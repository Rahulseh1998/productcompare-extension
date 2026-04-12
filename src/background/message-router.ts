import type { ExtensionMessage } from '../types/messages';
import {
  getActiveProducts,
  setActiveProducts,
  getSettings,
  broadcastToAllTabs,
} from './storage';
import { getLicenseStatus, getMaxProducts, validateAndActivate } from './license-checker';
import { getCachedAttributes, setCachedAttributes } from './extraction-cache';
import { extractAttributesWithLLM } from './claude-extractor';
import { generateVerdict } from './claude-verdict';
import { getLocalAIStatus, isLocalAIUsable, extractWithLocalAI, generateVerdictWithLocalAI } from './local-ai';
import { fetchPriceHistory } from './price-history';
import { deduplicateAttributes } from '../utils/normalize-keys';

export async function routeMessage(
  msg: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  switch (msg.type) {
    case 'ADD_PRODUCT': {
      console.log(`[CC] ADD_PRODUCT — ASIN: ${msg.product.asin}, pageText: ${msg.pageText?.length ?? 0} chars`);
      const license = await getLicenseStatus();
      const maxProducts = getMaxProducts(license.plan);
      const current = await getActiveProducts();

      if (current.find((p) => p.asin === msg.product.asin)) {
        sendResponse({ success: true, alreadyAdded: true });
        return;
      }
      if (current.length >= maxProducts) {
        sendResponse({ success: false, reason: 'limit_reached', plan: license.plan });
        return;
      }

      const updated = [...current, msg.product];
      await setActiveProducts(updated);

      // Trigger LLM enrichment asynchronously — reads pageText from the message,
      // not from product (keeps Product type clean). No-ops if no API key configured.
      triggerLLMExtraction(msg.product.asin, msg.pageText ?? '').catch(console.error);

      await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: updated });

      // Track comparison count for review prompt
      if (updated.length >= 2) {
        const countResult = await chrome.storage.local.get('stats.compareCount');
        const count = (countResult['stats.compareCount'] ?? 0) + 1;
        await chrome.storage.local.set({ 'stats.compareCount': count });
      }

      sendResponse({ success: true });
      break;
    }

    case 'REMOVE_PRODUCT': {
      const current = await getActiveProducts();
      const updated = current.filter((p) => p.asin !== msg.asin);
      await setActiveProducts(updated);
      await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: updated });
      sendResponse({ success: true });
      break;
    }

    case 'CLEAR_ALL': {
      await setActiveProducts([]);
      await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: [] });
      sendResponse({ success: true });
      break;
    }

    case 'OPEN_SIDE_PANEL': {
      if (sender.tab?.id) {
        await chrome.sidePanel.open({ tabId: sender.tab.id });
      }
      sendResponse({ success: true });
      break;
    }

    case 'GET_COMPARE_LIST': {
      const products = await getActiveProducts();
      sendResponse({ products });
      break;
    }

    case 'FETCH_VERDICT': {
      try {
        // Tier 1: Try Chrome Built-in AI (free, local)
        const aiStatus = await getLocalAIStatus();
        if (isLocalAIUsable(aiStatus)) {
          console.log('[CC] Generating verdict with Chrome Built-in AI (Gemini Nano)');
          const verdict = await generateVerdictWithLocalAI(msg.products);
          sendResponse({ verdict });
          return;
        }

        // Tier 2: Try user's Anthropic API key
        const settings = await getSettings();
        if (settings.anthropicApiKey) {
          console.log('[CC] Generating verdict with Anthropic API');
          const verdict = await generateVerdict(msg.products, settings.anthropicApiKey);
          sendResponse({ verdict });
          return;
        }

        sendResponse({ error: 'AI not available. Chrome Built-in AI requires Chrome 131+ with sufficient hardware, or add an API key in Settings.' });
      } catch (err) {
        sendResponse({ error: String(err) });
      }
      break;
    }

    case 'FETCH_PRICE_HISTORY': {
      try {
        const products = await getActiveProducts();
        const product = products.find((p) => p.asin === msg.asin);
        const settings = await getSettings();
        const points = await fetchPriceHistory(msg.asin, product?.price ?? null, settings.keepaApiKey);
        sendResponse({ asin: msg.asin, points });
      } catch (err) {
        sendResponse({ error: String(err) });
      }
      break;
    }

    case 'CHECK_LICENSE': {
      const license = await getLicenseStatus();
      sendResponse({ plan: license.plan, expiresAt: license.expiresAt });
      break;
    }

    case 'ACTIVATE_LICENSE': {
      const result = await validateAndActivate(msg.licenseKey, msg.email);
      sendResponse(result);
      break;
    }

    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

/** Fire-and-forget: extract attributes via LLM, update products in storage */
async function triggerLLMExtraction(asin: string, pageText: string): Promise<void> {
  if (!pageText) {
    console.debug(`[PC] LLM extraction skipped for ${asin}: no page text`);
    return;
  }

  const cached = await getCachedAttributes(asin);
  if (cached) {
    console.debug(`[CC] Cache hit for ${asin}: ${cached.length} attributes`);
    await updateProductAttributes(asin, cached);
    return;
  }

  // Tier 1: Try Chrome Built-in AI (free, local, no setup)
  const aiStatus = await getLocalAIStatus();
  if (isLocalAIUsable(aiStatus)) {
    console.log(`[CC] Extracting with Chrome Built-in AI for ${asin}`);
    try {
      const attributes = await extractWithLocalAI(pageText);
      if (attributes.length > 0) {
        console.log(`[CC] Local AI extraction complete for ${asin}: ${attributes.length} attributes`);
        await setCachedAttributes(asin, attributes);
        await updateProductAttributes(asin, attributes);
        return;
      }
    } catch (err) {
      console.debug(`[CC] Local AI extraction failed for ${asin}, trying fallback:`, err);
    }
  }

  // Tier 2: Try user's Anthropic API key
  const settings = await getSettings();
  if (!settings.anthropicApiKey) {
    console.debug(`[CC] No AI available for ${asin}: Chrome AI unavailable, no API key`);
    return;
  }

  console.log(`[CC] Extracting with Anthropic API for ${asin}`);
  try {
    const attributes = await extractAttributesWithLLM(pageText, settings.anthropicApiKey);
    console.log(`[CC] Anthropic extraction complete for ${asin}: ${attributes.length} attributes`);
    await setCachedAttributes(asin, attributes);
    await updateProductAttributes(asin, attributes);
  } catch (err) {
    console.error(`[CC] Anthropic extraction failed for ${asin}:`, err);
  }
}

async function updateProductAttributes(asin: string, llmAttributes: import('../types/product').ProductAttribute[]): Promise<void> {
  const products = await getActiveProducts();
  const updated = products.map((p) => {
    if (p.asin !== asin) return p;

    // Merge: structured specs (already on product) + LLM enrichment.
    // LLM wins on duplicate keys (it has more context for prose-based specs).
    // Then deduplicate by normalized key to collapse near-duplicates like
    // "dishwasher_safe" vs "is_dishwasher_safe".
    const existingKeys = new Set(llmAttributes.map((a) => a.key));
    const raw = [
      ...llmAttributes,
      ...p.attributes.filter((a) => !existingKeys.has(a.key)),
    ];
    const merged = deduplicateAttributes(raw);

    return { ...p, attributes: merged, attributesPartial: false };
  });
  await setActiveProducts(updated);
  await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: updated });
}

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

export async function routeMessage(
  msg: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  switch (msg.type) {
    case 'ADD_PRODUCT': {
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

      // Trigger LLM attribute extraction asynchronously (non-blocking)
      triggerLLMExtraction(msg.product.asin, msg.product.pageText ?? '').catch(console.error);

      await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: updated });
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
      const settings = await getSettings();
      if (!settings.anthropicApiKey) {
        sendResponse({ error: 'No API key configured' });
        return;
      }
      try {
        const verdict = await generateVerdict(msg.products, settings.anthropicApiKey);
        // Broadcast verdict to side panel
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'VERDICT_COMPLETE',
            verdict,
            requestId: msg.requestId,
          });
        }
        sendResponse({ success: true });
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
  if (!pageText) return;

  // Check cache first
  const cached = await getCachedAttributes(asin);
  if (cached) {
    await updateProductAttributes(asin, cached);
    return;
  }

  const settings = await getSettings();
  if (!settings.anthropicApiKey) return;

  const attributes = await extractAttributesWithLLM(pageText, settings.anthropicApiKey);
  await setCachedAttributes(asin, attributes);
  await updateProductAttributes(asin, attributes);
}

async function updateProductAttributes(asin: string, attributes: import('../types/product').ProductAttribute[]): Promise<void> {
  const products = await getActiveProducts();
  const updated = products.map((p) =>
    p.asin === asin ? { ...p, attributes, attributesPartial: false } : p
  );
  await setActiveProducts(updated);
  await broadcastToAllTabs({ type: 'COMPARE_LIST_UPDATED', products: updated });
}

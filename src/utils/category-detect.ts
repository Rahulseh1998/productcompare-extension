import type { Product } from '../types/product';

/**
 * Infer a broad category bucket from product title alone (no DOM dependency).
 * Used for soft mixed-category warnings — not meant to be exhaustive.
 */
export function inferCategoryBucket(product: Product): string {
  const text = product.title.toLowerCase();

  // Order matters: more specific patterns first
  if (/\b(laptop|computer|monitor|keyboard|mouse pad|tablet|ipad|macbook|chromebook|desktop)\b/.test(text)) return 'electronics-computing';
  if (/\b(headphone|headset|speaker|earbud|earphone|airpod|audio|soundbar|subwoofer)\b/.test(text)) return 'electronics-audio';
  if (/\b(phone|smartphone|iphone|galaxy|pixel|android)\b/.test(text)) return 'electronics-mobile';
  if (/\b(tv|television|projector|streaming)\b/.test(text)) return 'electronics-display';
  if (/\b(camera|lens|tripod|gopro|dslr|mirrorless)\b/.test(text)) return 'electronics-camera';
  if (/\b(kettle|teapot|tea pot|coffee maker|blender|toaster|mixer|cookware|pot|pan|skillet|air fryer|instant pot|juicer|food processor)\b/.test(text)) return 'kitchen-appliance';
  if (/\b(knife|cutting board|utensil|spatula|whisk|colander|bakeware|baking)\b/.test(text)) return 'kitchen-tool';
  if (/\b(shirt|pants|dress|shoe|sneaker|jacket|hoodie|underwear|sock|jeans|sweater)\b/.test(text)) return 'clothing';
  if (/\b(book|novel|textbook|paperback|hardcover)\b/.test(text)) return 'books';
  if (/\b(supplement|vitamin|protein|probiotic|collagen|omega|multivitamin)\b/.test(text)) return 'health-supplement';
  if (/\b(shampoo|conditioner|moisturizer|sunscreen|skincare|serum|lotion|cleanser)\b/.test(text)) return 'beauty';
  if (/\b(toy|lego|puzzle|board game|action figure|doll|playset)\b/.test(text)) return 'toys';
  if (/\b(desk|chair|shelf|lamp|mattress|pillow|curtain|rug)\b/.test(text)) return 'home-furniture';
  if (/\b(drill|wrench|saw|hammer|screwdriver|toolbox|plier)\b/.test(text)) return 'tools';
  if (/\b(dog|cat|pet|aquarium|fish tank|bird feeder)\b/.test(text)) return 'pets';
  if (/\b(backpack|luggage|suitcase|wallet|purse|handbag|watch|sunglasse)\b/.test(text)) return 'accessories';

  return 'other';
}

export function hasMixedCategories(products: Product[]): boolean {
  if (products.length < 2) return false;
  const buckets = products.map(inferCategoryBucket);
  // 'other' is a wildcard — don't count it as a mismatch on its own
  const known = buckets.filter((b) => b !== 'other');
  if (known.length < 2) return false;
  return new Set(known).size > 1;
}

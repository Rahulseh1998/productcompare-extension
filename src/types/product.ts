export interface ProductAttribute {
  key: string;
  label: string;
  value: string | number | boolean | null;
  rawValue: string;
  unit?: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  isAmazonSeller: boolean;
}

export interface Product {
  asin: string;
  title: string;
  price: number | null;
  currency: string;
  priceFormatted: string;
  rating: number | null;
  reviewCount: number | null;
  brand: string | null;
  imageUrl: string;
  productUrl: string;
  isPrime: boolean;
  availability: string;
  /** LLM-extracted attributes — category-agnostic */
  attributes: ProductAttribute[];
  /** True if LLM extraction failed and only direct-extracted fields are populated */
  attributesPartial: boolean;
  extractedAt: number;
  pageLocale: string;
}

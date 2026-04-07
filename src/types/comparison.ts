import type { Product } from './product';

export type AttributeDiff = 'best' | 'worst' | 'neutral' | 'same';

export interface ComparedCell {
  productAsin: string;
  value: string | number | boolean | null;
  diff: AttributeDiff;
}

export interface ComparedRow {
  key: string;
  label: string;
  cells: ComparedCell[];
  /** When false, all cells have the same value — dim row in UI */
  hasDifference: boolean;
}

export interface VerdictResult {
  bestValue: string;
  bestSpecs: string;
  bestRated: string;
  summary: string;
  generatedAt: number;
}

export interface SavedComparison {
  id: string;
  name: string;
  products: Product[];
  rows: ComparedRow[];
  verdict?: VerdictResult;
  createdAt: number;
  updatedAt: number;
}

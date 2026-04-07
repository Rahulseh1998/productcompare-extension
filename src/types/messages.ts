import type { Product, PricePoint } from './product';
import type { VerdictResult } from './comparison';

export type MessageType =
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'CLEAR_ALL'
  | 'OPEN_SIDE_PANEL'
  | 'GET_COMPARE_LIST'
  | 'COMPARE_LIST_UPDATED'
  | 'FETCH_VERDICT'
  | 'VERDICT_CHUNK'
  | 'VERDICT_COMPLETE'
  | 'VERDICT_ERROR'
  | 'FETCH_PRICE_HISTORY'
  | 'PRICE_HISTORY_RESULT'
  | 'SAVE_COMPARISON'
  | 'GET_SAVED_COMPARISONS'
  | 'DELETE_SAVED_COMPARISON'
  | 'CHECK_LICENSE'
  | 'LICENSE_STATUS'
  | 'ACTIVATE_LICENSE';

interface BaseMessage {
  type: MessageType;
}

export interface AddProductMessage extends BaseMessage {
  type: 'ADD_PRODUCT';
  product: Product;
}

export interface RemoveProductMessage extends BaseMessage {
  type: 'REMOVE_PRODUCT';
  asin: string;
}

export interface ClearAllMessage extends BaseMessage {
  type: 'CLEAR_ALL';
}

export interface OpenSidePanelMessage extends BaseMessage {
  type: 'OPEN_SIDE_PANEL';
}

export interface GetCompareListMessage extends BaseMessage {
  type: 'GET_COMPARE_LIST';
}

export interface CompareListUpdatedMessage extends BaseMessage {
  type: 'COMPARE_LIST_UPDATED';
  products: Product[];
}

export interface FetchVerdictMessage extends BaseMessage {
  type: 'FETCH_VERDICT';
  products: Product[];
  requestId: string;
}

export interface VerdictChunkMessage extends BaseMessage {
  type: 'VERDICT_CHUNK';
  token: string;
  requestId: string;
}

export interface VerdictCompleteMessage extends BaseMessage {
  type: 'VERDICT_COMPLETE';
  verdict: VerdictResult;
  requestId: string;
}

export interface VerdictErrorMessage extends BaseMessage {
  type: 'VERDICT_ERROR';
  error: string;
  requestId: string;
}

export interface FetchPriceHistoryMessage extends BaseMessage {
  type: 'FETCH_PRICE_HISTORY';
  asin: string;
}

export interface PriceHistoryResultMessage extends BaseMessage {
  type: 'PRICE_HISTORY_RESULT';
  asin: string;
  points: PricePoint[];
}

export interface CheckLicenseMessage extends BaseMessage {
  type: 'CHECK_LICENSE';
}

export interface LicenseStatusMessage extends BaseMessage {
  type: 'LICENSE_STATUS';
  plan: 'free' | 'pro';
  expiresAt: number | null;
}

export interface ActivateLicenseMessage extends BaseMessage {
  type: 'ACTIVATE_LICENSE';
  licenseKey: string;
  email: string;
}

export type ExtensionMessage =
  | AddProductMessage
  | RemoveProductMessage
  | ClearAllMessage
  | OpenSidePanelMessage
  | GetCompareListMessage
  | CompareListUpdatedMessage
  | FetchVerdictMessage
  | VerdictChunkMessage
  | VerdictCompleteMessage
  | VerdictErrorMessage
  | FetchPriceHistoryMessage
  | PriceHistoryResultMessage
  | CheckLicenseMessage
  | LicenseStatusMessage
  | ActivateLicenseMessage;

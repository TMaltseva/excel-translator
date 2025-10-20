export type LanguageCode = 'hy' | 'en' | 'ru' | 'unknown';

export interface TranslationResult {
  original: string;
  translated: string;
  language: LanguageCode;
}

export interface TranslationProgress {
  current: number;
  total: number;
  message: string;
}

export interface YandexTranslateResponse {
  translations: Array<{
    text: string;
    detectedLanguageCode?: string;
  }>;
}

export interface YandexTranslateRequest {
  texts: string[];
  targetLanguageCode: string;
  sourceLanguageCode?: string;
}

export type StatusType = 'idle' | 'processing' | 'success' | 'error';

export interface TranslationStatus {
  type: StatusType;
  message: string;
}

export interface BankingTerm {
  [key: string]: string;
}

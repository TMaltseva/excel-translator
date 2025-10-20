import { YandexTranslateResponse } from '../types';

const TRANSLATE_PROXY_URL =
  process.env.NODE_ENV === 'production'
    ? '/api/translate'
    : 'http://localhost:3000/api/translate';

export class YandexTranslateAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, _targetLang: string = 'ru'): Promise<string> {
    try {
      const response = await fetch(TRANSLATE_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          texts: [text],
          apiKey: this.apiKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Translation API Error (${response.status}): ${errorText}`
        );
      }

      const data: YandexTranslateResponse = await response.json();

      if (!data.translations || data.translations.length === 0) {
        throw new Error('No translations returned from API');
      }

      return data.translations[0].text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Translation failed: ${error.message}`);
      }

      throw new Error('Unknown translation error');
    }
  }

  async translateBatch(
    texts: string[],
    _targetLang: string = 'ru'
  ): Promise<string[]> {
    try {
      const response = await fetch(TRANSLATE_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          texts,
          apiKey: this.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: YandexTranslateResponse = await response.json();

      return data.translations.map((t) => t.text);
    } catch (error) {
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.translate('test', 'ru');

      return true;
    } catch {
      return false;
    }
  }
}

export const createYandexTranslateClient = (
  apiKey: string
): YandexTranslateAPI => {
  return new YandexTranslateAPI(apiKey);
};

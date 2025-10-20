import { LanguageCode, BankingTerm } from '../types';

export const BANKING_TERMS: BankingTerm = {
  'Փոխկպ. հաշվից վճ/Linked Acc. Paym': 'Оплата со связанного счета',
  'Փոխկպ. հաշվից վճ': 'Оплата со связанного счета',
  'Linked Acc. Paym': 'Оплата со связанного счета',
  'Հաճախորդի սպասարկում  ռեզ.իրավ.անձ ,հաշվի.':
    'Обслуживание клиента рез. юр. лицо, счет',
  'Հաճախորդի սպասարկում ռեզ.իրավ.անձ ,հաշվի.':
    'Обслуживание клиента рез. юр. лицо, счет',
  'Գանձում փոխանցումից\\Commission': 'Комиссия за перевод',
  'Գանձում փոխանցումից': 'Комиссия за перевод',
  'Փոխանցում քարտին/Transfer To Card': 'Перевод на карту',
  'Փոխանցում քարտին': 'Перевод на карту',

  'Transfer To Card': 'Перевод на карту',
  'Transfer to Account': 'Перевод на счет',
  'Currency Exchange': 'Обмен валюты',
  Commission: 'Комиссия',
  'US Dollar': 'Доллар США'
};

const TRANSLATION_PATTERNS: Array<[RegExp, string]> = [
  [
    /Փոխկպ\.\s*հաշվից\s*վճ[\/\\]?Linked\s*Acc\.\s*Paym/gi,
    'Оплата со связанного счета'
  ],
  [/Փոխկպ\.\s*հաշվից\s*վճ/g, 'Оплата со связанного счета'],
  [
    /Հաճախորդի\s*սպասարկում\s*ռեզ\.իրավ\.անձ\s*,հաշվի\./g,
    'Обслуживание клиента рез. юр. лицо, счет'
  ],
  [/Գանձում\s*փոխանցումից[\/\\]?Commission/gi, 'Комиссия за перевод'],
  [/Գանձում\s*փոխանցումից/g, 'Комиссия за перевод'],
  [/Փոխանցում\s*քարտին[\/\\]?Transfer\s*To\s*Card/gi, 'Перевод на карту'],
  [/Փոխանցում\s*քարտին/g, 'Перевод на карту'],

  [/INVOICE\s+NO\./gi, 'СЧЕТ-ФАКТУРА №'],
  [/INVOICE\s+DATE:/gi, 'ДАТА СЧЕТА:'],
  [/INVOICE\s+/gi, 'СЧЕТ-ФАКТУРА '],
  [/INV\./gi, 'СФ.'],
  [/\bDATE\s+/gi, 'ДАТА '],
  [/SOFTWARE\s+DEVELOPMENT/gi, 'РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ'],
  [/Transfer\s+To\s+Card/gi, 'Перевод на карту'],
  [/Transfer\s+to\s+Account/gi, 'Перевод на счет'],
  [/Currency\s+Exchange/gi, 'Обмен валюты']
];

export const detectLanguage = (text: string): LanguageCode => {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  if (/[\u0530-\u058F]/.test(text)) {
    return 'hy';
  }

  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru';
  }

  if (/^[a-zA-Z0-9\s.,!?;:()\-\/\\]+$/.test(text)) {
    const englishKeywords = [
      'invoice',
      'date',
      'payment',
      'transfer',
      'account',
      'commission',
      'exchange',
      'card',
      'software',
      'development'
    ];
    const lowerText = text.toLowerCase();

    if (englishKeywords.some((keyword) => lowerText.includes(keyword))) {
      return 'en';
    }
  }

  return 'unknown';
};

export const applyDictionaryTranslation = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  if (BANKING_TERMS[text]) {
    return BANKING_TERMS[text];
  }

  let result = text;

  for (const [pattern, replacement] of TRANSLATION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result;
};

export const needsTranslation = (text: string): boolean => {
  const lang = detectLanguage(text);

  return lang === 'hy' || lang === 'en';
};

export const wasTranslatedByDictionary = (
  original: string,
  translated: string
): boolean => {
  return original !== translated;
};

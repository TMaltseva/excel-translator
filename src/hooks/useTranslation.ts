import { useState, useCallback } from 'react';
import {
  applyDictionaryTranslation,
  needsTranslation,
  wasTranslatedByDictionary
} from '../utils/translationUtils';
import {
  readExcelFile,
  createExcelFile,
  downloadExcelFile,
  collectUniqueTexts,
  applyTranslations,
  generateTranslatedFilename
} from '../utils/excelUtils';
import { TranslationProgress, TranslationStatus } from '../types';

interface UseTranslationReturn {
  status: TranslationStatus;
  progress: TranslationProgress | null;
  translateFile: (file: File, apiKey: string) => Promise<void>;
  resetStatus: () => void;
}

const translateTexts = async (texts: string[], apiKey: string) => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, apiKey })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error - check internet connection');
    }
    throw error;
  }
};

const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || apiKey.trim().length < 10) {
    return false;
  }

  try {
    await translateTexts(['test'], apiKey);
    return true;
  } catch {
    return false;
  }
};

export const useTranslation = (): UseTranslationReturn => {
  const [status, setStatus] = useState<TranslationStatus>({
    type: 'idle',
    message: ''
  });
  const [progress, setProgress] = useState<TranslationProgress | null>(null);

  const updateStatus = useCallback(
    (type: TranslationStatus['type'], message: string) => {
      setStatus({ type, message });
    },
    []
  );

  const updateProgress = useCallback(
    (current: number, total: number, message: string) => {
      setProgress({ current, total, message });
    },
    []
  );

  const resetStatus = useCallback(() => {
    setStatus({ type: 'idle', message: '' });
    setProgress(null);
  }, []);

  const translateFile = useCallback(
    async (file: File, apiKey: string) => {
      try {
        updateStatus('processing', 'Проверка API ключа...');

        const isValidKey = await validateApiKey(apiKey);
        if (!isValidKey) {
          throw new Error(
            'Неверный API ключ! Проверьте ключ в Yandex Cloud и попробуйте снова.'
          );
        }

        updateStatus('processing', 'Чтение файла...');
        const { workbook, sheetName, data } = await readExcelFile(file);

        updateStatus('processing', 'Анализ текстов...');
        const uniqueTexts = collectUniqueTexts(data);
        const textsToTranslate = Array.from(uniqueTexts).filter(
          needsTranslation
        );

        if (textsToTranslate.length === 0) {
          updateStatus('success', 'Файл не содержит текстов для перевода');
          return;
        }

        updateProgress(
          0,
          textsToTranslate.length,
          `Найдено ${textsToTranslate.length} текстов для перевода`
        );

        const translationCache = new Map<string, string>();
        let translated = 0;
        let apiErrors = 0;

        const batchSize = 10;
        for (let i = 0; i < textsToTranslate.length; i += batchSize) {
          const batch = textsToTranslate.slice(i, i + batchSize);
          const textsForApi: string[] = [];

          for (const text of batch) {
            let translation = applyDictionaryTranslation(text);

            if (!wasTranslatedByDictionary(text, translation)) {
              textsForApi.push(text);
            } else {
              translationCache.set(text, translation);
              translated++;
            }
          }

          if (textsForApi.length > 0) {
            try {
              const apiResult = await translateTexts(textsForApi, apiKey);

              textsForApi.forEach((text, index) => {
                translationCache.set(text, apiResult.translations[index].text);
                translated++;
              });

              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
              apiErrors++;

              if (apiErrors > 3) {
                throw new Error(
                  'Слишком много ошибок API. Проверьте ваш API ключ или лимиты.'
                );
              }

              textsForApi.forEach((text) => {
                translationCache.set(text, text);
                translated++;
              });
            }
          }

          const processedCount = i + batchSize;
          const current = Math.min(processedCount, textsToTranslate.length);

          if (
            processedCount >= textsToTranslate.length ||
            processedCount % 20 === 0
          ) {
            updateProgress(
              current,
              textsToTranslate.length,
              `Обработано ${current} из ${textsToTranslate.length}`
            );
          }
        }

        updateStatus('processing', 'Создание документа...');
        const translatedData = applyTranslations(data, translationCache);

        const newWorkbook = createExcelFile(
          workbook,
          sheetName,
          translatedData
        );
        const newFilename = generateTranslatedFilename(file.name);
        downloadExcelFile(newWorkbook, newFilename);

        updateStatus('success', 'Файл успешно переведен и скачан!');
        setProgress(null);

        setTimeout(() => {
          resetStatus();
        }, 5000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Неизвестная ошибка';
        updateStatus('error', `Ошибка: ${errorMessage}`);
        setProgress(null);
      }
    },
    [updateStatus, updateProgress, resetStatus]
  );

  return {
    status,
    progress,
    translateFile,
    resetStatus
  };
};

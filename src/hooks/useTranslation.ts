import { useState, useCallback } from 'react';
import { YandexTranslateAPI } from '../api/yandexTranslate';
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
        const apiClient = new YandexTranslateAPI(apiKey);

        try {
          await apiClient.translate('test', 'ru');
        } catch (error) {
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

        updateProgress(
          0,
          textsToTranslate.length,
          `Найдено ${textsToTranslate.length} текстов для перевода`
        );

        const translationCache = new Map<string, string>();
        let translated = 0;
        let apiErrors = 0;

        for (const text of textsToTranslate) {
          let translation = applyDictionaryTranslation(text);

          if (!wasTranslatedByDictionary(text, translation)) {
            try {
              translation = await apiClient.translate(text, 'ru');
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Failed to translate: ${text}`, error);
              apiErrors++;

              if (apiErrors > 5) {
                throw new Error(
                  'Слишком много ошибок API. Проверьте ваш API ключ или лимиты.'
                );
              }

              translation = text;
            }
          }

          translationCache.set(text, translation);
          translated++;

          if (translated % 3 === 0 || translated === textsToTranslate.length) {
            updateProgress(
              translated,
              textsToTranslate.length,
              `Переведено ${translated} из ${textsToTranslate.length}`
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

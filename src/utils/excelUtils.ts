import * as XLSX from 'xlsx';

export type CellValue = string | number | boolean | Date | null | undefined;
export type SheetData = CellValue[][];

export const readExcelFile = async (
  file: File
): Promise<{
  workbook: XLSX.WorkBook;
  sheetName: string;
  data: SheetData;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          cellStyles: true,
          cellFormula: true,
          cellDates: true,
          cellNF: true,
          sheetStubs: true
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        }) as SheetData;

        resolve({
          workbook,
          sheetName: firstSheetName,
          data: sheetData
        });
      } catch (error) {
        reject(new Error('Ошибка чтения Excel файла'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Ошибка загрузки файла'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const createExcelFile = (
  originalWorkbook: XLSX.WorkBook,
  sheetName: string,
  data: SheetData
): XLSX.WorkBook => {
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.aoa_to_sheet(data);

  const originalWorksheet = originalWorkbook.Sheets[sheetName];

  if (originalWorksheet['!ref']) {
    newWorksheet['!ref'] = originalWorksheet['!ref'];
  }

  if (originalWorksheet['!cols']) {
    newWorksheet['!cols'] = originalWorksheet['!cols'];
  }

  if (originalWorksheet['!rows']) {
    newWorksheet['!rows'] = originalWorksheet['!rows'];
  }

  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

  return newWorkbook;
};

export const downloadExcelFile = (
  workbook: XLSX.WorkBook,
  filename: string
): void => {
  XLSX.writeFile(workbook, filename);
};

export const collectUniqueTexts = (data: SheetData): Set<string> => {
  const uniqueTexts = new Set<string>();

  data.forEach((row) => {
    row.forEach((cell) => {
      if (cell && typeof cell === 'string' && cell.trim()) {
        uniqueTexts.add(cell);
      }
    });
  });

  return uniqueTexts;
};

export const applyTranslations = (
  data: SheetData,
  translations: Map<string, string>
): SheetData => {
  return data.map((row) => {
    return row.map((cell) => {
      if (cell && typeof cell === 'string' && translations.has(cell)) {
        return translations.get(cell)!;
      }

      return cell;
    });
  });
};

export const generateTranslatedFilename = (
  originalFilename: string
): string => {
  const baseName = originalFilename.replace(/\.xlsx$/i, '');

  return `${baseName} на русском.xlsx`;
};

// Excel export utility — loads xlsx from CDN at runtime to avoid build dependency issues

type XLSXType = {
  utils: {
    json_to_sheet: (data: Record<string, unknown>[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
  };
  writeFile: (wb: unknown, filename: string) => void;
};

interface WindowWithXLSX {
  XLSX?: XLSXType;
}

let xlsxCache: XLSXType | null = null;

async function loadXLSX(): Promise<XLSXType> {
  if (xlsxCache) return xlsxCache;

  return new Promise((resolve, reject) => {
    // Check if already loaded via CDN
    const win = window as WindowWithXLSX;
    if (win.XLSX) {
      xlsxCache = win.XLSX;
      return resolve(xlsxCache);
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => {
      const w = window as WindowWithXLSX;
      xlsxCache = w.XLSX ?? null;
      if (xlsxCache) {
        resolve(xlsxCache);
      } else {
        reject(new Error("xlsx loaded but XLSX global not found"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load xlsx library"));
    document.head.appendChild(script);
  });
}

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1",
): Promise<void> {
  const XLSX = await loadXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export async function exportMultiSheetExcel(
  sheets: Array<{
    name: string;
    data: Record<string, unknown>[];
  }>,
  filename: string,
): Promise<void> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.writeFile(wb, filename);
}

import * as XLSX from "xlsx-js-style";

function ensureXlsxExtension(filename: string) {
  if (filename.toLowerCase().endsWith(".xlsx")) return filename;
  return filename.replace(/\.csv$/i, "") + ".xlsx";
}

function getCellText(cell?: XLSX.CellObject): string {
  if (!cell || cell.v == null) return "";
  return String(cell.v).trim();
}

function isDateFilterRow(worksheet: XLSX.WorkSheet, row: number, startCol: number): boolean {
  const firstCellAddress = XLSX.utils.encode_cell({ r: row, c: startCol });
  const firstCellText = getCellText(worksheet[firstCellAddress]);
  return /date\s*filter/i.test(firstCellText);
}

function isEmptyRow(worksheet: XLSX.WorkSheet, row: number, startCol: number, endCol: number): boolean {
  for (let col = startCol; col <= endCol; col += 1) {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    if (getCellText(worksheet[address]) !== "") return false;
  }
  return true;
}

function findHeaderRow(worksheet: XLSX.WorkSheet, range: XLSX.Range): number | null {
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    if (isDateFilterRow(worksheet, row, range.s.c)) continue;
    if (isEmptyRow(worksheet, row, range.s.c, range.e.c)) continue;
    return row;
  }
  return null;
}

export function downloadStyledWorkbookFromCsv(
  csvContent: string,
  filename: string,
  options?: {
    redFontColumns?: string[];
    thresholds?: Record<string, number>;
  },
) {
  const workbook = XLSX.read(csvContent, { type: "string" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet || !worksheet["!ref"]) {
    XLSX.writeFile(workbook, ensureXlsxExtension(filename));
    return;
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const headerRow = findHeaderRow(worksheet, range);

  // Get column indices for red font columns
  const redFontColIndices: Record<string, number> = {};
  if (options?.redFontColumns && headerRow !== null) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const headerText = getCellText(worksheet[address]);
      if (options.redFontColumns.includes(headerText)) {
        redFontColIndices[headerText] = col;
      }
    }
  }

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const dateFilterRow = isDateFilterRow(worksheet, row, range.s.c);
    const tableHeaderRow = headerRow !== null && row === headerRow;

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[address];
      if (!cell) continue;

      const fillColor = tableHeaderRow
        ? "16A34A"
        : dateFilterRow
          ? "FACC15"
          : undefined;
      let fontColor = tableHeaderRow ? "FFFFFF" : "000000";
      const bold = tableHeaderRow || dateFilterRow;

      // Apply red font for cells that exceed thresholds
      if (!tableHeaderRow && !dateFilterRow && options?.redFontColumns && options?.thresholds) {
        const headerAddress = XLSX.utils.encode_cell({ r: headerRow || 0, c: col });
        const headerText = getCellText(worksheet[headerAddress]);
        if (options.redFontColumns.includes(headerText) && options.thresholds[headerText]) {
          const cellValue = getCellText(cell);
          const threshold = options.thresholds[headerText];
          
          // Parse time value to hours for comparison
          const hours = parseTimeToHours(cellValue);
          if (hours > threshold) {
            fontColor = "FF0000";
          }
        }
      }

      cell.s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        font: {
          bold,
          color: { rgb: fontColor },
        },
        fill: fillColor
          ? {
              patternType: "solid",
              fgColor: { rgb: fillColor },
            }
          : undefined,
      };
    }
  }

  XLSX.writeFile(workbook, ensureXlsxExtension(filename));
}

function parseTimeToHours(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours + (minutes / 60) + (seconds / 3600);
  }
  return 0;
}

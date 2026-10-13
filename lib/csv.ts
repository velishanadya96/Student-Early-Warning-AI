/** Parser CSV kecil: mendukung tanda kutip ("a,b"), kutip ganda "" , BOM, dan pemisah koma/titik koma. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    row.push(field.trim());
    field = "";
  };
  const endRow = () => {
    endField();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  endRow();
  return rows;
}

export type CsvRecord = Record<string, string>;

/** Ubah baris CSV menjadi objek berdasarkan header (huruf kecil). */
export function csvToRecords(text: string, required: readonly string[]): CsvRecord[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("File CSV belum memiliki data.");
  const headers = (rows[0] ?? []).map((value) => value.toLowerCase());
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Kolom wajib belum lengkap: ${missing.join(", ")}.`);
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

import { describe, expect, it } from "vitest";
import { csvToRecords, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("membaca tanda kutip yang berisi koma dan kutip ganda", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });

  it("mendeteksi pemisah titik koma (format Excel Indonesia) dan membuang BOM", () => {
    expect(parseCsv("﻿nim;nama\n2024001;Alya")).toEqual([["nim", "nama"], ["2024001", "Alya"]]);
  });

  it("mengabaikan baris kosong dan CRLF", () => {
    expect(parseCsv("a,b\r\n1,2\r\n\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("csvToRecords", () => {
  const required = ["nim", "nama"];

  it("menolak file tanpa baris data", () => {
    expect(() => csvToRecords("nim,nama", required)).toThrow("belum memiliki data");
  });

  it("menyebutkan kolom wajib yang hilang", () => {
    expect(() => csvToRecords("nim,ipk\n1,3", required)).toThrow("nama");
  });

  it("mengubah baris menjadi objek dengan header huruf kecil", () => {
    expect(csvToRecords("NIM,Nama\n2024001,Alya", required)).toEqual([{ nim: "2024001", nama: "Alya" }]);
  });
});

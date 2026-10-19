"use strict";
const assert = require("assert");
const {
  formatRupiah, filterBulan, ringkas, perKategori, keCSV, parseCSV, dariCSV, tanggalValid,
} = require("../app.js");

const sample = [
  { id: "1", tanggal: "2026-10-01", jenis: "masuk", kategori: "Gaji", jumlah: 5000000, catatan: "Gaji" },
  { id: "2", tanggal: "2026-10-02", jenis: "keluar", kategori: "Makan & minum", jumlah: 35000, catatan: 'Makan, "siang"' },
  { id: "3", tanggal: "2026-10-05", jenis: "keluar", kategori: "Transportasi", jumlah: 20000, catatan: "=HYPERLINK(\"x\")" },
  { id: "4", tanggal: "2026-09-30", jenis: "keluar", kategori: "Belanja", jumlah: 99000, catatan: "" },
];

// Rupiah
assert.strictEqual(formatRupiah(1500000), "Rp 1.500.000");
assert.strictEqual(formatRupiah(-25000), "-Rp 25.000");
assert.strictEqual(formatRupiah(0), "Rp 0");

// Filter bulan + urutan terbaru dulu
const okt = filterBulan(sample, "2026-10");
assert.deepStrictEqual(okt.map((t) => t.id), ["3", "2", "1"]);

// Ringkasan
assert.deepStrictEqual(ringkas(okt), { masuk: 5000000, keluar: 55000, saldo: 4945000 });

// Per kategori (hanya pengeluaran, urut terbesar)
assert.deepStrictEqual(perKategori(okt), [["Makan & minum", 35000], ["Transportasi", 20000]]);

// Tanggal
assert.ok(tanggalValid("2026-02-28"));
assert.ok(!tanggalValid("2026-02-30"));
assert.ok(!tanggalValid("26-10-01"));

// CSV round trip, termasuk koma, tanda kutip, dan proteksi formula
const csv = keCSV(sample);
assert.ok(csv.includes("\"'=HYPERLINK"), "sel berawalan = harus diberi awalan '");
let n = 0;
const hasil = dariCSV(csv, () => "id" + ++n);
assert.strictEqual(hasil.dilewati, 0);
assert.strictEqual(hasil.items.length, 4);
assert.strictEqual(hasil.items[1].catatan, 'Makan, "siang"');
assert.strictEqual(hasil.items[2].catatan, '=HYPERLINK("x")');
assert.strictEqual(hasil.items[0].jumlah, 5000000);

// Baris tidak valid dilewati
const buruk = "tanggal,jenis,kategori,jumlah,catatan\n2026-10-01,masuk,Gaji,abc,x\n2026-13-01,keluar,Belanja,1000,x\n2026-10-03,lain,Belanja,1000,x\n2026-10-04,keluar,Belanja,1000,ok\n";
const h2 = dariCSV(buruk, () => "z");
assert.strictEqual(h2.items.length, 1);
assert.strictEqual(h2.dilewati, 3);

// Header salah -> error
assert.throws(() => dariCSV("a,b,c\n1,2,3", () => "z"));

// Parser: CRLF, BOM, newline dalam tanda kutip
const p = parseCSV("﻿a,b\r\n\"x\ny\",2\r\n");
assert.deepStrictEqual(p, [["a", "b"], ["x\ny", "2"]]);

console.log("Semua tes lulus");

# Catatan Keuangan Pribadi

Aplikasi web sederhana untuk mencatat pemasukan dan pengeluaran. Tanpa server, tanpa akun, tanpa pelacak: semua data tersimpan **di browser kamu sendiri**.

## Fitur

- Catat pemasukan dan pengeluaran dengan kategori
- Ringkasan per bulan: pemasukan, pengeluaran, saldo
- Rincian pengeluaran per kategori
- Ekspor dan impor CSV (untuk cadangan atau pindah perangkat)
- Mendukung mode gelap, nyaman dipakai di HP

## Cara pakai

Buka `index.html` di browser, atau jalankan server lokal:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Penting: privasi dan cadangan

- **Jaga repo ini tetap PRIVATE** di GitHub. Kode aplikasinya tidak berisi data, tetapi file CSV hasil ekspor berisi data keuanganmu.
- Data ada di `localStorage` browser. Kalau cache/data situs dihapus, data ikut hilang. **Ekspor CSV secara berkala.**
- Data tidak tersinkron otomatis antar perangkat. Untuk pindah perangkat: ekspor di satu perangkat, impor di perangkat lain.
- File `*.csv` sudah masuk `.gitignore` supaya tidak ikut ter-commit tanpa sengaja.

## Deploy ke Cloudflare Pages (opsional)

1. Push repo ini ke GitHub (private).
2. Di dashboard Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pilih repo ini.
3. Build command: kosongkan. Output directory: `/` (root).
4. Karena ini berisi urusan pribadi, pertimbangkan membatasi akses dengan **Cloudflare Access**, supaya hanya emailmu yang bisa membuka situsnya. Data tetap ada di browser, tetapi ini mencegah orang lain memakai atau melihat halamannya.

## Format CSV

```
tanggal,jenis,kategori,jumlah,catatan
2026-10-01,masuk,Gaji,5000000,Gaji Oktober
2026-10-02,keluar,Makan & minum,35000,Makan siang
```

- `tanggal`: `YYYY-MM-DD`
- `jenis`: `masuk` atau `keluar`
- `jumlah`: angka bulat positif dalam Rupiah

## Struktur

```
index.html   # halaman
style.css    # tampilan
app.js       # logika
tests/       # tes logika (jalankan: node tests/test.js)
```

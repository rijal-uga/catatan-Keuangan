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

## Deploy gratis ke Cloudflare Pages

Situs ini statis, jadi cukup paket gratis Cloudflare. Tidak perlu build.

1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com) (daftar gratis kalau belum punya akun).
2. **Workers & Pages → Create application → Pages → Connect to Git**.
3. Izinkan Cloudflare mengakses GitHub, lalu pilih repo ini saja (*Only select repositories*).
4. Pengaturan build:
   - Framework preset: **None**
   - Build command: *(kosongkan)*
   - Build output directory: `/` (atau `.`)
5. Klik **Save and Deploy**. Situs tersedia di `https://<nama-proyek>.pages.dev`. Setiap `git push` ke `main` otomatis memperbarui situs.

File `_headers` sudah disertakan: menambah header keamanan dan `noindex` supaya situs tidak muncul di mesin pencari.

### Kunci akses (disarankan)

Data memang hanya ada di browser, tetapi sebaiknya halaman ini tidak terbuka untuk umum. Pakai **Cloudflare Access** (gratis sampai 50 pengguna):

1. Dashboard → **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Isi domain `<nama-proyek>.pages.dev`.
3. Buat policy **Allow** dengan aturan *Emails* berisi emailmu saja.
4. Simpan. Setelah itu halaman meminta kode verifikasi lewat email sebelum bisa dibuka.

### Domain sendiri (opsional)

Domain `.pages.dev` gratis. Kalau mau domain sendiri, tambahkan lewat tab **Custom domains** di proyek Pages. Domain biasanya berbayar.

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

"use strict";

/* ---------- Logika murni (bisa diuji di Node) ---------- */

const KATEGORI = {
  keluar: ["Makan & minum", "Transportasi", "Belanja", "Tagihan", "Kesehatan", "Hiburan", "Pendidikan", "Lainnya"],
  masuk: ["Gaji", "Bonus", "Usaha", "Lainnya"],
};

function formatRupiah(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "Rp " + Math.abs(Math.round(n)).toLocaleString("id-ID");
}

function filterBulan(list, bulan) {
  return list
    .filter((t) => t.tanggal.slice(0, 7) === bulan)
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
}

function ringkas(list) {
  let masuk = 0;
  let keluar = 0;
  for (const t of list) {
    if (t.jenis === "masuk") masuk += t.jumlah;
    else keluar += t.jumlah;
  }
  return { masuk, keluar, saldo: masuk - keluar };
}

function perKategori(list) {
  const map = new Map();
  for (const t of list) {
    if (t.jenis !== "keluar") continue;
    map.set(t.kategori, (map.get(t.kategori) || 0) + t.jumlah);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const FORMULA_CHARS = ["=", "+", "-", "@", "\t", "\r"];

function csvCell(v) {
  let s = String(v);
  // cegah formula injection saat CSV dibuka di Excel/Sheets
  if (s && FORMULA_CHARS.includes(s[0])) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function keCSV(list) {
  const lines = ["tanggal,jenis,kategori,jumlah,catatan"];
  for (const t of list) {
    lines.push([t.tanggal, t.jenis, t.kategori, t.jumlah, t.catatan].map(csvCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function bersihkanTeks(s, maks) {
  s = String(s || "").trim();
  if (s.length > 1 && s[0] === "'" && FORMULA_CHARS.includes(s[1])) s = s.slice(1);
  return s.slice(0, maks);
}

function tanggalValid(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

function dariCSV(text, idGen) {
  const rows = parseCSV(text);
  if (!rows.length) return { items: [], dilewati: 0 };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k) => head.indexOf(k);
  const iTgl = idx("tanggal"), iJns = idx("jenis"), iKat = idx("kategori"), iJml = idx("jumlah"), iCat = idx("catatan");
  if (iTgl < 0 || iJns < 0 || iKat < 0 || iJml < 0) throw new Error("Header CSV tidak dikenali");
  const items = [];
  let dilewati = 0;
  for (const r of rows.slice(1)) {
    const tanggal = (r[iTgl] || "").trim();
    const jenis = (r[iJns] || "").trim().toLowerCase();
    const jumlah = Number((r[iJml] || "").trim());
    const kategori = bersihkanTeks(r[iKat], 40);
    if (!tanggalValid(tanggal) || !["masuk", "keluar"].includes(jenis) || !Number.isFinite(jumlah) || jumlah <= 0 || !kategori) {
      dilewati++;
      continue;
    }
    items.push({
      id: idGen(),
      tanggal,
      jenis,
      kategori,
      jumlah: Math.round(jumlah),
      catatan: iCat >= 0 ? bersihkanTeks(r[iCat], 120) : "",
    });
  }
  return { items, dilewati };
}

const IKON = {
  "Makan & minum": "🍜", "Transportasi": "🚌", "Belanja": "🛍️", "Tagihan": "🧾",
  "Kesehatan": "💊", "Hiburan": "🎮", "Pendidikan": "📚", "Lainnya": "✨",
  "Gaji": "💼", "Bonus": "🎁", "Usaha": "🏪",
};

function ikon(nama) {
  return IKON[nama] || "💰";
}

const MAKS_JUMLAH = 999999999999;

function parseAngka(s) {
  const digits = String(s || "").replace(/\D/g, "");
  if (!digits) return 0;
  return Math.min(Number(digits), MAKS_JUMLAH);
}

function formatAngka(n) {
  return Math.round(n).toLocaleString("id-ID");
}

function tanggalLokal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function hariIni() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function buatId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

if (typeof module !== "undefined") {
  module.exports = { formatRupiah, filterBulan, ringkas, perKategori, keCSV, parseCSV, dariCSV, tanggalValid, hariIni, parseAngka, formatAngka, tanggalLokal, ikon, KATEGORI, IKON };
}

/* ---------- Antarmuka (hanya jalan di browser) ---------- */

if (typeof document !== "undefined") {
  const KEY = "catatan-keuangan:v1";
  const $ = (id) => document.getElementById(id);
  const NOMINAL_CEPAT = [10000, 20000, 50000, 100000, 250000];

  let jenis = "keluar";
  let kategori = KATEGORI.keluar[0];

  function muat() {
    try {
      const raw = localStorage.getItem(KEY);
      const d = raw ? JSON.parse(raw) : [];
      return Array.isArray(d) ? d : [];
    } catch (e) {
      return [];
    }
  }
  let data = muat();

  function simpan() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      pesan("Gagal menyimpan ke browser. Ekspor CSV agar datamu aman.");
    }
  }

  function pesan(t) { $("msg").textContent = t; }

  function tampilkanError(t) {
    const el = $("jumlah-err");
    el.textContent = t;
    el.hidden = !t;
  }

  /* --- Form --- */
  function isiKategori() {
    const wrap = $("kategori");
    wrap.textContent = "";
    if (!KATEGORI[jenis].includes(kategori)) kategori = KATEGORI[jenis][0];
    for (const k of KATEGORI[jenis]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = ikon(k) + " " + k;
      b.setAttribute("aria-pressed", String(k === kategori));
      b.addEventListener("click", () => {
        kategori = k;
        for (const x of wrap.children) x.setAttribute("aria-pressed", String(x === b));
      });
      wrap.appendChild(b);
    }
  }

  function setJenis(j) {
    jenis = j;
    for (const b of document.querySelectorAll(".seg-btn")) {
      const aktif = b.dataset.jenis === j;
      b.classList.toggle("active", aktif);
      b.setAttribute("aria-checked", String(aktif));
    }
    const btn = $("btnSimpan");
    btn.textContent = j === "masuk" ? "Simpan pemasukan" : "Simpan pengeluaran";
    btn.classList.toggle("masuk", j === "masuk");
    isiKategori();
  }

  function isiNominalCepat() {
    const q = $("quick");
    for (const n of NOMINAL_CEPAT) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = "+" + formatAngka(n);
      b.setAttribute("aria-label", "Tambah " + formatRupiah(n));
      b.addEventListener("click", () => {
        const sekarang = parseAngka($("jumlah").value);
        $("jumlah").value = formatAngka(Math.min(sekarang + n, MAKS_JUMLAH));
        tampilkanError("");
      });
      q.appendChild(b);
    }
  }

  function geserHari(d) {
    const t = new Date();
    t.setDate(t.getDate() + d);
    $("tanggal").value = tanggalLokal(t);
  }

  $("jumlah").addEventListener("input", (e) => {
    const n = Math.min(parseAngka(e.target.value), MAKS_JUMLAH);
    e.target.value = n ? formatAngka(n) : "";
    tampilkanError("");
  });
  for (const b of document.querySelectorAll(".seg-btn")) {
    b.addEventListener("click", () => setJenis(b.dataset.jenis));
  }
  $("btnHariIni").addEventListener("click", () => geserHari(0));
  $("btnKemarin").addEventListener("click", () => geserHari(-1));

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const jumlah = parseAngka($("jumlah").value);
    if (!(jumlah > 0)) {
      tampilkanError("Isi jumlah lebih dari 0.");
      $("jumlah").focus();
      return;
    }
    if (!tanggalValid($("tanggal").value)) {
      tampilkanError("Pilih tanggal yang valid.");
      $("tanggal").focus();
      return;
    }
    data.push({
      id: buatId(),
      tanggal: $("tanggal").value,
      jenis,
      kategori,
      jumlah,
      catatan: $("catatan").value.trim().slice(0, 120),
    });
    simpan();
    $("bulan").value = $("tanggal").value.slice(0, 7);
    $("jumlah").value = "";
    $("catatan").value = "";
    tampilkanError("");
    $("jumlah").focus();
    pesan("Tersimpan.");
    render();
  });

  /* --- Tampilan data --- */
  function render() {
    const bulan = $("bulan").value;
    const list = filterBulan(data, bulan);
    const r = ringkas(list);
    $("sumIn").textContent = formatRupiah(r.masuk);
    $("sumOut").textContent = formatRupiah(r.keluar);
    $("sumBal").textContent = formatRupiah(r.saldo);

    const bd = $("breakdown");
    bd.textContent = "";
    const kat = perKategori(list);
    if (!kat.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "Belum ada pengeluaran bulan ini.";
      bd.appendChild(p);
    }
    for (const [nama, jml] of kat) {
      const row = document.createElement("div");
      row.className = "bar-row";
      const head = document.createElement("div");
      head.className = "bar-head";
      const a = document.createElement("span");
      a.textContent = ikon(nama) + " " + nama;
      const b = document.createElement("span");
      b.textContent = formatRupiah(jml) + " (" + Math.round((jml / r.keluar) * 100) + "%)";
      head.append(a, b);
      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = (jml / kat[0][1]) * 100 + "%";
      track.appendChild(fill);
      row.append(head, track);
      bd.appendChild(row);
    }

    const tbody = $("rows");
    tbody.textContent = "";
    $("empty").hidden = list.length > 0;
    for (const t of list) {
      const tr = document.createElement("tr");
      const cells = [t.tanggal, ikon(t.kategori) + " " + t.kategori, t.catatan];
      for (const c of cells) {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      }
      const tdJ = document.createElement("td");
      tdJ.className = "num " + t.jenis;
      tdJ.textContent = (t.jenis === "masuk" ? "+" : "-") + formatRupiah(t.jumlah);
      tr.appendChild(tdJ);
      const tdD = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "del";
      btn.textContent = "Hapus";
      btn.setAttribute("aria-label", "Hapus transaksi " + t.kategori + " " + t.tanggal);
      btn.addEventListener("click", () => {
        data = data.filter((x) => x.id !== t.id);
        simpan();
        render();
      });
      tdD.appendChild(btn);
      tr.appendChild(tdD);
      tbody.appendChild(tr);
    }
  }

  $("bulan").addEventListener("change", render);

  /* --- Data: ekspor / impor / hapus --- */
  $("btnExport").addEventListener("click", () => {
    const blob = new Blob(["﻿" + keCSV(data)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "catatan-keuangan-" + hariIni() + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    pesan("CSV diekspor (" + data.length + " transaksi).");
  });

  $("fileImport").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { items, dilewati } = dariCSV(await file.text(), buatId);
      data = data.concat(items);
      simpan();
      render();
      pesan("Diimpor " + items.length + " transaksi" + (dilewati ? ", " + dilewati + " baris dilewati karena tidak valid." : "."));
    } catch (err) {
      pesan("Impor gagal: " + err.message);
    }
  });

  $("btnClear").addEventListener("click", () => {
    if (!data.length) return;
    if (confirm("Hapus SEMUA data? Sebaiknya ekspor CSV dulu. Tindakan ini tidak bisa dibatalkan.")) {
      data = [];
      simpan();
      render();
      pesan("Semua data dihapus.");
    }
  });

  /* --- Mulai --- */
  $("tanggal").value = hariIni();
  $("bulan").value = hariIni().slice(0, 7);
  isiNominalCepat();
  setJenis("keluar");
  render();
}

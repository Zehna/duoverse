# Duoverse UI/UX Design System Specification

> **Status:** Mandatory Design Specification  
> **Target Scope:** All Frontend Code in `apps/desktop-ui` (`.tsx`, `.css`)  
> **Philosophy:** Sleek Dark Tactical HUD (Inspired by Steam Deck UI, Linear, Discord Desktop)  
> **Zero Tolerance:** Dilarang Keras "AI Slop"

---

## 1. Zero AI Slop Policy (Aturan Anti-AI Slop)

Semua komponen antarmuka Duoverse wajib terlihat seperti perangkat lunak gaming komersial profesional berstandar tinggi. Hindari semua pola visual klise yang sering dihasilkan oleh generator AI:

| AI Slop Anti-Pattern (DILARANG KERAS) | Standar Duoverse (WAJIB DIGUNAKAN) |
|---|---|
| **Gradien Pelangi/Neon:** Gradien ungu-ke-pink mencolok (`from-purple-500 via-pink-500 to-indigo-500`) atau efek glowing hyper-saturated. | **Solid Dark HUD:** Background solid `zinc-950` dengan kartu `zinc-900` dan aksen fungsional monokrom/tunggal. |
| **Radius Balon (Hyper-Rounded):** `rounded-3xl` (24px) atau `rounded-full` pada kartu, panel, atau dialog modal. | **Crisp Engineering Radius:** Gunakan `rounded-md` (6px) untuk tombol/input, `rounded-lg` (8px) untuk kartu/dialog. Maksimal 8–12px. |
| **Bayangan Mengambang Tebal:** `shadow-2xl` atau bayangan berwarna neon (`shadow-indigo-500/50`) yang tidak realistis. | **Subtle Borders & Ambient Occlusion:** Garis pembatas 1px tajam (`border-zinc-800/60`) dengan bayangan halus `shadow-sm` atau `shadow-black/40`. |
| **Animasi Berlebihan:** Tombol bergoyang, partikel mengambang acak, efek hovering bouncing liar. | **Tactile Micro-Interactions:** Transisi cepat (150–200ms), spring physics ringan, perubahan opacity dan transform skala minimal (`scale-[0.98]` saat ditekan). |

---

## 2. Palet Warna (Sleek Dark HUD)

Desain Duoverse dibangun di atas skala warna **Zinc** murni untuk menjaga fokus visual gamer pada poster game dan status koneksi:

### 2.1 Surface & Neutral Tokens
```css
/* Surface Hierarchy */
--bg-app:        #09090b; /* Tailwind: zinc-950 (Latar belakang utama desktop) */
--bg-surface:    #18181b; /* Tailwind: zinc-900 (Panel, sidebar, kartu game) */
--bg-subtle:     #27272a; /* Tailwind: zinc-800 (Hover state, input background) */
--border-base:   rgba(39, 39, 42, 0.6); /* Tailwind: border-zinc-800/60 (1px crisp line) */
--border-hover:  rgba(63, 63, 70, 0.8); /* Tailwind: border-zinc-700/80 (Active focus border) */

/* Typography */
--text-primary:   #f4f4f5; /* Tailwind: zinc-100 (Judul game, status utama, teks tombol) */
--text-secondary: #a1a1aa; /* Tailwind: zinc-400 (Deskripsi, metadata engine, label form) */
--text-muted:     #71717a; /* Tailwind: zinc-500 (Versi, ping number, disclaimer) */
```

### 2.2 Semantic & Functional Accent Tokens
Setiap warna aksen hanya digunakan untuk menyampaikan **status sistem riil**:

- **Online / Ready / Safe:** `emerald-500` (`#10b981`)
  - Status Host ready, VFS non-destructive verified, anti-cheat clean, latency rendah (<40ms).
  - Background lembut: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`.
- **Active / Streaming / Selected:** `sky-500` (`#0ea5e9`)
  - Sesi aktif, tab terpilih, SDR relay streaming, focus rings.
  - Background lembut: `bg-sky-500/10 text-sky-400 border-sky-500/20`.
- **Error / Safety Abort:** `rose-500` (`#f43f5e`)
  - Deteksi kernel anti-cheat, desync kritis, koneksi terputus.
  - Background lembut: `bg-rose-500/10 text-rose-400 border-rose-500/20`.
- **Warning / Jitter:** `amber-500` (`#f59e0b`)
  - High latency / packet loss warning, kompatibilitas parsial.
  - Background lembut: `bg-amber-500/10 text-amber-400 border-amber-500/20`.

---

## 3. Hirarki Visual & Tata Letak

### 3.1 Cover Poster Game
- **Aspek Rasio:**
  - Vertikal Poster: **3:4** (`aspect-[3/4]`), standar kartu koleksi game (Steam library format).
  - Banner Horizontal: **16:9** (`aspect-video`), untuk hero banner game terpilih.
- **Hover Overlay:**
  - Gambar cover tidak boleh zoom berlebihan. Gunakan transisi halus 200ms.
  - Saat hover, tampilkan overlay gelap transparan (`bg-black/50 backdrop-blur-[2px]`) yang memunculkan badge engine (misal: "Unity Mono", "Unreal 4") dan tombol cepat "Launch Co-op".

### 3.2 Tipografi
- **Font Stack:** Modern clean sans-serif (`font-sans`), font-weight 500 (Medium) untuk body, 600 (Semibold) untuk headings.
- **Ukuran & Spasi:**
  - Judul Halaman: `text-xl font-semibold tracking-tight text-zinc-100`
  - Subjudul / Label Bagian: `text-xs font-medium uppercase tracking-wider text-zinc-500`
  - Teks Kartu Game: `text-sm font-medium text-zinc-200 line-clamp-1`
  - Status Metadata: `text-xs font-mono text-zinc-400`

### 3.3 Room Code HUD (Lobby Identifier)
Kode lobi 6-karakter adalah elemen interaktif terpenting dalam launcher:
- **Tampilan:**
  - Font: `font-mono tracking-widest uppercase`
  - Ukuran: `text-lg` atau `text-xl` dengan warna kontras tinggi `text-sky-400`
  - Kontainer: `bg-zinc-950 border border-zinc-800/80 px-4 py-2 rounded-md`
- **1-Click Copy Interaction:**
  - Dilengkapi tombol salin responsif dengan ikon `Copy` (Lucide).
  - Saat diklik: ikon berganti instan ke `Check` (warna `emerald-400`) dengan tooltip "Copied to clipboard!" selama 1.5 detik.

---

## 4. Micro-Interactions & Motion Guide

Gunakan **Framer Motion** secara hemat, terukur, dan bertujuan fungsional:

### 4.1 Transition Tokens
```typescript
export const transitions = {
  instant: { duration: 0.1, ease: "easeOut" },
  tactile: { type: "spring", stiffness: 450, damping: 35 },
  fade: { duration: 0.18, ease: "easeInOut" }
};
```

### 4.2 Interaksi Komponen
- **Tombol Ditekan:** `whileTap={{ scale: 0.98 }}` untuk feedback taktil.
- **Modal / Dialog:** Fade in `opacity: 0 -> 1` dan `scale: 0.97 -> 1` (maksimal 180ms). Dilarang slide-in dramatis dari bawah layar.
- **Card Hover:** `y: -2px` dengan `border-color: zinc-700/80` (hindari bayangan raksasa).

---

## 5. Komponen Standar (shadcn/ui Adapted)

Setiap komponen UI dasar yang dibuat di `src/components/ui/` wajib mengimplementasikan token di atas:

1. **Button:**
   - `variant="default"`: `bg-zinc-100 text-zinc-900 hover:bg-white font-medium text-sm rounded-md`
   - `variant="secondary"`: `bg-zinc-800 text-zinc-200 hover:bg-zinc-750 border border-zinc-700/50`
   - `variant="ghost"`: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60`
   - `variant="destructive"`: `bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20`
2. **Card:**
   - `bg-zinc-900/90 border border-zinc-800/60 rounded-lg p-5 shadow-sm`
3. **Badge:**
   - `px-2 py-0.5 text-xs font-medium rounded border border-zinc-800 bg-zinc-950/80 text-zinc-300`
4. **Input:**
   - `bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50`
5. **Dialog:**
   - `bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/60`
6. **Tabs:**
   - `bg-zinc-950/60 border border-zinc-800/60 p-1 rounded-md text-zinc-400`
   - Active Tab: `bg-zinc-800 text-zinc-100 shadow-sm`
7. **Tooltip:**
   - `bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs px-2.5 py-1 rounded shadow-md`

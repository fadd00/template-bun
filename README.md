# Dokumentasi Proyek Game Phaser 4

Proyek ini adalah template/dasar untuk pembuatan game menggunakan [Phaser 4](https://github.com/phaserjs/phaser), [Bun](https://bun.sh/) sebagai runtime & package manager, [Vite](https://vitejs.dev/) untuk *bundler*, dan **TypeScript** untuk pengembangan yang lebih *type-safe*.

## Spesifikasi Utama

- **Phaser:** v4.0.0
- **Vite:** v6.x
- **TypeScript:** v5.x
- **Runtime & Bundler:** Bun

## Persyaratan Sistem

Pastikan Anda sudah menginstal **Bun** di komputer Anda.  
Jika belum, Anda dapat menginstalnya melalui terminal dengan perintah:
```bash
curl -fsSL https://bun.sh/install | bash
```

## Cara Menjalankan Proyek

1. **Instalasi Dependensi**  
   Buka terminal di direktori proyek ini dan jalankan:
   ```bash
   bun install
   ```

2. **Mode Pengembangan (Development / Hot-Reload)**  
   Untuk menjalankan server lokal dan melakukan testing game:
   ```bash
   bun run dev
   ```
   Aplikasi akan berjalan di `http://localhost:8080` (cek terminal untuk detailnya). Setiap perubahan pada kode di dalam folder `src/` akan otomatis memicu *hot-reload* pada browser.

3. **Membangun Proyek (Production Build)**  
   Ketika game sudah siap direlis, jalankan perintah berikut untuk menghasilkan struktur web statis yang sudah dioptimasi:
   ```bash
   bun run build
   ```
   *File hasil build akan berada di dalam folder `dist/` dan siap untuk di-deploy ke server web atau platform hosting mana pun (misal: Vercel, Netlify, atau GitHub Pages).*

## Struktur Direktori

Berikut adalah penjelasan singkat untuk struktur file & folder penting di proyek ini:

- `index.html` — Entry point HTML dari game/proyek ini.
- `public/` — Tempat menyimpan _static assets_ seperti gambar, suara, file CSS globlal (`style.css`), dll.
- `src/` — Kumpulan kode program utama.
  - `main.ts` — File _bootstrap_ aplikasi (terhubung ke index.html).
  - `game/main.ts` — Titik masuk utama game, digunakan untuk mengatur konfigurasi dasar Phaser & meluncurkan instance game.
  - `game/scenes/` — Direktori berisi *Scene* game yang memisahkan logika dari menu, proses pre-loading, level, dan UI (contoh: `MainMenu.ts`, `GameScene.ts`).
- `vite/` — Konfigurasi environment untuk Vite.

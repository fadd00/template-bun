# Log Pengerjaan Proyek: Game Logika Phaser 4

**Tanggal:** 10 Mei 2026

Berikut adalah catatan pekerjaan yang telah diselesaikan untuk iterasi prototipe *Logic Block Puzzle Game*:

## 1. Perencanaan & Dokumentasi
- **`README.md`**: Diperbarui penuh ke Bahasa Indonesia, disesuaikan dengan instruksi instalasi menggunakan Bun dan Vite.
- **Rencana Pengembangan (*Plan*)**: Mempersiapkan *draft* konsep secara detail, menetapkan spesifikasi fungsionalitas UI (bergaya mirip *Scratch* dengan integrasi *Pallet* dan *Workspace*), mekanik skor berbasis tingkat kecocokan urutan logika, dan mekanik 'Nyawa' (Lives) serta 'Reset'.

## 2. Struktur Data Level
- **`src/game/scenes/levels.ts`**: 
  - Mengubah antarmuka (`interface`) dari teka-teki berbasis kotak (grid) ke sistem `BlockDef` (blok logika) dan `LevelDef`.
  - Membuat skenario level tutorial 1: **"Dasar Logika: Nasi Goreng"**, lengkap dengan senarai blok-blok instruksi, parameter kebolehan nyawa (`hasLives: false`), dan urutan ideal (`idealSequence`) yang harus diselesaikan pemain.

## 3. Mekanik Inti Permainan (Gameplay)
- **`src/game/scenes/GameScene.ts`**: 
  - Membuat pembagian ruang visual antara **Pallet** (di sisi kiri) dan **Workspace** (di sisi kanan).
  - Melakukan implementasi Class `LogicBlock` yang mendukung:
    - *Spawning* (Kloning) blok dari Pallet melalui *Drag & Drop*.
    - Sistem menempel otomatis *Snapping* ujung ke ujung (*tail-to-head* atau sebaliknya) ketika dilepas berdekatan (*radius < 50px*).
    - Memindahkan *group of blocks* secara utuh tatkala menyentuh/menggerakkan induk blok.
  - Mempersiapkan Action Panel di bawah yang memuat fungsionalitas tombol:
    - **Reset**: Menghancurkan seluruh rangkaian di dalam *Workspace*.
    - **Run**: Menemukan untaian blok terpanjang, menerjemahkannya ke dalam bentuk urutan (*array*), dan membandingkannya (evaluasi) dengan `idealSequence` untuk mendapatkan Skor secara persentase (%).

## 4. Layar Hasil & Skor (Game Loop)
- **`src/game/scenes/ResultScene.ts`**:
  - Mengganti tampilan hasil lama menjadi layar evaluasi yang menampilkan apakah urutan logika sudah Benar (Succes >= 80%) atau Gagal.
  - Menampilkan Skor akhir (`score %`) beserta umpan balik (*message*).
  - Mengimplementasikan sistem **Nyawa (Lives)** bersyarat yang akan mengurangi sisa nyawa saat gagal (berlaku untuk level-level evaluasi berikutnya), dan memberikan status *"GAME OVER"* komplit dengan tombol untuk kembali ke *Main Menu*.
  - Pembaruan mekanisme untuk lanjut ke level berikutnya (*Next Level*) atau mengulang (*Retry*).

---
**Status Saat Ini:** Basis prototipe sudah dapat dijalankan dengan `bun run dev`. Pemain sudah bisa melakukan simulasi Drag & Drop perangkaian logika masak Nasi Goreng beserta fungsi evaluasinya.

## 5. Hotfix & Perbaikan Bug
- **`src/game/scenes/GameScene.ts`**:
  - Memperbaiki konflik *namespace* global `Phaser` pada *module bundler* (Vite/Bun) yang menyebabkan `Uncaught ReferenceError: Phaser is not defined`. Impor library telah diubah menjadi secara spesifik (mendeklarasikan `Geom`, `Math as PhaserMath`, dll secara eksplisit) sehingga game dapat kembali _render_ dengan mulus.
# Agent Instructions: Logic Block Puzzle Game

## 1. Project Context & Goals
Ini adalah game edukasi berbasis **Phaser 4**, **TypeScript**, dan **Vite/Bun** yang bertujuan untuk mengajarkan **Logika Dasar** (urutan langkah yang benar, belum masuk ke algoritma kompleks) bagi mahasiswa. 
- **Mekanik Inti:** Pemain memindahkan blok instruksi (Drag & Drop) dari area `Pallet` ke dalam `Workspace` (mirip seperti Scratch).
- **Penilaian:** Pemain menekan tombol "Run" untuk mengubah blok menjadi *Array of Commands*, lalu dicocokkan dengan `idealSequence` (urutan ideal). Skor dinilai berdasarkan persentase kecocokan langkah.
- **Tantangan:** Terdapat sistem **Nyawa (Lives)** yang baru akan diaktifkan pada level-level evaluasi lanjutan.

## 2. Current State (Status Saat Ini)
- **Logika Utama Aman:** Sistem *drag-and-drop*, *snapping* antar blok (merangkai dari atas ke bawah), *validation score*, *lives system*, serta pergantian *scene* (`GameScene` -> `ResultScene`) sudah berjalan dengan baik.
- **Level Tersedia:** Baru 1 level dasar ("Dasar Logika: Nasi Goreng") di `src/game/scenes/levels.ts`.
- **Bug Fixed:** *Namespace error* untuk Phaser akibat module bundler (Vite) sudah diatasi dengan melakukan `import` spesifik (misal: `import { Scene, GameObjects, Math as PhaserMath } from 'phaser';`).

## 3. Future Tasks Roadmap (Tugas Selanjutnya)

Minta agen (AI) berikutnya untuk menyelesaikan prioritas berikut secara terstruktur:

### Tahap 1: Visualisasi Hasil Akhir (Polishing UI)
- [ ] **Implementasi Gambar Hasil di `ResultScene.ts`:** Saat ini `successImage` dan `failImage` sudah terdefinisikan di dalam data level (`levels.ts`), namun belum dimuat (*load*) dan ditampilkan di *ResultScene*. Tambahkan fungsi `preload` atau pastikan aset-aset gambar tersebut di-render berdasarkan skor yang didapat (contoh: Nasi Goreng Matang VS Gosong).
- [ ] **Scrollable Workspace:** Pastikan area *Workspace* dapat di_*scroll* jika rangkaian blok terlalu panjang hingga ke bawah layar.

### Tahap 2: Mekanik Lanjutan (If/Else & Looping)
- [ ] **Blok Bersarang (Nested Blocks):** Saat ini interaksi blok hanya menempel dari ujung atas ke bawah (*head-to-tail*). Evaluasi dan buat arsitektur pengetesan untuk blok tipe `loop` atau `condition`, di mana mereka bisa "membungkus" atau menampung blok aksi (*action*) di dalamnya.

### Tahap 3: Ekspansi Konten Level (`levels.ts`)
- [ ] **Tambah Level Dasar (Level 2 & 3):** Buat skenario/kasus logika sehari-hari lain bertipe *action* biasa (tanpa nyawa).
- [ ] **Level Evaluasi Dasar (Level 4):** Buat level ulangan dari konsep sebelumnya dengan mekanik parameter `hasLives: true` dihidupkan (pemain dibatasi kesempatan mencobanya).
- [ ] **Level Kondisional (If/Else):** Implementasikan level baru untuk mengajarkan konsep logika percabangan.

## 4. Development Rules (Aturan Coding)
1. **Phaser Import:** HINDARI memanggil *namespace* `Phaser` secara global (seperti `Phaser.Geom`). Gunakan *import* spesifik di awal *file* (`import { Geom } from 'phaser'`).
2. **Environment:** Gunakan `bun` untuk operasi terminal (*install*, *run dev*, *run build*).
3. **Safety:** Apabila memerlukan *Update* yang cukup besar (seperti mengubah *Class Layout*), selalu pastikan membersihkan/menghancurkan (*destroy*) *event listener* lama untuk mencegah tumpangan elemen.
4. **Bahasa UI:** Semua *interface* yang dibaca *player* harus menggunakan Bahasa Indonesia.

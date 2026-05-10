# Panduan Dekonstruksi & Konversi Proyek (Phaser ke Godot / Unity)

Dokumen ini berisi penjelasan detail mengenai arsitektur proyek saat ini secara menyeluruh, tujuan utama proyek, dan panduan langkah demi langkah jika ingin melakukan penulisan ulang (*porting* / konversi) dari versi **Phaser 4 (Web/HTML5)** ke *game engine* standar industri seperti **Godot** atau **Unity**.

---

## 1. Tujuan & Konsep Proyek

**Tujuan Pembuatan Proyek:**
Proyek ini adalah **Game Edukasi Teka-Teki Logika (Logic Block Puzzle Game)** bergaya antarmuka pemrograman visual mirip *Scratch*. Tujuan utamanya adalah mengajarkan konsep dasar algoritma dan pengurutan langkah (sekuensial) melalui aktivitas sehari-hari (contoh: cara memasak nasi goreng). Pemain tidak menulis kode, melainkan menyusun blok-blok visual secara logis untuk mencapai hasil akhir yang benar.

**Mekanik Inti:**
1. **Pallet & Area Kerja (Workspace)**: Tersedia laci (*pallet*) di sebelah kiri berisi blok-blok aksi tunggal, dan Area Kerja kosong di sebelah kanan. Area ini dapat di-*scroll* (gulir).
2. **Drag, Drop & Snap**: Pemain menarik blok dari *pallet* dan meletakkannya di *workspace*. Blok akan saling menempel (*snap*) dari ekor-ke-kepala secara otomatis jika diletakkan berdekatan.
3. **Single Entity Block**: Masing-masing blok hanya berjumlah satu. Jika ditarik dari *pallet*, blok tersebut pindah, tidak digandakan. Menekan *Reset* atau membuang blok ke luar *workspace* akan mengembalikan blok ke *pallet*.
4. **Evaluasi & Skor (Proximity Match)**: Ketika pemain menekan **Run**, sistem mengekstrak urutan blok dan membandingkannya (evaluasi) dengan urutan ideal (`idealSequence`). Jika cocok semua = 100%. Jika salah atau acak-acakan, skor akan turun. Evaluasi ini memicu pengurangan nyawa jika level tersebut menerapkan sistem nyawa.

---

## 2. Peta Direktori & Arsitektur Saat Ini

Sebelum mengonversi, penting memahami apa fungsi masing-masing komponen di *codebase* (Phaser, TypeScript, Vite) saat ini:

*   **`src/game/scenes/levels.ts`**
    *   **Fungsi:** Menyimpan data *blueprint* level permainan (judul, deskripsi, blok apa saja yang tersedia, atribut nyawa, dan `idealSequence`).
    *   **Konsep:** Berperan sebagai basis data statis (Static Data/Config).
*   **`src/game/scenes/GameScene.ts`**
    *   **Fungsi:** Mengatur *game loop* utama, menginisialisasi UI *scrollable* (*Masking*), menangani *Input Events* (DragStart, Drag, DragEnd), mendeteksi jarak antar-blok (kalkulasi *Snapping* menggunakan Teorema Pythagoras / Jarak Vektor), dan merangkai logika blok menjadi susunan *Array* untuk dievaluasi oleh tombol *Run*.
*   **`src/game/scenes/ResultScene.ts`**
    *   **Fungsi:** Layar transisi untuk memberitahu pemain apakah mereka berhasil, menampilkan skor evaluasi, menghitung sisa nyawa, serta tombol navigasi menuju level berikutnya (bertransisi balik ke `GameScene` dengan Data/Indeks baru) atau *Retry*.
*   **`log.js` / `log.md` / `agent-instructions.md`**
    *   **Fungsi:** Berkas pelacakan *history* untuk *developer*/AI. Tidak ikut di-*compile* ke dalam *game build*.

---

## 3. Instruksi Konversi ke GODOT (Versi 4.x)

Godot sangat cocok untuk game berbasis antarmuka (*UI-Heavy*) seperti ini karena sistem `Control` nodes-nya yang sangat matang.

### Kebutuhan Dasar Godot:
1. **Bahasa:** GDScript atau C#.
2. **Setup Proyek:** 2D (Mobile/Desktop), resolusi basis misalnya `1280x720`, setel mode rentang UI (*Stretch Mode*) ke `canvas_items` dan aspeksi `keep`.

### Pemetaan Konsep (Phaser -> Godot):
*   `Scene` (GameScene/ResultScene) ➡️ **Scene Node (`Node2D` / `Control`)**
*   `Container` (Blok) ➡️ **`PanelContainer` atau `TextureRect`**
*   `Masking` / Area Scroll ➡️ **`ScrollContainer` + `VBoxContainer`**
*   Basis Data Level (`levels.ts`) ➡️ **`Resource` (Custom Resource) / JSON file**.

### Langkah Eksekusi:
1. **Arsitektur Data Level:**
   * Buat *Custom Resource* bernama `LevelData.gd` yang mengekspor variabel: `level_title`, `description`, `available_blocks` (Array of Dictionaries), dan `ideal_sequence` (Array of Strings).
   * Simpan masing-masing level sebagai `.tres` (Resource Files).
2. **Sistem Drag & Drop (UI Node):**
   * Di Godot, *Drag and Drop* UI bisa menggunakan fungsi bawaan `_get_drag_data()`, `_can_drop_data()`, dan `_drop_data()`.
   * **Alternatif (Kustom):** Karena kontrol presisi jarak (*snapping*) diperlukan, lebih dianjurkan memanfaatkan sinyal `gui_input(event)` pada node Blok *Control* untuk mendeteksi `InputEventScreenDrag`. Saat di-drag, pindahkan balok dari hierarki (tree) *Parent* menjadi anak (*child*) tertingginya UI Root agar di-render di atas *layer* lain (`top_level`).
3. **Scroll Area (`ScrollContainer`):**
   * Pallet (Kiri) dan Workspace (Kanan) dapat dibuat menggunakan dua node `ScrollContainer`. Kontainer otomatis me-masking (*clipping*) *child* yang ada di dalamnya secara "bebas kode".
4. **Logika Snapping (Snap Distance):**
   * Saat blok dilepas (`event` DragEnd), hitung `global_position` blok. Iterasikan (*loop*) dengan semua *global_position* blok lain di dalam `Workspace`. Gunakan `Vector2.distance_to()` untuk jaraknya. Jika `< 50`, `reparent()` node ini agar mengikuti struktur berantai atau atur tata letak UI-nya berdasarkan logika rantai.

---

## 4. Instruksi Konversi ke UNITY (Versi 2022++)

Unity akan mengandalkan Unity UI (UGUI) secara penuh, dikarenakan sifat proyek yang 90% berbasis tata letak antarmuka.

### Kebutuhan Dasar Unity:
1. **Bahasa:** C#.
2. **Setup Proyek:** 2D Core, resolusi *Canvas* di-set ke *Scale With Screen Size*.

### Pemetaan Konsep (Phaser -> Unity):
*   `Scene` ➡️ **Unity `Scene`**
*   `GameObjects.Container` Blok ➡️ **`GameObject` dengan komponen `RectTransform` + `Image`**
*   Input Event & Drag handling ➡️ **Implementasi antarmuka UIDrag: `IBeginDragHandler`, `IDragHandler`, `IEndDragHandler` + `CanvasGroup` (Blocks Raycasts: False saat drag)**
*   Masking & Area Scroll ➡️ **Komponen `ScrollRect` yang dipasangkan dengan komponen `RectMask2D` atau `Mask`**
*   Data Level (`levels.ts`) ➡️ **`ScriptableObject`**.

### Langkah Eksekusi:
1. **Manajemen Data (`ScriptableObjects`):**
   * Buat naskah (*script*) `LevelData : ScriptableObject` berisi *field-field* level (Judul, Daftar Blok, Logika Ideal).
   * Gunakan menu klik kanan Unity untuk membuat *Assets* (`.asset`) untuk masing-masing Level.
2. **Sistem Antarmuka (Canvas Setup):**
   * Buat Canvas (Root). Bagi dua *Panel* utama (Kiri untuk Pallet, Kanan untuk Workspace).
   * Tambahkan komponen `ScrollRect` dan `Mask` pada Panel Pallet dan Panel Workspace agar blok terpotong (*clipped*) ketika di-*scroll*, tidak menembus batas UI.
3. **Mekanisme Drag & Drop:**
   * Di dalam C#, buat file `DragDropLogic.cs` (Inherit `MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler`).
   * Pasang pada prefab Blok. Saat *Begin Drag*, taruh blok menjadi "anak" dari hirarki paling atas *Canvas* agar tergambar (*render*) di atas segalanya (`transform.SetAsLastSibling()`).
   * Terapkan raycasting dari EventSystem. Jika *pointer* melayang di atas *Workspace*, letakkan.
4. **Logika *Snapping*:**
   * Saat `OnEndDrag`, periksa jarak antar blok menggunakan `Vector2.Distance(blockA.transform.position, blockB.transform.position)`.
   * Di Unity C#, pastikan *anchors* diatur dengan benar agar titik (*pivot*) menempel di ujung bawah (Tail) dan menempel pada ujung atas blok lain (Head).
5. **Evaluator Logika:**
   * Saat Button *Run* (onClick) ditekan, ambil *Root* blok pertama. Gunakan referensi komponen penunjuk (contoh: `Block.NextBlock`) seperti layaknya *Linked List*. Kumpulkan string *ID* ke dalam `List<string> userSequence`, bandingkan secara iteratif dengan `List<string> idealSequence` dari konfigurasi *ScriptableObject* level saat ini untuk mendapatkan hasil akhir lalu lempar ke *Scene* layar berhasil.

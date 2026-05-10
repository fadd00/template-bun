export interface BlockDef {
  id: string;
  label: string;
  type: 'action' | 'loop' | 'condition';
}

export interface LevelDef {
  id: number;
  title: string;
  description: string;
  availableBlocks: BlockDef[];
  idealSequence: string[]; // array of block ids
  hasLives: boolean;
  maxLives?: number;
  successImage: string;
  failImage: string;
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Dasar Logika: Nasi Goreng',
    description: 'Susun urutan memasak nasi goreng yang benar!',
    hasLives: false,
    availableBlocks: [
      { id: 'ambil_minyak', label: 'Ambil Minyak', type: 'action' },
      { id: 'tuang_minyak', label: 'Tuang Minyak ke Wajan', type: 'action' },
      { id: 'ambil_telur', label: 'Ambil Telur', type: 'action' },
      { id: 'pecah_telur', label: 'Pecahkan Telur', type: 'action' },
      { id: 'masuk_telur', label: 'Masukan Telur ke Wajan', type: 'action' },
      { id: 'masuk_nasi', label: 'Masukan Nasi', type: 'action' },
      { id: 'masuk_bumbu', label: 'Masukan Bumbu', type: 'action' },
      { id: 'aduk', label: 'Aduk', type: 'action' },
      { id: 'hidangkan', label: 'Hidangkan ke Piring', type: 'action' },
    ],
    idealSequence: [
      'ambil_minyak',
      'tuang_minyak',
      'ambil_telur',
      'pecah_telur',
      'masuk_telur',
      'masuk_nasi',
      'masuk_bumbu',
      'aduk',
      'hidangkan'
    ],
    successImage: 'nasi_goreng_sukses.png',
    failImage: 'nasi_goreng_gagal.png'
  }
];

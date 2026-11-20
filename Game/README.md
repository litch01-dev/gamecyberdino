# CYBERPUNK HAND RUNNER ⚡
### Webcam-Controlled Futuristic Endless Runner Game

Game berbasis web interaktif dengan tema **Cyberpunk Futuristic** yang dikendalikan secara real-time menggunakan gerakan tangan (hand gestures) melalui webcam dengan integrasi **MediaPipe Tasks Vision - Hand Landmarker**. 

Pemain mengendalikan robot cyborg futuristik yang berlari melintasi jalanan kota cyberpunk megastruktur, melompat menghindari rintangan laser dan drone, serta mengumpulkan modul energi dan power-up.

---

## 🚀 Fitur Utama

- **Neural Hand Tracking Control**: Kendalikan lompatan robot dengan mengangkat tangan di depan webcam secara real-time.
- **Kalibrasi Interaktif & Stabil**: Sistem baseline cerdas dengan visual feedback skeleton tangan, smoothing Exponential Moving Average (EMA), serta proteksi cooldown & debounce untuk mencegah lompatan ganda.
- **5 Tingkat Level Progresif**:
  1. *Level 1 - Neon District* (280 km/h)
  2. *Level 2 - Cyber Street* (340 km/h)
  3. *Level 3 - Digital Highway* (400 km/h)
  4. *Level 4 - Machine Zone* (460 km/h)
  5. *Level 5 - Neon Core* (530 km/h)
  6. *Endless Overdrive MK* (Tantangan tanpa batas dengan kesulitan bertingkat)
- **5 Jenis Rintangan Unik**:
  1. *Cyber Barrier*: Penghalang gaya medan neon bergaris hazard.
  2. *Electric Crate*: Kontainer teknologi bertegangan tinggi dengan lonjakan listrik.
  3. *Energy Gate*: Tiang pylon ganda dengan sinar plasma horizontal.
  4. *Laser Obstacle*: Proyektor laser tanah berdenyut mematikan.
  5. *Mechanical Drone*: Drone melayang dengan osilasi sensor pengintai.
- **Item Collectibles & Power-Ups**:
  - *Energy Orb* (+50 Poin)
  - *Cyber Coin* (+100 Poin)
  - *Power Core* (+250 Poin)
  - *Shield Power-Up*: Melindungi karakter dari 1 tabrakan fatal.
  - *Magnet Power-Up*: Menarik seluruh item dalam radius 260px.
  - *2X Score Boost*: Menggandakan seluruh poin selama 10 detik.
- **Procedural Cyberpunk Synthesizer (Web Audio API)**:
  - Musik synthwave dinamis berirama bass 16th-note yang otomatis menyesuaikan tempo dengan level permainan.
  - Efek suara lengkap: lompatan jet thruster, pengambilan koin kristal, perisai energi, ledakan partikel tabrakan, dan UI klik.
  - 100% sintetis prosedural — tidak membutuhkan file `.mp3` eksternal yang rentan gagal dimuat.
- **Multi-layer Parallax & Particle FX**:
  - Parallax megacity dengan gedung pencakar langit dan sinyal antena.
  - Efek screen shake, partikel api pendorong jet, gelombang kejut mendarat, dan percikan ledakan neon.
- **Dual Controls**: Mendukung webcam hand tracking sebagai kontrol utama, serta tombol keyboard (`Spasi`, `Panah Atas`, `W`, `P` untuk Pause) untuk kenyamanan dan aksesibilitas.

---

## 🛠️ Teknologi yang Digunakan

1. **HTML5**: Struktur semantik kanvas dan antarmuka HUD.
2. **CSS3**: Tata letak responsif, glassmorphism, sudut tech cutout (`clip-path`), dan animasi neon glowing.
3. **JavaScript ES6+**: Arsitektur modular berorientasi objek tanpa framework berlebih.
4. **HTML5 Canvas 2D API**: Rendering prosedural 60 FPS untuk karakter robot, rintangan dinamis, partikel, dan latar belakang kota cyberpunk.
5. **MediaPipe Tasks Vision v0.10.14**: Hand Landmarker neural network untuk deteksi 21 titik sendi tangan secara lokal di browser.
6. **Web Audio API**: Mesin suara dan musik synthesizer cyberpunk real-time.
7. **LocalStorage API**: Penyimpanan high score, pengaturan volume, sensitivitas, dan statistik permainan.

---

## 📂 Struktur Folder Proyek

```
cyberpunk-hand-runner/
│
├── index.html               # Halaman utama game & antarmuka HUD
│
├── css/
│   └── style.css            # Desain futuristik Cyberpunk, HUD & Glassmorphism
│
├── js/
│   ├── main.js              # Inisialisasi aplikasi & navigasi UI antar layar
│   ├── game.js              # Game engine loop, state machine & rendering kanvas
│   ├── handTracking.js      # Integrasi MediaPipe Tasks Vision & kalkulasi gestur
│   ├── player.js            # Karakter robot, animasi multi-sendi & fisika delta-time
│   ├── obstacles.js         # Pengelola 5 jenis rintangan & sistem deteksi tabrakan
│   ├── collectibles.js      # Pengelola item energi, koin, dan 3 jenis power-up
│   ├── particles.js         # Sistem partikel neon, asap thruster & guncangan layar
│   ├── audio.js             # Web Audio API synthesizer musik & SFX prosedural
│   ├── settings.js          # Pengontrol preferensi audio & sensitivitas tangan
│   └── storage.js           # Pengelola penyimpanan data persisten LocalStorage
│
├── assets/
│   ├── images/
│   ├── sprites/
│   ├── audio/
│   └── fonts/
│
└── README.md                # Dokumentasi lengkap proyek
```

---

## 💻 Panduan Menjalankan Game

### Langkah 1: Buka Proyek di VS Code
1. Jalankan aplikasi **Visual Studio Code**.
2. Klik menu **File** > **Open Folder...**
3. Pilih folder proyek ini: `c:\Users\user\Documents\komun web\Game`.

### Langkah 2: Jalankan Melalui Live Server
1. Pastikan ekstensi **Live Server** (oleh *Ritwick Dey*) telah terpasang di VS Code.
2. Pada file explorer di sebelah kiri, klik kanan file `index.html`.
3. Pilih **Open with Live Server** (atau gunakan shortcut `Alt + L, Alt + O`).
4. Browser default Anda akan terbuka secara otomatis di alamat `http://127.0.0.1:5500/index.html`.

---

## 🖐️ Panduan Kalibrasi & Cara Bermain

### Mengaktifkan Kamera & Kalibrasi
1. Pada menu utama, klik tombol **Play Game** atau **Calibrate Hand**.
2. Ketika browser memunculkan dialog izin kamera (*"Use your camera"*), klik **Allow** / **Izinkan**.
3. Posisikan tangan Anda di depan webcam dengan posisi santai/netral yang nyaman (biasanya di bagian bawah atau tengah pandangan kamera).
4. Tekan tombol **Lock Baseline** untuk mengunci titik acuan istirahat tangan Anda.
5. Coba angkat tangan Anda ke atas: jika indikator berubah menjadi warna hijau dengan teks *"JUMP DETECTED!"*, sistem telah terkalibrasi dengan sempurna!
6. Klik **Start Runner** untuk langsung memulai permainan.

### Kontrol Permainan
- **Angkat Tangan ke Atas**: Membuat robot melompat menggunakan pendorong jet.
- **Kembalikan Tangan ke Posisi Netral**: Mereset detektor agar siap untuk lompatan berikutnya.
- **Papan Ketik (Alternatif)**:
  - `Spasi` / `Panah Atas` / `W`: Melompat
  - `P` / `Escape`: Jeda Permainan (Pause)

---

## ⚙️ Pengaturan Sensitivitas & Audio

Buka menu **Settings** untuk menyesuaikan:
- **Hand Gesture Sensitivity**: Skala 1 (membutuhkan ayunan tangan lebih tinggi) hingga 5 (cukup sentakan ringan). Standar: 3.
- **Synthesizer Music**: Mengaktifkan atau mematikan musik latar berirama cyberpunk serta mengatur volume master.
- **Sound Effects (SFX)**: Mengatur efek audio saat melompat, mengambil modul, atau menabrak rintangan.
- **Reset High Score**: Menghapus catatan skor rekor lama.

---

## 🔒 Privasi dan Keamanan

- **Pemrosesan Lokal**: Video dari webcam hanya diproses di browser Anda menggunakan WebAssembly/GPU lokal. Tidak ada frame video atau data citra yang dikirimkan ke server mana pun.
- **Status Stream**: Kamera dapat dinonaktifkan kapan saja dan stream kamera dimatikan secara bersih saat pengguna keluar dari sesi.

---

## ❓ Panduan Troubleshooting

### 1. Masalah Kamera / Webcam
- **Pesan "Camera access denied"**: 
  - Klik ikon gembok di sebelah kiri bilah alamat browser (URL bar).
  - Pastikan izin **Camera** diubah menjadi **Allow**.
  - Muat ulang (refresh) halaman (`Ctrl + F5`).
- **Kamera Terbuka di Aplikasi Lain**:
  - Pastikan aplikasi seperti Zoom, Microsoft Teams, atau OBS Studio tidak sedang menggunakan webcam Anda secara bersamaan.

### 2. Masalah MediaPipe Tasks Vision
- **Model Gagal Dimuat**:
  - MediaPipe Tasks Vision dimuat melalui CDN jsDelivr (`@mediapipe/tasks-vision@0.10.14`). Pastikan komputer Anda terhubung ke internet saat pertama kali memuat model vision.
  - Jika koneksi internet sedang dibatasi, kontrol cadangan menggunakan keyboard (`Spasi`) tetap aktif secara otomatis sehingga game tetap dapat dimainkan tanpa hambatan.

---

*CYBERPUNK HAND RUNNER — Created with High-Tech Precision.*


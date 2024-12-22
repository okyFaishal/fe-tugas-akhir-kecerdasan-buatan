# Rute Anti Banjir (Kota Semarang)

## Deskripsi
Proyek "Rute Anti Banjir" adalah sebuah aplikasi berbasis web yang dirancang untuk membantu pengguna menemukan rute yang aman dari banjir di Kota Semarang. Aplikasi ini memanfaatkan data area rawan banjir dan cuaca untuk memberikan rekomendasi rute yang aman hingga 3 hari ke depan.

## Cara Menjalankan
1. Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) di komputer Anda.
2. Clone repository proyek ini:
   ```bash
   git clone https://github.com/okyFaishal/fe-tugas-akhir-kecerdasan-buatan.git
   ```
3. Masuk ke direktori proyek:
   ```bash
   cd fe-tugas-akhir-kecerdasan-buatan
   ```
4. Install dependensi proyek:
   ```bash
   npm install
   ```
5. Konfigurasi file `.env`:
   - Buat file `.env` di root proyek.
   - Tambahkan variabel berikut dan sesuaikan jika diperlukan:
     ```env
     VITE_APP_HOST=localhost
     VITE_APP_PORT=8080  # bisa diganti sesuai keinginan
     VITE_APP_IP_BACKEND=http://localhost:8000/ # bisa diganti sesuai keinginan
     ```
6. Jalankan proyek:
   ```bash
   npm run dev
   ```
7. Buka aplikasi di browser melalui URL yang ditampilkan di terminal.

## Fitur
- Integrasi dengan API cuaca BMKG untuk mendapatkan prakiraan cuaca 3 hari kedepan yang akurat.
- Integrasi dengan peta interaktif untuk visualisasi rute (menggunakan Leaflet dan OpenStreetMap).
- Prediksi rute anti banjir berdasarkan data area rawan banjir dan cuaca.

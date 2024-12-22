<template>
    <div class="dashboard p-4 card">
      <h1 class="text-3xl mb-4">Rute Anti Banjir</h1>
      <p class="mb-4">Proyek "Rute Anti Banjir" adalah sebuah aplikasi berbasis web yang dirancang untuk membantu pengguna menemukan rute yang aman dari banjir di Kota Semarang. Aplikasi ini memanfaatkan data area rawan banjir dan cuaca untuk memberikan rekomendasi rute yang aman hingga 3 hari ke depan.</p>
  
      <h2 class="text-2xl mt-6">Fitur</h2>
      <ul class="list-disc ml-5">
        <li>Integrasi dengan API cuaca BMKG untuk mendapatkan prakiraan cuaca 3 hari kedepan yang akurat.</li>
        <li>Integrasi dengan peta interaktif untuk visualisasi rute (menggunakan Leaflet dan OpenStreetMap).</li>
        <li>Prediksi rute anti banjir berdasarkan data area rawan banjir dan cuaca.</li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: "Dashboard",
  };
  </script>
  
  <style scoped>
  .dashboard {
    font-family: Arial, sans-serif;
    line-height: 1.6;
  }
  </style>
  
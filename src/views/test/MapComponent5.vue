<template>
  <div id="app">
    <h1>Rute AI dengan Leaflet dan OpenRouteService</h1>
    <div id="map" style="height: 500px;"></div>
    <div>
      <p>Koordinat Awal: {{ startCoord }}</p>
      <p>Koordinat Tujuan: {{ endCoord }}</p>
      <button @click="getRoute" :disabled="!startCoord || !endCoord">
        Tentukan Rute
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "App",
  data() {
    return {
      map: null, // Instance Leaflet map
      startCoord: null, // Titik awal koordinat
      endCoord: null, // Titik tujuan koordinat
      routeLayer: null, // Layer untuk menampilkan rute
    };
  },
  mounted() {
    // Inisialisasi peta Leaflet di Semarang
    this.map = L.map("map").setView([-6.966667, 110.416664], 13);

    // Tambahkan tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.map);

    // Event klik pada peta untuk menentukan titik koordinat
    this.map.on("click", this.handleMapClick);
  },
  methods: {
    // Menangani klik pada peta
    handleMapClick(e) {
      const coord = [e.latlng.lat, e.latlng.lng];
      if (!this.startCoord) {
        this.startCoord = coord;
        L.marker(coord).addTo(this.map).bindPopup("Titik Awal").openPopup();
      } else if (!this.endCoord) {
        this.endCoord = coord;
        L.marker(coord).addTo(this.map).bindPopup("Titik Tujuan").openPopup();
      } else {
        alert("Anda telah memilih titik awal dan tujuan.");
      }
    },
    // Ambil rute dari OpenRouteService API
    async getRoute() {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer); // Hapus rute sebelumnya
      }

      const apiKey = "5b3ce3597851110001cf62485212891d3919499884da249f6d9578c5"; // Ganti dengan API Key Anda
      const baseUrl = "https://api.openrouteservice.org/v2/directions/driving-car";
      const url = `${baseUrl}?api_key=${apiKey}&start=${this.startCoord[1]},${this.startCoord[0]}&end=${this.endCoord[1]},${this.endCoord[0]}`;

      try {
        const response = await axios.get(url);
        const coordinates = response.data.features[0].geometry.coordinates;

        // Konversi koordinat GeoJSON ke Leaflet format
        const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);
        this.routeLayer = L.polyline(latLngs, { color: "blue" }).addTo(this.map);

        // Zoom ke rute
        this.map.fitBounds(this.routeLayer.getBounds());
      } catch (error) {
        console.error("Gagal mengambil data rute:", error);
        alert("Gagal menghitung rute. Periksa API Key atau koordinat.");
      }
    },
  },
};
</script>

<style>
#map {
  margin-bottom: 20px;
  border: 1px solid #ccc;
}
</style>

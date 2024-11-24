<template>
  <div>
    <h1>Rute Kota Semarang</h1>
    <div id="map" style="height: 500px; margin-bottom: 20px;"></div>
    <div class="controls">
      <label>Start:
        <input v-model="start" placeholder="Lokasi awal" />
      </label>
      <label>Target:
        <input v-model="target" placeholder="Lokasi tujuan" />
      </label>
      <button @click="findRoute">Cari Rute</button>
    </div>
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

export default {
  data() {
    return {
      map: null,
      start: "",
      target: "",
      markers: [],
      routeLayer: null,
    };
  },
  methods: {
    initializeMap() {
      this.map = L.map("map").setView([-6.99361, 110.40683], 13);

      // Tambahkan layer peta dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);
    },
    async geocode(location) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await response.json();
      if (data.length === 0) {
        alert(`Lokasi "${location}" tidak ditemukan.`);
        return null;
      }
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)]; // Format GeoJSON [lng, lat]
    },
    async findRoute() {
      if (!this.start || !this.target) {
        alert("Silakan masukkan lokasi awal dan tujuan.");
        return;
      }

      const startCoord = await this.geocode(this.start);
      const targetCoord = await this.geocode(this.target);

      if (!startCoord || !targetCoord) return;

      // Hapus marker dan rute sebelumnya
      this.markers.forEach((marker) => this.map.removeLayer(marker));
      if (this.routeLayer) this.map.removeLayer(this.routeLayer);

      // Tambahkan marker untuk lokasi awal dan tujuan
      const startMarker = L.marker([startCoord[1], startCoord[0]]).bindPopup("Start: " + this.start);
      const targetMarker = L.marker([targetCoord[1], targetCoord[0]]).bindPopup("Target: " + this.target);

      startMarker.addTo(this.map);
      targetMarker.addTo(this.map);
      this.markers = [startMarker, targetMarker];

      // Fetch rute dari OSRM API
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoord.join(",")};${targetCoord.join(",")}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]); // Convert to [lat, lng]

        // Gambarkan rute di peta
        this.routeLayer = L.polyline(coordinates, { color: "blue" });
        this.routeLayer.addTo(this.map);
        this.map.fitBounds(this.routeLayer.getBounds());
      } else {
        alert("Rute tidak ditemukan.");
      }
    },
  },
  mounted() {
    this.initializeMap();
    // universitas semarang, semarang, jawa tengah, indonesia
    // simpang lima, semarang, jawa tengah, indonesia
  },
};
</script>

<style>
#map {
  border: 1px solid #ccc;
}
.controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>

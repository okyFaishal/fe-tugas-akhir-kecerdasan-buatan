<template>
  <div id="app">
    <h1>Rute dengan Penghindaran Area</h1>
    <div id="map" style="height: 500px;"></div>
    <button @click="getRoute">Hitung Rute</button>
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
      map: null,
      startCoord: [-6.9932, 110.4203], // Titik awal (lat, lng)
      endCoord: [-6.9848, 110.4352], // Titik tujuan (lat, lng)
      restrictedAreas: [
        {
          id_area_banjir: "43e5baa1-d6cc-466d-ac3a-062fdbb07a86",
          nama_area_banjir: "Area Banjir 1",
          list_titik_area_banjir: [
            { lat_titik_area_banjir: "-6.989644173706021", lng_titik_area_banjir: "110.43440637111286" },
            { lat_titik_area_banjir: "-6.988451472861695", lng_titik_area_banjir: "110.42745311132884" },
            { lat_titik_area_banjir: "-6.9982485681456925", lng_titik_area_banjir: "110.4237618746534" },
            { lat_titik_area_banjir: "-6.9995264349850554", lng_titik_area_banjir: "110.43097266257753" },
          ],
        },
      ],
      routeLayer: null,
    };
  },
  mounted() {
    this.initializeMap();
  },
  methods: {
    // Inisialisasi peta Leaflet
    initializeMap() {
      this.map = L.map("map").setView(this.startCoord, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(this.map);

      // Tambahkan marker awal dan akhir
      L.marker(this.startCoord).addTo(this.map).bindPopup("Titik Awal").openPopup();
      L.marker(this.endCoord).addTo(this.map).bindPopup("Titik Tujuan").openPopup();
    },

    // Format koordinat poligon dari area yang akan dihindari
    formatPolygons() {
      return this.restrictedAreas.map((area) => {
        const points = area.list_titik_area_banjir.map((point) => [
          parseFloat(point.lng_titik_area_banjir),
          parseFloat(point.lat_titik_area_banjir),
        ]);

        // Pastikan poligon tertutup
        if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) {
          points.push(points[0]);
        }

        return [points];
      });
    },

    // Ambil rute dengan menghindari area tertentu
    async getRoute() {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
      }

      const apiKey = "5b3ce3597851110001cf62485212891d3919499884da249f6d9578c5";
      const baseUrl = "https://api.openrouteservice.org/v2/directions/driving-car";

      const avoidPolygons = {
        type: "MultiPolygon",
        coordinates: this.formatPolygons(),
      };

      const data = {
        coordinates: [
          [this.startCoord[1], this.startCoord[0]], // Format [lng, lat]
          [this.endCoord[1], this.endCoord[0]],
        ],
        options: {
          avoid_polygons: avoidPolygons,
        },
      };

      try {
        const response = await axios.post(baseUrl, data, {
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
        });

        // Cek apakah response berisi fitur dan koordinat
        if (response.data.features && response.data.features.length > 0) {
          const coordinates = response.data.features[0].geometry.coordinates;
          const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);

          // Tampilkan rute pada peta
          this.routeLayer = L.polyline(latLngs, { color: "blue" }).addTo(this.map);
          this.map.fitBounds(this.routeLayer.getBounds());
        } else {
          console.error("Tidak ada rute yang ditemukan.");
          alert("Tidak ada rute yang ditemukan.");
        }
      } catch (error) {
        console.error("Error mengambil rute:", error.response?.data || error);
        alert("Rute tidak ditemukan atau ada kesalahan.");
      }
    }

  },
};
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
#map {
  width: 100%;
}
button {
  margin: 10px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
button:hover {
  background-color: #0056b3;
}
</style>

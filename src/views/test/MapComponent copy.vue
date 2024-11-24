<script>
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  data() {
    return {
      map: null,
      startCoord: null,
      endCoord: null,
      routeLayer: null,
      restrictedAreas: [
        {
          id_area_banjir: "43e5baa1-d6cc-466d-ac3a-062fdbb07a86",
          nama_area_banjir: "4",
          list_titik_area_banjir: [
            { lat_titik_area_banjir: "-6.989644173706021", lng_titik_area_banjir: "110.43440637111286" },
            { lat_titik_area_banjir: "-6.988451472861695", lng_titik_area_banjir: "110.42745311132884" },
            { lat_titik_area_banjir: "-6.9982485681456925", lng_titik_area_banjir: "110.4237618746534" },
            { lat_titik_area_banjir: "-6.9995264349850554", lng_titik_area_banjir: "110.43097266257753" },
          ],
        },
      ],
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = L.map("map").setView([-6.993, 110.43], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(this.map);

      this.map.on("click", (e) => {
        if (!this.startCoord) {
          this.startCoord = [e.latlng.lat, e.latlng.lng];
          L.marker(this.startCoord).addTo(this.map).bindPopup("Start Point").openPopup();
        } else if (!this.endCoord) {
          this.endCoord = [e.latlng.lat, e.latlng.lng];
          L.marker(this.endCoord).addTo(this.map).bindPopup("End Point").openPopup();
          this.getRoute();
        }
      });

      this.drawRestrictedAreas();
    },
    drawRestrictedAreas() {
      this.restrictedAreas.forEach((area) => {
        const latLngs = area.list_titik_area_banjir.map((point) => [point.lat_titik_area_banjir, point.lng_titik_area_banjir]);
        L.polygon(latLngs, { color: "red" }).addTo(this.map).bindPopup("Restricted Area");
      });
    },
    async getRoute() {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
      }

      const apiKey = "5b3ce3597851110001cf62485212891d3919499884da249f6d9578c5";
      const baseUrl = "https://api.openrouteservice.org/v2/directions/driving-car";

      // Mengubah area ke GeoJSON MultiPolygon
      const avoidPolygons = {
        type: "MultiPolygon",
        coordinates: this.restrictedAreas.map((area) => [
          area.list_titik_area_banjir.map((point) => [parseFloat(point.lng_titik_area_banjir), parseFloat(point.lat_titik_area_banjir)]),
        ]),
      };

      const data = {
        coordinates: [
          [this.startCoord[1], this.startCoord[0]], // Format [lng, lat]
          [this.endCoord[1], this.endCoord[0]],
        ],
        options: {
          avoid_polygons: avoidPolygons, // Poligon untuk dihindari
        },
      };

      try {
        const response = await axios.post(baseUrl, data, {
          headers: {
            "Authorization": apiKey,
            "Content-Type": "application/json",
          },
        });

        const coordinates = response.data.features[0].geometry.coordinates;

        const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);
        this.routeLayer = L.polyline(latLngs, { color: "blue" }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds());
      } catch (error) {
        console.error("Gagal mengambil data rute:", error);
        alert("Rute tidak ditemukan atau gagal menghitung.");
      }
    },
  },
};
</script>

<template>
  <div>
    <div id="map" style="height: 500px;"></div>
  </div>
</template>

<style>
#map {
  width: 100%;
  height: 500px;
}
</style>
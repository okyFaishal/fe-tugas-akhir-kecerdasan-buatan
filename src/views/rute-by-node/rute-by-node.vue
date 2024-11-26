<template>
  <div class="card text-center h-100" v-show="loading">
    <ProgressSpinner />
  </div>
  <div id="app" v-show="!loading">
    <div class="card">
      <Textarea class="w-full" v-model="listNode" autoResize />
      <Button class="w-full" severity="primary" @click="displayRuteWaysArdan(listNode)">Find</Button>
    </div>
    <!-- Elemen untuk peta -->
    <div id="map" ref="mapContainer"></div>
  </div>
</template>

<script>
// Impor Leaflet dan file CSS untuk peta
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "App",
  data() {
    return {
      loading: false,
      // Objek peta Leaflet
      map: null,
      // Koordinat pusat peta (Semarang)
      semarangCoordinates: [-6.987599541823833, 110.41071318060438],
      // koordinat rute
      rute: {
        asal: null,
        tujuan: null,
        listRute: [],
      },
      // URL API Overpass
      apiURL: "https://overpass-api.de/api/interpreter",
      nodes: {},
      ways: {},
      listRoute: [],
      listNode: [],
    };
  },
  async mounted() {
    this.loading = true
    await this.initMap();
    this.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Rute telah siap', life: 3000 });
    this.loading = false
  },
  methods: {
    // Inisialisasi peta Leaflet
    async initMap() {
      // Membuat peta dengan pusat di koordinat Semarang
      this.map = L.map(this.$refs.mapContainer).setView(this.semarangCoordinates, 17);

      // Menambahkan tile layer dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20, // Maksimal zoom
        zoom: 14,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Memanggil fungsi untuk mengambil rute dari API
      await this.fetchRoutes();
    },

    // Mengambil data rute dari Overpass API
    async fetchRoutes() {
      try {
        // Query untuk mendapatkan data jalan (highway) di sekitar koordinat
        const query = `
          [out:json];
          way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:16000,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});
          out;>;out skel;
        `;
        // Panggil API menggunakan Fetch
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        // Parse hasil JSON dari API
        const data = await response.json();
        console.log('data', data)

        // Tampilkan rute di peta
        await this.setRoutes(data);
        // await this.displayRuteWaysArdan();
        
      } catch (error) {
        console.error("Gagal mengambil data dari Overpass API:", error);
      }
    },

    async displayRuteWaysArdan(nodes){
      
      this.listRoute.forEach(rute => {
        rute.remove();
      });
      this.listRoute = []
      // const nodes = ['257094446', '7051156748', '7051156747', '257094447', '5510245124', '3495176720', '259668207', '5510244619', '3495176483', '259668206', '7051333200', '1930113755', '3492762019', '3492762025', '7300997760', '5441992212', '7119000261', '7119000260', '7119000263', '7119000264', '7238426082', '7238426078', '5527025814', '1930178584', '5527025815', '1930178582', '6257275557', '6257275553', '79761954', '7298635103', '2436138308', '79761955', '2436108664', '79761956', '2436108658', '79770445', '2069254788', '79761957', '3933861793', '3933861768', '2891410175', '2069254802', '257677939', '3933861811', '2069254797', '3933861779', '79770413', '2069254793', '79770414', '5428405226', '2436138320', '7051333205', '2436138325', '1280164912', '6257275540', '6257275537', '7199473458', '11140126947', '1280164925', '12062872911', '11140126942', '8503008193', '11415385011']
      // console.log("nodes", nodes)
      let listNode = (JSON.parse(nodes)).map(x => { return this.nodes[x]})
      console.log("listNode", listNode)
      
      this.listRoute.push(L.polyline(listNode, { color: "red" }).addTo(this.map))
    },

    // Menggambar rute di peta berdasarkan data dari Overpass API
    async setRoutes(data) {
      // console.log('data', data)
      this.nodes = {}; // Menyimpan koordinat semua node
      this.ways = {}; // Menyimpan daftar way (jalan)

      // Proses setiap elemen hasil API (dipisah karena proses way butuh hasil dari node)
      // Simpan koordinat node berdasarkan ID
      data.elements.forEach((element) => {
        if (element.type === "node") {
          this.nodes[element.id] = [element.lat, element.lon];
        } 
      // });
      // // Simpan daftar node yang membentuk way
      // data.elements.forEach((element) => {
        if (element.type === "way") {
          element.nodeStart = element.nodes[0]
          element.nodeEnd = element.nodes[element.nodes.length-1]
          // element.jarak = 0
          // for (let i = 0; i < element.nodes.length - 1; i++) {
          //   const node = element.nodes[i];
          //   let lat1 = this.nodes[node][0]
          //   let lat2 = this.nodes[node][1]
          //   let lng1 = this.nodes[element.nodes[i+1]][0]
          //   let lng2 = this.nodes[element.nodes[i+1]][1]
          //   element.jarak += this.getDistanceFromLatLonInKm(lat1, lat2, lng1, lng2)
          // }
          this.ways[element.id] = element;
          // console.log("element", element)
        }
      });

      if(false){
        // Tambahkan setiap way ke peta
        for (const key in this.ways) {
          if (Object.prototype.hasOwnProperty.call(this.ways, key)) {
            const way = this.ways[key];
            // console.log(way.tags.name, way)
          // const way = ways[6]
            // Konversi node ID ke koordinat latitude-longitude
            const latlngs = way.nodes.map((nodeId) => this.nodes[nodeId]).filter(Boolean);
            if (latlngs.length) {
              // Tambahkan polyline ke peta dengan warna biru
              // L.polyline(latlngs, { color: "blue" }).addTo(this.map);
            }
            // test titik titik koordinat
            // console.log('latlngs', latlngs)
            for (let i = 0; i < latlngs.length; i++) {
              const node = latlngs[i];
              // if(way.id == '1302466496' && i == 0) console.log(way)
              // L.marker(node).addTo(this.map).bindPopup(`${i} ${way.id} ${way.tags.name} ${way.tags.oneway}`)
            }
            // for (let i = 0; i < way.nodes.length; i++) {
            //   const node = way.nodes[i];
            //   if(node == '6257275515') console.log(`${i} ${way.id} ${way.tags.name} ${way.tags.oneway}`)
            // }
          }
        }
      }
    },
  },
};
</script>

<style>
/* Pastikan elemen peta memenuhi layar penuh */
#map {
  height: 80vh;
  width: 100%;
}
</style>

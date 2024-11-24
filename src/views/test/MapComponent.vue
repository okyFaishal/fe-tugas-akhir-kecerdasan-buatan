<template>
  <div id="app">
    <Button class="mb-3 w-full" severity="warn" @click="resetRute()">reset</Button>
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
    };
  },
  async mounted() {
    // Inisialisasi peta saat komponen dimuat
    let test = []
    await this.initMap();
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
      this.fetchRoutes();
      
      // Event klik untuk memilih koordinat
      this.map.on("click", this.onMapClick);
    },

    // Mengambil data rute dari Overpass API
    async fetchRoutes() {
      try {
        // Query untuk mendapatkan data jalan (highway) di sekitar koordinat
        const query = `
          [out:json];
          way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:670,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});
          out;>;out skel;
        `;
        // const query = `[out:json];way[highway](around:200,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});out;>;out skel;`;
        // Panggil API menggunakan Fetch
        const response = await fetch(`${this.apiURL}?data=${encodeURIComponent(query)}`);
        // Parse hasil JSON dari API
        const data = await response.json();

        // Tampilkan rute di peta
        this.setRoutes(data);
      } catch (error) {
        console.error("Gagal mengambil data dari Overpass API:", error);
      }
    },

    // Event klik di peta
    onMapClick(e) {
      const { lat, lng } = e.latlng;

      if (!this.rute.asal) {
        // Tetapkan koordinat awal
        this.rute.asal = [lat.toFixed(7), lng.toFixed(7)];
        this.rute.listRute.push(L.marker([lat, lng]).addTo(this.map).bindPopup("titik awal"));
        this.rute.titikTerdekatAsal = this.cekTitikRuteTerdekat(lat, lng)
      } else if (!this.rute.tujuan) {
        // Tetapkan koordinat akhir
        this.rute.tujuan = [lat.toFixed(7), lng.toFixed(7)];
        this.rute.listRute.push(L.marker([lat, lng]).addTo(this.map).bindPopup("titik akhir"));
        this.rute.titikTerdekatTujuan = this.cekTitikRuteTerdekat(lat, lng)
        // this.getWayRute(this.rute.titikTerdekatAsal, this.rute.titikTerdekatTujuan, [])

        // get way asal dan tujuan
        const wayAsal = this.getWayRute(this.rute.titikTerdekatAsal)
        const wayTujuan = this.getWayRute(this.rute.titikTerdekatTujuan)
        console.log('wayAsal', wayAsal)
        console.log('wayTujuan', wayTujuan)
        // set ways from
        const waysFrom = []
        waysFrom.push({...wayAsal, nodeWaySearch: wayAsal.nodeEnd})
        if(wayAsal.tags.oneway == 'no') waysFrom.push({...wayAsal, nodeWaySearch: wayAsal.nodeStart})
        // set ways to
        const waysTo = []
        waysTo.push({...wayTujuan, nodeWaySearch: wayTujuan.nodeEnd})
        if(wayTujuan.tags.oneway == 'no') waysTo.push({...wayTujuan, nodeWaySearch: wayTujuan.nodeStart})

        // get rute
        // this.getRute(waysFrom, waysTo, [], [])
        let hasil = this.getRute(waysFrom, waysTo, [], [])
        console.log("hasil", hasil)

        // Tampilkan rute setelah kedua titik dipilih
        // this.fetchRoute();
      }
    },

    resetRute(){
      this.rute.listRute.forEach(rute => {
        rute.remove();
      });
      this.rute = {
        asal: null,
        tujuan: null,
        listRute: [],
      }
    },

    cekTitikRuteTerdekat(lat, lng){
      let titikTerdekat = null
      let jarak = null
      // console.log("this.nodes", this.nodes)
      for (const key in this.nodes) {
        const latCek = Math.abs(Math.abs(this.nodes[key][0]) - Math.abs(lat))
        const lngCek = Math.abs(Math.abs(this.nodes[key][1]) - Math.abs(lng))
        const total = latCek + lngCek
        if(!jarak || total < jarak) {
          titikTerdekat = this.nodes[key]
          jarak = total
        }
      }
      L.polyline([
        [lat, lng],
        titikTerdekat,
      ], { color: "red" }).addTo(this.map);
      return titikTerdekat
    },

    getWayRute(search){
      // const waysFrom = []
      for (const key in this.ways) { //perulangan way
        if (Object.prototype.hasOwnProperty.call(this.ways, key)) {
          const way = this.ways[key];
          for (let i = 0; i < way.nodes.length; i++) { // perulangan node pada way
            const node = way.nodes[i];
            // jika lat dan lng search dan node pada way sama
            if(this.nodes[node][0] == search[0] && this.nodes[node][1] == search[1]){
              return way
            }
          }
        }
      }
    },

    getWay(wayFrom){
      const waysFrom = []
      for (const key in this.ways) {
        if (Object.prototype.hasOwnProperty.call(this.ways, key)) {
          const way = this.ways[key];
          if(way.nodeStart == wayFrom.nodeWaySearch) {
            waysFrom.push({...way, nodeWaySearch: way.nodeEnd})
          }else if(way.tags.oneway = 'no' && way.nodeEnd == wayFrom.nodeWaySearch){
            waysFrom.push({...way, nodeWaySearch: way.nodeStart})
          }
        }
      }
      return waysFrom
    },

    getRute(waysFrom, waysTo, nodeVisited, listSearchWay){
      // const listSearchWay = [] // list way yang akan dicari dalam proses  selanjutnya
      // perulangan way master
      console.log('1', listSearchWay)
      for (const key in this.ways) {
        if (Object.prototype.hasOwnProperty.call(this.ways, key)) {
          const way = this.ways[key]; // way = way yang ada / asli
          // perulangan way from
          for (let a = 0; a < waysFrom.length; a++) {
            const wayFrom = waysFrom[a]; // wayFrom = way asal dalam proses ini
            // perulangan way to
            for (let b = 0; b < waysTo.length; b++) {
              const wayTo = waysTo[b]; // wayTo = way tujuan
              // i++
              if(way.nodeStart == wayFrom.nodeWaySearch){ // mulai dari node awal
                if(way.nodeEnd == wayTo.nodeWaySearch){ // jika way end sama
                  // selesai pencarian cabang ini
                  return listSearchWay
                }else{
                  if (!nodeVisited.some(x => x === wayFrom.nodeWaySearch)) {
                    let hasil = this.getRute(
                      this.getWay( {...way, nodeWaySearch: way.nodeEnd}), // waysFrom
                      waysTo, // waysTo
                      [...nodeVisited, wayFrom.nodeWaySearch], // nodeVisited
                      [...listSearchWay, {...wayFrom, nodeWaySearch: wayFrom.nodeWaySearch}] // listSearchWay
                    )
                    if(hasil && hasil.length > 0){
                      return hasil
                    }
                  }
                }
              }else if(way.nodeEnd == wayFrom.nodeWaySearch && way.tags.oneway == 'no'){ // mulai dari node akhir dan untuk jalan dua arah
                if(way.nodeEnd == wayTo.nodeWaySearch){ // jika way end sama
                  // selesai pencarian cabang ini
                  return listSearchWay
                }else{
                  if (!nodeVisited.some(x => x === wayFrom.nodeWaySearch)) {
                    let hasil = this.getRute(
                      this.getWay( {...way, nodeWaySearch: way.nodeStart}), // waysFrom
                      waysTo, // waysTo
                      [...nodeVisited, wayFrom.nodeWaySearch], // nodeVisited
                      [...listSearchWay, {...wayFrom, nodeWaySearch: wayFrom.nodeWaySearch}] // listSearchWay
                    )
                    if(hasil && hasil.length > 0){
                      return hasil
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    // Menggambar rute di peta berdasarkan data dari Overpass API
    setRoutes(data) {
      // console.log('data', data)
      this.nodes = {}; // Menyimpan koordinat semua node
      this.ways = {}; // Menyimpan daftar way (jalan)

      // Proses setiap elemen hasil API (dipisah karena proses way butuh hasil dari node)
      // Simpan koordinat node berdasarkan ID
      data.elements.forEach((element) => {
        if (element.type === "node") {
          this.nodes[element.id] = [element.lat, element.lon];
        } 
      });
      // Simpan daftar node yang membentuk way
      data.elements.forEach((element) => {
        if (element.type === "way") {
          element.nodeStart = element.nodes[0]
          element.nodeEnd = element.nodes[element.nodes.length-1]
          element.jarak = 0
          for (let i = 0; i < element.nodes.length - 1; i++) {
            const node = element.nodes[i];
            let lat1 = this.nodes[node][0]
            let lat2 = this.nodes[node][1]
            let lng1 = this.nodes[element.nodes[i+1]][0]
            let lng2 = this.nodes[element.nodes[i+1]][1]
            element.jarak += this.getDistanceFromLatLonInKm(lat1, lat2, lng1, lng2)
          }
          this.ways[element.id] = element;
          // console.log("element", element)
        }
      });

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
            L.polyline(latlngs, { color: "blue" }).addTo(this.map);
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
      console.log("nodes", this.nodes)
      console.log("ways", this.ways)
    },
    getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
      var dLon = this.deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d;
    },
    deg2rad(deg) {
      return deg * (Math.PI/180); 1 
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

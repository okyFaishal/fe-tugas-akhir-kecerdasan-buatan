<template>
  <div class="card text-center h-100" v-show="loading">
    <ProgressSpinner />
  </div>
  <div id="app" v-show="true">
    <Button class="mb-3 w-full" severity="warn" @click="resetRute()">reset</Button>
    <!-- Elemen untuk peta -->
    <div id="map" ref="mapContainer"></div>
  </div>
</template>

<script>
// Impor Leaflet dan file CSS untuk peta
import Axios from 'axios';
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
    };
  },
  async mounted() {
    this.loading = true
    // Inisialisasi peta saat komponen dimuat
    let test = []
    let openweathermap = await Axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: -6.987599541823833,
        lon: 110.41071318060438,
        appid: '1f4fdff7329bd98f31a366f69925c59b',
      },
    }); 
    console.log("openweathermap", openweathermap)
    await this.initMap();
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
      // const res = await this.$axios.post('rute_perjalanan/test', {test: 123})
      // console.log("rute_perjalanan/test", res)
      // if(res.data.status == 200){
      //   // this.displayRuteWaysArdan(res.data.data)
      // }
      
      // Event klik untuk memilih koordinat
      this.map.on("click", this.onMapClick);
    },

    // Mengambil data rute dari Overpass API
    async fetchRoutes() {
      try {
        // Query untuk mendapatkan data jalan (highway) di sekitar koordinat
        // 16000
        // const query = `[out:json];way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:670,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});out;>;out skel;
        // const query = `[out:json];way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:16000,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});out;>;out skel;
        // `;
        const query = `
          [out:json];
          way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:16000,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});
          out;>;out skel;
        `;
        // const query = `
        //   [out:json];
        //   way(around:600,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});
        //   out;>;out skel;
        // `;
        // const query = `[out:json];way[highway](around:200,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});out;>;out skel;`;
        // Panggil API menggunakan Fetch
        const response = await fetch(`${this.apiURL}?data=${encodeURIComponent(query)}`);
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

    // Event klik di peta
    async onMapClick(e) {
      const { lat, lng } = e.latlng;
      console.log("lat, lng", lat, lng)

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


        const res = await this.$axios.post('rute_perjalanan/test', {wayAsal: wayAsal.id, wayTujuan: wayTujuan.id})
        console.log("rute_perjalanan/test", res)
        if(res.data.status == 200){
          this.displayRuteWaysArdan(res.data.data)
        }

        // // set ways from
        // const waysFrom = []
        // waysFrom.push({...wayAsal, nodeWaySearch: wayAsal.nodeEnd})
        // if(wayAsal.tags.oneway == 'no') waysFrom.push({...wayAsal, nodeWaySearch: wayAsal.nodeStart})
        // // set ways to
        // const waysTo = []
        // waysTo.push({...wayTujuan, nodeWaySearch: wayTujuan.nodeEnd})
        // if(wayTujuan.tags.oneway == 'no') waysTo.push({...wayTujuan, nodeWaySearch: wayTujuan.nodeStart})

        // // get rute
        // // this.getRute(waysFrom, waysTo, [], [])
        // let hasil = this.getRute(waysFrom, waysTo, [], [])
        // console.log("hasil", hasil)
        // this.displayRute(hasil)

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

    displayRute(ways){
      const listNode = []
      for (let i = 0; i < ways.length; i++) {
        const way = ways[i];
        let listNodes = []
        if(way.nodeWaySearch === way.nodeEnd){
          listNodes = way.nodes
        }else{
          listNodes = way.nodes.reverse()
        }
        for (let u = 0; u < listNodes.length; u++) {
          const node = listNodes[u];
          listNode.push(this.nodes[node])
        }
      }
      L.polyline(listNode, { color: "red" }).addTo(this.map);
    },

    async displayRuteWaysArdan(nodes){
      // const nodes = ['257094446', '7051156748', '7051156747', '257094447', '5510245124', '3495176720', '259668207', '5510244619', '3495176483', '259668206', '7051333200', '1930113755', '3492762019', '3492762025', '7300997760', '5441992212', '7119000261', '7119000260', '7119000263', '7119000264', '7238426082', '7238426078', '5527025814', '1930178584', '5527025815', '1930178582', '6257275557', '6257275553', '79761954', '7298635103', '2436138308', '79761955', '2436108664', '79761956', '2436108658', '79770445', '2069254788', '79761957', '3933861793', '3933861768', '2891410175', '2069254802', '257677939', '3933861811', '2069254797', '3933861779', '79770413', '2069254793', '79770414', '5428405226', '2436138320', '7051333205', '2436138325', '1280164912', '6257275540', '6257275537', '7199473458', '11140126947', '1280164925', '12062872911', '11140126942', '8503008193', '11415385011']
      // console.log("nodes", nodes)
      let listNode = nodes.map(x => { return this.nodes[x]})
      // console.log("listNode", listNode)
      
      L.polyline(listNode, { color: "red" }).addTo(this.map);
    },

    // async displayRuteWaysArdan(){
    //   const ways = ['257094446', '7051156748', '7051156747', '257094447', '5510245124', '3495176720', '259668207', '5510244619', '3495176483', '259668206', '7051333200', '1930113755', '3492762019', '3492762025', '7300997760', '5441992212', '7119000261', '7119000260', '7119000263', '7119000264', '7238426082', '7238426078', '5527025814', '1930178584', '5527025815', '1930178582', '6257275557', '6257275553', '79761954', '7298635103', '2436138308', '79761955', '2436108664', '79761956', '2436108658', '79770445', '2069254788', '79761957', '3933861793', '3933861768', '2891410175', '2069254802', '257677939', '3933861811', '2069254797', '3933861779', '79770413', '2069254793', '79770414', '5428405226', '2436138320', '7051333205', '2436138325', '1280164912', '6257275540', '6257275537', '7199473458', '11140126947', '1280164925', '12062872911', '11140126942', '8503008193', '11415385011']
    //   let node = []
    //   for (let a = 0; a < ways.length; a++) {
    //     const way = this.ways[ways[a]];
    //     console.log("way", way)
    //     console.log("this.ways", this.ways)
    //     if(node.length == 0) {
    //       let reverse = false
    //       const aa = way.nodeStart
    //       const ab = way.nodeEnd
    //       const ba = this.ways[ways[a]].nodeStart
    //       const bb = this.ways[ways[a]].nodeEnd
    //       if(aa == ba){
    //         reverse = false
    //       } else if(aa == bb) {
    //         reverse = false
    //       } else if(ab == ba) {
    //         reverse = true
    //       } else if(ab == bb) {
    //         reverse = true
    //       }
    //       node = [...node, ...(reverse ? way.nodes.reverse() : way.node)]
    //     }else{
    //       let endBefore = node[node.length-1]
    //       const aa = way.nodeStart
    //       const ab = way.nodeEnd
    //       if(aa == endBefore){
    //         reverse = false
    //       } else if(ab == endBefore) {
    //         reverse = true
    //       }
    //       node = [...node, ...(reverse ? way.nodes.reverse() : way.node)]
    //     }
    //   }
    //   console.log('node', node)
    //   const listNode = node.map(x => { return this.nodes[x]})
    //   console.log('listNode', listNode)
    //   L.polyline(listNode, { color: "red" }).addTo(this.map);
    // },

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

      if(false){
        let listWayJson = []
        for (const key in this.ways) {
          if (Object.prototype.hasOwnProperty.call(this.ways, key)) {
            const way = this.ways[key];
            for (let i = 0; i < way.nodes.length; i++) {
              const node = way.nodes[i];
              let type = ''
              switch (way.tags.highway) {
                case 'motorway':
                  type = 'Jalan TOL'
                  break;
                case 'trunk':
                  type = 'Jalur nasional'
                  break;
                case 'primary':
                  type = 'Jalur antar kota'
                  break;
                case 'secondary':
                  type = 'Jalan sedang'
                  break;
                case 'tertiary':
                  type = 'Jalan kecil'
                  break;
              }
              if(way.tags.name){
                listWayJson.push({
                  jalan: way.tags.name,
                  'satu arah': way.tags.oneway === 'no' ? 'tidak' : 'ya',
                  motor: way.tags.motorcycle === 'yes' ? 'ya' : 'tidak',
                  highway: type,
                  'panjang jalan': Math.round(way.jarak * 1000),
                  urutan: i+1,
                  latitude: this.nodes[node][0],
                  longitude: this.nodes[node][1],
                })
              }
            }
          }
        }
        console.log("listWayJson", listWayJson)
      }

      if(true){
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
      // console.log("nodes", this.nodes)
      // console.log("ways", this.ways)
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

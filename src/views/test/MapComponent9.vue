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
      ways: [],
      stop: false,
      hasil: []
    };
  },
  methods: {
    // Inisialisasi peta Leaflet
    initMap() {
      // Membuat peta dengan pusat di koordinat Semarang
      this.map = L.map(this.$refs.mapContainer).setView(this.semarangCoordinates, 17);

      // Menambahkan tile layer dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, // Maksimal zoom
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
          way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:480,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});
          out;>;out skel;
        `;
        // const query = `[out:json];way[highway](around:200,${this.semarangCoordinates[0]},${this.semarangCoordinates[1]});out;>;out skel;`;
        // Panggil API menggunakan Fetch
        const response = await fetch(`${this.apiURL}?data=${encodeURIComponent(query)}`);
        // Parse hasil JSON dari API
        const data = await response.json();

        // Tampilkan rute di peta
        this.drawRoutes(data);
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
        this.getWayRute(this.rute.titikTerdekatAsal, this.rute.titikTerdekatTujuan, [])

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

    // mendapatkan way pertama / titik asal
    getWayRute(start, end, rute){
      const vm = this
      let wayRute = null
      let nodeAwal = null
      let nodeTujuan = null
      if(rute) rute = [] // membuat rute jika belum ada
      let selesai = false // jika rute sudah ditemukan
      for (let a = 0; a < vm.ways.length; a++) { // perulangan way / jalan
        const way = vm.ways[a];
        for (let b = 0; b < way.nodes.length; b++) { // perulangan mencari titik awal
          const node = way.nodes[b];
          if(this.nodes[node][0] == start[0] && this.nodes[node][1] == start[1]){
            nodeAwal = node
            wayRute = way
            // console.log('start', way)
            selesai = true
            break
          }
        }
        for (let b = 0; b < way.nodes.length; b++) { // perulangan mencari titik tujuan
          const node = way.nodes[b];
          if(this.nodes[node][0] == end[0] && this.nodes[node][1] == end[1]){
            // console.log('end', way)
            nodeTujuan = node
            selesai = true
            break
          }
        }
        // if(selesai) break
      }
      this.stop = false 
      this.hasil = [] 
      let hasilRute = this.getRute(wayRute, nodeAwal, nodeTujuan, [], [])
      console.log('hasilRute', hasilRute)

      // this.drawRute(hasilRute[1])
      this.drawRute(this.hasil)

      // let ruteDisplay = this.getRuteDisplay(hasilRute)
      // console.log('ruteDisplay', ruteDisplay)
      // // if(ruteDisplay.statusA){
      //   this.createRuteDisplay(ruteDisplay.ruteA)
      // // }
      // // if(ruteDisplay.statusB){
      //   this.createRuteDisplay(ruteDisplay.ruteB)
      // // }
    },

    getRute(wayAwal, nodeAwal, nodeTujuan, listNodes, listSemuaWay){
      // console.log('1')
      // console.log("wayAwal", wayAwal)
      let first = listNodes.length == 0
      let status = false
      let find = false
      listSemuaWay.push(wayAwal.id)
      let reverse = false
      console.log(wayAwal.nodes.findIndex(x => x == nodeAwal), wayAwal.nodes.length-1)
      if(wayAwal.nodes.findIndex(x => x == nodeAwal) == wayAwal.nodes.length-1 && wayAwal.oneway == 'no') reverse = true
      if(!reverse){
        for (let a = 0; a < wayAwal.nodes.length; a++) { // perulangan node dalam way
          const node = wayAwal.nodes[a];
          if(node == nodeAwal) status = true // mencari node awal dalam way
          if(status){
            listNodes.push(node)
          }
          // jika node tujuan sudah ditemukan
          if(node == nodeTujuan) {
            find = true
            break
          } 
        }
      }else{
        for (let a = wayAwal.nodes.length-1; a >= 0 ; a--) { // perulangan node dalam way
          const node = wayAwal.nodes[a];
          if(node == nodeAwal) status = true // mencari node awal dalam way
          if(status){
            listNodes.push(node)
          }
          // jika node tujuan sudah ditemukan
          if(node == nodeTujuan) {
            find = true
            break
          } 
        }
      }
      // jika tidak menemukan node tujuan
      if(!find){
        let listWays = []
        for (let i = 0; i < this.ways.length; i++) {
          const way = this.ways[i];
          // tidak termasuk way yang sudah masuk dan yang tidak memiliki node terakhir
          if(!(listSemuaWay.some(x => x == way.id)) && way.nodes.some(x=> x == listNodes[listNodes.length-1])) {
            // console.log('-', listSemuaWay.some(x => x == way.id))
            listWays.push(way)
            let hasil = this.getRute(way, listNodes[listNodes.length-1], nodeTujuan, JSON.parse(JSON.stringify(listNodes)), JSON.parse(JSON.stringify(listSemuaWay)))
            // console.log("--", hasil)
            if(hasil[0]) {
              if(this.hasil.length == 0) this.hasil = hasil[1]
              console.log('hasil[0]', hasil)
              return [true, listNodes] 
            }
          }
        }
      }else{
        return [true, listNodes]
      }
      return [false, listNodes]
    },

    drawRute(datas){
      let koordinat = []
      for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        koordinat.push(this.nodes[data])
      }
      // console.log("koordinat", koordinat)
      L.polyline(koordinat, { color: "red" }).addTo(this.map);
    },

    // getRute(wayAwal, nodeAwal, titikTujuan, listWayId){
    //   console.log("jalan", nodeAwal)
    //   // console.log('getRute')
    //   let ruteA = [] 
    //   let lanjutA = false
    //   let ditemukanA = false
    //   let hasilA = []
    //   let ruteB = [] // jika jalan dua arah
    //   let lanjutB = false
    //   let ditemukanB = false
    //   let hasilB = []

    //   // rute arah a
    //   let status = false
    //   for (let i = 0; i < wayAwal.nodes.length; i++) { // perulangan way untuk menemukan node / titik
    //     const node = wayAwal.nodes[i];  
    //     if(this.stop) break
    //     if(node == nodeAwal) status = true // mencari node / titik
    //     if(status) { // jika titik ditemukan
    //       // if(rute)
    //       ruteA.push(node) // memasukkan node / titik ke rute
    //       if(this.nodes[node][0] == titikTujuan[0] && this.nodes[node][1] == titikTujuan[1]){ // jika titik sesuai dengan tujuan
    //         ditemukanA = true
    //         this.stop = true
    //         break
    //       }
    //     }
    //   }
    //   let nodeAkhirA = wayAwal.nodes[wayAwal.nodes.length-1]
    //   let listWayFromNodeA = this.getWayFromNode(nodeAkhirA, [...listWayId, wayAwal.id])
    //   if(listWayFromNodeA.length && !ditemukanA) {
    //     lanjutA = true
    //     for (let i = 0; i < listWayFromNodeA.length; i++) {
    //       const way = listWayFromNodeA[i];
    //       hasilA.push(this.getRute(way, nodeAkhirA, titikTujuan, [...listWayId, wayAwal.id]))
    //     }
    //   }
    //   // console.log('listWayFromNodeA', listWayFromNodeA)
    //   // if(lanjutA) getRute

    //   // rute arah b (jika jalan dua arah)
    //   if(wayAwal.tags.oneway == 'no'){
    //     let status = false
    //     for (let i = wayAwal.nodes.length - 1; i >= 0; i--) { // perualngan way untuk menemukan node / titik
    //       if(this.stop) break
    //       const node = wayAwal.nodes[i];
    //       if(node == nodeAwal) status = true // mencari node / titik
    //       if(status) { // jika titik ditemukan
    //         ruteB.push(node) // memasukkan node / titik ke rute
    //         if(this.nodes[node][0] == titikTujuan[0] && this.nodes[node][1] == titikTujuan[1]){ // jika titik sesuai dengan tujuan
    //           ditemukanB = true
    //           this.stop = true
    //           break
    //         }
    //       }
    //     }
    //     let nodeAkhirB = wayAwal.nodes[0]
    //     let listWayFromNodeB = this.getWayFromNode(nodeAkhirB, [...listWayId, wayAwal.id])
    //     if(listWayFromNodeB.length && !ditemukanB) {
    //       lanjutB = true
    //       for (let i = 0; i < listWayFromNodeB.length; i++) {
    //         const way = listWayFromNodeB[i];
    //         hasilB.push(this.getRute(way, nodeAkhirB, titikTujuan, [...listWayId, wayAwal.id]))
    //       }
    //     }
    //     // console.log('listWayFromNodeB', listWayFromNodeB)
    //   }

    //   // menggambar rute
    //   let a = ruteA.map(x => {return [...this.nodes[x]]})
    //   L.polyline(a, { color: "red" }).addTo(this.map);
    //   let b = ruteB.map(x => {return [...this.nodes[x]]})
    //   L.polyline(b, { color: "red" }).addTo(this.map);

    //   return {
    //     rute: [ ruteA, ruteB ],
    //     ruteA,
    //     lanjutA,
    //     ditemukanA,
    //     hasilA,
    //     ruteB,
    //     lanjutB,
    //     ditemukanB,
    //     hasilB,
    //   }
    // },

    // // mendapatkan rute yang akan di display
    // getRuteDisplay(data){
    //   let ruteA = []
    //   let statusA = false
    //   if(data.lanjutA || data.ditemukanA){
    //     for (let i = 0; i < data.ruteA.length; i++) {
    //       const rute = data.ruteA[i];
    //       ruteA.push(this.nodes[rute])
    //     }
    //     if(data.lanjutA){
    //       for (let b = 0; b < data.hasilA.length; b++) {
    //         let hasil = this.getRuteDisplay(data.hasilA[b])
    //         // console.log('hasil a', hasil)
    //         if(hasil.statusA || hasil.ruteB) {
    //           statusA = true
    //           ruteA = [...ruteA, ...hasil.ruteA, ...hasil.ruteB]
    //         }
    //       }
    //     }else if(data.ditemukanA){
    //       statusA = true
    //     }else{
    //       ruteA = []
    //     }
    //   }
      
    //   let ruteB = []
    //   let statusB = false
    //   if(data.lanjutB || data.ditemukanB){
    //     for (let i = 0; i < data.ruteB.length; i++) {
    //       const rute = data.ruteB[i];
    //       ruteB.push(this.nodes[rute])
    //     }
    //     if(data.lanjutB){
    //       for (let b = 0; b < data.hasilB.length; b++) {
    //         let hasil = this.getRuteDisplay(data.hasilB[b])
    //         console.log('hasil b', hasil)
    //         if(hasil.statusB || hasil.ruteA) {
    //           statusB = true
    //           ruteB = [...ruteB, ...hasil.ruteB, ...hasil.ruteA]
    //         }
    //       }
    //     }else if(data.ditemukanB){
    //       statusB = true
    //     }else{
    //       ruteB = []
    //     }
    //   }
    //   return {ruteA, statusA, ruteB, statusB}
    // },

    // // membuat display rute yang telah dibuat
    // createRuteDisplay(data){
    //   // menggambar rute
    //   L.polyline(data, { color: "green" }).addTo(this.map);
    // },

    // // mendapatkan way dari node
    // getWayFromNode(nodeAsal, wayPernahDilalui){
    //   const listWay = []
    //   for (let i = 0; i < this.ways.length; i++) {
    //     const way = this.ways[i];
    //     if(!(wayPernahDilalui.some(x => x == way.id))){
    //       for (let o = 0; o < way.nodes.length; o++) {
    //         const node = way.nodes[o];
    //         if(nodeAsal == node) {
    //           listWay.push(way)
    //           break
    //         }
    //       }
    //     }
    //   }
    //   return listWay
    // },

    // Menggambar rute di peta berdasarkan data dari Overpass API
    drawRoutes(data) {
      // console.log('data', data)
      this.nodes = {}; // Menyimpan koordinat semua node
      this.ways = []; // Menyimpan daftar way (jalan)

      // Proses setiap elemen hasil API
      data.elements.forEach((element) => {
        if (element.type === "node") {
          // Simpan koordinat node berdasarkan ID
          this.nodes[element.id] = [element.lat, element.lon];
        } else if (element.type === "way") {
          // Simpan daftar node yang membentuk way
          this.ways.push(element);
        }
      });

      // Tambahkan setiap way ke peta
      this.ways.forEach((way) => {
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
      });
    },
  },
  mounted() {
    // Inisialisasi peta saat komponen dimuat
    this.initMap();
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

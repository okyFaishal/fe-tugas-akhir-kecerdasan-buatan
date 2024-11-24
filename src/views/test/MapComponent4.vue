<template>
  <!-- <div class="card">
    <input v-model="origin" placeholder="Masukkan alamat asal" />
    <input v-model="destination" placeholder="Masukkan alamat tujuan" />
    <Button @click="generateRoute">Cari Rute</Button>
  </div> -->
  <div class="card" style="border-radius: 20px; padding: 10px;">
    <div id="map" style="height: 500px; border-radius: 10px;"></div>
  </div>
</template>

<script>
import Axios from 'axios';
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      areaPoints: [], // Menyimpan titik-titik yang dipilih
      polygon: null,   // Menyimpan polygon area yang dipilih
      listPolygon: [],
      listAreaBanjir: {},
      routingControl: null,
      origin: '',
      destination: '',
      koordinat: {
        tujuan: {lat: 0, lng: 0},
        asal: {lat: 0, lng: 0},
      },
      apiKey: '9c2dc2a6e60e44e5be39883924de55d9', // Ganti dengan API key dari OpenCage
    };
  },
  async mounted() {
    const vm = this
    await vm.setMap()
    this.drawFloodAreas();
    // await vm.getData()
    // await vm.setStatusBanjir()
    
    let lat = -6.987599541823833 // vertikal
    let lng = 110.41071318060438 // horizontal
    for (let i = 0; i < 10; i++) {
      const radius = 0.001
      L.polygon([
        [ lat + radius, lng - radius ], // kiri atas
        [ lat - radius, lng - radius ], // kiri bawah
        [ lat - radius, lng + radius ], // kanan bawah
        [ lat + radius, lng + radius ], // kanan atas
      ], { 
        // color: null, // Menghilangkan warna garis border
        // weight: 0, // Menetapkan ketebalan garis menjadi 0
        fillColor: 'blue' // Warna isian area (pilih sesuai kebutuhan)
      }).addTo(vm.map);
      [lat, lng] = [lat + (radius * 2), 110.41071318060438]
    }

    // add event clisk map
    vm.map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if(vm.koordinat.asal.lat && vm.koordinat.tujuan.lat){
        vm.koordinat = {
          tujuan: {lat: 0, lng: 0},
          asal: {lat: 0, lng: 0},
        }
      }
      if(!vm.koordinat.asal.lat){
        vm.koordinat.asal.lat = lat
        vm.koordinat.asal.lng = lng
      }else{
        vm.koordinat.tujuan.lat = lat
        vm.koordinat.tujuan.lng = lng
        vm.generateRoute()
      }
    });
  },
  methods: {
    async setMap() {
      const vm = this
      let center = [-6.987599541823833, 110.41071318060438] // titik koordinat untuk default tengah map
      var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      });      
      vm.map = L.map('map', {
        center,
        zoom: 14,
        layers: [osm]
      });
    },
    async setStatusBanjir(){
      const vm = this
      try {
        for (let i = 0; i < vm.listAreaBanjir.length; i++) {
          const area = vm.listAreaBanjir[i];
          if(area.list_titik_area_banjir.length){
            const coordinates = area.list_titik_area_banjir.map(item => { return {
              lat: parseFloat(item.lat_titik_area_banjir),
              lng: parseFloat(item.lng_titik_area_banjir),
            }});
            // menentukan koordinat asal yang akan dijadikan pondasi
            const utara = coordinates.reduce((prev, current) => current.lat > prev.lat ? current : prev );
            const selatan = coordinates.reduce((prev, current) => current.lat < prev.lat ? current : prev );
            const timur = coordinates.reduce((prev, current) => current.lng > prev.lng ? current : prev );
            const barat = coordinates.reduce((prev, current) => current.lng < prev.lng ? current : prev );
            const asal = {utara, selatan, timur, barat}
            // memnentukan koordinat sesungguhnya
            let padding = 0.0003
            let it = [asal.utara.lat + padding, asal.barat.lng - padding] // kiri atas
            let ib = [asal.selatan.lat - padding, asal.barat.lng - padding] // kiri bawah
            let ab = [asal.selatan.lat - padding, asal.timur.lng + padding] // kanan bawah
            let at = [asal.utara.lat + padding, asal.timur.lng + padding] // kanan atas
            const jadi = [it, ib, ab, at]
            const areaMap = L.polygon(jadi, { color: 'blue' }).addTo(vm.map);
          }
        }
      } catch (error) {
        console.log('error sistem', error)
        vm.$toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem', life: 3000 });
      }
    },
    async generateRoute() {
      try {
        const originCoords = this.koordinat.asal;
        const destinationCoords = this.koordinat.tujuan;

        if (this.routingControl) {
          this.map.removeControl(this.routingControl);
        }

        this.routingControl = L.Routing.control({
          waypoints: [
            L.latLng(originCoords.lat, originCoords.lng),
            L.latLng(destinationCoords.lat, destinationCoords.lng)
          ],
          routeWhileDragging: true
        }).addTo(this.map);

        this.routingControl.on('routesfound', (e) => {
          const route = e.routes[0];
          const coordinates = route.coordinates;

          if (this.checkFloodAreaIntersection(coordinates)) {
            alert("Rute melewati area banjir! Silakan pilih rute lain.");
          }
        });

      } catch (error) {
        console.error("Error menemukan koordinat: ", error);
      }
    },
    checkFloodAreaIntersection(routeCoordinates) {
      const floodAreas = [
        [
          [-6.989644173706021, 110.43440637111286],
          [-6.988451472861695, 110.42745311132884],
          [-6.9982485681456925, 110.4237618746534],
          [-6.9995264349850554, 110.43097266257753]
        ]
      ];

      for (const area of floodAreas) {
        const polygon = L.polygon(area);
        for (const coord of routeCoordinates) {
          if (polygon.getBounds().contains(L.latLng(coord.lat, coord.lng))) {
            return true; // Rute melewati area banjir
          }
        }
      }
      return false;
    },
    drawFloodAreas() {
      const floodAreas = [
        {
          id_area_banjir: "43e5baa1-d6cc-466d-ac3a-062fdbb07a86",
          nama_area_banjir: "4",
          list_titik_area_banjir: [
            { lat_titik_area_banjir: "-6.989644173706021", lng_titik_area_banjir: "110.43440637111286" },
            { lat_titik_area_banjir: "-6.988451472861695", lng_titik_area_banjir: "110.42745311132884" },
            { lat_titik_area_banjir: "-6.9982485681456925", lng_titik_area_banjir: "110.4237618746534" },
            { lat_titik_area_banjir: "-6.9995264349850554", lng_titik_area_banjir: "110.43097266257753" }
          ]
        }
      ];

      floodAreas.forEach(area => {
        const polygonPoints = area.list_titik_area_banjir.map(point => [
          parseFloat(point.lat_titik_area_banjir),
          parseFloat(point.lng_titik_area_banjir)
        ]);

        const polygon = L.polygon(polygonPoints, { color: 'red', fillOpacity: 0.5 });
        polygon.addTo(this.map);
      });
    },

    async geocodeAddress(address) {
      // Meminta geocoding API untuk mendapatkan koordinat dari alamat
      const response = await Axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${this.apiKey}`
      );
      const result = response.data.results[0];
      return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
      };
    },
    async getData(){
      const vm = this
      vm.loading = true
      try {
        let res = await vm.$axios.post('area_banjir/read')
        if(res.data.status == 200){
          vm.listAreaBanjir = res.data.data.map(x => { 
            return {
              ...x,
            }
          })
          // tampilkan ke map
          for (let i = 0; i < vm.listAreaBanjir.length; i++) {
            const area = vm.listAreaBanjir[i];
            const listTitik = []
            for (let u = 0; u < area.list_titik_area_banjir.length; u++) {
              const titik = area.list_titik_area_banjir[u];
              listTitik.push([titik.lat_titik_area_banjir, titik.lng_titik_area_banjir])
            }
            let color = 'green'
            switch (area.level_area_banjir) {
              case 1:
                color = 'red'
                break;
              case 2:
                color = 'yellow'
                break;
              case 3:
                color = 'green'
                break;
            }
            const areaMap = L.polygon(listTitik, { color }).addTo(vm.map);
            vm.listPolygon.push(areaMap)

            // memunculkan label
            areaMap.bindPopup(area.nama_area_banjir); // Mengikat popup dengan judul ke polygon
            areaMap.on('click', () => {
              areaMap.openPopup(); // Menampilkan popup saat area diklik
              vm.clickArea(area)
            });
          }
        }else{
          vm.$toast.add({ severity: 'error', summary: 'Error', detail: res.data.message, life: 3000 });
        }
      } catch (error) {
        console.log('error system', error)
        vm.$toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem', life: 3000 });
      } finally {
        vm.loading = false
      }
    },
    clickArea(data) {
      const vm = this
      vm.dataForm = data
      if(vm.polygon){
        vm.map.removeLayer(vm.polygon);
        vm.areaPoints = []
      }
    },
    resetArea() {
      const vm = this
      // Hapus semua titik dan polygon dari peta
      vm.areaPoints = [];
      if (vm.polygon) {
        vm.map.removeLayer(vm.polygon);
        vm.polygon = null;
      }
      vm.listPolygon.forEach(item => {
        this.map.removeLayer(item);
      });
      vm.dataForm = {
        nama_area_banjir: null,
        level_area_banjir: null,
      }
    },
  },
};
</script>

<style scoped>

#map {
  width: 100%;
  height: 500px;
}
</style>

<template>
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
    };
  },
  async mounted() {
    const vm = this
    vm.setMap()
    vm.getData()
    let openMeteo = await Axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: -6.987599541823833,
        longitude: 110.41071318060438,
        current: 'rain',
        hourly: 'rain'
      },
    }); 
    let openweathermap = await Axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: -6.987599541823833,
        lon: 110.41071318060438,
        appid: '1f4fdff7329bd98f31a366f69925c59b',
      },
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
      // Menambahkan kontrol rute
      const routeControl = L.Routing.control({
        waypoints: [
          L.latLng('-6.995186997945882', '110.4341737838987'),
          L.latLng('-6.995879180790946', '110.40988362043508'),
        ],
      }).addTo(this.map);
      routeControl.on('routesfound', this.handleRouteFound);
    },
    // Fungsi untuk menangani event 'routesfound' dan mendapatkan koordinat setiap 1 meter
    handleRouteFound(event) {
      console.log('jalan', event.routes)
      // event.routes[1] = undefined
      const route = event.routes[0]; // Ambil rute pertama dari array routes
      const latlngs = route.instructions.map(instruction => instruction.location); // Ambil lokasi dari instruksi rute
      // event.routes[0].instructions = []
      // console.log("event.routes", event.routes)
      // event.routes = [event.routes[0]]
      // console.log("event.routes", event.routes)
      for (let i = 0; i < event.routes.length; i++) {
        const route = event.routes[i];
        console.log('route', i, route)
        route.instructions = []
        // route.name = ''
        // route.summary = {totalDistance: 0, totalTime: 0}
      }

      // Fungsi untuk mendapatkan koordinat setiap 1 meter
      // const coordinates = this.getCoordinatesAtInterval(latlngs, 1); // 1 meter interval
      // console.log(coordinates); // Menampilkan koordinat setiap 1 meter
    },
    // Fungsi untuk interpolasi koordinat setiap interval meter
    getCoordinatesAtInterval(latlngs, interval) {
      const coordinates = [];
      let totalDistance = 0;

      // Loop untuk mendapatkan titik setiap interval
      for (let i = 0; i < latlngs.length - 1; i++) {
        const start = latlngs[i];
        const end = latlngs[i + 1];
        // console.log(latlngs, ' , ', start, ' - ', end)
        // Pastikan koordinat start dan end valid sebelum menggunakan distanceTo
        if (start && end) {
          const segmentDistance = start.distanceTo(end); // Hitung jarak antar dua titik

          // Hitung berapa banyak titik yang diperlukan untuk mencapai interval meter
          const pointsNeeded = Math.floor(segmentDistance / interval);
          for (let j = 0; j <= pointsNeeded; j++) {
            const fraction = j / pointsNeeded;
            const point = L.latLng(
              start.lat + fraction * (end.lat - start.lat),
              start.lng + fraction * (end.lng - start.lng)
            );
            coordinates.push(point); // Simpan titik koordinat
          }
        } else {
          console.error("Koordinat tidak valid pada indeks: ", i);
        }
      }
      // console.log("coordinates 1", coordinates);
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

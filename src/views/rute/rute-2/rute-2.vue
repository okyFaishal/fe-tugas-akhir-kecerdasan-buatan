<template>
  <div class="card">
    <div class="mb-3">
      <Dropdown 
        class="w-full"
        v-model="dataForm.tanggal_waktu" 
        :options="listTanggal" 
        optionLabel="nama_tanggal_waktu" 
        optionValue="tanggal_waktu"
        placeholder="Pilih tanggal"
      />
    </div>
  </div>
  <div class="card">
    <Message v-if="kesimpulan" severity="info" class="mb-3">
      <div>Jarak {{ kesimpulan.jarak }}, dengan perkiraan waktu {{ kesimpulan.waktu }}</div>
    </Message>
    <Button class="mb-3 w-full" severity="primary" :disabled="loading" @click="resetArea()">
      <div v-if="loading"><InputIcon class="pi pi-spin pi-spinner" /></div>
      <div v-else>reset</div>
    </Button>
    <div id="map" ref="mapContainer" style="border-radius: 10px;"></div>
  </div>
</template>

<script>
// import Axios from 'axios'
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default {
  data() {
    return {
      listTanggal: [],
      dataForm: {
        tanggal_waktu: null,
        asal: null,
        tujuan: null,
        listRute: [],
      },
      loading: false,
      kesimpulan: null,
    };
  },
  async mounted() {
    const vm = this
    await vm.getData()
    await vm.setMap()
  },
  methods: {
    async setMap() { // inisialisasi peta Leaflet
      const vm = this
      vm.loading = true

      const latitude = -6.987599541823833
      const longitude = 110.41071318060438
      vm.map = L.map(vm.$refs.mapContainer).setView([latitude, longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20, // maksimal zoom
        zoom: 14,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(vm.map);

      vm.map.on("click", vm.onMapClick);
      vm.loading = false
    },
    
    // Event klik di peta
    async onMapClick(e) {
      const vm = this
      vm.loading = true
      const { lat, lng } = e.latlng;
      console.log("lat", lat)
      console.log("lng", lng)

      if (!vm.dataForm.asal) { // titik awal
        vm.dataForm.asal = [lat.toFixed(7), lng.toFixed(7)];
        vm.dataForm.listRute.push(L.marker([lat, lng]).addTo(vm.map).bindPopup("titik awal"));
      } else if (!vm.dataForm.tujuan) { // titik akhir
        vm.dataForm.tujuan = [lat.toFixed(7), lng.toFixed(7)];
        vm.dataForm.listRute.push(L.marker([lat, lng]).addTo(vm.map).bindPopup("titik akhir"));

        // get rute
        const res = await vm.$axios.post('perjalanan/rute_2', {...vm.dataForm, listRute: undefined})
        if(res.data.status == 200){
          if(res.data.data == 'Tidak ada rute yang ditemukan.\r\n'){
            vm.$toast.add({ severity: 'warn', summary: 'Error', detail: 'Rute yang ditemukan', life: 3000 });
            vm.resetArea()
          }else{
            const data = JSON.parse(res.data.data.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true')) // format data respon
            vm.kesimpulan = vm.calculateDistanceAndTime(data) // set jarak dan perkiraan waktu
            console.log("res.data.data", data)
            vm.dataForm.listRute.push(L.polyline(data.map(x => [x.lat_rute_koordinat, x.lng_rute_koordinat]), { color: "blue" }).addTo(vm.map)); // rute garis
          }
        }
      }
      vm.loading = false
    },
    // menghitung jarak Haversine
    haversine(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius bumi dalam km
      const toRadians = (deg) => (deg * Math.PI) / 180
      const dLat = toRadians(lat2 - lat1)
      const dLon = toRadians(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // jarak dalam km
    },

    // menghitung jarak dan waktu tempuh
    calculateDistanceAndTime(data, speed = 50) {
      if (data.length < 2) {
        console.error("Data harus memiliki setidaknya dua titik koordinat.");
        return null;
      }
      let jarak = 0;
      for (let i = 0; i < data.length - 1; i++) {
        const point1 = data[i];
        const point2 = data[i + 1];
        const distance = this.haversine(
          parseFloat(point1.lat_rute_koordinat),
          parseFloat(point1.lng_rute_koordinat),
          parseFloat(point2.lat_rute_koordinat),
          parseFloat(point2.lng_rute_koordinat)
        );
        jarak += distance;
      }
      const waktu = jarak / speed; // waktu dalam jam
      return {
        jarak: jarak.toFixed(2) + " km",
        waktu: (waktu * 60).toFixed(2) + " menit", // konversi ke menit
      };
    },
    async getData(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('cuaca/list_tanggal')
        // console.log('res', res)
        if(res.data.status == 200){
          vm.listTanggal = res.data.data.map(x => { return {
            ...x,
            nama_tanggal_waktu: vm.$moment(x.tanggal_waktu).format(`[Tanggal] DD-MM-YYYY, [Pukul] HH:mm`)
          }})
          vm.dataForm.tanggal_waktu = vm.findClosestDate(vm.listTanggal).tanggal_waktu // otomatisasi ke tanggal waktu terdekat
        }else{
          vm.$toast.add({ severity: 'error', summary: 'Error', detail: res.data.message, life: 3000 });
        }
      } catch (error) {
        vm.$toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem', life: 3000 });
        console.log(error)
      } finally {
        vm.loading = false
      }
    },
    findClosestDate(data) {
      const now = new Date();
      return data.reduce((closest, current) => {
        const currentDate = new Date(current.tanggal_waktu);
        const closestDate = new Date(closest.tanggal_waktu);
        
        return Math.abs(currentDate - now) < Math.abs(closestDate - now) ? current : closest;
      });
    },
    resetArea() {
      const vm = this
      vm.loading = true
      vm.dataForm.listRute.forEach(item => {
        item.remove()
      });
      vm.kesimpulan = null
      vm.dataForm = {
        tanggal_waktu: vm.dataForm.tanggal_waktu,
        asal: null,
        tujuan: null,
        listRute: [],
      }
      vm.loading = false
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

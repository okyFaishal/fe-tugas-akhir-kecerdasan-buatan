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
    <div class="text-center h-100" v-show="loading">
      <ProgressSpinner />
    </div>
    <div id="app" v-show="!loading">
      <Button class="mb-3 w-full" severity="primary" @click="resetArea()">reset</Button>
      <div id="map" ref="mapContainer"></div>
    </div>
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
    };
  },
  async mounted() {
    const vm = this
    await vm.getData()
    await vm.setMap()
  },
  methods: {
    async setMap() { // Inisialisasi peta Leaflet
      const vm = this
      vm.loading = true
      // Membuat peta dengan pusat di koordinat Semarang
      const latitude = -6.987599541823833
      const longitude = 110.41071318060438
      vm.map = L.map(vm.$refs.mapContainer).setView([latitude, longitude], 15);

      // Menambahkan tile layer dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20, // maksimal zoom
        zoom: 14,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(vm.map);

      // Memanggil fungsi untuk mengambil rute dari API
      // await vm.getRute();
      
      // Event klik untuk memilih koordinat
      vm.map.on("click", vm.onMapClick);

      vm.loading = false
    },
    
    // Event klik di peta
    async onMapClick(e) {
      const vm = this
      const { lat, lng } = e.latlng;
      console.log("lat, lng", lat, lng)

      if (!vm.dataForm.asal) {
        // Tetapkan koordinat awal
        vm.dataForm.asal = [lat.toFixed(7), lng.toFixed(7)];
        vm.dataForm.listRute.push(L.marker([lat, lng]).addTo(vm.map).bindPopup("titik awal"));
        // vm.dataForm.titikTerdekatAsal = vm.cekTitikRuteTerdekat(lat, lng)
      } else if (!vm.dataForm.tujuan) {
        // Tetapkan koordinat akhir
        vm.dataForm.tujuan = [lat.toFixed(7), lng.toFixed(7)];
        vm.dataForm.listRute.push(L.marker([lat, lng]).addTo(vm.map).bindPopup("titik akhir"));
        // vm.dataForm.titikTerdekatTujuan = vm.cekTitikRuteTerdekat(lat, lng)

        // console.log("vm.dataForm", vm.dataForm)
        const res = await vm.$axios.post('perjalanan/rute_1', {...vm.dataForm, listRute: undefined})
        // console.log("hasil", res)
        if(res.data.status == 200){
          vm.dataForm.listRute.push(L.polyline(JSON.parse(res.data.data.replace(/'/g, '"')).map(x => [x.lat_rute_koordinat, x.lng_rute_koordinat]), { color: "blue" }).addTo(vm.map)); // rute garis
        }
      }
      // if(vm.dataForm.asal && vm.dataForm.tujuan){
      // }
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
            nama_tanggal_waktu: vm.$moment(x.tanggal_waktu).format(`[Pukul] HH:mm, [Tanggal] DD-MM-YYYY`)
          }})
          vm.dataForm.tanggal_waktu = vm.findClosestDate(vm.listTanggal).tanggal_waktu
          // vm.dataForm.tanggal_waktu = vm.listTanggal[0].tanggal_waktu
          console.log(vm.findClosestDate(vm.listTanggal))
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
    resetArea() {
      const vm = this
      vm.loading = true
      vm.dataForm.listRute.forEach(item => {
        item.remove()
      });
      vm.dataForm = {
        tanggal_waktu: vm.dataForm.tanggal_waktu,
        asal: null,
        tujuan: null,
        listRute: [],
      }
      vm.loading = false
    },
    findClosestDate(data) {
      const now = new Date();
      return data.reduce((closest, current) => {
        const currentDate = new Date(current.tanggal_waktu);
        const closestDate = new Date(closest.tanggal_waktu);
        
        return Math.abs(currentDate - now) < Math.abs(closestDate - now) ? current : closest;
      });
    }
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 500px;
}
</style>

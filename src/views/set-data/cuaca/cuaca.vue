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
    <div class="flex gap-3">
      <Button label="get cuaca" class="p-3" severity="primary" @click="getCuaca()"/>
      <Button label="set data rute 1" class="p-3" severity="primary" @click="setRute1()"/>
      <Button label="set data rute 2" class="p-3" severity="primary" @click="setRute2()"/>
    </div>
  </div>
  <div class="card">
    <div class="text-center h-100" v-show="loading">
      <ProgressSpinner />
    </div>
    <div id="app" v-show="!loading">
      <Button class="mb-3 w-full" severity="primary" @click="getRute()">refresh</Button>
      <div id="map" ref="mapContainer" style="border-radius: 10px;"></div>
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
    async setMap() {
      const vm = this
      vm.loading = true

      // membuat peta dengan pusat di koordinat Semarang
      const latitude = -6.987599541823833
      const longitude = 110.41071318060438
      vm.map = L.map(vm.$refs.mapContainer).setView([latitude, longitude], 12);

      // menambahkan tile layer dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20, // maksimal zoom
        zoom: 14,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(vm.map);

      // memanggil fungsi untuk mengambil rute dari API
      await vm.getRute();
      
      vm.loading = false
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
          vm.dataForm.tanggal_waktu = vm.listTanggal[0].tanggal_waktu
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
    async getRute(){
      const vm = this
      vm.loading = true
      try {
        // rute jalur
        let ruteKoordinat = await vm.$axios.post('rute_koordinat_banjir/list_banjir', {
          ...vm.dataForm,
          column: ['banjir', 'lat_rute_koordinat', 'lng_rute_koordinat', 'satu_arah', 'id_rute_jalur', 'id_rute_koordinat'],
          banjir: true,
        })
        console.log('ruteKoordinat', ruteKoordinat)

        // grouping
        const rutes = {}
        for (let a = 0; a < ruteKoordinat.data.data.length; a++) {
          const jalur = ruteKoordinat.data.data[a];
          if(!rutes[jalur.id_rute_jalur]) rutes[jalur.id_rute_jalur] = []
          rutes[jalur.id_rute_jalur].push(jalur)
          // if(a == 15) break
        }
        console.log('rutes', rutes)

        // set rute di map
        for (const key in rutes) {
          if (Object.prototype.hasOwnProperty.call(rutes, key)) {
            const rute = rutes[key];
            L.polyline(rute.map(x => [x.lat_rute_koordinat, x.lng_rute_koordinat]), { color: "red" }).addTo(vm.map); // rute garis
            // rute.forEach(x => {
            //   L.marker([x.lat_rute_koordinat, x.lng_rute_koordinat]).addTo(vm.map).bindPopup(`${x.id_rute_jalur} ${x.urutan} ${x.nama_rute_jalur}`) // tanda node
            // });
          }
        }
      } catch (error) {
        console.log('error system', error)
        vm.$toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem', life: 3000 });
      } finally {
        vm.loading = false
      }
    },
    async getCuaca(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('cuaca/set_cuaca')
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil set data cuaca', life: 3000 });
          vm.resetArea();
          vm.getData()
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
    async setRute1(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('rute_koordinat_banjir/set_banjir')
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil set data rute 1', life: 3000 });
          vm.resetArea();
          vm.getData()
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
    async setRute2(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('rute_koordinat_banjir/set_banjir_json')
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil set data rute 2', life: 3000 });
          vm.resetArea();
          vm.getData()
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

<template>
  <div class="card" style="border-radius: 20px; padding: 10px;">
    <div id="map" style="height: 500px; border-radius: 10px;"></div>
  </div>
  <div class="mt-8 card">
    <h3 class="text-xl font-bold">Masukkan data koordinat</h3>
    <div class="">
      <div class="mt-8">
        <FloatLabel variant="on">
          <InputText id="nama_area_banjir" v-model="dataForm.nama_area_banjir" class="w-full" autocomplete="off" />
          <label for="nama_area_banjir">Nama area banjir</label>
        </FloatLabel>
      </div>
      <div class="mt-8">
        <FloatLabel variant="on">
          <InputText id="level_area_banjir" type="number" v-model="dataForm.level_area_banjir" class="w-full" autocomplete="off" />
          <label for="level_area_banjir">Level area banjir</label>
        </FloatLabel>
      </div>
    </div>
    <Button label="Tambah" class="mt-4" @click="submit()" :disabled="areaPoints.length < 3"/>
  </div>
</template>

<script>
import Axios from 'axios';
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      areaPoints: [], // Menyimpan titik-titik yang dipilih
      polygon: null,   // Menyimpan polygon area yang dipilih
      dataForm: {
        nama_area_banjir: null,
        level_area_banjir: null,
      },
      listAreaBanjir: {},
    };
  },
  async mounted() {
    const vm = this
    vm.setMap()
    vm.getData()
    let data = await Axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: -6.987599541823833,
        longitude: 110.41071318060438,
        current: 'rain',
        hourly: 'rain'
      },
    }); 
    console.log('data',  data)
  },
  methods: {
    async setMap() {
      const vm = this
      // await new Promise(resolve => setTimeout(resolve, 1000));
      let center = [-6.987599541823833, 110.41071318060438]

      var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      });
      
      vm.map = L.map('map', {
        center,
        zoom: 15,
        layers: [osm]
      });
      
      //event click map untuk membuat pin
      vm.map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        console.log(lat, lng)
        vm.addPoint(lat, lng);
      });
    },
    addPoint(lat, lng) {
      console.log('jalan')
      // Tambahkan titik ke array areaPoints
      this.areaPoints.push([lat, lng]);

      // Perbarui tampilan polygon di peta
      if (this.polygon) {
        this.map.removeLayer(this.polygon);
      }
      this.polygon = L.polygon(this.areaPoints, { color: 'blue' }).addTo(this.map);
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
            console.log('listTitik', listTitik)
            L.polygon(listTitik, { color }).addTo(vm.map);
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
    async submit(){
      const vm = this
      vm.loading = true
      try {
        const titik_area_banjir = []
        for (let i = 0; i < vm.areaPoints.length; i++) {
          const titik = vm.areaPoints[i];
          titik_area_banjir.push({
            lat_titik_area_banjir: titik[0],
            lng_titik_area_banjir: titik[1],
            urutan_titik_area_banjir: i + 1,
          })
        }
        const res = await vm.$axios.post('area_banjir/create_with_titik', { ...vm.dataForm, titik_area_banjir })
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil membuat area banjir', life: 3000 });
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
      // Hapus semua titik dan polygon dari peta
      vm.areaPoints = [];
      if (vm.polygon) {
        vm.map.removeLayer(vm.polygon);
        vm.polygon = null;
      }
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
/* button {
  margin-top: 10px;
  padding: 10px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
} */
</style>

<template>
  <div class="card">
    <div>
      <FloatLabel variant="on" class="mt-3">
        <InputText id="range" v-model="dataRute.range" class="w-full" autocomplete="off" />
        <label for="range">Range</label>
      </FloatLabel>
      <Button label="Set data rute" class="mt-4" severity="primary" @click="setDataRute()"/>
    </div>
  </div>
  <div class="card">
    <Fieldset :legend="`Tersisa ${jumlahSisaRuteKoordinat} data`" :collapsed="true" :toggleable="true">
      <div class="flex flex-column gap-3 mt-3">
        <Button label="Set data rute wilayah by openstreetmap" class="p-3" severity="primary" @click="setDataRuteWilayah()"/>
        <div>
          <Button label="Set data rute wilayah by google map api" class="p-3" severity="danger" @click="setDataRuteWilayahByGoogleMapAPI()"/>
          <!-- <div class="text-xs text-red-400">* click jika menggunakan openstreetmap masih terdapat data yang tidak ditemukan</div> -->
        </div>
      </div>
    </Fieldset>
    <div>
    </div>
  </div>
  <div class="card">
    <div class="text-center h-100" v-show="loading">
      <ProgressSpinner />
    </div>
    <div id="app" v-show="!loading">
      <Button class="mb-3 w-full" severity="primary" @click="getRute()">refresh</Button>
      <div id="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script>
// import Axios from 'axios'
import Axios from 'axios';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default {
  data() {
    return {
      jumlahSisaRuteKoordinat: '0',
      listRuteKoordinat: [],
      dataRute: {
        range: 16000,
        lat: -6.987599541823833,
        lng: 110.41071318060438,
      },
      loading: false,
    };
  },
  async mounted() {
    const vm = this
    await vm.setMap()

    const latitude = -6.987599541823833
    const longitude = 110.41071318060438
    const { data } = await Axios.get('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=33.74.10.1006')
    console.log("data", data)
    await vm.getData()
  },
  methods: {
    async setMap() { // Inisialisasi peta Leaflet
      const vm = this
      vm.loading = false
      // Membuat peta dengan pusat di koordinat Semarang
      const latitude = -6.987599541823833
      const longitude = 110.41071318060438
      vm.map = L.map(vm.$refs.mapContainer).setView([latitude, longitude], 12);

      // Menambahkan tile layer dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20, // maksimal zoom
        zoom: 14,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(vm.map);

      // Memanggil fungsi untuk mengambil rute dari API
      await vm.getRute();
      
      // Event klik untuk memilih koordinat
      // vm.map.on("click", vm.onMapClick);
      vm.loading = true
    },
    async getRute(){
      const vm = this
      vm.loading = true
      try {
        // rute jalur
        let ruteKoordinat = await vm.$axios.post('rute_koordinat/read', {})
        // console.log('ruteKoordinat', ruteKoordinat)
        if(ruteKoordinat.data.status == 200){
        }

        // grouping
        const rutes = {}
        for (let a = 0; a < ruteKoordinat.data.data.length; a++) {
          const jalur = ruteKoordinat.data.data[a];
          if(!rutes[jalur.id_rute_jalur]) rutes[jalur.id_rute_jalur] = []
          rutes[jalur.id_rute_jalur].push(jalur)
        }
        // console.log('rutes', rutes)

        // set rute di map
        for (const key in rutes) {
          if (Object.prototype.hasOwnProperty.call(rutes, key)) {
            const rute = rutes[key];
            L.polyline(rute.map(x => [x.lat_rute_koordinat, x.lng_rute_koordinat]), { color: "blue" }).addTo(vm.map); // rute garis
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
    async getData(){
      const vm = this
      vm.loading = true
      try {
        let res = await vm.$axios.post('rute_koordinat/read', {jumlah: 1, halaman: 1, kode_full_wilayah: null})
        if(res.data.status == 200){
          vm.jumlahSisaRuteKoordinat = res.data.count + ''
          // console.log(res.data.data)
          // for (let i = 0; i < res.data.data.length; i++) {
          //   const item = res.data.data[i];
          //   const alamat = await this.getAlamatFromLatLng(item.lat_rute_koordinat, item.lng_rute_koordinat);
          //   console.log('Hasil Alamat:', alamat);
          // }
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
    async setDataRute(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('rute_jalur/set_rute', vm.dataRute)
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
    async setDataRuteWilayah(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('rute_koordinat/set_wilayah', vm.dataRute)
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil menghubungkan rute dengan wilayah', life: 3000 });
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
    async setDataRuteWilayahByGoogleMapAPI(){
      const vm = this
      vm.loading = true
      try {
        const res = await vm.$axios.post('rute_koordinat/set_wilayah_by_googlemapapi', vm.dataRute)
        // console.log('res', res)
        if(res.data.status == 200){
          vm.$toast.add({ severity: 'success', summary: 'Konfirmasi', detail: 'Berhasil menghubungkan rute dengan wilayah by google map api', life: 3000 });
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
    // async getAlamatFromLatLng(latitude, longitude) {
    //   try {
    //     const apiKey = 'API_KEY_ANDA'; // Ganti dengan API Key dari BigDataCloud
    //     const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`;

    //     const response = await fetch(url);
    //     if (!response.ok) {
    //       throw new Error('Gagal mengambil data dari BigDataCloud');
    //     }

    //     const data = await response.json();
    //     console.log('data', data);

    //     const alamat = {
    //       kelurahan: data.locality || null, // Nama kelurahan
    //       kecamatan: data.principalSubdivision || null, // Nama kecamatan
    //       kota: data.city || data.locality || null, // Kota/Kabupaten
    //       provinsi: data.countrySubdivision || null, // Nama provinsi
    //     };

    //     console.log(alamat);
    //     return alamat;
    //   } catch (error) {
    //     console.error(error);
    //     return null;
    //   }
    // },
    async getAlamatFromLatLng(latitude, longitude) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        // const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Gagal mengambil data dari Nominatim');
        }

        const data = await response.json();

        if (data && data.address) {
          const alamat = {
            kelurahan: data.address.suburb || data.address.village,
            kecamatan: data.address.city_district || data.address.district || data.address.municipality,
            kota: data.address.city || data.address.town || null,
            provinsi: data.address.state || null,
          };

          console.log('data', data);
          return alamat;
        } else {
          throw new Error('Data alamat tidak ditemukan');
        }
      } catch (error) {
        console.error(error);
        return null;
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

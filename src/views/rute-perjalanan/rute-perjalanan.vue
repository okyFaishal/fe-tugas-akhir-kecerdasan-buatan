<template>
  <div class="card" style="border-radius: 20px; padding: 10px;">
    <div id="map" style="height: 500px; border-radius: 10px;"></div>
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
      koordinat: {
        lat: -6.987599541823833, // vertikal
        lng: 110.41071318060438, // horizontal
      },
      map: null,
      areaPoints: [], // Menyimpan titik-titik yang dipilih
      polygon: null,   // Menyimpan polygon area yang dipilih
      listPolygon: [],
      listAreaBanjir: {},
      listContainerAreaBanjir: [],
      listitemAreaBanjir: [],
      apiKey: '9c2dc2a6e60e44e5be39883924de55d9', // Ganti dengan API key dari OpenCage
    };
  },
  async mounted() {
    const vm = this
    await vm.setMap()
    await vm.getData()
    await vm.setStatusBanjir()
    await vm.getCuaca()
    // await vm.getAreaBanjir()
    // let openMeteo = await Axios.get('https://api.open-meteo.com/v1/forecast', {
    //   params: {
    //     latitude: -6.987599541823833,
    //     longitude: 110.41071318060438,
    //     current: 'rain',
    //     hourly: 'rain'
    //   },
    // }); 
    // let openweathermap = await Axios.get('https://api.openweathermap.org/data/2.5/weather', {
    //   params: {
    //     lat: -6.987599541823833,
    //     lon: 110.41071318060438,
    //     appid: '1f4fdff7329bd98f31a366f69925c59b',
    //   },
    // });
  },
  methods: {
    async setMap() {
      const vm = this
      let center = [-6.987599541823833, 110.41071318060438] // titik koordinat untuk default tengah map
      // let center = [51.505, -0.09] // titik koordinat untuk default tengah map
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
            let padding = 0.0001
            let it = [asal.utara.lat + padding, asal.barat.lng - padding] // kiri atas
            let ib = [asal.selatan.lat - padding, asal.barat.lng - padding] // kiri bawah
            let ab = [asal.selatan.lat - padding, asal.timur.lng + padding] // kanan bawah
            let at = [asal.utara.lat + padding, asal.timur.lng + padding] // kanan atas
            vm.listContainerAreaBanjir.push({
              utara, selatan, timur, barat,
              level_area_banjir: area.level_area_banjir,
              nama_area_banjir: area.nama_area_banjir,
              list_titik_area_banjir: area.list_titik_area_banjir,
            })
            const jadi = [it, ib, ab, at]
            const areaMap = L.polygon(jadi, { color: 'blue' }).addTo(vm.map);
            break
          }
        }
        this.setItemBanjir()
      } catch (error) {
        console.log('error sistem', error)
        vm.$toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem', life: 3000 });
      }
    },
    setItemBanjir(){
      const vm = this
      for (let i = 0; i < vm.listContainerAreaBanjir.length; i++) {
        const con = vm.listContainerAreaBanjir[i];
        const jarak = 0.0001
        const lat = vm.koordinat.lat // vertikal
        const lng = vm.koordinat.lng // horizontal
        console.log('con.utara', con.utara)
        console.log('lat', lat)

        let utara = Math.abs(con.utara.lat - Math.abs(lat))
        let selatan = Math.abs(con.selatan.lat - Math.abs(lat))
        let timur = Math.abs(con.timur.lng - Math.abs(lng))
        let barat = Math.abs(con.barat.lng - Math.abs(lng))

        if(utara > selatan){
          utara = Math.ceil(utara)
          selatan = Math.floor(selatan)
        }else{
          utara = Math.floor(utara)
          selatan = Math.ceil(selatan)
        }
        if(timur > barat){
          timur = Math.ceil(timur)
          barat = Math.floor(barat)
        }else{
          timur = Math.floor(timur)
          barat = Math.ceil(barat)
        }

        console.log('utara', utara)
        console.log('selatan', selatan)
        console.log('timur', timur)
        console.log('barat', barat)

        break

        // for (let i = 0; i < 10; i++) {
        //   const radius = 0.001
        //   L.polygon([
        //     [ lat + radius, lng - radius ], // kiri atas
        //     [ lat - radius, lng - radius ], // kiri bawah
        //     [ lat - radius, lng + radius ], // kanan bawah
        //     [ lat + radius, lng + radius ], // kanan atas
        //   ], { 
        //     // color: null, // Menghilangkan warna garis border
        //     // weight: 0, // Menetapkan ketebalan garis menjadi 0
        //     fillColor: 'blue' // Warna isian area (pilih sesuai kebutuhan)
        //   }).addTo(vm.map);
        //   [lat, lng] = [lat + (radius * 2), 110.41071318060438]
        // }
      }
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
    // async getCuaca(){
    //   const vm = this
    //   let perjam = []
    //   let saatIni = []
    //   for (let i = 0; i < vm.listAreaBanjir.length; i++) {
    //     const area = vm.listAreaBanjir[i];
    //     // console.log(area)
    //     for (let o = 0; o < area.list_titik_area_banjir.length; o++) {
    //       const titik = area.list_titik_area_banjir[o];
    //       // console.log(titik)
    //       let cuaca = await Axios.get('https://api.tomorrow.io/v4/weather/forecast', {
    //         params: {
    //           location: `${titik.lat_titik_area_banjir},${titik.lng_titik_area_banjir}`,
    //           apikey: 'm3YKM0pxTSxeajam0hn5CQuFtHZ5n7Jj',
    //         },
    //       });
    //       console.log('cuaca' ,cuaca)
    //       // if(cuaca.status == 200){
    //       //   const latitude = cuaca.data.latitude
    //       //   const longitude = cuaca.data.longitude
    //       //   for (let o = 0; o < cuaca.data.hourly.precipitation.length; o++) {
    //       //     const kemungkinanHujan = cuaca.data.hourly.precipitation_probability[o];
    //       //     const curahHujan = cuaca.data.hourly.precipitation[o] * 25.4;
    //       //     const waktu = cuaca.data.hourly.time[o];
    //       //     if(!(saatIni.some(x => x.latitude == latitude && x.waktu == waktu))){
    //       //       saatIni.push({
    //       //         latitude,
    //       //         longitude,
    //       //         kemungkinanHujan,
    //       //         curahHujan,
    //       //         waktu,
    //       //       })
    //       //     }
    //       //   }
    //       // }
    //       break
    //     }
    //     if(i >= 0){
    //       break
    //     }
    //   }
    //   console.log("saatIni", saatIni)
    // },
    // async getCuaca(){
    //   const vm = this
    //   let perjam = []
    //   let saatIni = []
    //   for (let i = 0; i < vm.listAreaBanjir.length; i++) {
    //     const area = vm.listAreaBanjir[i];
    //     // console.log(area)
    //     for (let o = 0; o < area.list_titik_area_banjir.length; o++) {
    //       const titik = area.list_titik_area_banjir[o];
    //       // console.log(titik)
    //       // let cuaca = await Axios.get('https://api.openweathermap.org/data/2.5/weather', {
    //       //   params: {
    //       //     lat: titik.lat_titik_area_banjir,
    //       //     lon: titik.lng_titik_area_banjir,
    //       //     // exclude: 'current,hourly',
    //       //     // appid: 'd8b64ab1f99ffde5c83fbbf21cfa087c', // oky
    //       //     appid: '1f4fdff7329bd98f31a366f69925c59b', // ardan
    //       //   },
    //       // });
    //       let cuaca = await Axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${titik.lat_titik_area_banjir}&lon=-${titik.lng_titik_area_banjir}&exclude=hourly,daily&appid=105e1a79f24492bbe4753c1ffe61c7cc`);
    //       console.log('cuaca' ,cuaca)
    //       // if(cuaca.status == 200){
    //       //   const latitude = cuaca.data.latitude
    //       //   const longitude = cuaca.data.longitude
    //       //   for (let o = 0; o < cuaca.data.hourly.precipitation.length; o++) {
    //       //     const kemungkinanHujan = cuaca.data.hourly.precipitation_probability[o];
    //       //     const curahHujan = cuaca.data.hourly.precipitation[o] * 25.4;
    //       //     const waktu = cuaca.data.hourly.time[o];
    //       //     if(!(saatIni.some(x => x.latitude == latitude && x.waktu == waktu))){
    //       //       saatIni.push({
    //       //         latitude,
    //       //         longitude,
    //       //         kemungkinanHujan,
    //       //         curahHujan,
    //       //         waktu,
    //       //       })
    //       //     }
    //       //   }
    //       // }
    //       break
    //     }
    //     if(i >= 0){
    //       break
    //     }
    //   }
    //   console.log("saatIni", saatIni)
    // },
    async getCuaca(){
      const vm = this
      let perjam = []
      let saatIni = []
      for (let i = 0; i < vm.listAreaBanjir.length; i++) {
        const area = vm.listAreaBanjir[i];
        // console.log(area)
        for (let o = 0; o < area.list_titik_area_banjir.length; o++) {
          const titik = area.list_titik_area_banjir[o];
          // console.log(titik)
          let cuaca = await Axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
              latitude: titik.lat_titik_area_banjir,
              longitude: titik.lng_titik_area_banjir,
              // current: 'precipitation',
              hourly: 'precipitation_probability,precipitation'
            },
          });
          console.log('cuaca' ,cuaca)
          if(cuaca.status == 200){
            const latitude = cuaca.data.latitude
            const longitude = cuaca.data.longitude
            for (let o = 0; o < cuaca.data.hourly.precipitation.length; o++) {
              const kemungkinanHujan = cuaca.data.hourly.precipitation_probability[o];
              const curahHujan = cuaca.data.hourly.precipitation[o] * 25.4;
              const waktu = cuaca.data.hourly.time[o];
              if(!(saatIni.some(x => x.latitude == latitude && x.waktu == waktu))){
                saatIni.push({
                  latitude,
                  longitude,
                  kemungkinanHujan,
                  curahHujan,
                  waktu,
                })
              }
            }
          }
          break
        }
        if(i >= 2){
          break
        }
      }
      console.log("saatIni", saatIni)
    },
    // async getCuaca(){
    //   const vm = this
    //   let perjam = []
    //   let saatIni = []
    //   for (let i = 0; i < vm.listAreaBanjir.length; i++) {
    //     const area = vm.listAreaBanjir[i];
    //     // console.log(area)
    //     for (let o = 0; o < area.list_titik_area_banjir.length; o++) {
    //       const titik = area.list_titik_area_banjir[o];
    //       // console.log(titik)
    //       let cuaca = await Axios.get('http://api.weatherapi.com/v1//forecast.json', {
    //         params: {
    //           key: "c0d5a64071004d0f86d125906242411",
    //           q: `${titik.lat_titik_area_banjir},${titik.lng_titik_area_banjir}`,
    //         },
    //       });
    //       if(cuaca.status == 200){
    //         let current = cuaca.data.forecast.forecastday[0].day
    //         // console.log("current", current)
    //         if(!(saatIni.some(x => x.curah_hujan == current.totalprecip_mm))){
    //           saatIni.push({
    //             hujan: current.daily_chance_of_rain ,
    //             curah_hujan: current.totalprecip_mm ,
    //             lat: cuaca.data.location.lat,
    //             lng: cuaca.data.location.lon,
    //             // ...titik
    //           })
    //         }
    //       }
    //       // let cuaca = await Axios.get('https://api.open-meteo.com/v1/forecast', {
    //       //   params: {
    //       //     latitude: titik.lat_titik_area_banjir,
    //       //     longitude: titik.lng_titik_area_banjir,
    //       //     current: 'precipitation,rain',
    //       //     hourly: 'precipitation_probability,rain'
    //       //   },
    //       // });
    //       // console.log('cuaca' ,cuaca)
    //       // break
    //     }
    //     // if(i >= 2){
    //     //   break
    //     // }
    //   }
    //   console.log("saatIni", saatIni)
    // },
    getAreaBanjir(){
      const vm = this
      const listAreaBanjir = []
      for (let i = 0; i < vm.listAreaBanjir.length; i++) {
        const area = vm.listAreaBanjir[i];
        console.log("area", area)
        for (let o = 0; o < area.list_titik_area_banjir.length; o++) {
          const titik = area.list_titik_area_banjir[o];
          console.log("titik", titik)
          listAreaBanjir.push({
            area: area.nama_area_banjir,
            level: area.level_area_banjir,
            urutan: titik.urutan_titik_area_banjir,
            latitude: titik.lat_titik_area_banjir,
            longitude: titik.lng_titik_area_banjir,
          })
          // break
        }
        // break
      }
      console.log("listAreaBanjir", listAreaBanjir)
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

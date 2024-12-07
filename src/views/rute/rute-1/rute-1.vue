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
      // vm.map.on("click", vm.onMapClick);

      // const data = [{'banjir': 0, 'lat_rute_koordinat': '-6.9870079', 'lng_rute_koordinat': '110.4157909', 'satu_arah': 1, 'id_rute_jalur': '761930457', 'id_rute_koordinat': '12064262015'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9872801', 'lng_rute_koordinat': '110.4166853', 'satu_arah': 1, 'id_rute_jalur': '1302641929', 'id_rute_koordinat': '7118849173'}, {'banjir': 0, 'lat_rute_koordinat': '-6.987411', 'lng_rute_koordinat': '110.4171454', 'satu_arah': 1, 'id_rute_jalur': '1302641929', 'id_rute_koordinat': '7119000617'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9875096', 'lng_rute_koordinat': '110.4171102', 'satu_arah': 0, 'id_rute_jalur': '775906977', 'id_rute_koordinat': '1280172781'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9874903', 'lng_rute_koordinat': '110.4170488', 'satu_arah': 1, 'id_rute_jalur': '1302641928', 'id_rute_koordinat': '5430863999'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9873771', 'lng_rute_koordinat': '110.416652', 'satu_arah': 1, 'id_rute_jalur': '1302641928', 'id_rute_koordinat': '2436108660'}, {'banjir': 0, 'lat_rute_koordinat': '-6.987004', 'lng_rute_koordinat': '110.415496', 'satu_arah': 1, 'id_rute_jalur': '1302641928', 'id_rute_koordinat': '7637989423'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9869864', 'lng_rute_koordinat': '110.4154414', 'satu_arah': 1, 'id_rute_jalur': '760436108', 'id_rute_koordinat': '2436108662'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9868245', 'lng_rute_koordinat': '110.4148147', 'satu_arah': 1, 'id_rute_jalur': '760436108', 'id_rute_koordinat': '499290283'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9868057', 'lng_rute_koordinat': '110.4147353', 'satu_arah': 1, 'id_rute_jalur': '760436108', 'id_rute_koordinat': '3492764095'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9866024', 'lng_rute_koordinat': '110.4140652', 'satu_arah': 1, 'id_rute_jalur': '760436108', 'id_rute_koordinat': '5430863979'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9865371', 'lng_rute_koordinat': '110.4138391', 'satu_arah': 1, 'id_rute_jalur': '775906979', 'id_rute_koordinat': '7119000260'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9864674', 'lng_rute_koordinat': '110.4136819', 'satu_arah': 1, 'id_rute_jalur': '761945209', 'id_rute_koordinat': '7119000263'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9863543', 'lng_rute_koordinat': '110.4134016', 'satu_arah': 1, 'id_rute_jalur': '761945209', 'id_rute_koordinat': '7119000264'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9863056', 'lng_rute_koordinat': '110.4132916', 'satu_arah': 1, 'id_rute_jalur': '761945209', 'id_rute_koordinat': '7238426082'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9861466', 'lng_rute_koordinat': '110.4129323', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '7238426078'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9857692', 'lng_rute_koordinat': '110.4121125', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '5527025814'}, {'banjir': 0, 'lat_rute_koordinat': '-6.985503', 'lng_rute_koordinat': '110.4115744', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '5527025815'}, {'banjir': 0, 'lat_rute_koordinat': '-6.985306', 'lng_rute_koordinat': '110.4111479', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '6257275557'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9851419', 'lng_rute_koordinat': '110.4107806', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '6257275553'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9848448', 'lng_rute_koordinat': '110.4101563', 'satu_arah': 1, 'id_rute_jalur': '161143472', 'id_rute_koordinat': '79761954'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9848154', 'lng_rute_koordinat': '110.4100415', 'satu_arah': 1, 'id_rute_jalur': '775906983', 'id_rute_koordinat': '7298635103'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9848012', 'lng_rute_koordinat': '110.4099367', 'satu_arah': 1, 'id_rute_jalur': '775906983', 'id_rute_koordinat': '2436138308'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9847765', 'lng_rute_koordinat': '110.4097651', 'satu_arah': 1, 'id_rute_jalur': '775906983', 'id_rute_koordinat': '79761955'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9847462', 'lng_rute_koordinat': '110.4096145', 'satu_arah': 1, 'id_rute_jalur': '590661913', 'id_rute_koordinat': '2436108664'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9847308', 'lng_rute_koordinat': '110.4095785', 'satu_arah': 1, 'id_rute_jalur': '590661913', 'id_rute_koordinat': '79761956'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9847008', 'lng_rute_koordinat': '110.4095206', 'satu_arah': 1, 'id_rute_jalur': '590661913', 'id_rute_koordinat': '2436108658'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9845797', 'lng_rute_koordinat': '110.4093299', 'satu_arah': 1, 'id_rute_jalur': '590661913', 'id_rute_koordinat': '79770445'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9845317', 'lng_rute_koordinat': '110.4092321', 'satu_arah': 1, 'id_rute_jalur': '1302053883', 'id_rute_koordinat': '2069254788'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9844646', 'lng_rute_koordinat': '110.4091466', 'satu_arah': 1, 'id_rute_jalur': '1302053883', 'id_rute_koordinat': '79761957'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9843907', 'lng_rute_koordinat': '110.4090836', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '3933861793'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9843065', 'lng_rute_koordinat': '110.4090356', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '3933861768'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9842149', 'lng_rute_koordinat': '110.4090043', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '2891410175'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9841191', 'lng_rute_koordinat': '110.4089907', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '2069254802'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9840224', 'lng_rute_koordinat': '110.4089954', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '257677939'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9839283', 'lng_rute_koordinat': '110.4090182', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '3933861811'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9838401', 'lng_rute_koordinat': '110.4090583', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '2069254797'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9837609', 'lng_rute_koordinat': '110.4091142', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '3933861779'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9836934', 'lng_rute_koordinat': '110.4091841', 'satu_arah': 1, 'id_rute_jalur': '1267625350', 'id_rute_koordinat': '79770413'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9836493', 'lng_rute_koordinat': '110.4092487', 'satu_arah': 1, 'id_rute_jalur': '1302053882', 'id_rute_koordinat': '2069254793'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9836264', 'lng_rute_koordinat': '110.4092865', 'satu_arah': 1, 'id_rute_jalur': '1302053882', 'id_rute_koordinat': '79770414'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9835555', 'lng_rute_koordinat': '110.4093458', 'satu_arah': 1, 'id_rute_jalur': '112669191', 'id_rute_koordinat': '5428405226'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9834644', 'lng_rute_koordinat': '110.4094045', 'satu_arah': 1, 'id_rute_jalur': '112669191', 'id_rute_koordinat': '2436138320'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9833595', 'lng_rute_koordinat': '110.4094715', 'satu_arah': 1, 'id_rute_jalur': '112669191', 'id_rute_koordinat': '7051333205'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9832899', 'lng_rute_koordinat': '110.4095081', 'satu_arah': 1, 'id_rute_jalur': '112669191', 'id_rute_koordinat': '2436138325'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9830753', 'lng_rute_koordinat': '110.4096202', 'satu_arah': 1, 'id_rute_jalur': '112669191', 'id_rute_koordinat': '1280164912'}, {'banjir': 0, 'lat_rute_koordinat': '-6.983022', 'lng_rute_koordinat': '110.4096467', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '6257275540'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9828152', 'lng_rute_koordinat': '110.4097327', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '6257275537'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9827826', 'lng_rute_koordinat': '110.4097468', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '7199473458'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9826646', 'lng_rute_koordinat': '110.4097979', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '11140126947'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9825718', 'lng_rute_koordinat': '110.409838', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '1280164925'}, {'banjir': 0, 'lat_rute_koordinat': '-6.982519', 'lng_rute_koordinat': '110.4098607', 'satu_arah': 1, 'id_rute_jalur': '174882415', 'id_rute_koordinat': '12062872911'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9823943', 'lng_rute_koordinat': '110.4099145', 'satu_arah': 1, 'id_rute_jalur': '1302466494', 'id_rute_koordinat': '11140126942'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9820567', 'lng_rute_koordinat': '110.41006', 'satu_arah': 1, 'id_rute_jalur': '1302466494', 'id_rute_koordinat': '8503008193'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9814509', 'lng_rute_koordinat': '110.4103205', 'satu_arah': 1, 'id_rute_jalur': '1302466494', 'id_rute_koordinat': '11415385011'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9811222', 'lng_rute_koordinat': '110.4104627', 'satu_arah': 1, 'id_rute_jalur': '1302466493', 'id_rute_koordinat': '1280164942'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9808678', 'lng_rute_koordinat': '110.410573', 'satu_arah': 1, 'id_rute_jalur': '1118564129', 'id_rute_koordinat': '9485564485'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9806995', 'lng_rute_koordinat': '110.4106459', 'satu_arah': 1, 'id_rute_jalur': '1118564129', 'id_rute_koordinat': '9485564479'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9794521', 'lng_rute_koordinat': '110.4111867', 'satu_arah': 1, 'id_rute_jalur': '1118564129', 'id_rute_koordinat': '4395981692'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9785564', 'lng_rute_koordinat': '110.4116455', 'satu_arah': 1, 'id_rute_jalur': '1118564129', 'id_rute_koordinat': '257678742'}, {'banjir': 0, 'lat_rute_koordinat': '-6.978591', 'lng_rute_koordinat': '110.4118855', 'satu_arah': 1, 'id_rute_jalur': '112669197', 'id_rute_koordinat': '257678743'}, {'banjir': 0, 'lat_rute_koordinat': '-6.978495', 'lng_rute_koordinat': '110.4124819', 'satu_arah': 1, 'id_rute_jalur': '112669197', 'id_rute_koordinat': '9486053105'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9782918', 'lng_rute_koordinat': '110.4135691', 'satu_arah': 1, 'id_rute_jalur': '112669197', 'id_rute_koordinat': '9486053099'}, {'banjir': 0, 'lat_rute_koordinat': '-6.978243', 'lng_rute_koordinat': '110.4138425', 'satu_arah': 1, 'id_rute_jalur': '112669197', 'id_rute_koordinat': '12064261980'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9782289', 'lng_rute_koordinat': '110.4139215', 'satu_arah': 1, 'id_rute_jalur': '1302737885', 'id_rute_koordinat': '1280164956'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9780902', 'lng_rute_koordinat': '110.4146436', 'satu_arah': 1, 'id_rute_jalur': '1302737885', 'id_rute_koordinat': '10738568245'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9780485', 'lng_rute_koordinat': '110.4148614', 'satu_arah': 1, 'id_rute_jalur': '1302737885', 'id_rute_koordinat': '260719511'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9779487', 'lng_rute_koordinat': '110.4154133', 'satu_arah': 1, 'id_rute_jalur': '1302737885', 'id_rute_koordinat': '257678807'}, {'banjir': 0, 'lat_rute_koordinat': '-6.977878', 'lng_rute_koordinat': '110.4157993', 'satu_arah': 1, 'id_rute_jalur': '174883472', 'id_rute_koordinat': '257678747'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9778368', 'lng_rute_koordinat': '110.4159725', 'satu_arah': 1, 'id_rute_jalur': '571615551', 'id_rute_koordinat': '7663666666'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9778069', 'lng_rute_koordinat': '110.4160751', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '7051028253'}, {'banjir': 0, 'lat_rute_koordinat': '-6.977729', 'lng_rute_koordinat': '110.4162294', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '5487985538'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9776818', 'lng_rute_koordinat': '110.416344', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '7051028252'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9776811', 'lng_rute_koordinat': '110.4163984', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '5493243166'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9777131', 'lng_rute_koordinat': '110.4164681', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '7051028251'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9777536', 'lng_rute_koordinat': '110.416511', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '260719677'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9778185', 'lng_rute_koordinat': '110.4165908', 'satu_arah': 1, 'id_rute_jalur': '24040638', 'id_rute_koordinat': '7051156751'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9778579', 'lng_rute_koordinat': '110.4166028', 'satu_arah': 1, 'id_rute_jalur': '590326200', 'id_rute_koordinat': '257677473'}, {'banjir': 0, 'lat_rute_koordinat': '-6.977946', 'lng_rute_koordinat': '110.4165164', 'satu_arah': 1, 'id_rute_jalur': '24040645', 'id_rute_koordinat': '257677474'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9779986', 'lng_rute_koordinat': '110.4164131', 'satu_arah': 1, 'id_rute_jalur': '24040645', 'id_rute_koordinat': '7051156754'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9780998', 'lng_rute_koordinat': '110.416122', 'satu_arah': 1, 'id_rute_jalur': '24040645', 'id_rute_koordinat': '6257260120'}, {'banjir': 0, 'lat_rute_koordinat': '-6.978159', 'lng_rute_koordinat': '110.4159216', 'satu_arah': 1, 'id_rute_jalur': '24040645', 'id_rute_koordinat': '7051028258'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9782162', 'lng_rute_koordinat': '110.4157694', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '11406637276'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9782774', 'lng_rute_koordinat': '110.4156768', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '11406637277'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9786906', 'lng_rute_koordinat': '110.4152612', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '9512411815'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9787311', 'lng_rute_koordinat': '110.4152192', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '10267046440'}, {'banjir': 0, 'lat_rute_koordinat': '-6.978763', 'lng_rute_koordinat': '110.4151845', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '9708978647'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9788509', 'lng_rute_koordinat': '110.4150814', 'satu_arah': 1, 'id_rute_jalur': '570877181', 'id_rute_koordinat': '257677476'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9788558', 'lng_rute_koordinat': '110.4150775', 'satu_arah': 1, 'id_rute_jalur': '759535963', 'id_rute_koordinat': '5487985541'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9790046', 'lng_rute_koordinat': '110.4149326', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '10738568251'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9790707', 'lng_rute_koordinat': '110.4148634', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '6257260123'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9791327', 'lng_rute_koordinat': '110.4147951', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '11259013030'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9793253', 'lng_rute_koordinat': '110.4146018', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '6257260060'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9794203', 'lng_rute_koordinat': '110.4145041', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '6257260083'}, {'banjir': 0, 'lat_rute_koordinat': '-6.979589', 'lng_rute_koordinat': '110.4143307', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '11185033284'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9796114', 'lng_rute_koordinat': '110.4143077', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '6257260074'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9796312', 'lng_rute_koordinat': '110.4142874', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '6257260069'}, {'banjir': 0, 'lat_rute_koordinat': '-6.979699', 'lng_rute_koordinat': '110.4142176', 'satu_arah': 1, 'id_rute_jalur': '24040646', 'id_rute_koordinat': '12062872881'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9798381', 'lng_rute_koordinat': '110.4140747', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '1930098313'}, {'banjir': 0, 'lat_rute_koordinat': '-6.980036', 'lng_rute_koordinat': '110.4138645', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '8502860899'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9807905', 'lng_rute_koordinat': '110.4130633', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '9169794872'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9808258', 'lng_rute_koordinat': '110.4130258', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '6257260098'}, {'banjir': 0, 'lat_rute_koordinat': '-6.980931', 'lng_rute_koordinat': '110.4129027', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '9169303615'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9809546', 'lng_rute_koordinat': '110.412875', 'satu_arah': 1, 'id_rute_jalur': '1302466475', 'id_rute_koordinat': '10781271458'}, {'banjir': 0, 'lat_rute_koordinat': '-6.98104', 'lng_rute_koordinat': '110.412775', 'satu_arah': 1, 'id_rute_jalur': '1302053881', 'id_rute_koordinat': '7284407333'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9811254', 'lng_rute_koordinat': '110.4127004', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '7629202246'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9811908', 'lng_rute_koordinat': '110.4126382', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '5065228079'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9814024', 'lng_rute_koordinat': '110.412408', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '6257275524'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9814754', 'lng_rute_koordinat': '110.4123313', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '6257275516'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9815402', 'lng_rute_koordinat': '110.4122581', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '7629202248'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9815725', 'lng_rute_koordinat': '110.4122229', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '5065228080'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9816541', 'lng_rute_koordinat': '110.4121404', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '6257275519'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9817683', 'lng_rute_koordinat': '110.4120108', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '7284407354'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9817754', 'lng_rute_koordinat': '110.4120021', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '1883495344'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9819424', 'lng_rute_koordinat': '110.4118256', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '6257275529'}, {'banjir': 0, 'lat_rute_koordinat': '-6.9820836', 'lng_rute_koordinat': '110.4116763', 'satu_arah': 1, 'id_rute_jalur': '816854470', 'id_rute_koordinat': '7284441364'}]

      // L.polyline(data.map(x => [x.lat_rute_koordinat, x.lng_rute_koordinat]), { color: "blue" }).addTo(vm.map); // rute garis

      
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
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 500px;
}
</style>

<template>
  <div class="card">
    <div>
      <Button label="Set data wilayah" class="mt-4" severity="primary" @click="setDataRute()" :disabled="loading"/>
      <div class="mt-3">
        <TreeTable :value="listWilayah" tableStyle="min-width: 50rem" :loading="loading">
          <Column field="nama_wilayah" header="Nama" expander></Column>
          <Column field="kode_full_wilayah" header="Kode"></Column>
        </TreeTable>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      listWilayah: [],
      dataRute: {
        range: 16000,
      }
    };
  },
  async mounted() {
    const vm = this
    await vm.getData()
  },
  methods: {
    async getData(){
      const vm = this
      vm.loading = true
      try {
        let res = await vm.$axios.post('wilayah/read')
        if(res.data.status == 200){
          const listWilayah1 = res.data.data.filter(x => x.kode_full_wilayah.split('.').length === 1)
          const listWilayah2 = res.data.data.filter(x => x.kode_full_wilayah.split('.').length === 2)
          const listWilayah3 = res.data.data.filter(x => x.kode_full_wilayah.split('.').length === 3)
          const listWilayah4 = res.data.data.filter(x => x.kode_full_wilayah.split('.').length === 4)
          // wilayah 4
          const container4 = listWilayah4.reduce((result, item) => {
            const key = item.head_wilayah;
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push({
              data: item,
              key: item.kode_full_wilayah,
              label: item.nama_wilayah,
            });
            return result;
          })
          // wilayah 3
          const container3 = listWilayah3.reduce((result, item) => {
            const key = item.head_wilayah;
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push({
              data: item,
              key: item.kode_full_wilayah,
              label: item.nama_wilayah,
              children: container4[item.kode_full_wilayah]
            });
            return result;
          })
          // wilayah 2
          const container2 = listWilayah2.reduce((result, item) => {
            const key = item.head_wilayah;
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push({
              data: item, 
              key: item.kode_full_wilayah,
              label: item.nama_wilayah,
              children: container3[item.kode_full_wilayah]
            });
            return result;
          })
          // wilayah 1
          const container1 = []
          for (let i = 0; i < listWilayah1.length; i++) {
            const item = listWilayah1[i];
            container1.push({
              data: item,
              key: item.kode_full_wilayah,
              label: item.nama_wilayah,
              children: container2[item.kode_full_wilayah]
            })
          }
          // console.log("container1", container1)
          vm.listWilayah = container1
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
        const res = await vm.$axios.post('wilayah/set_wilayah')
        console.log('res', res)
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

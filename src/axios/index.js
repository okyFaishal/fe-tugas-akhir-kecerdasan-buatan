// import store from "@/store/store.js";
import axios from "axios";

// import ip from '/ipBackend.js';
// const ip = process.env.VUE_APP_IP_BACKEND;
const instance = axios.create({
  baseURL: 'http://localhost:8004/',
});
// reques axios / sebelum kirim
instance.interceptors.request.use(async (req) => { 
  // req.headers.token = store.state.token;
  return req;
});
// respon axios / setelah kirim
instance.interceptors.response.use(async (res) => { 
  // if(res.data.status == 401){
  //   store.commit('logout')
  //   router.push('/access-denied')
  // }
  return res;
});
// vm.$toast.add({ severity: 'error', summary: 'Error', detail: res.data.message, life: 3000 });
export default instance;

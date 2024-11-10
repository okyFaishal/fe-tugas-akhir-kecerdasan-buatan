import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

// import IftaLabel from 'primevue/iftalabel';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

import axios from "@/axios/index.js";

const app = createApp(App);

app.config.globalProperties.$axios = axios;

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// app.component('IftaLabel', IftaLabel);
app.component('FloatLabel', FloatLabel);
app.component('InputText', InputText);
app.component('Toast', Toast);

app.mount('#app');

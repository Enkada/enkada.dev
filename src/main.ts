import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.baseURL = 'https://api.enkada.dev/www/'

createApp(App)
	.use(router)
	.mount('#app')

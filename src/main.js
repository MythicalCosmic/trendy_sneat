import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import Toast from 'vue-toastification'
import { toastOptions } from '@/plugins/api/toast'
import '@mdi/font/css/materialdesignicons.css'


// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@styles/styles.scss'

// Create vue app
const app = createApp(App)
app.use(Toast, toastOptions)

// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')

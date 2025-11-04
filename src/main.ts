import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/reset.module.css'
import './styles/theme.css'
import './styles/rtl-utils.css'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// Import Bootstrap JavaScript
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// Import AOS
import AOS from 'aos'
import 'aos/dist/aos.css'

// Import debug utilities (development only)
if (import.meta.env.DEV) {
  import('./utils/testPongDebugging')
}
// Import test utilities in development mode
if (import.meta.env.DEV) {
  import('./utils/testPongNotifications')
}

// Load Google Fonts - COMMENTED OUT FOR CORS COMPLIANCE
// If you need Arabic fonts (Cairo, Noto Kufi Arabic), consider self-hosting them
// or installing them as npm packages to avoid CORS issues
// const loadFonts = () => {
//   const link = document.createElement('link')
//   link.href =
//     "https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Noto+Kufi+Arabic:wght@100..900&display=swap";
//   link.rel = 'stylesheet'
//   document.head.appendChild(link)
// }

// Initialize app
const app = createApp(App)
const pinia = createPinia()

// Load fonts
// loadFonts() // COMMENTED OUT FOR CORS COMPLIANCE

// Initialize AOS
AOS.init({
  duration: 1000,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100
})

// Setup app
app.use(pinia)
app.use(router)

// Mount immediately; JWT composable handles its own lazy init
app.mount('#app')

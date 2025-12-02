import axios from 'axios'
import router from '@/plugins/router/index'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})


// Request interceptor to add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')   
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

// Handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Remove token on unauthorized
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      router.push('/login')
    }

    return Promise.reject(error)
  },
)

export default api

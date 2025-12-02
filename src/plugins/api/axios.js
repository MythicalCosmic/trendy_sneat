import axios from 'axios'
import router from '@/plugins/router/index'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Request interceptor to add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default api

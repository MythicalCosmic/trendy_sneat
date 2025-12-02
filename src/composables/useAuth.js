import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/plugins/axios'

export function useAuth() {
  const router = useRouter()
  const toast = useToast()
  
  const user = ref(null)
  const isAuthenticated = computed(() => {
    return !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
  })

  const loadUser = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        user.value = JSON.parse(userData)
      } catch (e) {
        console.error('Error parsing user data:', e)
        localStorage.removeItem('user')
      }
    }
  }

  const logout = async () => {
    try {
      // Optional: call logout endpoint if your API has one
      // await api.post('/api/logout')
      
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      
      user.value = null
      
      toast.success('👋 Logged out successfully', {
        position: 'top-right',
      })
      
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      
      // Force logout even if API call fails
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      user.value = null
      router.push('/login')
    }
  }

  const getUser = () => {
    if (!user.value) {
      loadUser()
    }
    return user.value
  }

  return {
    user,
    isAuthenticated,
    loadUser,
    logout,
    getUser,
  }
}

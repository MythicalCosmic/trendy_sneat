<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'
import logo from '@images/logo.svg?raw'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?url'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?url'

const router = useRouter()
const toast = useToast()

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = 'Email must be valid'
  }
  
  if (!form.value.password) {
    errors.value.password = 'Password is required'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  if (!validateForm()) {
    toast.error('Please fix the errors in the form', {
      position: 'top-right',
    })
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/api/login', {
      email: form.value.email,
      password: form.value.password,
    })


    // Check if login was successful
    if (response.data.success) {
      // Save token
      
      localStorage.setItem('token', response.data.data.token)
      console.log(response.data.data.token)
      
      // Save user data
      localStorage.setItem('user', JSON.stringify(response.data.data.user))

      // Show success message
      toast.success(`🎉 ${response.data.message || 'Welcome back!'}`, {
        position: 'top-right',
      })

      // Small delay for better UX
      setTimeout(() => {
        router.push('/dashboard')
      }, 300)
    } else {
      toast.error(response.data.message || 'Login failed', {
        position: 'top-right',
      })
    }

  } catch (error) {
    console.error('Login error:', error)
    
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 
                     error.response.data?.detail || 
                     'Invalid email or password'
      
      toast.error(`❌ ${message}`, {
        position: 'top-right',
        timeout: 4000,
      })
      
      // Set field errors if available
      if (error.response.data?.errors) {
        errors.value = error.response.data.errors
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('🔌 Cannot connect to server. Please check your connection.', {
        position: 'top-right',
        timeout: 5000,
      })
    } else {
      // Something else happened
      toast.error('⚠️ An unexpected error occurred. Please try again.', {
        position: 'top-right',
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VImg
        :src="authV1TopShape"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VImg
        :src="authV1BottomShape"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <RouterLink
            to="/"
            class="app-logo"
          >
            <div
              class="d-flex"
              v-html="logo"
            />
            <h1 class="app-logo-title">
              trendy
            </h1>
          </RouterLink>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to Trendy! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="handleLogin">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <VTextField
                  v-model="form.email"
                  autofocus
                  label="Email or Username"
                  type="email"
                  placeholder="johndoe@email.com"
                  :error-messages="errors.email"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  :error-messages="errors.password"
                  :disabled="isLoading"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <!-- remember me checkbox -->
                <div class="d-flex align-center justify-space-between flex-wrap my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                    :disabled="isLoading"
                  />

                  <RouterLink
                    class="text-primary"
                    to="/forgot-password"
                  >
                    Forgot Password?
                  </RouterLink>
                </div>

                <!-- login button -->
                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-center text-base"
              >
                <span>New on our platform?</span>
                <RouterLink
                  class="text-primary ms-2"
                  to="/register"
                >
                  Create an account
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>

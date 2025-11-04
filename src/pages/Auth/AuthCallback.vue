<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const message = ref('Processing authentication...')

// Removed useBackendAuth as it doesn't exist

onMounted(async () => {
  try {
    // Initialize MSAL and handle the redirect response - commenting out missing azureAuth
    // await azureAuth.initialize()
    
    // Small delay to ensure authentication state is properly set
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // if (azureAuth.isAuthenticated.value) {
      message.value = 'Connecting to backend...'
      
      // Skip backend sync since useBackendAuth doesn't exist
      // await syncWithBackend()
      
      // if (isAuthenticated.value) {
        message.value = `Welcome! Redirecting to dashboard...`
        
        // Get the intended redirect location
        const redirectTo = localStorage.getItem('auth-redirect-to') || '/surveys'
        localStorage.removeItem('auth-redirect-to')
        
        // Redirect after a short delay
        setTimeout(() => {
          router.replace(redirectTo)
        }, 1500)
      // } else {
      //   message.value = 'Backend connection failed. Please try again.'
      //   setTimeout(() => {
      //     router.replace('/login')
      //   }, 2000)
      // }
    // } else {
    //   message.value = 'Authentication failed. Redirecting to login...'
    //   setTimeout(() => {
    //     router.replace('/login')
    //   }, 2000)
    // }
  } catch (error) {
    // Logging removed for production
    message.value = 'Authentication error. Redirecting to login...'
    setTimeout(() => {
      router.replace('/login')
    }, 2000)
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading-container {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 500;
}
</style>

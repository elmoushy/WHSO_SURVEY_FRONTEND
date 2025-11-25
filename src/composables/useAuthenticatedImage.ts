import { ref, watch, onUnmounted, type Ref, isRef, type ComputedRef } from 'vue'
import { apiClient } from '../services/jwtAuthService'

/**
 * Composable to load images that require authentication
 * Fetches image with Authorization header and creates a blob URL
 */
export const useAuthenticatedImage = (imageUrl: string | null | undefined | Ref<string | null | undefined> | ComputedRef<string | null | undefined>) => {
  const blobUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Track created blob URLs for cleanup
  const createdUrls: string[] = []

  const loadImage = async (url: string | null | undefined) => {
    // Clear previous blob URL
    if (blobUrl.value) {
      URL.revokeObjectURL(blobUrl.value)
      blobUrl.value = null
    }

    if (!url) {
      return
    }

    try {
      isLoading.value = true
      error.value = null

      // Fetch image with authentication
      const response = await apiClient.get(url, {
        responseType: 'blob',
        headers: {
          'Accept': 'image/*'
        }
      })

      // Create blob URL
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'image/jpeg' 
      })
      const objectUrl = URL.createObjectURL(blob)
      
      blobUrl.value = objectUrl
      createdUrls.push(objectUrl)
    } catch (err: any) {
      console.error('Failed to load authenticated image:', err)
      error.value = 'Failed to load image'
    } finally {
      isLoading.value = false
    }
  }

  // Watch for URL changes - handle both ref and non-ref values
  if (isRef(imageUrl)) {
    watch(imageUrl, (newUrl) => {
      loadImage(newUrl)
    }, { immediate: true })
  } else {
    // For non-ref values, load immediately
    loadImage(imageUrl)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    createdUrls.forEach(url => URL.revokeObjectURL(url))
  })

  return {
    blobUrl,
    isLoading,
    error
  }
}

import { ref, watch, onUnmounted, type Ref, isRef, type ComputedRef } from 'vue'
import { apiClient } from '../services/jwtAuthService'
import { getCachedImage, cacheImage, generateCacheKey } from '../utils/imageCache'

interface ImageOptions {
  /** Version string for cache invalidation (e.g., updated_at timestamp) */
  version?: string
  /** Skip cache and always fetch from server */
  skipCache?: boolean
}

/**
 * Composable to load images that require authentication
 * Features:
 * - Fetches image with Authorization header
 * - Caches images in IndexedDB for offline/fast access
 * - Uses version-based cache invalidation (updated_at timestamp)
 * - Creates blob URLs for display
 */
export const useAuthenticatedImage = (
  imageUrl: string | null | undefined | Ref<string | null | undefined> | ComputedRef<string | null | undefined>,
  options?: ImageOptions | Ref<ImageOptions | undefined> | ComputedRef<ImageOptions | undefined>
) => {
  const blobUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isFromCache = ref(false)

  // Track created blob URLs for cleanup
  const createdUrls: string[] = []

  const loadImage = async (url: string | null | undefined, opts?: ImageOptions) => {
    // Clear previous blob URL
    if (blobUrl.value) {
      URL.revokeObjectURL(blobUrl.value)
      blobUrl.value = null
    }
    isFromCache.value = false

    if (!url) {
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const cacheKey = generateCacheKey(url, opts?.version)
      
      // Try to get from cache first (unless skipCache is set)
      if (!opts?.skipCache) {
        const cached = await getCachedImage(cacheKey)
        if (cached) {
          // Create blob URL from cached data
          const objectUrl = URL.createObjectURL(cached.blob)
          blobUrl.value = objectUrl
          createdUrls.push(objectUrl)
          isFromCache.value = true
          isLoading.value = false
          return
        }
      }

      // Fetch image with authentication
      const response = await apiClient.get(url, {
        responseType: 'blob',
        headers: {
          'Accept': 'image/*'
        }
      })

      // Create blob
      const mimeType = response.headers['content-type'] || 'image/jpeg'
      const blob = new Blob([response.data], { type: mimeType })
      
      // Cache the image (non-blocking)
      cacheImage(url, cacheKey, blob, mimeType).catch(console.error)
      
      // Create blob URL
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

  // Get options value
  const getOptionsValue = (): ImageOptions | undefined => {
    if (isRef(options)) {
      return options.value
    }
    return options
  }

  // Watch for URL changes - handle both ref and non-ref values
  if (isRef(imageUrl)) {
    // Also watch options if it's a ref
    if (isRef(options)) {
      watch([imageUrl, options], ([newUrl, newOpts]) => {
        loadImage(newUrl, newOpts)
      }, { immediate: true })
    } else {
      watch(imageUrl, (newUrl) => {
        loadImage(newUrl, getOptionsValue())
      }, { immediate: true })
    }
  } else {
    // For non-ref values, load immediately
    loadImage(imageUrl, getOptionsValue())
  }

  // Cleanup on unmount
  onUnmounted(() => {
    createdUrls.forEach(url => URL.revokeObjectURL(url))
  })

  return {
    blobUrl,
    isLoading,
    error,
    isFromCache
  }
}

/**
 * Preload and cache an image without displaying it
 * Useful for prefetching images in a list
 */
export const preloadImage = async (url: string, version?: string): Promise<void> => {
  const cacheKey = generateCacheKey(url, version)
  
  // Check if already cached
  const cached = await getCachedImage(cacheKey)
  if (cached) return
  
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'image/*'
      }
    })
    
    const mimeType = response.headers['content-type'] || 'image/jpeg'
    const blob = new Blob([response.data], { type: mimeType })
    
    await cacheImage(url, cacheKey, blob, mimeType)
  } catch (err) {
    console.error('Failed to preload image:', err)
  }
}

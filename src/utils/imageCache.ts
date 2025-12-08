/**
 * Image Cache Utility
 * Uses IndexedDB to cache authenticated images with version-based invalidation
 * Images are cached based on URL + updated_at timestamp to ensure fresh images on updates
 */

const DB_NAME = 'NewsImageCache'
const DB_VERSION = 1
const STORE_NAME = 'images'
const CACHE_EXPIRY_DAYS = 7 // Cache expires after 7 days

interface CachedImage {
  url: string           // Original URL
  cacheKey: string      // URL + version/timestamp
  blob: Blob            // Image data
  mimeType: string      // Content type
  cachedAt: number      // Timestamp when cached
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Initialize IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open image cache DB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
        store.createIndex('url', 'url', { unique: false })
        store.createIndex('cachedAt', 'cachedAt', { unique: false })
      }
    }
  })

  return dbPromise
}

/**
 * Generate cache key from URL and version/timestamp
 * @param url - Image URL
 * @param version - Version string (usually updated_at timestamp)
 */
export const generateCacheKey = (url: string, version?: string): string => {
  // Extract the meaningful part of the URL (path without query params)
  const urlObj = new URL(url, window.location.origin)
  const cleanPath = urlObj.pathname
  
  // Combine path with version for cache key
  return version ? `${cleanPath}::${version}` : cleanPath
}

/**
 * Get cached image
 * @param cacheKey - Cache key
 */
export const getCachedImage = async (cacheKey: string): Promise<CachedImage | null> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(cacheKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined
        
        if (!result) {
          resolve(null)
          return
        }

        // Check if cache has expired
        const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        if (Date.now() - result.cachedAt > expiryTime) {
          // Cache expired, delete it
          deleteCachedImage(cacheKey).catch(console.error)
          resolve(null)
          return
        }

        resolve(result)
      }
    })
  } catch (error) {
    console.error('Failed to get cached image:', error)
    return null
  }
}

/**
 * Cache an image
 * @param url - Original URL
 * @param cacheKey - Cache key
 * @param blob - Image blob
 * @param mimeType - Content type
 */
export const cacheImage = async (
  url: string,
  cacheKey: string,
  blob: Blob,
  mimeType: string
): Promise<void> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const cachedImage: CachedImage = {
        url,
        cacheKey,
        blob,
        mimeType,
        cachedAt: Date.now()
      }

      const request = store.put(cachedImage)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Failed to cache image:', error)
  }
}

/**
 * Delete cached image
 * @param cacheKey - Cache key
 */
export const deleteCachedImage = async (cacheKey: string): Promise<void> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(cacheKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Failed to delete cached image:', error)
  }
}

/**
 * Clear all cached images
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Failed to clear image cache:', error)
  }
}

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = async (): Promise<void> => {
  try {
    const db = await initDB()
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const cutoffTime = Date.now() - expiryTime

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('cachedAt')
      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  } catch (error) {
    console.error('Failed to cleanup expired cache:', error)
  }
}

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{ count: number; totalSize: number }> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()
      
      let count = 0
      let totalSize = 0

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          count++
          totalSize += (cursor.value as CachedImage).blob.size
          cursor.continue()
        } else {
          resolve({ count, totalSize })
        }
      }
    })
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return { count: 0, totalSize: 0 }
  }
}

// Run cleanup on module load (non-blocking)
cleanupExpiredCache().catch(console.error)

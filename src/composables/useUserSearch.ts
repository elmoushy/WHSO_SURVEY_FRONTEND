// User Search Composable
// Supports both listing all users and searching
// Updated to show all users initially with infinite scroll pagination

import { ref, computed } from 'vue'
import { chatAPI, type SearchUsersResponse } from '../services/chatService'
import type { ChatUser } from '../types/chat.types'

export function useUserSearch() {
  const users = ref<ChatUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const nextPageUrl = ref<string | null>(null)
  const previousPageUrl = ref<string | null>(null)
  const currentPage = ref(1)
  const currentSearchQuery = ref<string>('')
  const isInitialized = ref(false)
  
  const hasMore = computed(() => nextPageUrl.value !== null)
  
  /**
   * Fetch all users (initial load without search)
   * @param page - Page number (default 1)
   * @returns Promise<ChatUser[]> - User results
   */
  async function fetchUsers(page: number = 1): Promise<ChatUser[]> {
    loading.value = true
    error.value = null
    currentSearchQuery.value = ''
    
    try {
      const response: SearchUsersResponse = await chatAPI.getUsers(page)
      
      // Update state
      if (page === 1) {
        // Initial load - replace results
        users.value = response.results
      } else {
        // Pagination - append results (avoid duplicates)
        const existingIds = new Set(users.value.map(u => u.id))
        const newUsers = response.results.filter(u => !existingIds.has(u.id))
        users.value = [...users.value, ...newUsers]
      }
      
      totalCount.value = response.count
      nextPageUrl.value = response.next
      previousPageUrl.value = response.previous
      currentPage.value = page
      isInitialized.value = true
      
      return response.results
    } catch (err: any) {
      handleError(err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Search users with optional query parameter
   * @param searchQuery - Search query (empty = fetch all)
   * @param page - Page number (default 1)
   * @returns Promise<ChatUser[]> - User results
   */
  async function searchUsers(searchQuery: string, page: number = 1): Promise<ChatUser[]> {
    // If no search query, fetch all users
    if (!searchQuery || searchQuery.trim().length === 0) {
      return fetchUsers(page)
    }
    
    loading.value = true
    error.value = null
    currentSearchQuery.value = searchQuery.trim()
    
    try {
      const response: SearchUsersResponse = await chatAPI.searchUsers(searchQuery, page)
      
      // Update state
      if (page === 1) {
        // New search - replace results
        users.value = response.results
      } else {
        // Pagination - append results (avoid duplicates)
        const existingIds = new Set(users.value.map(u => u.id))
        const newUsers = response.results.filter(u => !existingIds.has(u.id))
        users.value = [...users.value, ...newUsers]
      }
      
      totalCount.value = response.count
      nextPageUrl.value = response.next
      previousPageUrl.value = response.previous
      currentPage.value = page
      
      return response.results
    } catch (err: any) {
      handleError(err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Handle API errors
   */
  function handleError(err: any): void {
    if (err.response?.status === 400) {
      const errorData = err.response.data
      error.value = errorData.error || errorData.detail || 'خطأ في البحث'
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'فشل تحميل المستخدمين. يرجى المحاولة مرة أخرى.'
    }
    console.error('User fetch/search failed:', err)
  }
  
  /**
   * Load next page of results (works for both all users and search)
   */
  async function loadNextPage(): Promise<void> {
    if (!nextPageUrl.value || loading.value) return
    
    // Extract page number from URL
    const match = nextPageUrl.value.match(/page=(\d+)/)
    const nextPage = match ? parseInt(match[1]) : currentPage.value + 1
    
    if (currentSearchQuery.value) {
      await searchUsers(currentSearchQuery.value, nextPage)
    } else {
      await fetchUsers(nextPage)
    }
  }
  
  /**
   * Clear search results and reset to initial state
   */
  function clearResults(): void {
    users.value = []
    totalCount.value = 0
    nextPageUrl.value = null
    previousPageUrl.value = null
    currentPage.value = 1
    currentSearchQuery.value = ''
    error.value = null
    isInitialized.value = false
  }
  
  /**
   * Reset search and fetch all users
   */
  async function resetToAllUsers(): Promise<ChatUser[]> {
    currentSearchQuery.value = ''
    currentPage.value = 1
    return fetchUsers(1)
  }
  
  /**
   * Get current page number
   */
  function getCurrentPage(): number {
    return currentPage.value
  }
  
  /**
   * Get remaining count (for "Load More" indicator)
   */
  const remainingCount = computed(() => {
    return Math.max(0, totalCount.value - users.value.length)
  })
  
  return {
    users,
    loading,
    error,
    totalCount,
    hasMore,
    remainingCount,
    currentPage: computed(() => currentPage.value),
    currentSearchQuery: computed(() => currentSearchQuery.value),
    isInitialized: computed(() => isInitialized.value),
    fetchUsers,
    searchUsers,
    loadNextPage,
    clearResults,
    resetToAllUsers,
    getCurrentPage
  }
}

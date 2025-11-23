// User Search Composable
// Implements TASK_05 - User Enumeration Prevention
// Based on FRONTEND_USER_LIST_MIGRATION_GUIDE.md

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
  
  const hasMore = computed(() => nextPageUrl.value !== null)
  
  /**
   * Search users with required query parameter
   * @param searchQuery - REQUIRED, minimum 2 characters
   * @param page - Page number (default 1)
   * @returns Promise<ChatUser[]> - User results
   */
  async function searchUsers(searchQuery: string, page: number = 1): Promise<ChatUser[]> {
    // ✅ CRITICAL: Validate search query BEFORE calling API
    if (!searchQuery || searchQuery.trim().length < 2) {
      error.value = 'يجب إدخال حرفين على الأقل للبحث'
      users.value = []
      return []
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response: SearchUsersResponse = await chatAPI.searchUsers(searchQuery, page)
      
      // Update state
      if (page === 1) {
        // New search - replace results
        users.value = response.results
      } else {
        // Pagination - append results
        users.value = [...users.value, ...response.results]
      }
      
      totalCount.value = response.count
      nextPageUrl.value = response.next
      previousPageUrl.value = response.previous
      currentPage.value = page
      
      return response.results
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorData = err.response.data
        if (errorData.code === 'SEARCH_REQUIRED') {
          error.value = 'يجب إدخال حرفين على الأقل للبحث'
        } else {
          error.value = errorData.error || errorData.detail || 'خطأ في البحث'
        }
      } else if (err.message) {
        error.value = err.message
      } else {
        error.value = 'فشل البحث عن المستخدمين. يرجى المحاولة مرة أخرى.'
      }
      
      console.error('User search failed:', err)
      users.value = []
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Load next page of results
   */
  async function loadNextPage(searchQuery: string): Promise<void> {
    if (!nextPageUrl.value) return
    
    // Extract page number from URL
    const match = nextPageUrl.value.match(/page=(\d+)/)
    const nextPage = match ? parseInt(match[1]) : currentPage.value + 1
    
    await searchUsers(searchQuery, nextPage)
  }
  
  /**
   * Clear search results
   */
  function clearResults(): void {
    users.value = []
    totalCount.value = 0
    nextPageUrl.value = null
    previousPageUrl.value = null
    currentPage.value = 1
    error.value = null
  }
  
  /**
   * Get current page number from nextPageUrl
   */
  function getCurrentPage(): number {
    return currentPage.value
  }
  
  /**
   * Get remaining count (for "Load More" button)
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
    searchUsers,
    loadNextPage,
    clearResults,
    getCurrentPage
  }
}

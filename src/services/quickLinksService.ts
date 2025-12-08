import { apiClient } from './jwtAuthService'
import type { AxiosResponse } from 'axios'
import type { 
  PaginatedQuickLinksResponse, 
  QuickLinkDetailResponse, 
  CreateQuickLinkRequest,
  UpdateQuickLinkRequest,
  QuickLinkIconUploadResponse,
  QuickLinksListParams,
  UpdatePositionsRequest
} from '../types/quicklinks.types'

/**
 * Quick Links Service
 * Handles all API calls for Quick Links management
 */

// ==================== QUICK LINKS CRUD ====================

/**
 * Fetch all quick links (public - for sidebar)
 * @param params - Optional pagination/filter parameters
 */
export const fetchQuickLinks = async (params?: QuickLinksListParams): Promise<PaginatedQuickLinksResponse> => {
  const response: AxiosResponse<PaginatedQuickLinksResponse> = await apiClient.get('/quicklinks/', {
    params: { ...params, is_active: true }
  })
  return response.data
}

/**
 * Fetch all quick links (admin - includes inactive)
 * @param params - Optional pagination parameters
 */
export const fetchAllQuickLinks = async (params?: QuickLinksListParams): Promise<PaginatedQuickLinksResponse> => {
  const response: AxiosResponse<PaginatedQuickLinksResponse> = await apiClient.get('/quicklinks/', {
    params
  })
  return response.data
}

/**
 * Fetch single quick link by ID
 * @param id - Quick link ID
 */
export const fetchQuickLinkDetail = async (id: number): Promise<QuickLinkDetailResponse> => {
  const response: AxiosResponse<QuickLinkDetailResponse> = await apiClient.get(`/quicklinks/${id}/`)
  return response.data
}

/**
 * Create new quick link (Admin only)
 * @param data - Quick link creation data
 */
export const createQuickLink = async (data: CreateQuickLinkRequest): Promise<{ data: { id: number } }> => {
  const response: AxiosResponse<any> = await apiClient.post('/quicklinks/', data)
  return { data: { id: response.data.id || response.data.data?.id } }
}

/**
 * Update quick link (Admin only)
 * @param id - Quick link ID
 * @param data - Quick link update data
 */
export const updateQuickLink = async (id: number, data: UpdateQuickLinkRequest): Promise<QuickLinkDetailResponse> => {
  const response: AxiosResponse<QuickLinkDetailResponse> = await apiClient.patch(`/quicklinks/${id}/`, data)
  return response.data
}

/**
 * Delete quick link (Admin only)
 * @param id - Quick link ID
 */
export const deleteQuickLink = async (id: number): Promise<void> => {
  await apiClient.delete(`/quicklinks/${id}/`)
}

// ==================== ICON MANAGEMENT ====================

/**
 * Upload icon for quick link (Admin only)
 * @param id - Quick link ID
 * @param file - Icon image file
 */
export const uploadQuickLinkIcon = async (
  id: number, 
  file: File
): Promise<QuickLinkIconUploadResponse> => {
  const formData = new FormData()
  formData.append('icon', file)
  
  const response: AxiosResponse<QuickLinkIconUploadResponse> = await apiClient.post(
    `/quicklinks/${id}/icon/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

/**
 * Delete icon from quick link (Admin only)
 * @param id - Quick link ID
 */
export const deleteQuickLinkIcon = async (id: number): Promise<void> => {
  await apiClient.delete(`/quicklinks/${id}/icon/`)
}

// ==================== POSITION MANAGEMENT ====================

/**
 * Update positions of multiple quick links (Admin only)
 * @param positions - Array of {id, position} objects
 */
export const updateQuickLinkPositions = async (data: UpdatePositionsRequest): Promise<void> => {
  await apiClient.patch('/quicklinks/positions/', data)
}

/**
 * Toggle quick link active status (Admin only)
 * @param id - Quick link ID
 * @param isActive - New active status
 */
export const toggleQuickLinkStatus = async (id: number, isActive: boolean): Promise<QuickLinkDetailResponse> => {
  const response: AxiosResponse<QuickLinkDetailResponse> = await apiClient.patch(`/quicklinks/${id}/`, {
    is_active: isActive
  })
  return response.data
}

// ==================== USER PREFERENCES ====================

/**
 * Toggle pin status for a quick link
 * @param id - Quick link ID
 * @returns Pin toggle response with new status
 */
export const toggleQuickLinkPin = async (id: number): Promise<{
  status: string
  message: string
  data: {
    quicklink_id: number
    is_pinned: boolean
    pin_order: number | null
  }
}> => {
  const response = await apiClient.post(`/quicklinks/${id}/pin/`)
  return response.data
}

/**
 * Record a click/access for a quick link
 * Used for "recent" ordering
 * @param id - Quick link ID
 */
export const recordQuickLinkClick = async (id: number): Promise<{
  status: string
  message: string
  data: {
    quicklink_id: number
    click_count: number
    last_accessed_at: string
  }
}> => {
  const response = await apiClient.post(`/quicklinks/${id}/click/`)
  return response.data
}

/**
 * Get current user's quick link preferences
 * @returns User preferences for pinned and recent links
 */
export const getMyQuickLinkPreferences = async (): Promise<{
  status: string
  message: string
  data: {
    pinned_count: number
    recent_count: number
    pinned: Array<{
      quicklink_id: number
      name: string
      is_pinned: boolean
      pin_order: number
      last_accessed_at: string | null
      click_count: number
    }>
    recent: Array<{
      quicklink_id: number
      name: string
      is_pinned: boolean
      pin_order: number
      last_accessed_at: string | null
      click_count: number
    }>
  }
}> => {
  const response = await apiClient.get('/quicklinks/my-preferences/')
  return response.data
}

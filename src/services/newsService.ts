import { apiClient } from './jwtAuthService'
import type { AxiosResponse } from 'axios'
import type { 
  PaginatedNewsResponse, 
  NewsDetailResponse, 
  CreateNewsRequest,
  UpdateNewsRequest,
  ImageUploadResponse,
  NewsListParams 
} from '../types/news.types'

/**
 * News Service
 * Handles all API calls for Slider and Normal News
 */

// ==================== SLIDER NEWS ====================

/**
 * Fetch paginated slider news
 * @param params - Pagination parameters (page, page_size)
 */
export const fetchSliderNews = async (params?: NewsListParams): Promise<PaginatedNewsResponse> => {
  const response: AxiosResponse<PaginatedNewsResponse> = await apiClient.get('/newsletters/slider/', {
    params
  })
  return response.data
}

/**
 * Fetch single slider news by ID
 * @param id - Slider news ID
 */
export const fetchSliderNewsDetail = async (id: number): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.get(`/newsletters/slider/${id}/`)
  return response.data
}

/**
 * Create new slider news (Admin only)
 * @param data - News creation data
 */
export const createSliderNews = async (data: CreateNewsRequest): Promise<{ data: { id: number } }> => {
  const response: AxiosResponse<any> = await apiClient.post('/newsletters/slider/', data)
  return { data: { id: response.data.id } }
}

/**
 * Update slider news (Admin only)
 * @param id - Slider news ID
 * @param data - News update data
 */
export const updateSliderNews = async (id: number, data: UpdateNewsRequest): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.patch(`/newsletters/slider/${id}/`, data)
  return response.data
}

/**
 * Delete slider news (Admin only)
 * @param id - Slider news ID
 */
export const deleteSliderNews = async (id: number): Promise<void> => {
  await apiClient.delete(`/newsletters/slider/${id}/`)
}

/**
 * Upload image to slider news (Admin only)
 * @param id - Slider news ID
 * @param file - Image file
 * @param isMain - Set as main image
 * @param displayOrder - Display order
 */
export const uploadSliderImage = async (
  id: number, 
  file: File, 
  isMain: boolean = false, 
  displayOrder: number = 0
): Promise<ImageUploadResponse> => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('is_main', isMain.toString())
  formData.append('display_order', displayOrder.toString())

  const response: AxiosResponse<ImageUploadResponse> = await apiClient.post(
    `/newsletters/slider/${id}/images/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// ==================== NORMAL NEWS ====================

/**
 * Fetch paginated normal news
 * @param params - Pagination parameters (page, page_size)
 */
export const fetchNormalNews = async (params?: NewsListParams): Promise<PaginatedNewsResponse> => {
  const response: AxiosResponse<PaginatedNewsResponse> = await apiClient.get('/newsletters/normal/', {
    params
  })
  return response.data
}

/**
 * Fetch single normal news by ID
 * @param id - Normal news ID
 */
export const fetchNormalNewsDetail = async (id: number): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.get(`/newsletters/normal/${id}/`)
  return response.data
}

/**
 * Create new normal news (Admin only)
 * @param data - News creation data
 */
export const createNormalNews = async (data: CreateNewsRequest): Promise<{ data: { id: number } }> => {
  const response: AxiosResponse<any> = await apiClient.post('/newsletters/normal/', data)
  return { data: { id: response.data.id } }
}

/**
 * Update normal news (Admin only)
 * @param id - Normal news ID
 * @param data - News update data
 */
export const updateNormalNews = async (id: number, data: UpdateNewsRequest): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.patch(`/newsletters/normal/${id}/`, data)
  return response.data
}

/**
 * Delete normal news (Admin only)
 * @param id - Normal news ID
 */
export const deleteNormalNews = async (id: number): Promise<void> => {
  await apiClient.delete(`/newsletters/normal/${id}/`)
}

/**
 * Upload image to normal news (Admin only)
 * @param id - Normal news ID
 * @param file - Image file
 * @param isMain - Set as main image
 * @param displayOrder - Display order
 */
export const uploadNormalImage = async (
  id: number, 
  file: File, 
  isMain: boolean = false, 
  displayOrder: number = 0
): Promise<ImageUploadResponse> => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('is_main', isMain.toString())
  formData.append('display_order', displayOrder.toString())

  const response: AxiosResponse<ImageUploadResponse> = await apiClient.post(
    `/newsletters/normal/${id}/images/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// ==================== ACHIEVEMENT NEWS ====================

/**
 * Fetch paginated achievement news
 * @param params - Pagination parameters (page, page_size)
 */
export const fetchAchievementNews = async (params?: NewsListParams): Promise<PaginatedNewsResponse> => {
  const response: AxiosResponse<PaginatedNewsResponse> = await apiClient.get('/newsletters/achievement/', {
    params
  })
  return response.data
}

/**
 * Fetch single achievement news by ID
 * @param id - Achievement news ID
 */
export const fetchAchievementNewsDetail = async (id: number): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.get(`/newsletters/achievement/${id}/`)
  return response.data
}

/**
 * Create new achievement news (Admin only)
 * @param data - News creation data
 */
export const createAchievementNews = async (data: CreateNewsRequest): Promise<{ data: { id: number } }> => {
  const response: AxiosResponse<any> = await apiClient.post('/newsletters/achievement/', data)
  return { data: { id: response.data.id } }
}

/**
 * Update achievement news (Admin only)
 * @param id - Achievement news ID
 * @param data - News update data
 */
export const updateAchievementNews = async (id: number, data: UpdateNewsRequest): Promise<NewsDetailResponse> => {
  const response: AxiosResponse<NewsDetailResponse> = await apiClient.patch(`/newsletters/achievement/${id}/`, data)
  return response.data
}

/**
 * Delete achievement news (Admin only)
 * @param id - Achievement news ID
 */
export const deleteAchievementNews = async (id: number): Promise<void> => {
  await apiClient.delete(`/newsletters/achievement/${id}/`)
}

/**
 * Upload image to achievement news (Admin only)
 * @param id - Achievement news ID
 * @param file - Image file
 * @param isMain - Set as main image
 * @param displayOrder - Display order
 */
export const uploadAchievementImage = async (
  id: number, 
  file: File, 
  isMain: boolean = false, 
  displayOrder: number = 0
): Promise<ImageUploadResponse> => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('is_main', isMain.toString())
  formData.append('display_order', displayOrder.toString())

  const response: AxiosResponse<ImageUploadResponse> = await apiClient.post(
    `/newsletters/achievement/${id}/images/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// ==================== IMAGE OPERATIONS ====================

/**
 * Newsletter image interface
 */
export interface NewsletterImage {
  id: number
  original_filename: string
  file_size: number
  mime_type: string
  is_main: boolean
  display_order: number
  uploaded_at: string
  download_url: string
  thumbnail_url: string
}

/**
 * List all images for a newsletter
 * @param newsType - News type (slider, normal, achievement)
 * @param id - Newsletter ID
 */
export const listNewsletterImages = async (
  newsType: 'slider' | 'normal' | 'achievement',
  id: number
): Promise<{ status: string; data: NewsletterImage[] }> => {
  const response = await apiClient.get(`/newsletters/${newsType}/${id}/images/`)
  return response.data
}

/**
 * Delete a newsletter image
 * @param imageId - Image ID
 */
export const deleteNewsletterImage = async (imageId: number): Promise<void> => {
  await apiClient.delete(`/newsletters/images/${imageId}/`)
}

/**
 * Update image metadata
 * @param imageId - Image ID
 * @param data - Update data (is_main, display_order)
 */
export const updateNewsletterImage = async (
  imageId: number,
  data: { is_main?: boolean; display_order?: number }
): Promise<{ status: string; data: NewsletterImage }> => {
  const response = await apiClient.patch(`/newsletters/images/${imageId}/`, data)
  return response.data
}

/**
 * Get download URL for full image
 * @param imageId - Image ID
 */
export const getImageDownloadUrl = (imageId: number): string => {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
  return `${baseUrl}/newsletters/images/${imageId}/download/`
}

/**
 * Get thumbnail URL for image
 * @param imageId - Image ID
 */
export const getImageThumbnailUrl = (imageId: number): string => {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
  return `${baseUrl}/newsletters/images/${imageId}/thumbnail/`
}

// ==================== POSITION MANAGEMENT ====================

/**
 * Position list item interface
 */
export interface PositionListItem {
  id: number
  title: string
  position: number
}

/**
 * Position update response interface
 */
export interface PositionUpdateResponse {
  status: string
  message: string
  data: {
    id: number
    title: string
    old_position: number
    new_position: number
    displaced_newsletter?: {
      id: number
      title: string
      old_position: number
      new_position: number
    }
  }
}

/**
 * Fetch all positions for normal news
 */
export const fetchNormalPositions = async (): Promise<{ status: string; data: PositionListItem[] }> => {
  const response = await apiClient.get('/newsletters/normal/positions/')
  return response.data
}

/**
 * Fetch all positions for slider news
 */
export const fetchSliderPositions = async (): Promise<{ status: string; data: PositionListItem[] }> => {
  const response = await apiClient.get('/newsletters/slider/positions/')
  return response.data
}

/**
 * Fetch all positions for achievement news
 */
export const fetchAchievementPositions = async (): Promise<{ status: string; data: PositionListItem[] }> => {
  const response = await apiClient.get('/newsletters/achievement/positions/')
  return response.data
}

/**
 * Update position for normal news (Admin only)
 * @param id - Newsletter ID
 * @param position - New position
 */
export const updateNormalPosition = async (id: number, position: number): Promise<PositionUpdateResponse> => {
  const response = await apiClient.patch(`/newsletters/normal/${id}/update-position/`, { position })
  return response.data
}

/**
 * Update position for slider news (Admin only)
 * @param id - Newsletter ID
 * @param position - New position
 */
export const updateSliderPosition = async (id: number, position: number): Promise<PositionUpdateResponse> => {
  const response = await apiClient.patch(`/newsletters/slider/${id}/update-position/`, { position })
  return response.data
}

/**
 * Update position for achievement news (Admin only)
 * @param id - Newsletter ID
 * @param position - New position
 */
export const updateAchievementPosition = async (id: number, position: number): Promise<PositionUpdateResponse> => {
  const response = await apiClient.patch(`/newsletters/achievement/${id}/update-position/`, { position })
  return response.data
}

/**
 * Get next available position for a news type
 * @param type - News type (NORMAL, SLIDER, ACHIEVEMENT)
 */
export const getNextAvailablePosition = async (type: 'NORMAL' | 'SLIDER' | 'ACHIEVEMENT'): Promise<number> => {
  let fetchFn: () => Promise<{ status: string; data: PositionListItem[] }>
  
  switch (type) {
    case 'SLIDER':
      fetchFn = fetchSliderPositions
      break
    case 'ACHIEVEMENT':
      fetchFn = fetchAchievementPositions
      break
    default:
      fetchFn = fetchNormalPositions
  }
  
  const response = await fetchFn()
  const positions = response.data.map(item => item.position).sort((a, b) => a - b)
  
  // Find the first gap or return next number after max
  for (let i = 0; i <= positions.length; i++) {
    if (!positions.includes(i)) {
      return i
    }
  }
  
  return positions.length > 0 ? Math.max(...positions) + 1 : 0
}

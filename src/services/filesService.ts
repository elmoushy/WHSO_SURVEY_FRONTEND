import { apiClient } from './jwtAuthService'
import type { AxiosResponse } from 'axios'

// ==========================================
// API Response Types matching backend schema
// ==========================================

export interface APIResponse<T = any> {
  status: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

// Backend File Model (UUID-based)
export interface BackendFile {
  id: string // UUID
  name: string
  mime_type: string
  size_bytes: number
  extension: string
  size_human: string
  folder: string | null // UUID
  folder_name: string | null
  folder_path: string | null
  is_favorite: boolean
  uploaded_at: string // ISO datetime
  created_at: string // ISO datetime
  updated_at: string // ISO datetime
}

// Backend Folder Model (UUID-based)
export interface BackendFolder {
  id: string // UUID
  name: string
  parent: string | null // UUID
  full_path: string
  is_shared: boolean
  file_count: number
  subfolder_count: number
  created_at: string // ISO datetime
  updated_at: string // ISO datetime
}

// Backend User Quota Model
export interface UserQuota {
  limit_bytes: number
  used_bytes: number
  used_percent: number
  available_bytes: number
  limit_gb: number
  used_gb: number
  updated_at: string // ISO datetime
}

// Backend User Model (for sharing)
export interface BackendUser {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
}

// Backend Share Model
export interface BackendShare {
  id: string // UUID
  folder: string // UUID
  target_user: number
  target_user_name: string
  permission: 'read' | 'write'
  expires_at: string | null // ISO datetime
  created_at: string // ISO datetime
}

// Shared Folder Response Model
export interface SharedFolder {
  id: string // UUID
  name: string
  full_path: string
  owner_name: string
  permission: 'read' | 'write'
  shared_at: string // ISO datetime
  expires_at: string | null // ISO datetime
  file_count: number
  subfolder_count: number
}

// ==========================================
// Request Parameter Types
// ==========================================

export interface FileListParams {
  scope?: 'my' | 'shared' | 'recent'
  folder?: string // UUID
  mime_type?: string
  is_favorite?: boolean
  search?: string
  name?: string
  type?: string
  size_min?: number
  size_max?: number
  date_from?: string // YYYY-MM-DD
  date_to?: string // YYYY-MM-DD
  ordering?: 'uploaded_at' | '-uploaded_at' | 'name' | '-name' | 'size_bytes' | '-size_bytes'
  page?: number
  limit?: number // for recent scope
}

export interface FolderListParams {
  parent?: string // UUID
  search?: string
  ordering?: 'name' | '-name' | 'created_at' | '-created_at'
}

export interface FileUpdateData {
  name?: string
  folder?: string // UUID
  is_favorite?: boolean
}

export interface FolderCreateData {
  name: string
  parent?: string // UUID
}

export interface FolderUpdateData {
  name?: string
  parent?: string // UUID
}

export interface ShareFolderData {
  target_user: number
  permission: 'read' | 'write'
  expires_at?: string // ISO datetime
}

export interface UserListParams {
  search?: string
}

export interface UpdateUserQuotaData {
  limit_gb?: number
  limit_bytes?: number
}

export interface FavoriteToggleData {
  is_favorite?: boolean
}

// ==========================================
// Upload Response Types
// ==========================================

export interface UploadResponse {
  uploaded_files: BackendFile[]
  errors: UploadError[]
}

export interface UploadError {
  filename: string
  errors: {
    [key: string]: string[]
  }
}

// ==========================================
// Files API Service Class
// ==========================================

class FilesService {
  
  // ==========================================
  // QUOTA MANAGEMENT
  // ==========================================
  
  /**
   * Get current user's storage quota information
   */
  async getUserQuota(): Promise<UserQuota> {
    const response: AxiosResponse<APIResponse<UserQuota>> = await apiClient.get('/files/quota/')
    return response.data.data
  }

  /**
   * Admin: Update user quota (admin only)
   */
  async updateUserQuota(userId: number, quotaData: UpdateUserQuotaData): Promise<UserQuota> {
    const response: AxiosResponse<APIResponse<UserQuota>> = await apiClient.patch(
      `/files/admin/users/${userId}/quota/`,
      quotaData
    )
    return response.data.data
  }

  // ==========================================
  // FILE OPERATIONS
  // ==========================================
  
  /**
   * List files with advanced filtering and pagination
   */
  async listFiles(params: FileListParams = {}): Promise<PaginatedResponse<BackendFile>> {
    const response: AxiosResponse<APIResponse<PaginatedResponse<BackendFile>>> = await apiClient.get(
      '/files/files/',
      { params }
    )
    return response.data.data
  }

  /**
   * Upload single or multiple files
   */
  async uploadFiles(files: File[], folderId?: string): Promise<UploadResponse> {
    const formData = new FormData()
    
    // Add files to form data - backend expects 'file_data' field name
    files.forEach(file => {
      formData.append('files', file)
    })
    
    // Add folder ID if specified
    if (folderId) {
      formData.append('folder_id', folderId)
    }

    const response: AxiosResponse<APIResponse<UploadResponse>> = await apiClient.post(
      '/files/files/upload/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes for large uploads
      }
    )
    return response.data.data
  }

  /**
   * Get detailed file metadata
   */
  async getFileDetails(fileId: string): Promise<BackendFile> {
    const response: AxiosResponse<BackendFile> = await apiClient.get(`/files/files/${fileId}/`)
    return response.data
  }

  /**
   * Update file metadata (name, folder, favorite status)
   */
  async updateFile(fileId: string, updateData: FileUpdateData): Promise<BackendFile> {
    const response: AxiosResponse<BackendFile> = await apiClient.patch(
      `/files/files/${fileId}/`,
      updateData
    )
    return response.data
  }

  /**
   * Delete a file (soft delete)
   */
  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/files/files/${fileId}/`)
  }

  /**
   * Download file binary data
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await apiClient.get(
      `/files/files/${fileId}/download/`,
      {
        responseType: 'blob'
      }
    )
    return response.data
  }

  /**
   * Get download URL for file
   */
  getDownloadUrl(fileId: string): string {
    return `${apiClient.defaults.baseURL}/files/files/${fileId}/download/`
  }

  /**
   * Toggle or set file favorite status
   */
  async toggleFileFavorite(fileId: string, favoriteData?: FavoriteToggleData): Promise<BackendFile> {
    const response: AxiosResponse<APIResponse<BackendFile>> = await apiClient.patch(
      `/files/files/${fileId}/favorite/`,
      favoriteData || {}
    )
    return response.data.data
  }

  // ==========================================
  // FOLDER OPERATIONS
  // ==========================================
  
  /**
   * List folders with filtering and search
   */
  async listFolders(params: FolderListParams = {}): Promise<PaginatedResponse<BackendFolder>> {
    const response: AxiosResponse<APIResponse<PaginatedResponse<BackendFolder>>> = await apiClient.get(
      '/files/folders/',
      { params }
    )
    return response.data.data
  }

  /**
   * Create a new folder
   */
  async createFolder(folderData: FolderCreateData): Promise<BackendFolder> {
    const response: AxiosResponse<APIResponse<BackendFolder>> = await apiClient.post(
      '/files/folders/',
      folderData
    )
    return response.data.data
  }

  /**
   * Get detailed folder information
   */
  async getFolderDetails(folderId: string): Promise<BackendFolder> {
    const response: AxiosResponse<BackendFolder> = await apiClient.get(`/files/folders/${folderId}/`)
    return response.data
  }

  /**
   * Update folder metadata (name, parent)
   */
  async updateFolder(folderId: string, updateData: FolderUpdateData): Promise<BackendFolder> {
    const response: AxiosResponse<BackendFolder> = await apiClient.patch(
      `/files/folders/${folderId}/`,
      updateData
    )
    return response.data
  }

  /**
   * Delete a folder and all its contents recursively
   */
  async deleteFolder(folderId: string): Promise<void> {
    await apiClient.delete(`/files/folders/${folderId}/`)
  }

  /**
   * Upload files directly to a specific folder
   */
  async uploadFilesToFolder(folderId: string, files: File[]): Promise<UploadResponse> {
    const formData = new FormData()
    
    files.forEach(file => {
        formData.append('files', file)
    })

    const response: AxiosResponse<APIResponse<UploadResponse>> = await apiClient.post(
      `/files/folders/${folderId}/upload/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes for large uploads
      }
    )
    return response.data.data
  }

  /**
   * Download entire folder as ZIP file
   */
  async downloadFolderAsZip(folderId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await apiClient.get(
      `/files/folders/${folderId}/download/`,
      {
        responseType: 'blob',
        timeout: 600000, // 10 minutes for large folders
      }
    )
    return response.data
  }

  /**
   * Get download URL for folder ZIP
   */
  getFolderDownloadUrl(folderId: string): string {
    return `${apiClient.defaults.baseURL}/files/folders/${folderId}/download/`
  }

  // ==========================================
  // SHARING SYSTEM
  // ==========================================
  
  /**
   * Share a folder with another user
   */
  async shareFolder(folderId: string, shareData: ShareFolderData): Promise<BackendShare> {
    const response: AxiosResponse<APIResponse<BackendShare>> = await apiClient.post(
      `/files/folders/${folderId}/share/`,
      shareData
    )
    return response.data.data
  }

  /**
   * List folders shared with current user
   */
  async listSharedFolders(): Promise<PaginatedResponse<SharedFolder>> {
    const response: AxiosResponse<APIResponse<PaginatedResponse<SharedFolder>>> = await apiClient.get(
      '/files/shared/'
    )
    return response.data.data
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  
  /**
   * List all users for sharing (excludes current user)
   */
  async listUsersForSharing(params: UserListParams = {}): Promise<PaginatedResponse<BackendUser>> {
    const response: AxiosResponse<APIResponse<PaginatedResponse<BackendUser>>> = await apiClient.get(
      '/files/users/list/',
      { params }
    )
    return response.data.data
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================
  
  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file icon based on MIME type or extension
   */
  getFileIcon(file: BackendFile): string {
    const mimeTypeIcons: { [key: string]: string } = {
      'application/pdf': 'fas fa-file-pdf',
      'application/msword': 'fas fa-file-word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
      'application/vnd.ms-excel': 'fas fa-file-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
      'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint',
      'text/plain': 'fas fa-file-alt',
      'application/zip': 'fas fa-file-archive',
      'application/x-rar-compressed': 'fas fa-file-archive',
      'image/jpeg': 'fas fa-file-image',
      'image/png': 'fas fa-file-image',
      'image/gif': 'fas fa-file-image',
      'video/mp4': 'fas fa-file-video',
      'video/avi': 'fas fa-file-video',
      'audio/mp3': 'fas fa-file-audio',
      'audio/wav': 'fas fa-file-audio',
    }

    return mimeTypeIcons[file.mime_type] || 'fas fa-file'
  }

  /**
   * Get file type color for UI
   */
  getFileTypeColor(file: BackendFile): string {
    if (file.mime_type.startsWith('image/')) return '#28a745'
    if (file.mime_type.startsWith('video/')) return '#dc3545'
    if (file.mime_type.startsWith('audio/')) return '#ffc107'
    if (file.mime_type === 'application/pdf') return '#dc3545'
    if (file.mime_type.includes('word')) return '#007bff'
    if (file.mime_type.includes('excel')) return '#28a745'
    if (file.mime_type.includes('powerpoint')) return '#fd7e14'
    return '#6c757d'
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: BackendFile): boolean {
    return file.mime_type.startsWith('image/')
  }

  /**
   * Check if file is a document
   */
  isDocumentFile(file: BackendFile): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    return documentTypes.includes(file.mime_type)
  }

  /**
   * Get breadcrumbs for folder navigation
   */
  async getFolderBreadcrumbs(folderId: string | null): Promise<{ id: string | null, name: string }[]> {
    if (!folderId) {
      return [{ id: null, name: 'Root' }]
    }

    const breadcrumbs: { id: string | null, name: string }[] = [{ id: null, name: 'Root' }]
    let currentFolderId: string | null = folderId
    
    while (currentFolderId) {
      try {
        const folder = await this.getFolderDetails(currentFolderId)
        breadcrumbs.push({ id: folder.id, name: folder.name })
        currentFolderId = folder.parent
      } catch (error) {
        // Logging removed for production
        break
      }
    }
    
    return breadcrumbs.reverse()
  }

  /**
   * Download file with proper filename
   */
  async downloadFileWithName(file: BackendFile): Promise<void> {
    try {
      const blob = await this.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // Logging removed for production
      throw error
    }
  }

  /**
   * Download folder as ZIP with proper filename
   */
  async downloadFolderWithName(folder: BackendFolder): Promise<void> {
    try {
      const blob = await this.downloadFolderAsZip(folder.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${folder.name}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // Logging removed for production
      throw error
    }
  }
}

// Export singleton instance
export const filesService = new FilesService()
export default filesService

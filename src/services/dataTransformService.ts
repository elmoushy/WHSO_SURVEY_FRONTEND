import type { BackendFile, BackendFolder, BackendUser } from '../services/filesService'
import type { FileItem, FolderItem, User } from '../types/files.types'

/**
 * Utility service to convert between backend API models and frontend models
 */
class DataTransformService {
  
  /**
   * Convert backend file to frontend FileItem
   */
  backendFileToFileItem(backendFile: BackendFile, currentUser: string = 'current_user'): FileItem {
    return {
      // Frontend fields
      id: backendFile.id,
      name: backendFile.name,
      size: backendFile.size_bytes,
      type: this.getFileTypeFromMimeType(backendFile.mime_type),
      modified: new Date(backendFile.uploaded_at),
      owner: currentUser,
      shared: false, // Will be updated based on sharing info
      parentId: backendFile.folder,
      tags: this.generateAutoTags(backendFile.name, backendFile.mime_type),
      version: 1.0,
      encrypted: false, // Frontend feature
      thumbnail: undefined, // Frontend feature
      sharedWith: [], // Will be populated separately
      
      // Backend fields (preserved for API calls)
      mime_type: backendFile.mime_type,
      extension: backendFile.extension,
      size_human: backendFile.size_human,
      folder_name: backendFile.folder_name,
      folder_path: backendFile.folder_path,
      is_favorite: backendFile.is_favorite,
      uploaded_at: backendFile.uploaded_at,
      created_at: backendFile.created_at,
      updated_at: backendFile.updated_at
    }
  }

  /**
   * Convert backend folder to frontend FolderItem
   */
  backendFolderToFolderItem(backendFolder: BackendFolder, currentUser: string = 'current_user'): FolderItem {
    return {
      id: backendFolder.id,
      name: backendFolder.name,
      parentId: backendFolder.parent,
      full_path: backendFolder.full_path,
      is_shared: backendFolder.is_shared,
      file_count: backendFolder.file_count,
      subfolder_count: backendFolder.subfolder_count,
      created_at: backendFolder.created_at,
      updated_at: backendFolder.updated_at,
      modified: new Date(backendFolder.updated_at),
      owner: currentUser,
      shared: backendFolder.is_shared
    }
  }

  /**
   * Convert backend user to frontend User
   */
  backendUserToUser(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      name: backendUser.full_name,
      email: backendUser.email,
      first_name: backendUser.first_name,
      last_name: backendUser.last_name,
      full_name: backendUser.full_name,
      avatar: undefined, // Not provided by backend
      role: undefined, // Not provided by backend
      department: undefined // Not provided by backend
    }
  }

  /**
   * Convert array of backend files to frontend FileItems
   */
  backendFilesToFileItems(backendFiles: BackendFile[], currentUser?: string): FileItem[] {
    return backendFiles.map(file => this.backendFileToFileItem(file, currentUser))
  }

  /**
   * Convert array of backend folders to frontend FolderItems
   */
  backendFoldersToFolderItems(backendFolders: BackendFolder[], currentUser?: string): FolderItem[] {
    return backendFolders.map(folder => this.backendFolderToFolderItem(folder, currentUser))
  }

  /**
   * Convert array of backend users to frontend Users
   */
  backendUsersToUsers(backendUsers: BackendUser[]): User[] {
    return backendUsers.map(user => this.backendUserToUser(user))
  }

  /**
   * Get file type from MIME type for frontend display
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('word')) return 'document'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
    if (mimeType.startsWith('text/')) return 'text'
    return 'file'
  }

  /**
   * Generate automatic tags based on filename and MIME type
   */
  private generateAutoTags(fileName: string, mimeType: string): string[] {
    const tags: string[] = []
    
    // MIME type based tags
    if (mimeType.startsWith('image/')) tags.push('image')
    if (mimeType.startsWith('video/')) tags.push('video')
    if (mimeType.startsWith('audio/')) tags.push('audio')
    if (mimeType === 'application/pdf') tags.push('document', 'pdf')
    if (mimeType.includes('word')) tags.push('document', 'word')
    if (mimeType.includes('excel')) tags.push('spreadsheet', 'excel')
    if (mimeType.includes('powerpoint')) tags.push('presentation', 'powerpoint')
    
    // Filename based tags (case insensitive)
    const nameLower = fileName.toLowerCase()
    if (nameLower.includes('strategic')) tags.push('strategic')
    if (nameLower.includes('mission')) tags.push('mission')
    if (nameLower.includes('weapon')) tags.push('weapons')
    if (nameLower.includes('equipment')) tags.push('equipment')
    if (nameLower.includes('training')) tags.push('training')
    if (nameLower.includes('classified')) tags.push('classified')
    if (nameLower.includes('confidential')) tags.push('confidential')
    if (nameLower.includes('report')) tags.push('report')
    if (nameLower.includes('brief')) tags.push('briefing')
    if (nameLower.includes('spec')) tags.push('specifications')
    
    // Remove duplicates
    return [...new Set(tags)]
  }

  /**
   * Convert frontend filter scope to backend scope parameter
   */
  frontendScopeToBackendScope(frontendScope: string): 'my' | 'shared' | 'recent' | undefined {
    switch (frontendScope) {
      case 'myFiles':
        return 'my'
      case 'sharedFiles':
        return 'shared'
      case 'recentFiles':
        return 'recent'
      default:
        return 'my'
    }
  }

  /**
   * Convert frontend sort option to backend ordering parameter
   */
  frontendSortToBackendOrdering(frontendSort: string): string {
    switch (frontendSort) {
      case 'name':
        return 'name'
      case 'date':
        return '-uploaded_at'
      case 'size':
        return '-size_bytes'
      case 'type':
        return 'name' // Backend doesn't have type sorting, fallback to name
      default:
        return 'name'
    }
  }

  /**
   * Create breadcrumb item from folder path
   */
  createBreadcrumbFromPath(fullPath: string): { id: string | null, name: string }[] {
    if (!fullPath || fullPath === '/') {
      return [{ id: null, name: 'Root' }]
    }

    const breadcrumbs = [{ id: null, name: 'Root' }]
    const pathParts = fullPath.split('/').filter(part => part.length > 0)
    
    pathParts.forEach((part) => {
      breadcrumbs.push({
        id: null, // This would need to be replaced with actual folder IDs when available
        name: part
      })
    })

    return breadcrumbs
  }

  /**
   * Merge files and folders for unified display
   */
  mergeFilesAndFolders(files: FileItem[], folders: FolderItem[]): (FileItem | FolderItem)[] {
    const combined: (FileItem | FolderItem)[] = []
    
    // Add folders first (they typically appear before files)
    folders.forEach(folder => {
      combined.push({
        ...folder,
        type: 'folder',
        size: 0, // Folders don't have size in the same way
        mime_type: 'folder',
        extension: '',
        size_human: `${folder.file_count} files`,
        folder_name: null,
        folder_path: null,
        is_favorite: false,
        uploaded_at: folder.created_at,
        tags: ['folder'],
        version: 1.0,
        encrypted: false,
        thumbnail: undefined,
        sharedWith: []
      } as FileItem)
    })
    
    // Add files
    files.forEach(file => {
      combined.push(file)
    })
    
    return combined
  }

  /**
   * Calculate storage percentage
   */
  calculateStoragePercentage(usedBytes: number, limitBytes: number): number {
    if (limitBytes === 0) return 0
    return Math.round((usedBytes / limitBytes) * 100 * 10) / 10 // Round to 1 decimal place
  }

  /**
   * Format date for display based on locale with Gregorian calendar
   */
  formatDate(dateString: string, locale: string = 'en-US'): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      calendar: 'gregory',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  /**
   * Check if date is recent (within last 7 days)
   */
  isRecentDate(dateString: string): boolean {
    const date = new Date(dateString)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date > weekAgo
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }

  /**
   * Validate file for upload (size, type, etc.)
   */
  validateFileForUpload(file: File, maxSizeBytes: number = 100 * 1024 * 1024): { valid: boolean, error?: string } {
    // Check file size (default 100MB limit)
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds limit of ${this.formatBytes(maxSizeBytes)}`
      }
    }

    // Check for prohibited file types (for security)
    const prohibitedExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com']
    const extension = this.getFileExtension(file.name)
    
    if (prohibitedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File type .${extension} is not allowed for security reasons`
      }
    }

    return { valid: true }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const dataTransformService = new DataTransformService()
export default dataTransformService

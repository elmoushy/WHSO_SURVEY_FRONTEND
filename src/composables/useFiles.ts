import { ref, computed, watch } from 'vue'
import { filesService } from '../services/filesService'
import { dataTransformService } from '../services/dataTransformService'
import type { 
  FileItem, 
  FolderItem, 
  UploadingFile, 
  User, 
  FilterTab 
} from '../types/files.types'
import type { 
  UserQuota, 
  FileListParams,
  FolderListParams 
} from '../services/filesService'

/**
 * Composable for managing files and folders state and operations
 */
export function useFiles() {
  // ==========================================
  // REACTIVE STATE
  // ==========================================
  
  // Storage quota
  const quota = ref<UserQuota | null>(null)
  const usedStorage = computed(() => quota.value?.used_bytes || 0)
  const totalStorage = computed(() => quota.value?.limit_bytes || 0)
  const storagePercentage = computed(() => 
    dataTransformService.calculateStoragePercentage(usedStorage.value, totalStorage.value)
  )

  // Files and folders
  const files = ref<FileItem[]>([])
  const folders = ref<FolderItem[]>([])
  const allItems = computed(() => dataTransformService.mergeFilesAndFolders(files.value, folders.value))

  // Navigation
  const currentFolderId = ref<string | null>(null)
  const breadcrumbs = ref<{ id: string | null, name: string }[]>([{ id: null, name: 'Root' }])

  // UI state
  const loading = ref(false)
  const uploading = ref(false)
  const uploadingFiles = ref<UploadingFile[]>([])
  const selectedFiles = ref<string[]>([])
  const starredFiles = ref<string[]>([])

  // Search and filtering
  const searchQuery = ref('')
  const activeFilter = ref('myFiles')
  const sortBy = ref('name')
  const viewMode = ref<'grid' | 'list'>('grid')

  // Modal states
  const showShareModal = ref(false)
  const showCreateFolder = ref(false)
  const showFolderModal = ref(false)
  const currentFile = ref<FileItem | null>(null)
  const currentFolder = ref<FolderItem | null>(null)

  // Users for sharing
  const availableUsers = ref<User[]>([])

  // Error handling
  const error = ref<string | null>(null)
  const lastOperation = ref<string | null>(null)

  // Filter tabs configuration
  const filterTabs: FilterTab[] = [
    { key: 'myFiles', label: 'files.myFiles', icon: 'fas fa-folder' },
    { key: 'sharedFiles', label: 'files.sharedFiles', icon: 'fas fa-users' },
    { key: 'recentFiles', label: 'files.recentFiles', icon: 'fas fa-clock' }
  ]

  // ==========================================
  // COMPUTED PROPERTIES
  // ==========================================

  const filteredFiles = computed(() => {
    let result = allItems.value

    // Filter by current folder
    if (currentFolderId.value !== null) {
      result = result.filter(item => item.parentId === currentFolderId.value)
    } else {
      result = result.filter(item => !item.parentId)
    }

    // Apply search
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query)
        const tagsMatch = 'tags' in item && item.tags 
          ? item.tags.some((tag: string) => tag.toLowerCase().includes(query))
          : false
        return nameMatch || tagsMatch
      })
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return new Date(b.modified).getTime() - new Date(a.modified).getTime()
        case 'size':
          const aSize = 'size' in a ? a.size : 0
          const bSize = 'size' in b ? b.size : 0
          return bSize - aSize
        case 'type':
          const aType = 'type' in a ? a.type : 'folder'
          const bType = 'type' in b ? b.type : 'folder'
          return aType.localeCompare(bType)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  })

  // ==========================================
  // QUOTA MANAGEMENT
  // ==========================================

  const loadQuota = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      quota.value = await filesService.getUserQuota()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load quota'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // FILE OPERATIONS
  // ==========================================

  const loadFiles = async (params: Partial<FileListParams> = {}): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const defaultParams: FileListParams = {
        scope: dataTransformService.frontendScopeToBackendScope(activeFilter.value),
        folder: currentFolderId.value || undefined,
        ordering: dataTransformService.frontendSortToBackendOrdering(sortBy.value) as any,
        search: searchQuery.value.trim() || undefined,
        ...params
      }

      const response = await filesService.listFiles(defaultParams)
      const transformedFiles = dataTransformService.backendFilesToFileItems(response.results)
      
      files.value = transformedFiles
      lastOperation.value = 'loadFiles'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load files'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const uploadFiles = async (filesToUpload: File[]): Promise<void> => {
    try {
      uploading.value = true
      error.value = null

      // Validate files
      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of filesToUpload) {
        const validation = dataTransformService.validateFileForUpload(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      }

      if (errors.length > 0) {
        error.value = `Some files were rejected: ${errors.join(', ')}`
      }

      if (validFiles.length === 0) {
        return
      }

      // Create uploading file entries for progress tracking
      const uploadingEntries: UploadingFile[] = validFiles.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        size: file.size,
        progress: 0,
        file,
        parentId: currentFolderId.value
      }))

      uploadingFiles.value = uploadingEntries

      // Simulate upload progress (in real implementation, you'd track actual progress)
      const progressInterval = setInterval(() => {
        uploadingFiles.value.forEach(upload => {
          if (upload.progress < 90) {
            upload.progress += Math.random() * 20
          }
        })
      }, 200)

      // Perform actual upload
      const response = await filesService.uploadFiles(validFiles, currentFolderId.value || undefined)
      
      // Clear progress interval
      clearInterval(progressInterval)

      // Update progress to 100%
      uploadingFiles.value.forEach(upload => {
        upload.progress = 100
      })

      // Transform uploaded files and add to files list
      const newFiles = dataTransformService.backendFilesToFileItems(response.uploaded_files)
      files.value.unshift(...newFiles)

      // Handle any upload errors
      if (response.errors.length > 0) {
        const errorMessages = response.errors.map(err => 
          `${err.filename}: ${Object.values(err.errors).flat().join(', ')}`
        )
        error.value = `Upload completed with errors: ${errorMessages.join('; ')}`
      }

      // Clear uploading files after a delay
      setTimeout(() => {
        uploadingFiles.value = []
      }, 2000)

      // Reload quota to reflect changes
      await loadQuota()
      lastOperation.value = 'uploadFiles'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload files'
      // Logging removed for production
      uploadingFiles.value = []
    } finally {
      uploading.value = false
    }
  }

  const downloadFile = async (file: FileItem): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await filesService.downloadFileWithName(file as any) // Type assertion for BackendFile compatibility
      lastOperation.value = 'downloadFile'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download file'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await filesService.deleteFile(fileId)
      files.value = files.value.filter(f => f.id !== fileId)
      selectedFiles.value = selectedFiles.value.filter(id => id !== fileId)
      await loadQuota() // Reload quota
      lastOperation.value = 'deleteFile'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete file'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const toggleFileFavorite = async (fileId: string): Promise<void> => {
    try {
      error.value = null
      const file = files.value.find(f => f.id === fileId)
      if (!file) return

      const updatedFile = await filesService.toggleFileFavorite(fileId)
      
      // Update local state
      const index = files.value.findIndex(f => f.id === fileId)
      if (index !== -1) {
        files.value[index] = dataTransformService.backendFileToFileItem(updatedFile)
      }

      // Update starred files list
      if (updatedFile.is_favorite) {
        if (!starredFiles.value.includes(fileId)) {
          starredFiles.value.push(fileId)
        }
      } else {
        starredFiles.value = starredFiles.value.filter(id => id !== fileId)
      }

      lastOperation.value = 'toggleFileFavorite'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update favorite status'
      // Logging removed for production
    }
  }

  // ==========================================
  // FOLDER OPERATIONS
  // ==========================================

  const loadFolders = async (params: Partial<FolderListParams> = {}): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const defaultParams: FolderListParams = {
        parent: currentFolderId.value || undefined,
        ordering: 'name',
        ...params
      }

      const response = await filesService.listFolders(defaultParams)
      const transformedFolders = dataTransformService.backendFoldersToFolderItems(response.results)
      
      folders.value = transformedFolders
      lastOperation.value = 'loadFolders'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load folders'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const createFolder = async (name: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const newFolder = await filesService.createFolder({
        name,
        parent: currentFolderId.value || undefined
      })
      
      const transformedFolder = dataTransformService.backendFolderToFolderItem(newFolder)
      folders.value.unshift(transformedFolder)
      showCreateFolder.value = false
      lastOperation.value = 'createFolder'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create folder'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const deleteFolder = async (folderId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await filesService.deleteFolder(folderId)
      folders.value = folders.value.filter(f => f.id !== folderId)
      selectedFiles.value = selectedFiles.value.filter(id => id !== folderId)
      await loadQuota() // Reload quota
      lastOperation.value = 'deleteFolder'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete folder'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  const downloadFolder = async (folder: FolderItem): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await filesService.downloadFolderWithName(folder as any) // Type assertion for BackendFolder compatibility
      lastOperation.value = 'downloadFolder'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download folder'
      // Logging removed for production
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navigateToFolder = async (folderId: string | null): Promise<void> => {
    currentFolderId.value = folderId
    await updateBreadcrumbs(folderId)
    await loadData()
  }

  const updateBreadcrumbs = async (folderId: string | null): Promise<void> => {
    try {
      breadcrumbs.value = await filesService.getFolderBreadcrumbs(folderId)
    } catch (err) {
      // Logging removed for production
      // Fallback to simple breadcrumbs
      breadcrumbs.value = [{ id: null, name: 'Root' }]
      if (folderId) {
        const folder = folders.value.find(f => f.id === folderId)
        if (folder) {
          breadcrumbs.value.push({ id: folder.id, name: folder.name })
        }
      }
    }
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  const loadUsersForSharing = async (): Promise<void> => {
    try {
      error.value = null
      const response = await filesService.listUsersForSharing()
      availableUsers.value = dataTransformService.backendUsersToUsers(response.results)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load users'
      // Logging removed for production
    }
  }

  // ==========================================
  // SELECTION MANAGEMENT
  // ==========================================

  const toggleSelection = (itemId: string): void => {
    const index = selectedFiles.value.indexOf(itemId)
    if (index === -1) {
      selectedFiles.value.push(itemId)
    } else {
      selectedFiles.value.splice(index, 1)
    }
  }

  const selectAll = (): void => {
    selectedFiles.value = filteredFiles.value.map(item => item.id)
  }

  const clearSelection = (): void => {
    selectedFiles.value = []
  }

  const deleteSelectedFiles = async (): Promise<void> => {
    const selectedIds = [...selectedFiles.value]
    let errors: string[] = []

    for (const id of selectedIds) {
      try {
        const item = allItems.value.find(item => item.id === id)
        if (item && 'file_count' in item) { // Check if it's a folder
          await deleteFolder(id)
        } else {
          await deleteFile(id)
        }
      } catch (err) {
        errors.push(`Failed to delete ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    if (errors.length > 0) {
      error.value = `Some items could not be deleted: ${errors.join('; ')}`
    }

    clearSelection()
  }

  // ==========================================
  // DATA LOADING
  // ==========================================

  const loadData = async (): Promise<void> => {
    await Promise.all([
      loadFiles(),
      loadFolders()
    ])
  }

  const refreshData = async (): Promise<void> => {
    await Promise.all([
      loadQuota(),
      loadData()
    ])
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getFileCount = (filterKey: string): number => {
    if (filterKey === 'myFiles') {
      return files.value.length
    } else if (filterKey === 'sharedFiles') {
      return files.value.filter(file => file.shared).length
    } else if (filterKey === 'recentFiles') {
      return files.value.filter(file => 
        dataTransformService.isRecentDate(file.uploaded_at)
      ).length
    }
    return 0
  }

  const formatFileSize = (bytes: number): string => {
    return dataTransformService.formatBytes(bytes)
  }

  const formatDate = (date: Date | string): string => {
    const dateStr = typeof date === 'string' ? date : date.toISOString()
    return dataTransformService.formatDate(dateStr)
  }

  const getFileIcon = (file: FileItem): string => {
    return filesService.getFileIcon(file as any) // Type assertion for BackendFile compatibility
  }

  const getFileIconColor = (file: FileItem): string => {
    return filesService.getFileTypeColor(file as any) // Type assertion for BackendFile compatibility
  }

  // ==========================================
  // WATCHERS
  // ==========================================

  // Watch for filter changes and reload data
  watch([activeFilter, sortBy, searchQuery], () => {
    loadData()
  })

  // ==========================================
  // INITIALIZATION
  // ==========================================

  const initialize = async (): Promise<void> => {
    await refreshData()
    await loadUsersForSharing()
  }

  // ==========================================
  // RETURN COMPOSABLE API
  // ==========================================

  return {
    // Reactive state
    quota,
    usedStorage,
    totalStorage,
    storagePercentage,
    files,
    folders,
    allItems,
    filteredFiles,
    currentFolderId,
    breadcrumbs,
    loading,
    uploading,
    uploadingFiles,
    selectedFiles,
    starredFiles,
    searchQuery,
    activeFilter,
    sortBy,
    viewMode,
    showShareModal,
    showCreateFolder,
    showFolderModal,
    currentFile,
    currentFolder,
    availableUsers,
    error,
    lastOperation,
    filterTabs,

    // File operations
    loadFiles,
    uploadFiles,
    downloadFile,
    deleteFile,
    toggleFileFavorite,

    // Folder operations
    loadFolders,
    createFolder,
    deleteFolder,
    downloadFolder,

    // Navigation
    navigateToFolder,
    updateBreadcrumbs,

    // User management
    loadUsersForSharing,

    // Selection management
    toggleSelection,
    selectAll,
    clearSelection,
    deleteSelectedFiles,

    // Data management
    loadData,
    refreshData,
    initialize,

    // Utility functions
    getFileCount,
    formatFileSize,
    formatDate,
    getFileIcon,
    getFileIconColor,

    // Quota management
    loadQuota
  }
}

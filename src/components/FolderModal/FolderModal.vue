<template>
  <Teleport to="body">
    <div v-if="isVisible && currentFolder" :class="styles.folderModal" @click="handleBackdropClick">
      <div :class="styles.folderModalContent" @click.stop>
        <!-- Enhanced Header -->
        <header :class="styles.folderModalHeader">
          <div :class="styles.folderInfo">
            <div :class="styles.folderIconContainer">
              <i class="fas fa-folder-open" :class="styles.folderIcon"></i>
              <div :class="styles.folderGlow"></div>
            </div>
            <div :class="styles.folderDetails">
              <h2 :class="styles.folderTitle">{{ currentFolder.name }}</h2>
              <div :class="styles.folderMeta">
                <span :class="styles.folderCount">
                  <i class="fas fa-file-alt"></i>
                  {{ folderFiles.length }} {{ folderFiles.length === 1 ? 'item' : 'items' }}
                </span>
                <span :class="styles.folderSize">
                  <i class="fas fa-hdd"></i>
                  {{ formatFileSize(totalFolderSize) }}
                </span>
                <span v-if="currentFolder.modified" :class="styles.folderDate">
                  <i class="fas fa-clock"></i>
                  {{ formatDate(currentFolder.modified) }}
                </span>
              </div>
            </div>
          </div>
          
          <div :class="styles.folderActions">
            <button 
              :class="[styles.folderActionBtn, styles.uploadAction]" 
              @click="handleUploadToFolder" 
              title="Upload to this folder"
            >
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Upload</span>
            </button>
            
            <button 
              :class="[styles.folderActionBtn, styles.downloadAction]" 
              @click="handleDownloadFolder" 
              title="Download as ZIP"
            >
              <i class="fas fa-file-archive"></i>
              <span>Download ZIP</span>
            </button>
            
            <button 
              :class="[styles.folderActionBtn, styles.shareAction]" 
              @click="handleShareFolder" 
              title="Share folder"
            >
              <i class="fas fa-share-alt"></i>
              <span>Share</span>
            </button>
            
            <button 
              :class="[styles.closeBtn]" 
              @click="handleClose" 
              title="Close"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </header>
        
        <!-- Enhanced Body -->
        <div :class="styles.folderModalBody">
          <!-- Search and Filter Bar -->
          <div v-if="folderFiles.length > 0" :class="styles.folderControls">
            <div :class="styles.searchContainer">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery"
                :placeholder="'Search in ' + currentFolder.name + '...'"
                :class="styles.searchInput"
              />
            </div>
            
            <div :class="styles.viewControls">
              <select v-model="sortBy" :class="styles.sortSelect">
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
                <option value="type">Sort by Type</option>
              </select>
              
              <div :class="styles.viewToggle">
                <button 
                  :class="[styles.viewBtn, { [styles.active]: viewMode === 'grid' }]"
                  @click="viewMode = 'grid'"
                  title="Grid View"
                >
                  <i class="fas fa-th"></i>
                </button>
                <button 
                  :class="[styles.viewBtn, { [styles.active]: viewMode === 'list' }]"
                  @click="viewMode = 'list'"
                  title="List View"
                >
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="folderFiles.length === 0" :class="styles.emptyFolder">
            <div :class="styles.emptyAnimation">
              <i class="fas fa-folder-open" :class="styles.emptyIcon"></i>
              <div :class="styles.emptyParticles">
                <div v-for="n in 6" :key="n" :class="[styles.particle, styles[`particle${n}`]]"></div>
              </div>
            </div>
            <h3 :class="styles.emptyTitle">This folder is empty</h3>
            <p :class="styles.emptyDescription">
              Drag and drop files here or click upload to add files to this folder
            </p>
            <button :class="styles.uploadBtn" @click="handleUploadToFolder">
              <i class="fas fa-plus"></i>
              <span>Add Files</span>
            </button>
          </div>
          
          <!-- Files Grid/List with Drag & Drop -->
          <div 
            v-else 
            :class="[
              styles.folderFileGrid, 
              styles[viewMode + 'View'],
              { [styles.dragOver]: isDragOver }
            ]"
            @dragover.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <div 
              v-for="file in filteredFiles" 
              :key="file.id" 
              :class="[
                styles.folderFileItem, 
                { 
                  [styles.selected]: selectedFiles.includes(file.id),
                  [styles.starred]: starredFiles.includes(file.id)
                }
              ]"
              @click="toggleFileSelection(file.id)"
              @dblclick="handleFileDoubleClick(file)"
            >
              <!-- File Icon with Top-left Position -->
              <div :class="styles.folderFileIcon">
                <div :class="styles.fileIconContainer">
                  <i 
                    :class="[getFileIcon(file.name), styles.mainFileIcon]" 
                    :style="getFileIconColor(file.type)"
                  ></i>
                  
                  <!-- Status Indicators in top-left -->
                  <div :class="styles.statusIndicators">
                    <div v-if="file.encrypted" :class="styles.encryptionIndicator" title="Encrypted">
                      <i class="fas fa-lock"></i>
                    </div>
                    <div v-if="starredFiles.includes(file.id)" :class="styles.starIndicator" title="Starred">
                      <i class="fas fa-star" :class="styles.smallStar"></i>
                    </div>
                  </div>
                </div>
                
                <!-- File Type Badge -->
                <div :class="styles.fileTypeBadge">
                  {{ getFileExtension(file.name).toUpperCase() }}
                </div>
              </div>
              
              <!-- File Information -->
              <div :class="styles.folderFileInfo">
                <h4 :class="styles.folderFileName" :title="file.name">{{ file.name }}</h4>
                
                <!-- File Tags -->
                <div v-if="file.tags && file.tags.length > 0" :class="styles.fileTags">
                  <span v-for="tag in file.tags.slice(0, 2)" :key="tag" :class="styles.tag">
                    {{ tag }}
                  </span>
                  <span v-if="file.tags.length > 2" :class="styles.moreTagsIndicator">
                    +{{ file.tags.length - 2 }}
                  </span>
                </div>
                
                <div :class="styles.folderFileDetails">
                  <span :class="styles.fileSize">
                    <i class="fas fa-weight-hanging"></i>
                    {{ formatFileSize(file.size) }}
                  </span>
                  <span :class="styles.fileDate">
                    <i class="fas fa-calendar-alt"></i>
                    {{ formatDate(file.modified) }}
                  </span>
                  <span v-if="file.version" :class="styles.fileVersion">
                    <i class="fas fa-code-branch"></i>
                    v{{ file.version }}
                  </span>
                </div>
                
                <!-- Sharing Info -->
                <div v-if="file.sharedWith && file.sharedWith.length > 0" :class="styles.sharingInfo">
                  <div :class="styles.sharedUsers">
                    <div 
                      v-for="(share, index) in file.sharedWith.slice(0, 3)" 
                      :key="share.userId"
                      :class="[styles.userAvatar, styles[`avatar${index + 1}`]]"
                      :title="getUserName(share.userId)"
                    >
                      <i class="fas fa-user"></i>
                    </div>
                    <div v-if="file.sharedWith.length > 3" :class="[styles.userAvatar, styles.moreUsers]">
                      +{{ file.sharedWith.length - 3 }}
                    </div>
                  </div>
                  <span :class="styles.sharedText">
                    Shared with {{ file.sharedWith.length }} {{ file.sharedWith.length === 1 ? 'user' : 'users' }}
                  </span>
                </div>
              </div>
              
              <!-- Enhanced Actions -->
              <div :class="styles.folderFileActions">
                <button 
                  :class="[styles.folderActionIcon, styles.starAction, { [styles.starred]: starredFiles.includes(file.id) }]"
                  @click.stop="toggleStar(file.id)"
                  :title="starredFiles.includes(file.id) ? 'Remove from favorites' : 'Add to favorites'"
                >
                  <i :class="starredFiles.includes(file.id) ? 'fas fa-heart' : 'far fa-heart'"></i>
                </button>
                
                <button 
                  :class="[styles.folderActionIcon, styles.downloadAction]"
                  @click.stop="downloadFile(file)"
                  title="Download file"
                >
                  <i class="fas fa-download"></i>
                </button>
                
                <button 
                  :class="[styles.folderActionIcon, styles.shareAction]"
                  @click.stop="shareFile(file)"
                  title="Share file"
                >
                  <i class="fas fa-share-alt"></i>
                </button>
                
                <button 
                  :class="[styles.folderActionIcon, styles.dangerAction]"
                  @click.stop="deleteFile(file.id)"
                  title="Delete file"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Footer -->
        <footer v-if="selectedFiles.length > 0" :class="styles.folderModalFooter">
          <div :class="styles.selectionInfo">
            <div :class="styles.selectionIcon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div :class="styles.selectionDetails">
              <span :class="styles.selectionCount">
                {{ selectedFiles.length }} file{{ selectedFiles.length !== 1 ? 's' : '' }} selected
              </span>
              <span :class="styles.selectionSize">
                {{ formatFileSize(selectedFilesSize) }}
              </span>
            </div>
          </div>
          
          <div :class="styles.bulkActions">
            <button :class="[styles.bulkActionBtn, styles.downloadBulk]" @click="downloadSelectedFiles">
              <i class="fas fa-download"></i>
              <span>Download Selected</span>
            </button>
            
            <button :class="[styles.bulkActionBtn, styles.shareBulk]" @click="shareSelectedFiles">
              <i class="fas fa-share-alt"></i>
              <span>Share Selected</span>
            </button>
            
            <button :class="[styles.bulkActionBtn, styles.deleteBulk]" @click="deleteSelectedFiles">
              <i class="fas fa-trash"></i>
              <span>Delete Selected</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FileItem } from '../../types/files.types'
import styles from './FolderModal.module.css'

// Props
interface Props {
  isVisible: boolean
  currentFolder: FileItem | null
  files: FileItem[]
  selectedFiles: string[] // Changed from number[] to string[] to match FileItem.id
  starredFiles: string[] // Changed from number[] to string[] to match FileItem.id
  availableUsers: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  uploadToFolder: []
  downloadFolder: [folder: FileItem]
  shareFolder: [folder: FileItem]
  toggleFileSelection: [fileId: string] // Changed from number to string
  toggleStar: [fileId: string] // Changed from number to string
  downloadFile: [file: FileItem]
  shareFile: [file: FileItem]
  deleteFile: [fileId: string] // Changed from number to string
  downloadSelectedFiles: []
  shareSelectedFiles: []
  deleteSelectedFiles: []
  dropFiles: [files: File[]]
}>()

// Local state
const searchQuery = ref('')
const sortBy = ref('name')
const viewMode = ref<'grid' | 'list'>('grid')
const isDragOver = ref(false)

// Computed properties
const folderFiles = computed(() => {
  if (!props.currentFolder) return []
  return props.files.filter(file => file.parentId === props.currentFolder?.id)
})

const filteredFiles = computed(() => {
  let result = folderFiles.value

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.modified).getTime() - new Date(a.modified).getTime()
      case 'size':
        return b.size - a.size
      case 'type':
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })

  return result
})

const totalFolderSize = computed(() => {
  return folderFiles.value.reduce((total, file) => total + file.size, 0)
})

const selectedFilesSize = computed(() => {
  return folderFiles.value
    .filter(file => props.selectedFiles.includes(file.id))
    .reduce((total, file) => total + file.size, 0)
})

// Methods
const handleBackdropClick = () => {
  emit('close')
}

const handleClose = () => {
  emit('close')
}

const handleUploadToFolder = () => {
  emit('uploadToFolder')
}

const handleDownloadFolder = () => {
  if (props.currentFolder) {
    emit('downloadFolder', props.currentFolder)
  }
}

const handleShareFolder = () => {
  if (props.currentFolder) {
    emit('shareFolder', props.currentFolder)
  }
}

const toggleFileSelection = (fileId: string) => {
  emit('toggleFileSelection', fileId)
}

// Add missing function
const handleFileDoubleClick = (file: FileItem) => {
  // Handle file double click - could open file or download
  downloadFile(file)
}

const toggleStar = (fileId: string) => {
  emit('toggleStar', fileId)
}

const downloadFile = (file: FileItem) => {
  emit('downloadFile', file)
}

const shareFile = (file: FileItem) => {
  emit('shareFile', file)
}

const deleteFile = (fileId: string) => {
  emit('deleteFile', fileId)
}

const downloadSelectedFiles = () => {
  emit('downloadSelectedFiles')
}

const shareSelectedFiles = () => {
  emit('shareSelectedFiles')
}

const deleteSelectedFiles = () => {
  emit('deleteSelectedFiles')
}

// Drag and Drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    const droppedFiles = Array.from(event.dataTransfer.files)
    emit('dropFiles', droppedFiles)
  }
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const iconMap: { [key: string]: string } = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    'txt': 'fas fa-file-alt',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'js': 'fas fa-file-code',
    'ts': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'vue': 'fas fa-file-code'
  }
  
  return iconMap[extension || ''] || 'fas fa-file'
}

const getFileIconColor = (fileType: string): { color: string } => {
  const colorMap: { [key: string]: string } = {
    'pdf': '#FF0000',
    'document': '#0066CC',
    'spreadsheet': '#00AA00',
    'presentation': '#FF6600',
    'image': '#9966CC',
    'video': '#FF3366',
    'audio': '#FF9900',
    'archive': '#666666'
  }
  
  return { color: colorMap[fileType] || '#666666' }
}

const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || 'file'
}

const getUserName = (userId: number): string => {
  const user = props.availableUsers.find(u => u.id === userId)
  return user ? user.name : 'Unknown User'
}

// Watch for modal visibility changes
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    searchQuery.value = ''
    sortBy.value = 'name'
    viewMode.value = 'grid'
  }
})
</script>

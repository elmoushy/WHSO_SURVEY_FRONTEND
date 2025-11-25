<script setup lang="ts">
import { ref, computed } from 'vue'
import Swal from 'sweetalert2'
import AuthenticatedImage from './AuthenticatedImage.vue'
import { 
  listNewsletterImages, 
  deleteNewsletterImage,
  uploadSliderImage,
  uploadNormalImage,
  uploadAchievementImage,
  getImageDownloadUrl, 
  getImageThumbnailUrl,
  type NewsletterImage 
} from '../../services/newsService'
import type { NewsType } from '../../types/news.types'

interface Props {
  newsId: number
  newsType: NewsType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

// State
const images = ref<NewsletterImage[]>([])
const loading = ref(false)
const uploading = ref(false)
const dragOver = ref(false)

// Computed
const mainImage = computed(() => images.value.find(img => img.is_main))
const galleryImages = computed(() => 
  images.value.filter(img => !img.is_main).sort((a, b) => a.display_order - b.display_order)
)

// Load images
const loadImages = async () => {
  loading.value = true
  try {
    const newsTypeMap = {
      'SLIDER': 'slider',
      'NORMAL': 'normal',
      'ACHIEVEMENT': 'achievement'
    } as const
    
    const response = await listNewsletterImages(
      newsTypeMap[props.newsType],
      props.newsId
    )
    images.value = response.data
  } catch (error: any) {
    console.error('Failed to load images:', error)
    await Swal.fire({
      title: 'Error',
      text: 'Failed to load images. Please try again.',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Upload image
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    await uploadFiles(Array.from(input.files))
  }
  input.value = '' // Reset input
}

const handleDrop = async (event: DragEvent) => {
  dragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    await uploadFiles(Array.from(event.dataTransfer.files))
  }
}

const uploadFiles = async (files: File[]) => {
  uploading.value = true
  
  try {
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Invalid File',
          text: `${file.name} is not an image file`,
          icon: 'error',
          timer: 3000
        })
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: 'File Too Large',
          text: `${file.name} exceeds 10MB limit`,
          icon: 'error',
          timer: 3000
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      uploading.value = false
      return
    }

    // Show loading
    Swal.fire({
      title: 'Uploading...',
      text: `Uploading ${validFiles.length} image(s)`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    // Upload each file
    const uploadFunction = props.newsType === 'SLIDER' 
      ? uploadSliderImage 
      : props.newsType === 'ACHIEVEMENT'
      ? uploadAchievementImage
      : uploadNormalImage

    let successCount = 0
    for (const file of validFiles) {
      try {
        const nextOrder = galleryImages.value.length > 0 
          ? Math.max(...galleryImages.value.map(img => img.display_order)) + 1 
          : 1
        
        await uploadFunction(props.newsId, file, false, nextOrder)
        successCount++
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }

    // Reload images
    await loadImages()

    // Success message
    await Swal.fire({
      title: 'Success!',
      text: `${successCount} image(s) uploaded successfully`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })

    emit('success')
  } catch (error: any) {
    console.error('Upload failed:', error)
    await Swal.fire({
      title: 'Error',
      text: error.response?.data?.detail || 'Failed to upload images',
      icon: 'error'
    })
  } finally {
    uploading.value = false
  }
}

// Delete image
const handleDelete = async (image: NewsletterImage) => {
  const result = await Swal.fire({
    title: 'Delete Image?',
    html: `Are you sure you want to delete:<br/><strong>${image.original_filename}</strong>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    focusCancel: true
  })

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      await deleteNewsletterImage(image.id)
      await loadImages()

      await Swal.fire({
        title: 'Deleted!',
        text: 'Image has been deleted.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })

      emit('success')
    } catch (error: any) {
      console.error('Failed to delete image:', error)
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.detail || 'Failed to delete image',
        icon: 'error'
      })
    }
  }
}

// View full image
const viewImage = (image: NewsletterImage) => {
  Swal.fire({
    imageUrl: getImageDownloadUrl(image.id),
    imageAlt: image.original_filename,
    showCloseButton: true,
    showConfirmButton: false,
    width: '90%',
    background: '#000',
    backdrop: 'rgba(0,0,0,0.95)',
    customClass: {
      image: 'swal-full-image'
    }
  })
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Load images on mount
loadImages()
</script>

<template>
  <div :class="$style.container">
    <!-- Upload Area -->
    <div 
      :class="[$style.uploadArea, { [$style.dragOver]: dragOver }]"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        :class="$style.fileInput"
        @change="handleFileSelect"
      />
      
      <div :class="$style.uploadContent">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          :class="$style.uploadIcon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p :class="$style.uploadText">
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p :class="$style.uploadHint">
          PNG, JPG, WebP up to 10MB
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" :class="$style.loading">
      <div :class="$style.spinner"></div>
      <p>Loading images...</p>
    </div>

    <!-- Images Grid -->
    <div v-else :class="$style.imagesSection">
      <!-- Main Image -->
      <div v-if="mainImage" :class="$style.section">
        <h3 :class="$style.sectionTitle">Main/Cover Image</h3>
        <div :class="$style.mainImageCard">
          <div :class="$style.imagePreview">
            <AuthenticatedImage
              :src="getImageThumbnailUrl(mainImage.id)" 
              :alt="mainImage.original_filename"
              :class="$style.image"
              @click="viewImage(mainImage)"
            />
            <div :class="$style.imageOverlay">
              <button 
                :class="$style.imageButton"
                @click="viewImage(mainImage)"
                title="View full size"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <button 
                :class="[$style.imageButton, $style.deleteButton]"
                @click="handleDelete(mainImage)"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div :class="$style.imageInfo">
            <p :class="$style.imageName">{{ mainImage.original_filename }}</p>
            <p :class="$style.imageSize">{{ formatFileSize(mainImage.file_size) }}</p>
          </div>
        </div>
      </div>

      <!-- Gallery Images -->
      <div v-if="galleryImages.length > 0" :class="$style.section">
        <h3 :class="$style.sectionTitle">
          Gallery Images 
          <span :class="$style.count">({{ galleryImages.length }})</span>
        </h3>
        <div :class="$style.gallery">
          <div 
            v-for="image in galleryImages" 
            :key="image.id"
            :class="$style.galleryCard"
          >
            <div :class="$style.imagePreview">
              <AuthenticatedImage
                :src="getImageThumbnailUrl(image.id)" 
                :alt="image.original_filename"
                :class="$style.image"
                @click="viewImage(image)"
              />
              <div :class="$style.imageOverlay">
                <button 
                  :class="$style.imageButton"
                  @click="viewImage(image)"
                  title="View full size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <button 
                  :class="[$style.imageButton, $style.deleteButton]"
                  @click="handleDelete(image)"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div :class="$style.imageInfo">
              <p :class="$style.imageName">{{ image.original_filename }}</p>
              <p :class="$style.imageSize">{{ formatFileSize(image.file_size) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!mainImage && galleryImages.length === 0" :class="$style.emptyState">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          :class="$style.emptyIcon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p :class="$style.emptyText">No images uploaded yet</p>
        <p :class="$style.emptyHint">Upload your first image to get started</p>
      </div>
    </div>
  </div>
</template>

<style module>
.container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Upload Area */
.uploadArea {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.uploadArea:hover,
.uploadArea.dragOver {
  border-color: #3b82f6;
  background: #eff6ff;
}

.fileInput {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.uploadContent {
  pointer-events: none;
}

.uploadIcon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #6b7280;
}

.uploadText {
  font-size: 16px;
  color: #374151;
  margin: 0 0 8px 0;
}

.uploadText strong {
  color: #3b82f6;
}

.uploadHint {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Images Section */
.imagesSection {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sectionTitle {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

/* Main Image Card */
.mainImageCard {
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Gallery */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.galleryCard {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.galleryCard:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Image Preview */
.imagePreview {
  position: relative;
  aspect-ratio: 1;
  background: #f3f4f6;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.imagePreview:hover .image {
  transform: scale(1.05);
}

.imageOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.imagePreview:hover .imageOverlay {
  opacity: 1;
}

.imageButton {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.imageButton:hover {
  background: white;
  transform: scale(1.1);
}

.deleteButton:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Image Info */
.imageInfo {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.imageName {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.imageSize {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* Empty State */
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.emptyIcon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.emptyText {
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.emptyHint {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .mainImageCard {
    max-width: 100%;
  }
}
</style>

<style>
/* SweetAlert2 custom style for full image view */
.swal-full-image {
  max-width: 90vw !important;
  max-height: 90vh !important;
  object-fit: contain !important;
}

/* Ensure SweetAlert2 appears above modals */
.swal2-container {
  z-index: 10000 !important;
}
</style>

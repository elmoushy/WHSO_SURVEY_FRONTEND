<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getImageDownloadUrl, getImageThumbnailUrl } from '../../services/newsService'
import AuthenticatedImage from './AuthenticatedImage.vue'
import type { Newsletter } from '../../types/news.types'

interface Props {
  show: boolean
  newsItem: Newsletter | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Gallery state
const selectedImageIndex = ref(0)
const showLightbox = ref(false)

// Computed
const galleryImages = computed(() => {
  if (!props.newsItem?.images) return []
  return props.newsItem.images.filter(img => !img.is_main)
})

const allImages = computed(() => {
  if (!props.newsItem?.images) return []
  return props.newsItem.images
})

const currentLightboxImage = computed(() => {
  return allImages.value[selectedImageIndex.value]
})

// Methods
const closeModal = () => {
  emit('close')
  showLightbox.value = false
  selectedImageIndex.value = 0
}

const openLightbox = (index: number) => {
  selectedImageIndex.value = index
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
}

const nextImage = () => {
  selectedImageIndex.value = (selectedImageIndex.value + 1) % allImages.value.length
}

const prevImage = () => {
  selectedImageIndex.value = (selectedImageIndex.value - 1 + allImages.value.length) % allImages.value.length
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showLightbox.value) {
      closeLightbox()
    } else {
      closeModal()
    }
  } else if (showLightbox.value) {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
    showLightbox.value = false
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Main Modal -->
    <Transition name="modal">
      <div v-if="show && newsItem" :class="$style.modalOverlay" @click.self="closeModal">
        <div :class="$style.modalContainer">
          <!-- Close Button -->
          <button :class="$style.closeButton" @click="closeModal" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Modal Content -->
          <div :class="$style.modalContent">
            <!-- Header -->
            <div :class="$style.header">
              <div :class="$style.typeBadge" :data-type="newsItem.news_type">
                {{ newsItem.news_type }}
              </div>
              <h2 :class="$style.title">{{ newsItem.title }}</h2>
            </div>

            <!-- Main Image -->
            <div v-if="newsItem.main_image" :class="$style.mainImageContainer">
              <AuthenticatedImage
                :src="getImageDownloadUrl(newsItem.main_image.id)" 
                :alt="newsItem.title"
                :class="$style.mainImage"
                @click="openLightbox(0)"
              />
              <div :class="$style.imageOverlay">
                <span>Click to enlarge</span>
              </div>
            </div>

            <!-- Details Content -->
            <div :class="$style.detailsSection">
              <div :class="$style.details" v-html="newsItem.details"></div>
            </div>

            <!-- Gallery -->
            <div v-if="galleryImages.length > 0" :class="$style.gallerySection">
              <h3 :class="$style.galleryTitle">Gallery ({{ galleryImages.length }} images)</h3>
              <div :class="$style.gallery">
                <div 
                  v-for="(image, index) in galleryImages" 
                  :key="image.id"
                  :class="$style.galleryItem"
                  @click="openLightbox(index + 1)"
                >
                  <AuthenticatedImage
                    :src="getImageThumbnailUrl(image.id)" 
                    :alt="image.original_filename"
                    :class="$style.galleryImage"
                  />
                  <div :class="$style.galleryOverlay">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div :class="$style.metadata">
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">Author:</span>
                <span :class="$style.metadataValue">{{ newsItem.author_name || 'Unknown' }}</span>
              </div>
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">Published:</span>
                <span :class="$style.metadataValue">{{ formatDate(newsItem.created_at) }}</span>
              </div>
              <div v-if="newsItem.updated_at !== newsItem.created_at" :class="$style.metadataItem">
                <span :class="$style.metadataLabel">Last Updated:</span>
                <span :class="$style.metadataValue">{{ formatDate(newsItem.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Lightbox -->
    <Transition name="fade">
      <div v-if="showLightbox && currentLightboxImage" :class="$style.lightbox" @click.self="closeLightbox">
        <button :class="$style.lightboxClose" @click="closeLightbox" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <button 
          v-if="allImages.length > 1"
          :class="[$style.lightboxNav, $style.lightboxPrev]" 
          @click="prevImage"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <AuthenticatedImage
          :src="getImageDownloadUrl(currentLightboxImage.id)" 
          :alt="currentLightboxImage.original_filename"
          :class="$style.lightboxImage"
        />

        <button 
          v-if="allImages.length > 1"
          :class="[$style.lightboxNav, $style.lightboxNext]" 
          @click="nextImage"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div :class="$style.lightboxCounter">
          {{ selectedImageIndex + 1 }} / {{ allImages.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modalContainer,
.modal-leave-active .modalContainer {
  transition: transform 0.3s ease;
}

.modal-enter-from .modalContainer,
.modal-leave-to .modalContainer {
  transform: scale(0.9);
}

/* Fade Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Overlay */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

/* Modal Container */
.modalContainer {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Close Button */
.closeButton {
  position: sticky;
  top: 20px;
  right: 20px;
  float: right;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.closeButton:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: rotate(90deg);
}

/* Modal Content */
.modalContent {
  padding: 40px;
}

/* Header */
.header {
  margin-bottom: 32px;
}

.typeBadge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.typeBadge[data-type="SLIDER"] {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.typeBadge[data-type="NORMAL"] {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.typeBadge[data-type="ACHIEVEMENT"] {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

/* Main Image */
.mainImageContainer {
  position: relative;
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #f3f4f6;
}

.mainImage {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.mainImageContainer:hover .mainImage {
  transform: scale(1.05);
}

.imageOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 16px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mainImageContainer:hover .imageOverlay {
  opacity: 1;
}

/* Details Section */
.detailsSection {
  margin-bottom: 32px;
}

.details {
  font-size: 16px;
  line-height: 1.7;
  color: #374151;
}

.details :global(p) {
  margin-bottom: 16px;
}

.details :global(h1),
.details :global(h2),
.details :global(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #1f2937;
}

/* Gallery Section */
.gallerySection {
  margin-bottom: 32px;
}

.galleryTitle {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.galleryItem {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f3f4f6;
}

.galleryImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.galleryItem:hover .galleryImage {
  transform: scale(1.1);
}

.galleryOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.galleryItem:hover .galleryOverlay {
  opacity: 1;
}

/* Metadata */
.metadata {
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.metadataItem {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadataLabel {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metadataValue {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.lightboxClose {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
  z-index: 10;
}

.lightboxClose:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.lightboxImage {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.lightboxNav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
}

.lightboxNav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightboxPrev {
  left: 20px;
}

.lightboxNext {
  right: 20px;
}

.lightboxCounter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .modalContent {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }

  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .metadata {
    flex-direction: column;
    gap: 16px;
  }

  .lightboxNav {
    width: 40px;
    height: 40px;
  }

  .lightboxPrev {
    left: 10px;
  }

  .lightboxNext {
    right: 10px;
  }
}
</style>

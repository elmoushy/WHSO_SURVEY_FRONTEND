<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchQuickLinks } from '../../services/quickLinksService'
import AuthenticatedImage from '../AuthenticatedImage.vue'
import type { QuickLink } from '../../types/quicklinks.types'

// Storage key for persisting sidebar state
const STORAGE_KEY = 'quicklinks-sidebar-visible'

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// State
const quickLinks = ref<QuickLink[]>([])
const isLoading = ref(true)
const isVisible = ref(true)
const isHovering = ref(false)

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isVisible.value = stored === 'true'
    }
  } catch (e) {
    // localStorage might not be available
  }
}

// Persist state to localStorage
const persistState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, String(isVisible.value))
  } catch (e) {
    // localStorage might not be available
  }
}

// Watch for visibility changes and persist
watch(isVisible, () => {
  persistState()
})

// Toggle sidebar visibility
const toggleSidebar = () => {
  isVisible.value = !isVisible.value
}

// Fetch quick links from API
const loadQuickLinks = async () => {
  try {
    isLoading.value = true
    const response = await fetchQuickLinks({ page_size: 20 })
    quickLinks.value = response.data.results.sort((a, b) => a.position - b.position)
  } catch (error) {
    console.error('Failed to load quick links:', error)
    quickLinks.value = []
  } finally {
    isLoading.value = false
  }
}

// Open link
const openLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Hover state for tooltips
const hoveredId = ref<number | null>(null)

// Load on mount
onMounted(() => {
  loadPersistedState()
  loadQuickLinks()
})

// Expose refresh method for parent components
defineExpose({
  refresh: loadQuickLinks,
  toggle: toggleSidebar,
  show: () => { isVisible.value = true },
  hide: () => { isVisible.value = false },
  isVisible
})
</script>

<template>
  <!-- Main Container -->
  <div 
    v-if="!isLoading && quickLinks.length > 0"
    :class="$style.wrapper"
    :data-theme="currentTheme"
    :dir="isRTL ? 'rtl' : 'ltr'"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- Toggle Button - Always visible -->
    <button
      :class="[
        $style.toggleButton,
        { [$style.sidebarHidden]: !isVisible }
      ]"
      @click="toggleSidebar"
      :title="isVisible 
        ? (isRTL ? 'إخفاء الروابط السريعة' : 'Hide Quick Links') 
        : (isRTL ? 'إظهار الروابط السريعة' : 'Show Quick Links')"
      :aria-expanded="isVisible"
      aria-controls="quicklinks-sidebar"
    >
      <svg 
        :class="[$style.toggleIcon, { [$style.rotated]: !isVisible }]" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline v-if="isRTL" points="15 18 9 12 15 6"/>
        <polyline v-else points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- Sidebar Panel -->
    <aside 
      id="quicklinks-sidebar"
      :class="[
        $style.sidebar,
        { [$style.hidden]: !isVisible }
      ]"
    >
      <!-- Header -->
      <div :class="$style.header">
        <div :class="$style.headerIcon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <span :class="$style.headerTitle">
          {{ isRTL ? 'روابط سريعة' : 'Quick Links' }}
        </span>
      </div>

      <!-- Divider -->
      <div :class="$style.divider"></div>

      <!-- Links Container -->
      <div :class="$style.linksContainer">
        <button
          v-for="link in quickLinks"
          :key="link.id"
          :class="$style.linkButton"
          :title="link.name"
          @click="openLink(link.redirect_url)"
          @mouseenter="hoveredId = link.id"
          @mouseleave="hoveredId = null"
        >
          <!-- Icon/Image -->
          <div :class="$style.iconWrapper">
            <AuthenticatedImage 
              v-if="link.icon_url" 
              :src="link.icon_url" 
              :alt="link.name"
              :class="$style.icon"
            />
            <span v-if="!link.icon_url" :class="$style.iconFallback">
              {{ link.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Tooltip -->
          <Transition name="tooltip">
            <span 
              v-if="hoveredId === link.id" 
              :class="$style.tooltip"
            >
              {{ link.name }}
              <span :class="$style.tooltipArrow"></span>
            </span>
          </Transition>
        </button>
      </div>

      <!-- Footer hint -->
      <div :class="$style.footer">
        <span :class="$style.footerHint">
          {{ quickLinks.length }} {{ isRTL ? 'روابط' : 'links' }}
        </span>
      </div>
    </aside>
  </div>
</template>

<style module>
/* ==================== WRAPPER ==================== */
.wrapper {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  gap: 0;
}

.wrapper[dir="rtl"] {
  right: auto;
  left: 0;
  flex-direction: row;
}

/* ==================== TOGGLE BUTTON ==================== */
.toggleButton {
  position: relative;
  width: 24px;
  height: 64px;
  border: none;
  background: linear-gradient(135deg, #B78A41 0%, #A17D23 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px 0 0 12px;
  box-shadow: -2px 0 12px rgba(183, 138, 65, 0.25);
  z-index: 1001;
}

.wrapper[dir="rtl"] .toggleButton {
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 0 12px rgba(183, 138, 65, 0.25);
}

.toggleButton:hover {
  width: 28px;
  background: linear-gradient(135deg, #C9A050 0%, #B78A41 100%);
  box-shadow: -4px 0 16px rgba(183, 138, 65, 0.35);
}

.wrapper[dir="rtl"] .toggleButton:hover {
  box-shadow: 4px 0 16px rgba(183, 138, 65, 0.35);
}

.toggleButton:active {
  transform: scale(0.95);
}

.toggleButton.sidebarHidden {
  border-radius: 12px 0 0 12px;
}

.wrapper[dir="rtl"] .toggleButton.sidebarHidden {
  border-radius: 0 12px 12px 0;
}

.toggleIcon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggleIcon.rotated {
  transform: rotate(180deg);
}

/* ==================== SIDEBAR PANEL ==================== */
.sidebar {
  width: 64px;
  max-height: 70vh;
  background: #ffffff;
  border-radius: 16px 0 0 16px;
  box-shadow: 
    -4px 0 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 8px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: right center;
  overflow: hidden;
}

.wrapper[dir="rtl"] .sidebar {
  border-radius: 0 16px 16px 0;
  transform-origin: left center;
}

.sidebar.hidden {
  width: 0;
  padding: 12px 0;
  opacity: 0;
  transform: scaleX(0);
}

/* ==================== HEADER ==================== */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.headerIcon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.12) 0%, rgba(161, 125, 35, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #B78A41;
}

.headerTitle {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.2;
}

/* ==================== DIVIDER ==================== */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 4px 0;
}

/* ==================== LINKS CONTAINER ==================== */
.linksContainer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(183, 138, 65, 0.3) transparent;
}

.linksContainer::-webkit-scrollbar {
  width: 3px;
}

.linksContainer::-webkit-scrollbar-track {
  background: transparent;
}

.linksContainer::-webkit-scrollbar-thumb {
  background: rgba(183, 138, 65, 0.3);
  border-radius: 3px;
}

/* ==================== LINK BUTTON ==================== */
.linkButton {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border: none;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.linkButton:hover {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.12) 0%, rgba(161, 125, 35, 0.08) 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(183, 138, 65, 0.15);
}

.linkButton:active {
  transform: scale(0.95);
}

/* ==================== ICON WRAPPER ==================== */
.iconWrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #B78A41 0%, #A17D23 100%);
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(183, 138, 65, 0.25);
}

.icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 2;
  background: white;
  padding: 4px;
  border-radius: 8px;
}

.iconFallback {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* ==================== TOOLTIP ==================== */
.tooltip {
  position: absolute;
  right: calc(100% + 16px);
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1002;
  pointer-events: none;
}

.tooltipArrow {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-left-color: #1f2937;
}

.wrapper[dir="rtl"] .tooltip {
  right: auto;
  left: calc(100% + 16px);
}

.wrapper[dir="rtl"] .tooltipArrow {
  left: auto;
  right: 100%;
  border-left-color: transparent;
  border-right-color: #1f2937;
}

/* ==================== FOOTER ==================== */
.footer {
  padding: 6px 0 2px;
  text-align: center;
}

.footerHint {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}

/* ==================== DARK MODE ==================== */
.wrapper[data-theme="night"] .toggleButton {
  background: linear-gradient(135deg, #B78A41 0%, #A17D23 100%);
  box-shadow: -2px 0 12px rgba(183, 138, 65, 0.35);
}

.wrapper[data-theme="night"][dir="rtl"] .toggleButton {
  box-shadow: 2px 0 12px rgba(183, 138, 65, 0.35);
}

.wrapper[data-theme="night"] .sidebar {
  background: #1e1e1e;
  box-shadow: 
    -4px 0 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.wrapper[data-theme="night"] .headerIcon {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.2) 0%, rgba(161, 125, 35, 0.15) 100%);
  color: #D4A855;
}

.wrapper[data-theme="night"] .headerTitle {
  color: #94a3b8;
}

.wrapper[data-theme="night"] .divider {
  background: linear-gradient(90deg, transparent, #404040, transparent);
}

.wrapper[data-theme="night"] .linkButton {
  background: #2a2a2a;
}

.wrapper[data-theme="night"] .linkButton:hover {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.2) 0%, rgba(161, 125, 35, 0.15) 100%);
  box-shadow: 0 4px 12px rgba(183, 138, 65, 0.2);
}

.wrapper[data-theme="night"] .iconWrapper {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.wrapper[data-theme="night"] .tooltip {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.wrapper[data-theme="night"] .tooltipArrow {
  border-left-color: #374151;
}

.wrapper[data-theme="night"][dir="rtl"] .tooltipArrow {
  border-left-color: transparent;
  border-right-color: #374151;
}

.wrapper[data-theme="night"] .footerHint {
  color: #64748b;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .wrapper {
    display: none;
  }
}

/* ==================== TOOLTIP TRANSITIONS ==================== */
:global(.tooltip-enter-active),
:global(.tooltip-leave-active) {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

:global(.tooltip-enter-from),
:global(.tooltip-leave-to) {
  opacity: 0;
}

.wrapper:not([dir="rtl"]) :global(.tooltip-enter-from),
.wrapper:not([dir="rtl"]) :global(.tooltip-leave-to) {
  transform: translateY(-50%) translateX(8px);
}

.wrapper[dir="rtl"] :global(.tooltip-enter-from),
.wrapper[dir="rtl"] :global(.tooltip-leave-to) {
  transform: translateY(-50%) translateX(-8px);
}

/* ==================== ACCESSIBILITY ==================== */
.toggleButton:focus-visible,
.linkButton:focus-visible {
  outline: 2px solid #B78A41;
  outline-offset: 2px;
}

/* ==================== REDUCED MOTION ==================== */
@media (prefers-reduced-motion: reduce) {
  .toggleButton,
  .toggleIcon,
  .sidebar,
  .linkButton {
    transition: none;
  }
}
</style>

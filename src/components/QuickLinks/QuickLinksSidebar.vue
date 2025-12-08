<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchQuickLinks, toggleQuickLinkPin, recordQuickLinkClick } from '../../services/quickLinksService'
import AuthenticatedImage from '../AuthenticatedImage.vue'
import type { QuickLink } from '../../types/quicklinks.types'

// Storage key for persisting sidebar state
const STORAGE_KEY = 'quicklinks-sidebar-visible'
const MAX_VISIBLE_LINKS = 6

// Store
const store = useAppStore()
const { currentTheme, currentLanguage, quickLinksRefreshTrigger } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// State
const quickLinks = ref<QuickLink[]>([])
const isLoading = ref(true)
const isVisible = ref(true)
const isHovering = ref(false)
const linksContainerRef = ref<HTMLElement | null>(null)
const pinningId = ref<number | null>(null) // Track which link is being pinned

// Scroll state
const canScrollUp = ref(false)
const canScrollDown = ref(false)

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

// Watch for refresh trigger
watch(quickLinksRefreshTrigger, () => {
  loadQuickLinks()
})

// Toggle sidebar visibility
const toggleSidebar = () => {
  isVisible.value = !isVisible.value
}

// Update scroll indicators
const updateScrollIndicators = () => {
  if (!linksContainerRef.value) return
  const container = linksContainerRef.value
  canScrollUp.value = container.scrollTop > 0
  canScrollDown.value = container.scrollTop + container.clientHeight < container.scrollHeight - 1
}

// Scroll functions
const scrollUp = () => {
  if (!linksContainerRef.value) return
  linksContainerRef.value.scrollBy({ top: -54, behavior: 'smooth' }) // 48px height + 6px gap
}

const scrollDown = () => {
  if (!linksContainerRef.value) return
  linksContainerRef.value.scrollBy({ top: 54, behavior: 'smooth' })
}

// Fetch quick links from API
const loadQuickLinks = async () => {
  try {
    isLoading.value = true
    const response = await fetchQuickLinks({ page_size: 20 })
    // Backend now returns ordered by: pinned first, then recent, then position
    quickLinks.value = response.data.results
    // Update scroll indicators after data loads
    setTimeout(updateScrollIndicators, 100)
  } catch (error) {
    console.error('Failed to load quick links:', error)
    quickLinks.value = []
  } finally {
    isLoading.value = false
  }
}

// Open link and record click
const openLink = async (link: QuickLink) => {
  // Record click for "recent" ordering (fire-and-forget)
  recordQuickLinkClick(link.id).catch(console.error)
  
  // Open the link
  window.open(link.redirect_url, '_blank', 'noopener,noreferrer')
}

// Toggle pin status
const togglePin = async (link: QuickLink, event: Event) => {
  event.stopPropagation() // Prevent opening the link
  
  if (pinningId.value === link.id) return // Already processing
  
  try {
    pinningId.value = link.id
    const response = await toggleQuickLinkPin(link.id)
    
    // Update local state
    const idx = quickLinks.value.findIndex(l => l.id === link.id)
    if (idx !== -1) {
      quickLinks.value[idx].is_pinned = response.data.is_pinned
    }
    
    // Reload to get correct order
    await loadQuickLinks()
  } catch (error) {
    console.error('Failed to toggle pin:', error)
  } finally {
    pinningId.value = null
  }
}

// Hover state for tooltips
const hoveredId = ref<number | null>(null)

// Check if we need scroll buttons
const needsScroll = computed(() => quickLinks.value.length > MAX_VISIBLE_LINKS)

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

      <!-- Scroll Up Button -->
      <button
        v-if="needsScroll"
        :class="[$style.scrollButton, $style.scrollUp, { [$style.disabled]: !canScrollUp }]"
        @click="scrollUp"
        :disabled="!canScrollUp"
        :title="isRTL ? 'التمرير لأعلى' : 'Scroll up'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      <!-- Links Container -->
      <div 
        ref="linksContainerRef"
        :class="[$style.linksContainer, { [$style.hasScroll]: needsScroll }]"
        @scroll="updateScrollIndicators"
      >
        <div
          v-for="link in quickLinks"
          :key="link.id"
          :class="[$style.linkWrapper, { [$style.pinned]: link.is_pinned }]"
        >
          <div
            :class="[$style.linkButton, { [$style.isPinnedLink]: link.is_pinned }]"
            role="button"
            :title="link.name"
            @click="openLink(link)"
            @mouseenter="hoveredId = link.id"
            @mouseleave="hoveredId = null"
          >
            <!-- Pin Button (Corner - appears on hover or when pinned) -->
            <Transition name="scale">
              <button
                v-if="link.is_pinned || hoveredId === link.id"
                :class="[$style.pinBtn, { [$style.pinned]: link.is_pinned }]"
                @click.stop="togglePin(link, $event)"
                :title="link.is_pinned 
                  ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') 
                  : (isRTL ? 'تثبيت' : 'Pin')"
              >
                <span v-if="pinningId === link.id" :class="$style.pinSpinner"></span>
                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
                </svg>
              </button>
            </Transition>
            
            <!-- Icon/Image -->
            <div :class="$style.iconWrapper">
              <AuthenticatedImage 
                v-if="link.icon_url" 
                :src="link.icon_url" 
                :alt="link.name"
                :class="$style.icon"
                :version="link.updated_at"
              />
              <span v-if="!link.icon_url" :class="$style.iconFallback">
                {{ link.name.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Tooltip (Name Only) -->
            <Transition name="tooltip">
              <span 
                v-if="hoveredId === link.id" 
                :class="$style.tooltip"
              >
                {{ link.name }}
                <span :class="$style.tooltipArrow"></span>
              </span>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Scroll Down Button -->
      <button
        v-if="needsScroll"
        :class="[$style.scrollButton, $style.scrollDown, { [$style.disabled]: !canScrollDown }]"
        @click="scrollDown"
        :disabled="!canScrollDown"
        :title="isRTL ? 'التمرير لأسفل' : 'Scroll down'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

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
  z-index: 999999999;
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
  width: 74px;
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
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  max-height: calc(6 * 54px); /* 6 items * (48px height + 6px gap) */
}

.linksContainer::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome/Safari */
}

.linksContainer.hasScroll {
  max-height: calc(6 * 54px);
}

/* ==================== SCROLL BUTTONS ==================== */
.scrollButton {
  width: 48px;
  height: 24px;
  margin: 0 auto;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.1) 0%, rgba(161, 125, 35, 0.08) 100%);
  color: #B78A41;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.scrollButton:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.2) 0%, rgba(161, 125, 35, 0.15) 100%);
  transform: scale(1.05);
}

.scrollButton:active:not(.disabled) {
  transform: scale(0.95);
}

.scrollButton.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.scrollUp {
  margin-bottom: 4px;
}

.scrollDown {
  margin-top: 4px;
}

/* ==================== LINK WRAPPER ==================== */
.linkWrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 6px;
  padding-right: 6px;
}

/* ==================== LINK BUTTON ==================== */
.linkButton {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto;
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
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(183, 138, 65, 0.2);
}

.linkButton:active {
  transform: scale(0.98);
}

.linkButton.isPinnedLink {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.08) 0%, rgba(161, 125, 35, 0.04) 100%);
  box-shadow: 0 0 0 2px rgba(183, 138, 65, 0.15);
}

/* ==================== PIN BUTTON ==================== */
.pinBtn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid white;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  padding: 0;
}

.pinBtn:hover {
  background: #B78A41;
  color: white;
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(183, 138, 65, 0.4);
}

.pinBtn.pinned {
  background: linear-gradient(135deg, #B78A41 0%, #A17D23 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(183, 138, 65, 0.4);
}

.pinBtn.pinned:hover {
  background: #ef4444;
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.4);
}

.pinSpinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(100, 116, 139, 0.3);
  border-top-color: #64748b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.pinBtn.pinned .pinSpinner {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1002;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
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
  box-shadow: 0 4px 16px rgba(183, 138, 65, 0.25);
}

.wrapper[data-theme="night"] .linkButton.isPinnedLink {
  background: linear-gradient(135deg, rgba(183, 138, 65, 0.15) 0%, rgba(161, 125, 35, 0.1) 100%);
  box-shadow: 0 0 0 2px rgba(212, 168, 85, 0.2);
}

.wrapper[data-theme="night"] .pinBtn {
  background: #3f3f46;
  color: #a1a1aa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.wrapper[data-theme="night"] .pinBtn:hover {
  background: #D4A855;
  color: white;
}

.wrapper[data-theme="night"] .pinBtn.pinned {
  background: linear-gradient(135deg, #D4A855 0%, #B78A41 100%);
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

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .wrapper {
    display: none;
  }
}

/* ==================== TRANSITIONS ==================== */
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

:global(.fade-enter-active),
:global(.fade-leave-active) {
  transition: opacity 0.15s ease;
}

:global(.fade-enter-from),
:global(.fade-leave-to) {
  opacity: 0;
}

:global(.scale-enter-active),
:global(.scale-leave-active) {
  transition: all 0.15s ease;
}

:global(.scale-enter-from),
:global(.scale-leave-to) {
  opacity: 0;
  transform: scale(0.5);
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

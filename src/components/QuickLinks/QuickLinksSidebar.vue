<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'

// Props
interface Props {
  collapsed?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: false
})

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// Quick links data - يمكنك تعديل هذه الروابط حسب احتياجاتك
const quickLinks = ref([
  {
    id: 1,
    name: 'Outlook',
    icon: '/icons/outlook.svg',
    url: 'https://outlook.office.com',
    color: '#0078D4'
  },
  {
    id: 2,
    name: 'Teams',
    icon: '/icons/teams.svg',
    url: 'https://teams.microsoft.com',
    color: '#6264A7'
  },
  {
    id: 3,
    name: 'SharePoint',
    icon: '/icons/sharepoint.svg',
    url: 'https://sharepoint.com',
    color: '#038387'
  },
  {
    id: 4,
    name: 'Word',
    icon: '/icons/word.svg',
    url: 'https://www.office.com/launch/word',
    color: '#2B579A'
  },
  {
    id: 5,
    name: 'Excel',
    icon: '/icons/excel.svg',
    url: 'https://www.office.com/launch/excel',
    color: '#217346'
  },
  {
    id: 6,
    name: 'PowerPoint',
    icon: '/icons/powerpoint.svg',
    url: 'https://www.office.com/launch/powerpoint',
    color: '#D24726'
  }
])

// Open link
const openLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Hover state
const hoveredId = ref<number | null>(null)
</script>

<template>
  <aside 
    :class="[$style.sidebar, { [$style.collapsed]: collapsed }]" 
    :data-theme="currentTheme"
  >
    <div :class="$style.linksContainer">
      <button
        v-for="link in quickLinks"
        :key="link.id"
        :class="$style.linkButton"
        :title="link.name"
        @click="openLink(link.url)"
        @mouseenter="hoveredId = link.id"
        @mouseleave="hoveredId = null"
      >
        <!-- Icon/Image -->
        <div 
          :class="$style.iconWrapper"
          :style="{ '--link-color': link.color }"
        >
          <!-- إذا كانت الصورة موجودة -->
          <img 
            v-if="link.icon" 
            :src="link.icon" 
            :alt="link.name"
            :class="$style.icon"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <!-- Fallback - أول حرف من الاسم -->
          <span :class="$style.iconFallback">
            {{ link.name.charAt(0) }}
          </span>
        </div>

        <!-- Tooltip -->
        <Transition name="tooltip">
          <span 
            v-if="hoveredId === link.id && !collapsed" 
            :class="$style.tooltip"
          >
            {{ link.name }}
          </span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<style module>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 56px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.sidebar[dir="rtl"] {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid #e5e7eb;
}

.sidebar.collapsed {
  transform: translateX(-100%);
}

.sidebar[dir="rtl"].collapsed {
  transform: translateX(100%);
}

/* Links Container */
.linksContainer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

/* Link Button */
.linkButton {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.linkButton:hover {
  background: #f3f4f6;
  transform: scale(1.05);
}

.linkButton:active {
  transform: scale(0.95);
}

/* Icon Wrapper */
.iconWrapper {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--link-color, #6b7280);
  overflow: hidden;
  position: relative;
}

.icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 2;
}

.iconFallback {
  position: absolute;
  font-size: 14px;
  font-weight: 600;
  color: white;
  z-index: 1;
}

.icon + .iconFallback {
  display: none;
}

/* Tooltip */
.tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  background: #1f2937;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

.tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: #1f2937;
}

.sidebar[dir="rtl"] .tooltip {
  left: auto;
  right: calc(100% + 12px);
}

.sidebar[dir="rtl"] .tooltip::before {
  right: auto;
  left: 100%;
  border-right-color: transparent;
  border-left-color: #1f2937;
}

/* ==================== DARK MODE ==================== */
.sidebar[data-theme="night"] {
  background: #1e1e1e;
  border-right-color: #404040;
}

.sidebar[data-theme="night"][dir="rtl"] {
  border-left-color: #404040;
}

.sidebar[data-theme="night"] .linkButton:hover {
  background: #2d2d2d;
}

.sidebar[data-theme="night"] .tooltip {
  background: #374151;
}

.sidebar[data-theme="night"] .tooltip::before {
  border-right-color: #374151;
}

.sidebar[data-theme="night"][dir="rtl"] .tooltip::before {
  border-right-color: transparent;
  border-left-color: #374151;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .sidebar {
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
  transform: translateY(-50%) translateX(-8px);
}
</style>

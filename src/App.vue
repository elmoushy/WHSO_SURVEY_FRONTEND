<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation/Navigation.vue'
import Sidebar from './components/Sidebar/Sidebar.vue'
import QuickLinksSidebar from './components/QuickLinks/QuickLinksSidebar.vue'
import { useSimpleAuth } from './composables/useSimpleAuth'
import { useAppStore } from './stores/useAppStore'
import { websocketService } from './services/websocketService'

const route = useRoute()
const showNavigation = computed(
  () => route.meta?.requiresAuth === true && route.meta?.hideNavigation !== true
)

const store = useAppStore()

// Map store theme ('light' | 'night') to Sidebar prop ('day' | 'night')
const sidebarTheme = computed<'day' | 'night'>(() =>
  store.currentTheme === 'night' ? 'night' : 'day'
)
const toggleTheme = () => store.toggleTheme()

const { isAuthenticated } = useSimpleAuth()

// Track if WebSocket setup is complete
const wsSetupComplete = ref(false)
const hasAttemptedConnection = ref(false)

// Setup global notification WebSocket connection
const setupNotificationWebSocket = () => {
  if (wsSetupComplete.value) return
  
  // Listen for chat unread updates
  websocketService.on('chat.unread.update', (_data: any) => {
    // Chat unread update received
  })
  
  // Listen for connection events
  websocketService.on('notification.connected', () => {
    // Notification WebSocket connected
  })
  
  websocketService.on('notification.disconnected', () => {
    // Notification WebSocket disconnected
  })
  
  wsSetupComplete.value = true
}

// Attempt WebSocket connection - now checks for actual token availability
const attemptWebSocketConnection = async (force = false) => {
  if (hasAttemptedConnection.value && !force) {
    return
  }
  
  // Import the auth initialization and wait for it
  const { initializeAuth, getAccessToken } = await import('./services/jwtAuthService')
  
  // Ensure auth is initialized first
  await initializeAuth()
  
  // Now check if token is available
  const token = getAccessToken()
  if (!token) {
    hasAttemptedConnection.value = false // Allow retry
    return
  }
  
  hasAttemptedConnection.value = true
  
  try {
    await websocketService.connectToNotifications()
  } catch (_error) {
    hasAttemptedConnection.value = false // Allow retry
  }
}

// Connect/disconnect based on authentication state
watch(isAuthenticated, async (authenticated, wasAuthenticated) => {
  if (authenticated) {
    // User is authenticated - connect WebSocket
    if (wasAuthenticated === undefined) {
      // Initial load with existing token - connect immediately
      await attemptWebSocketConnection()
    } else if (!wasAuthenticated) {
      // Transition from unauthenticated to authenticated (fresh login)
      // Add small delay to ensure token is saved
      setTimeout(async () => {
        await attemptWebSocketConnection(true) // Force reconnect
      }, 200)
    }
  } else if (wasAuthenticated) {
    // Only disconnect when we transition from authenticated to unauthenticated
    websocketService.disconnectFromNotifications()
    hasAttemptedConnection.value = false
  }
}, { immediate: true }) // Run immediately on component mount

// Setup on mount
onMounted(async () => {
  setupNotificationWebSocket()
  
  // Check authentication and connect if needed
  // The watch will handle this with immediate: true, but we add a fallback
  if (isAuthenticated.value && !hasAttemptedConnection.value) {
    setTimeout(async () => {
      await attemptWebSocketConnection()
    }, 500) // Slightly longer delay for safety
  }
})

// Cleanup on unmount
onUnmounted(() => {
  websocketService.disconnectFromNotifications()
})

const { user, logout } = useSimpleAuth()
const userRole = computed(() => user.value?.role ?? null)

const sidebarCollapsed = ref(false)
const isRTL = computed(() => document?.dir === 'rtl')
const autoCollapsedForMobile = ref(false)

/* ===== Responsive width logic ===== */
const vw = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1440)
const onResize = () => { vw.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

const handleLogout = async () => {
  await logout()
}

/** Expanded width ~ clamp(260px, 22vw, 360px) */
const expandedWidth = computed(() => {
  const min = 160, max = 270, preferred = vw.value * 0.22
  return Math.min(max, Math.max(min, Math.round(preferred)))
})

/** Collapsed width ~ clamp(72px, 6.5vw, 104px) */
const collapsedWidth = computed(() => {
  const min = 72, max = 104, preferred = vw.value * 0.065
  return Math.min(max, Math.max(min, Math.round(preferred)))
})

/** The number you were hard-coding before */
const sidebarWidth = computed(() =>
  sidebarCollapsed.value ? collapsedWidth.value : expandedWidth.value
)

/** Pass CSS vars to Sidebar so its internal CSS (var(--sb-width)) stays in sync */
const sidebarStyleVars = computed(() => {
  const base: Record<string, string> = {}
  if (vw.value <= 1024) {
    base['--sb-width'] = '60vw'
    base['--sb-width-collapsed'] = '0px'
    base['--sb-mobile-width'] = '60vw'
  } else {
    base['--sb-width'] = `${expandedWidth.value}px`
    base['--sb-width-collapsed'] = `${collapsedWidth.value}px`
    base['--sb-mobile-width'] = `${expandedWidth.value}px`
  }
  base['--sb-mobile-slide'] = isRTL.value ? '100%' : '-100%'
  return base
})

/** Offset the content. On tablets/phones we let the sidebar overlay (no margin). */
const contentOffsetStyle = computed(() => {
  if (!showNavigation.value) return {}
  if (vw.value <= 1024) return {} // overlay behavior on small screens
  
  const mainSidebarPx = `${sidebarWidth.value}px`
  
  // QuickLinks sidebar now floats over content (show/hide toggle)
  // So we only account for the main sidebar margin
  if (isRTL.value) {
    return { marginRight: mainSidebarPx }
  }
  return { marginLeft: mainSidebarPx }
})

const showSidebarToggle = computed(
  () => showNavigation.value && vw.value <= 1024,
)

const toggleSidebar = () => {
  const next = !sidebarCollapsed.value
  sidebarCollapsed.value = next
  if (vw.value <= 1024) {
    autoCollapsedForMobile.value = next
  }
}

const sidebarToggleIcon = computed(() => {
  const collapsed = sidebarCollapsed.value
  if (isRTL.value) {
    return collapsed ? 'fas fa-arrow-left' : 'fas fa-arrow-right'
  }
  return collapsed ? 'fas fa-arrow-right' : 'fas fa-arrow-left'
})

watch(
  vw,
  (width) => {
    const isMobile = width <= 1024
    if (isMobile && !autoCollapsedForMobile.value) {
      sidebarCollapsed.value = true
      autoCollapsedForMobile.value = true
    } else if (!isMobile && autoCollapsedForMobile.value) {
      sidebarCollapsed.value = false
      autoCollapsedForMobile.value = false
    }
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    if (vw.value <= 1024) {
      sidebarCollapsed.value = true
      autoCollapsedForMobile.value = true
    }
  },
)
</script>

<template>
  <div :data-theme="store.currentTheme">
    <!-- Quick Links Sidebar (Left) -->
    <QuickLinksSidebar v-if="showNavigation" />

    <Sidebar
      v-if="showNavigation"
      v-model="sidebarCollapsed"
      :theme="sidebarTheme"
      :user-role="userRole"
      :style="sidebarStyleVars"
      :mobile-overlay="showSidebarToggle"
      @toggleTheme="toggleTheme"
      @logout="handleLogout"
    />

    <button
      v-if="showSidebarToggle"
      class="mobile-sidebar-toggle"
      :class="{ 'mobile-sidebar-toggle--open': !sidebarCollapsed }"
      type="button"
      :aria-expanded="!sidebarCollapsed"
      :title="sidebarCollapsed ? 'فتح القائمة' : 'إغلاق القائمة'"
      @click="toggleSidebar"
    >
      <i :class="sidebarToggleIcon"></i>
    </button>

    <div
      v-if="showSidebarToggle && !sidebarCollapsed"
      class="sidebar-mobile-backdrop"
      @click="toggleSidebar"
    ></div>

    <main :style="contentOffsetStyle" class="app-main">
      <Navigation v-if="showNavigation" />
      <RouterView />
    </main>
  </div>
</template>

<style>
.app-main { transition: margin-left .25s ease, margin-right .25s ease; }

/* When the sidebar becomes an overlay, keep content full width */
@media (max-width: 1024px) {
  .app-main { margin-left: 0 !important; margin-right: 0 !important; }
}

.mobile-sidebar-toggle{
  position: fixed;
  top: 18px;
  right: 18px;
  inline-size: 46px;
  block-size: 46px;
  border-radius: 999px;
  border: 1px solid rgba(183,138,65,.35);
  background: rgba(255,255,255,.95);
  color: #A17D23;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(15,23,42,.16);
  z-index: 1300;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}
[data-theme="night"] .mobile-sidebar-toggle{
  background: rgba(24,26,31,.92);
  color: #F8FAFC;
  border-color: rgba(248,250,252,.18);
  box-shadow: 0 12px 28px rgba(8,8,12,.45);
}
.mobile-sidebar-toggle:hover{
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(15,23,42,.18);
}
[data-theme="night"] .mobile-sidebar-toggle:hover{
  box-shadow: 0 16px 36px rgba(8,8,12,.55);
}
.mobile-sidebar-toggle--open{
  color: #fff;
  background: linear-gradient(135deg,#B78A41,#A17D23);
  border-color: transparent;
  box-shadow: 0 16px 36px rgba(183,138,65,.28);
}
@media (max-width: 1024px){
  .mobile-sidebar-toggle{
    display: inline-flex;
    left: auto;
  }
}

.sidebar-mobile-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.25);
  z-index: 1100;
}
</style>

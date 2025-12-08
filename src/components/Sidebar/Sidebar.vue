<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChat } from '../../composables/useChat'

const props = defineProps<{
  theme?: 'day' | 'night'
  userRole?: string | null
  /** v-model */
  modelValue?: boolean
  mobileOverlay?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'logout'): void
  (e: 'toggleTheme'): void
}>()

const route = useRoute()
const router = useRouter()

/** collapse state mirrors v-model */
const internalCollapsed = ref<boolean>(props.modelValue ?? false)
watch(() => props.modelValue, v => { if (typeof v === 'boolean') internalCollapsed.value = v }, { immediate: true })
watch(internalCollapsed, v => emit('update:modelValue', v))

type NavItem = {
  name: string
  label: string
  icon: string
  path?: string
  requiresRole?: 'admin'
  badge?: number | string
  getBadge?: () => number | string | undefined
}

type NavGroup = { id: string; items: NavItem[] }

// Get unread count from chat composable
const { totalUnreadCount } = useChat()

// Watch for changes in totalUnreadCount
watch(totalUnreadCount, () => {
  // totalUnreadCount changed - reactivity will update the UI
}, { immediate: true })

const navGroups = computed<NavGroup[]>(() => {
  const primary: NavItem[] = [
    { name: 'surveys-overview',path:"/surveys", icon: 'fas fa-list-check', label: 'الاستطلاعات' },
    { name: 'news', path: '/news', icon: 'fas fa-newspaper', label: 'الأخبار' },
    // DISABLED FOR NOW - Will enable in future release
    // { name: 'organization-chart', path: '/organization-chart', icon: 'fas fa-sitemap', label: 'هيكل الشركة' },
    // { name: 'chat', path: '/chat', icon: 'fas fa-comments', label: 'المحادثات', getBadge: () => totalUnreadCount.value || undefined },
    { name: 'manage-surveys', path: '/control/surveys', icon: 'fas fa-table-cells-large', label: 'إدارة الاستطلاعات' },
    { name: 'manage-news', path: '/control/news', icon: 'fas fa-newspaper', label: 'إدارة الأخبار', requiresRole: 'admin' },
    { name: 'manage-quicklinks', path: '/control/quicklinks', icon: 'fas fa-link', label: 'إدارة الروابط السريعة', requiresRole: 'admin' },
    { name: 'manage-users', path: '/control/users', icon: 'fas fa-user-group', label: 'إدارة المستخدمين', requiresRole: 'admin' },
  ]

  const support: NavItem[] = [
    // Hidden items:
    // { name: 'settings', icon: 'fas fa-gear', label: 'الاعدادات' },
    // { name: 'support', icon: 'far fa-circle-question', label: 'الدعم والمساعدة' },
  ]

  const allowedRoles = new Set(['admin', 'super_admin'])
  const filteredPrimary = primary.filter(item => {
    if (!item.requiresRole) return true
    return props.userRole !== null && props.userRole !== undefined && allowedRoles.has(props.userRole)
  })

  const groups: NavGroup[] = []
  if (filteredPrimary.length) groups.push({ id: 'primary', items: filteredPrimary })
  if (support.length) groups.push({ id: 'support', items: support })
  return groups
})
const isActive = (path?: string) => (path ? route.path === path : false)

/** keyboard shortcut: Cmd/Ctrl + B */
const onKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    internalCollapsed.value = !internalCollapsed.value
  }
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

/** actions */
const handleNav = (item: NavItem) => {
  if (!item.path || item.path === '#') return
  // Handle external URLs
  if (item.path.startsWith('http://') || item.path.startsWith('https://')) {
    window.location.href = item.path
    return
  }
  router.push(item.path)
}
const emitLogout = () => emit('logout')
const toggleTheme = () => emit('toggleTheme')

/** UI states for control buttons */
const isNight = computed(() => props.theme === 'night')
const isCollapsed = computed(() => internalCollapsed.value)
const isMobileOverlay = computed(() => props.mobileOverlay === true)

/** Dynamic logo: swap when collapsed */
const logoSrc = computed(() => isCollapsed.value ? '/logomobile.png' : '/Logo.png')
</script>

<template>
  <aside
    :class="[
      $style.sidebar,
      internalCollapsed ? $style.collapsed : '',
      theme === 'night' ? $style.night : '',
      isMobileOverlay ? $style.mobile : '',
      isMobileOverlay && !internalCollapsed ? $style.mobileOpen : '',
    ]"
    role="navigation"
    aria-label="Sidebar"
  >
    <div :class="$style.header">
      <div :class="$style.emblemWrap">
        <img :src="logoSrc" :class="$style.emblem" alt="شعار المجلس الأعلى للأمن الوطني" />
      </div>
    </div>

    <nav :class="$style.navArea">
      <template v-for="group in navGroups" :key="group.id">
        <section :class="$style.menuCard">
          <button
            v-for="item in group.items"
            :key="item.name"
            type="button"
            :class="[$style.item, isActive(item.path) ? $style.active : '']"
            :title="item.label"
            @click="handleNav(item)"
          >
            <span :class="$style.itemIcon">
              <i :class="item.icon"></i>
            </span>
            <span :class="$style.itemText">{{ item.label }}</span>
            <span v-if="item.getBadge ? item.getBadge() : item.badge" :class="$style.badge">
              {{ item.getBadge ? item.getBadge() : item.badge }}
            </span>
          </button>
        </section>
      </template>
    </nav>

    <div :class="$style.controlsArea">
      <section :class="$style.controlsGroup">
        <button
          type="button"
          :class="[$style.controlItem, isCollapsed ? $style.controlActive : '']"
          @click="internalCollapsed = !internalCollapsed"
        >
          <span :class="$style.controlIcon">
            <i :class="isCollapsed ? 'fas fa-expand' : 'fas fa-compress'"></i>
          </span>
          <span :class="$style.controlLabel">{{ isCollapsed ? 'موسّع' : 'مصغّر' }}</span>
        </button>

        <button
          type="button"
          :class="[$style.controlItem, isNight ? $style.controlActive : '']"
          @click="toggleTheme"
        >
          <span :class="$style.controlIcon"><i class="far fa-moon"></i></span>
          <span :class="$style.controlLabel">الوضع الليلي</span>
        </button>
      </section>

      <section :class="$style.logoutGroup">
        <button type="button" :class="$style.logoutItem" @click="emitLogout">
          <span :class="$style.logoutIcon"><i class="fas fa-arrow-left-long"></i></span>
          <span :class="$style.logoutLabel">تسجيل الخروج</span>
        </button>
      </section>
    </div>
  </aside>
</template>

<style module>
:root {
  --sb-width: 320px;
  --sb-width-collapsed: 94px;
}

.sidebar{
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: min(var(--sb-width), 100vw);
  max-inline-size: 100vw;
  block-size: 100vh;
  background:#ffffff;
  /* border-inline-end:1px solid rgba(15,23,42,.08); */
  /* box-shadow:0 12px 34px rgba(15,23,42,.08); */
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:10px 25px;
  transition:inline-size .25s ease, background .25s ease, border-color .25s ease, transform .25s ease;
  direction: rtl;
  z-index: 999;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  --active-bg: #B78A41;
  --active-hover-bg: linear-gradient(135deg, #B78A41, #A17D23);
  --active-color: #ffffff;
  --active-icon-color: #ffffff;
  --active-shadow: 0 8px 18px rgba(183,138,65,.28);
  --active-disc-bg: #A17D23;
  --active-disc-color: #ffffff;
  --active-disc-shadow: 0 8px 18px rgba(161,125,35,.35);
}

.night{
  background:#181a1f;
  --active-bg: linear-gradient(135deg, rgba(161,125,35,.28), rgba(183,138,65,.20));
  --active-hover-bg: linear-gradient(135deg, rgba(161,125,35,.34), rgba(183,138,65,.26));
  --active-color: #F8FAFC;
  --active-icon-color: #ffffff;
  --active-shadow: 0 10px 22px rgba(183,138,65,.32);
  --active-disc-bg: linear-gradient(135deg,#B78A41,#A17D23);
  --active-disc-color: #ffffff;
  --active-disc-shadow: 0 10px 22px rgba(183,138,65,.40);
}
.collapsed{ inline-size: min(var(--sb-width-collapsed), 100vw); }

.mobile{
  inline-size: var(--sb-mobile-width, 60vw);
  max-inline-size: var(--sb-mobile-width, 60vw);
  transform: translateX(var(--sb-mobile-slide, -110%));
  opacity: 0;
  pointer-events: none;
  transition: transform .25s ease, opacity .2s ease;
  z-index: 1150;
}
.mobileOpen{
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

/* =========================================================
   ACTIVE LINK — DAY THEME
   ========================================================= */

/* Active row */
.item.active,
.item[aria-current="page"],
.item.router-link-active {
  background: var(--active-bg);
  color: var(--active-color);
}

/* Icon inside an active row */
.item.active .itemIcon,
.item[aria-current="page"] .itemIcon,
.item.router-link-active .itemIcon {
  color: var(--active-icon-color);
}

/* Hover/focus on an active row (keep it “active”, just elevate) */
.item.active:hover,
.item.active:focus-visible,
.item[aria-current="page"]:hover,
.item[aria-current="page"]:focus-visible,
.item.router-link-active:hover,
.item.router-link-active:focus-visible {
  background: var(--active-hover-bg);
  color: var(--active-color);
  transform: translateY(-1px);
  box-shadow: var(--active-shadow);
}

/* =========================================================
   ACTIVE LINK — NIGHT THEME
   ========================================================= */

/* =========================================================
   COLLAPSED RAIL — keep the disc golden & lift on hover
   ========================================================= */

/* In collapsed mode we color only the disc (you already do this) */
.collapsed .item.active { background: transparent; }

/* Give the active disc a tiny lift on hover/focus */
.collapsed .item.active:hover .itemIcon,
.collapsed .item.active:focus-visible .itemIcon {
  transform: translateY(-1px);
  background: var(--active-disc-bg);
  color: var(--active-disc-color);
  box-shadow: var(--active-disc-shadow);
}

/* =========================================================
   ACCESSIBILITY NUDGE
   ========================================================= */
.item:focus-visible {
  outline: 2px solid rgba(183,138,65,.6);
  outline-offset: 2px;
  border-radius: 16px;
}

.emblemWrap{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 16px;
  transition: background .25s ease, box-shadow .25s ease;
}

/* Night mode logo enhancement - white background with low opacity */
.night .emblemWrap{
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.night .emblemWrap:hover{
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 6px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Collapsed night mode */
.night.collapsed .emblemWrap{
  padding: 10px;
  border-radius: 16px;
}

.emblem{
  padding:0 5px !important;
  object-fit:contain !important;
  max-width: 100% !important;
  height: auto !important;
  transition: transform .25s ease, inline-size .25s ease, block-size .25s ease !important;
}
.headerText{
  display:flex;
  flex-direction:column;
  gap:4px;
  color:#0f172a;
  font-weight:700;
  font-size:14px;
  line-height:1.35;
}
.headerTitle{ letter-spacing:-.015em; }
.headerSubtitle{
  font-size:11px;
  letter-spacing:.24em;
  font-weight:600;
  color:#64748b;
}
.night .headerText{ color:#f8fafc; }
.night .headerSubtitle{ color:rgba(248,250,252,.65); }



.navArea{
    padding-top: 20px;
  flex:1;
  display:flex;
  flex-direction:column;
  gap:20px;
  overflow:visible;
}
.menuCard{
  background:#F5F7FA;
  border-radius:28px;
  padding:5px 10px;
  display:flex;
  flex-direction:column;
  gap:5px;
}
.night .menuCard{
  background:rgba(248,250,252,.04);
  /* box-shadow: inset 0 0 0 1px rgba(248,250,252,.08); */
}
.sectionDivider{
  height:1px;
  background:rgba(148,163,184,.32);
  margin-inline:8px;
}

.item{
  border:none;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:10px;
  inline-size:100%;
  padding:5px 12px;
  border-radius:20px;
  font-weight:600;
  font-size:16px;
  color:#0f172a;
  cursor:pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}
.item:hover{
  background:rgba(255,255,255,.95);
  transform:translateY(-1px);
  color: #B78A41;
  /* box-shadow:0 6px 18px rgba(15,23,42,.12); */
}
.night .item{
  color:#e2e8f0;
}
.night .item:hover{
  background:rgba(255,255,255,.08);
  box-shadow:none;
}
.itemIcon{
  /* inline-size:40px; */
  block-size:40px;
  border-radius:14px;
  /* background:#ffffff; */
  display:grid;
  place-items:center;
  color:#b78a41;
  /* box-shadow:0/ 12px 24px rgba(183,138,65,.25); */
  flex-shrink:0;
}
.night .itemIcon{
  color:#A17D23;
}

.itemText{
  flex:1;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  text-align:right;
}
.badge{
  font-size:12px;
  padding:2px 10px;
  border-radius:999px;
  font-weight:700;
  background:linear-gradient(135deg,#A17D23,#B78A41);
  color:#f8fafc;
  box-shadow:0 6px 16px rgba(161,125,35,.35);
}
.active{
  background: var(--active-bg);
  color: var(--active-color);
}
.active .itemIcon{
  color: var(--active-icon-color);
}

.controlsArea{
  margin-top:auto;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.controlsGroup{
  display:flex;
  flex-direction:column;
  gap:12px;
}
.controlItem{
  border:none;
  background:#f4f6fb;
  border-radius:999px;
  padding:5px 20px;
  display:flex;
    font-weight:600;

  align-items:center;
  justify-content:space-between;
  gap:6px;
    font-size:16px;
  color:#0f172a;
  cursor:pointer;
  transition: background .2s ease, transform .2s ease,  color .2s ease;
}
.controlItem:hover{
  background:#ffffff;
  transform:translateY(-1px);
  /* box-shadow:0 12px 24px rgba(15,23,42,.12); */
}
.controlItem:hover .controlIcon{
  color:#0f172a;
}
.controlActive:hover{
  background: linear-gradient(135deg, rgba(183,138,65,.2), rgba(161,125,35,.15));
}
.controlActive:hover .controlIcon{
  color:#A17D23;
}
.controlIcon{
  /* inline-size:44px; */
  block-size:40px;
  border-radius:50%;
  /* background:#ffffff; */
  display:grid;
  place-items:center;
  color:#0f172a;
  /* box-shadow:0 12px 24px rgba(148,163,184,.18); */
  flex-shrink:0;
}
.controlLabel{
  flex:1;
  text-align:right;
}
.controlActive{
  background:#ebeef6;
  color:#b78a41;
  /* box-shadow:0 16px 28px rgba(183,138,65,.22); */
}
.controlActive .controlIcon{
  /* background:linear-gradient(135deg,#B78A41,#A17D23); */
  color:#b78a41;
  /* box-shadow:0 18px 32px rgba(183,138,65,.28); */
}
.night .controlItem{
  background:rgba(248,250,252,.08);
  color:#e2e8f0;
}
.night .controlItem:hover{
  background:rgba(248,250,252,.15);
  /* box-shadow:0 18px 32px rgba(8,8,12,.45); */
}
.night .controlIcon{
  /* background:rgba(24,26,31,.92); */
  color:#A17D23;
  /* box-shadow:0 20px 36px rgba(8,8,12,.55); */
}
.night .controlActive{
  background:rgba(183,138,65,.28);
  color:#D4A855;
}
.night .controlActive .controlIcon{
  /* background:linear-gradient(135deg,#B78A41,#A17D23); */
  color:#D4A855;
}

.logoutGroup{
  display:flex;
      font-size:16px;

}
.logoutItem{
  width:100%;
    font-weight:600;

  border:none;
  background:#efe5d8;
  border-radius:999px;
  padding:5px 22px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:6px;
  color:#704d16;
  cursor:pointer;
  transition: transform .2s ease,
}
.logoutItem:hover{
  transform:translateY(-1px);
  /* box-shadow:0 18px 32px rgba(183,138,65,.24); */
}
.logoutIcon{
  /* inline-size:48px;  */
  block-size:48px;
  border-radius:50%;
  display:grid;
  place-items:center;
  color:#b78a41;
  flex-shrink:0;
}
.logoutLabel{
  flex:1;
  text-align:right;
}
.night .logoutItem{
  background:rgba(183,138,65,.18);
  color:#f8fafc;
}
.night .logoutIcon{
  /* background:rgba(30,32,37,.94); */
  /* border-color:rgba(46,38,30,.92); */
  color:white;
  /* box-shadow:0 22px 38px rgba(8,8,12,.55); */
}


.collapsed .itemText,
.collapsed .badge,
.collapsed .controlLabel,
.collapsed .logoutLabel{
  display:none;
}
/* ================================
   COLLAPSED RAIL — centered circles
   ================================ */

/* Narrower padding so the rail feels slim */

/* The rail "pill" */
.collapsed .menuCard{
  background:#F5F7FA;                /* keep the soft card bg */
  border-radius: 28px;
  padding: 10px 10px;
  align-items: center;
  gap: 10px;
}
.night.collapsed .menuCard{
  background: rgba(248,250,252,.06);
}



/* Items become stacked circles with only icon visible */
.collapsed .item{
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 0;
  gap: 2px;
  background: transparent;
}
.collapsed .item:hover{ background: none; transform: none; }

/* Icon = circle; default outline feel */
.collapsed .itemIcon{
  inline-size: 50px;
  block-size: 50px;
  border-radius: 999px;
  display: grid; place-items: center;
  background: #EFF4FA;               /* subtle disc */
  color: #0f172a;
  box-shadow: none;
}
.night.collapsed .itemIcon{
  background: rgba(255,255,255,.06);
  color: #e2e8f0;
}

/* Hover glow on the disc */
.collapsed .item:hover .itemIcon{
  background: #ffffff;
}
.night.collapsed .item:hover .itemIcon{
  background: rgba(255,255,255,.12);
}

/* ACTIVE = filled gold circle with white icon */
.collapsed .active .itemIcon{
  background: var(--active-disc-bg);
  color: var(--active-disc-color);
  box-shadow: var(--active-disc-shadow);
}

/* Hide texts/badges in rail (you already had this but keep for safety) */
.collapsed .itemText,
.collapsed .badge { display: none; }

/* ================================
   Controls at bottom = round discs
   ================================ */

/* .collapsed .controlsArea{ gap: 16px; } */

.collapsed .controlItem{
  justify-content: center;
   inline-size: 50px;
  block-size: 50px;
  border-radius: 999px;
  background: #EFF4FA;
  transition: background .2s ease;
}

.night.collapsed .controlItem{
    
  background: rgba(248,250,252,.06);
}

.collapsed .controlItem:hover{
  background: #ffffff;
}
.collapsed .controlItem:hover .controlIcon{
  color: #0f172a;
}
.collapsed .controlActive:hover{
  background: linear-gradient(135deg, #C9A050, #B78A41);
}
.collapsed .controlActive:hover .controlIcon{
  color: #ffffff;
}
.night.collapsed .controlItem:hover{
  background: rgba(255,255,255,.12);
}
.night.collapsed .controlItem:hover .controlIcon{
  color: #e2e8f0;
}
.night.collapsed .controlActive:hover{
  background: linear-gradient(135deg, #C9A050, #B78A41);
}
.night.collapsed .controlActive:hover .controlIcon{
  color: #ffffff;
}

/* The single icon inside */
.collapsed .controlIcon{
  inline-size: 36px;
  block-size: 36px;
  
  border-radius: 999px; /* purely for centering symmetry */
  color: #0f172a;
}
.night.collapsed .controlIcon{ color: #e2e8f0; }

/* Active control = filled gold disc */
.collapsed .controlActive{
  background: #A17D23;
}
.collapsed .controlActive .controlIcon{
  color: #ffffff;
}
.night.collapsed .controlActive{
  background: linear-gradient(135deg,#B78A41,#A17D23);
}

/* Logout button = big pale disc with gold inner circle */
.collapsed .logoutItem{
  inline-size: 50px;
  block-size: 50px;
  border-radius: 999px;
  padding: 0;
  background: #EFEAE4;
  justify-content: center;
}
.night.collapsed .logoutItem{
  background: rgba(183,138,65,.18);
}
.collapsed .logoutIcon{
  inline-size: 50px;
  block-size: 50px;
  border-radius: 999px;
  display: grid; place-items: center;
  background: #B78A41;              /* gold inner circle */
  color: #fff;
}

/* ================================
   Brand area (optional polish)
   ================================ */
/* ---------- Collapsed rail spacing controls ---------- */
:root{
  --rail-pad: 8px;          /* top/bottom padding inside the rail */
  --rail-gap: 14px;         /* vertical gap between discs */
  --rail-disc: 50px;        /* disc size (icons) */
  --rail-ctrl: 50px;        /* control & logout disc size */
}

@media (max-width: 1024px) {
  .sidebar{
    padding-inline: 18px;
    padding-block: 18px;
  }
}

@media (max-width: 768px) {
  .sidebar{
    padding-inline: 16px;
    padding-block: 16px;
    gap: 14px;
  }
  .menuCard{
    padding:8px 12px;
    gap:8px;
  }
  .controlsArea{
    gap:12px;
  }
  .controlsGroup{
    gap:10px;
  }
  .controlItem{
    padding:6px 16px;
  }
  .logoutItem{
    padding:6px 18px;
  }
}

.collapsed.sidebar{
  padding-inline: 12px;                 /* slimmer side padding */
  padding-block: var(--rail-pad);
}

/* Rail “pill” cards */
.collapsed .menuCard{
  /* padding-block: var(--rail-pad); */
  /* padding-inline: 0;                     remove extra side padding */
  gap: var(--rail-gap);
  align-items: center;
}

.night.collapsed .sectionDivider{ background: rgba(148,163,184,.16); }


.collapsed .item:hover{ background: none; transform: none; }

/* Disc size + look */
.collapsed .itemIcon{
  inline-size: var(--rail-disc);
  block-size: var(--rail-disc);
  border-radius: 999px;
  display: grid; place-items: center;
  background: #EFF4FA;
  color: #0f172a;
  box-shadow: none;
  transition: background .2s ease, color .2s ease, box-shadow .2s ease;
}
.night.collapsed .itemIcon{
  background: rgba(255,255,255,.06);
  color: #e2e8f0;
}

/* Active disc */
.collapsed .active .itemIcon{
  background: var(--active-disc-bg);
  color: var(--active-disc-color);
  box-shadow: var(--active-disc-shadow);
}

/* Hide labels/badges in rail */
.collapsed .itemText,
.collapsed .badge{ display:none; }

/* ---------- Bottom controls spacing ---------- */



/* one place to tune sizes */
:root{
  --rail-disc: 50px;   /* menu disc */
  --rail-ctrl: 50px;   /* control/logout disc */
}

/* Center the whole rail */
.collapsed.sidebar{
  padding-inline: 12px;
}

/* Make each card a centered vertical stack with a fixed track width */


/* Controls group centered to the same track */
.collapsed .controlsArea{
  width: var(--rail-track);
  margin-inline: auto;
  align-items: center;
  gap: 14px;
}

/* each control is just a disc, centered */
.collapsed .controlItem{
  width: var(--rail-ctrl);
  height: var(--rail-ctrl);
  padding: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin-inline: auto;         /* <- keep on the same line */
}

/* inner icon size + zero line-height prevents vertical drift */
.collapsed .controlIcon,
.collapsed .itemIcon i,
.collapsed .itemIcon svg{
  width: 28px;
  height: 28px;
  line-height: 0;
  display: grid;
  place-items: center;
}

/* logout button matches the same rail center */
.collapsed .logoutItem{
  width: var(--rail-ctrl);
  height: var(--rail-ctrl);
  padding: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin-inline: auto;
}
.collapsed .logoutIcon{
  width: var(--rail-ctrl);
  height: var(--rail-ctrl);
  border-radius: 999px;
  display: grid;
  place-items: center;
}

/* (Optional) make the active/hover styles you already have apply to the disc only */
/* your existing colors for day/night will continue to work */



</style>

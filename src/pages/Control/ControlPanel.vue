<template>
  <div :class="$style.controlPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Hero Section -->
    <section :class="$style.heroSection">
      <div :class="$style.heroBackground">
        <div :class="$style.heroGlow"></div>
        <div :class="$style.heroParticles">
          <div v-for="i in 6" :key="i" :class="$style.particle" :style="{ animationDelay: `${i * 0.5}s` }"></div>
        </div>
      </div>
      
      <div :class="$style.heroContent">
        <div :class="$style.heroText">
          <h1 :class="$style.heroTitle">
            <i class="fas fa-cogs" :class="$style.heroIcon"></i>
            {{ t('control.title') }}
          </h1>
          <p :class="$style.heroSubtitle">{{ t('control.subtitle') }}</p>
        </div>
        
        <div :class="$style.heroStats">
          <div :class="$style.statCard">
            <div :class="$style.statNumber">6</div>
            <div :class="$style.statLabel">{{ t('control.stats.modules') || 'Control Modules' }}</div>
          </div>
          <div :class="$style.statCard">
            <div :class="$style.statNumber">1</div>
            <div :class="$style.statLabel">{{ t('control.stats.active') || 'Active' }}</div>
          </div>
          <div :class="$style.statCard">
            <div :class="$style.statNumber">5</div>
            <div :class="$style.statLabel">{{ t('control.stats.coming') || 'Coming Soon' }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Control Modules Grid -->
    <section :class="$style.modulesSection">
      <div :class="$style.modulesGrid">
        <!-- News Management Module -->
        <div :class="[$style.moduleCard, $style.activeModule]" @click="navigateToNews">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-newspaper"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.activeStatus">{{ t('control.status.active') || 'Active' }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.news.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.news.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.primaryButton]">
              {{ t('control.modules.news.button') }}
              <i class="fas fa-arrow-right" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.moduleGlow"></div>
        </div>

        <!-- Survey Management Module -->
        <div :class="[$style.moduleCard, $style.comingSoonModule]">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-poll-h"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.comingSoonStatus">{{ t('control.modules.survey.comingSoon') }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.survey.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.survey.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.disabledButton]" disabled>
              {{ t('control.modules.survey.button') }}
              <i class="fas fa-clock" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.comingSoonOverlay">
            <div :class="$style.comingSoonBadge">
              <i class="fas fa-hourglass-half"></i>
              {{ t('control.modules.survey.comingSoon') }}
            </div>
          </div>
        </div>

        <!-- User Management Module -->
        <div :class="[$style.moduleCard, $style.comingSoonModule]">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.comingSoonStatus">{{ t('control.modules.users.comingSoon') }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.users.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.users.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.disabledButton]" disabled>
              {{ t('control.modules.users.button') }}
              <i class="fas fa-clock" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.comingSoonOverlay">
            <div :class="$style.comingSoonBadge">
              <i class="fas fa-hourglass-half"></i>
              {{ t('control.modules.users.comingSoon') }}
            </div>
          </div>
        </div>

        <!-- Analytics Control Module -->
        <div :class="[$style.moduleCard, $style.comingSoonModule]">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.comingSoonStatus">{{ t('control.modules.analytics.comingSoon') }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.analytics.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.analytics.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.disabledButton]" disabled>
              {{ t('control.modules.analytics.button') }}
              <i class="fas fa-clock" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.comingSoonOverlay">
            <div :class="$style.comingSoonBadge">
              <i class="fas fa-hourglass-half"></i>
              {{ t('control.modules.analytics.comingSoon') }}
            </div>
          </div>
        </div>

        <!-- System Settings Module -->
        <div :class="[$style.moduleCard, $style.comingSoonModule]">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-sliders-h"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.comingSoonStatus">{{ t('control.modules.settings.comingSoon') }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.settings.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.settings.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.disabledButton]" disabled>
              {{ t('control.modules.settings.button') }}
              <i class="fas fa-clock" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.comingSoonOverlay">
            <div :class="$style.comingSoonBadge">
              <i class="fas fa-hourglass-half"></i>
              {{ t('control.modules.settings.comingSoon') }}
            </div>
          </div>
        </div>

        <!-- Backup & Recovery Module -->
        <div :class="[$style.moduleCard, $style.comingSoonModule]">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.comingSoonStatus">{{ t('control.modules.backup.comingSoon') }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.backup.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.backup.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[$style.moduleButton, $style.disabledButton]" disabled>
              {{ t('control.modules.backup.button') }}
              <i class="fas fa-clock" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.comingSoonOverlay">
            <div :class="$style.comingSoonBadge">
              <i class="fas fa-hourglass-half"></i>
              {{ t('control.modules.backup.comingSoon') }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section :class="$style.quickActionsSection">
      <div :class="$style.quickActionsHeader">
        <h2 :class="$style.sectionTitle">{{ t('control.quickActions.title') || 'Quick Actions' }}</h2>
        <p :class="$style.sectionSubtitle">{{ t('control.quickActions.subtitle') || 'Commonly used control actions' }}</p>
      </div>
      
      <div :class="$style.quickActionsGrid">
        <button :class="$style.quickActionCard" @click="refreshAllData">
          <div :class="$style.quickActionIcon">
            <i class="fas fa-sync-alt"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.refresh') }}</span>
        </button>
        
        <button :class="$style.quickActionCard" @click="navigateToNews">
          <div :class="$style.quickActionIcon">
            <i class="fas fa-plus"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.quickActions.addNews') || 'Add News' }}</span>
        </button>
        
        <button :class="$style.quickActionCard" disabled>
          <div :class="$style.quickActionIcon">
            <i class="fas fa-poll"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.quickActions.createSurvey') || 'Create Survey' }}</span>
          <span :class="$style.comingSoonLabel">{{ t('control.modules.survey.comingSoon') }}</span>
        </button>
        
        <button :class="$style.quickActionCard" disabled>
          <div :class="$style.quickActionIcon">
            <i class="fas fa-download"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.quickActions.backup') || 'Backup Data' }}</span>
          <span :class="$style.comingSoonLabel">{{ t('control.modules.backup.comingSoon') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'

// Store and router
const store = useAppStore()
const router = useRouter()

// Computed properties
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Methods
const navigateToNews = () => {
  router.push('/control/news')
}

const refreshAllData = () => {
  // Add refresh functionality here
  
}
</script>

<style module src="./ControlPanel.module.css">
/* CSS Module styles are imported from ControlPanel.module.css */
</style>

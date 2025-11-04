<template>
  <div :class="$style.controlPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
     <br />

    <!-- Control Modules Grid -->
    <section :class="$style.modulesSection">
      <div :class="$style.modulesGrid">
        
        <!-- Survey Management Module -->
        <div :class="[$style.moduleCard, $style.activeModule]" @click="navigateToSurveys">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-poll-h"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="$style.activeStatus">{{ t('control.status.active') || 'Active' }}</span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.survey.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.survey.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <br>
            <button :class="[$style.moduleButton, $style.primaryButton]">
              {{ t('control.modules.survey.button') }}
              <i class="fas fa-arrow-right" :class="$style.buttonIcon"></i>
            </button>
          </div>
          
          <div :class="$style.moduleGlow"></div>
        </div>

        <!-- User Management Module -->
        <div :class="[
          $style.moduleCard, 
          isSuperAdmin ? $style.activeModule : $style.restrictedModule
        ]" @click="navigateToUserManagement">
          <div :class="$style.moduleHeader">
            <div :class="$style.moduleIcon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div :class="$style.moduleStatus">
              <span :class="isSuperAdmin ? $style.activeStatus : $style.restrictedStatus">
                {{ isSuperAdmin ? t('control.status.active') || 'Active' : t('control.status.superAdminOnly') || 'متاح فقط للمسؤول الأعلى' }}
              </span>
            </div>
          </div>
          
          <div :class="$style.moduleContent">
            <h3 :class="$style.moduleTitle">{{ t('control.modules.users.title') }}</h3>
            <p :class="$style.moduleDescription">{{ t('control.modules.users.description') }}</p>
          </div>
          
          <div :class="$style.moduleFooter">
            <button :class="[
              $style.moduleButton, 
              isSuperAdmin ? $style.primaryButton : $style.disabledButton
            ]" :disabled="!isSuperAdmin">
              {{ t('control.modules.users.button') }}
              <i :class="[
                isSuperAdmin ? 'fas fa-arrow-right' : 'fas fa-lock', 
                $style.buttonIcon
              ]"></i>
            </button>
          </div>
          
          <div v-if="!isSuperAdmin" :class="$style.restrictedOverlay">
            <div :class="$style.restrictedBadge">
              <i class="fas fa-shield-alt"></i>
              {{ t('control.status.superAdminOnly') || 'متاح فقط للمسؤول الأعلى' }}
            </div>
          </div>
          
          <div v-if="isSuperAdmin" :class="$style.moduleGlow"></div>
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

      </div>
    </section>

    <!-- Quick Actions Section soon -->
    <!-- <section :class="$style.quickActionsSection">
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
        
        <button :class="$style.quickActionCard" @click="navigateToSurveys">
          <div :class="$style.quickActionIcon">
            <i class="fas fa-poll"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.quickActions.createSurvey') || 'Create Survey' }}</span>
        </button>
        
        <button :class="$style.quickActionCard" disabled>
          <div :class="$style.quickActionIcon">
            <i class="fas fa-download"></i>
          </div>
          <span :class="$style.quickActionLabel">{{ t('control.quickActions.backup') || 'Backup Data' }}</span>
          <span :class="$style.comingSoonLabel">{{ t('control.modules.backup.comingSoon') }}</span>
        </button>
      </div>
    </section> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { useSimpleAuth } from '../../composables/useSimpleAuth'

// Store and router
const store = useAppStore()
const router = useRouter()

// Authentication
const { user } = useSimpleAuth()

// Computed properties
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Check if user is super admin
const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

// Methods
const navigateToSurveys = () => {
  router.push('/control/surveys')
}

const navigateToUserManagement = () => {
  if (isSuperAdmin.value) {
    router.push('/control/users')
  }
}
</script>

<style module src="./Control.module.css">
/* CSS Module styles are imported from Control.module.css */
</style>

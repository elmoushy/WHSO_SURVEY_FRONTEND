<template>
  <div :class="$style.modalOverlay" @click="$emit('close')">
    <div 
      :class="$style.modalContainer" 
      :data-theme="currentTheme" 
      :dir="isRTL ? 'rtl' : 'ltr'"
      @click.stop
    >
      <!-- Header -->
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">
          <i class="fas fa-chart-bar" :class="$style.modalIcon"></i>
          {{ t('survey.analytics.title') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <div v-if="analytics">
          <!-- Overview Stats -->
          <div :class="$style.statsGrid">
            <div :class="$style.statCard">
              <div :class="$style.statNumber">{{ analytics.total_surveys }}</div>
              <div :class="$style.statLabel">{{ t('survey.dashboard.totalSurveys') }}</div>
            </div>
            <div :class="$style.statCard">
              <div :class="$style.statNumber">{{ analytics.active_surveys }}</div>
              <div :class="$style.statLabel">{{ t('survey.dashboard.activeSurveys') }}</div>
            </div>
            <div :class="$style.statCard">
              <div :class="$style.statNumber">{{ analytics.total_responses }}</div>
              <div :class="$style.statLabel">{{ t('survey.dashboard.totalResponses') }}</div>
            </div>
            <div :class="$style.statCard">
              <div :class="$style.statNumber">{{ analytics.avg_response_rate }}%</div>
              <div :class="$style.statLabel">{{ t('survey.dashboard.avgResponseRate') }}</div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div :class="$style.section">
            <h3 :class="$style.sectionTitle">{{ t('survey.dashboard.recentActivity') }}</h3>
            <div :class="$style.activityGrid">
              <div :class="$style.activityCard">
                <div :class="$style.activityIcon">
                  <i class="fas fa-plus"></i>
                </div>
                <div :class="$style.activityContent">
                  <div :class="$style.activityNumber">{{ analytics.recent_activity.new_surveys_this_week }}</div>
                  <div :class="$style.activityLabel">{{ t('survey.dashboard.newSurveysThisWeek') }}</div>
                </div>
              </div>
              <div :class="$style.activityCard">
                <div :class="$style.activityIcon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div :class="$style.activityContent">
                  <div :class="$style.activityNumber">{{ analytics.recent_activity.new_responses_this_week }}</div>
                  <div :class="$style.activityLabel">{{ t('survey.dashboard.newResponsesThisWeek') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Surveys -->
          <div :class="$style.section">
            <h3 :class="$style.sectionTitle">{{ t('survey.dashboard.topSurveys') }}</h3>
            <div :class="$style.topSurveysList">
              <div 
                v-for="(survey, index) in analytics.top_surveys" 
                :key="survey.id"
                :class="$style.topSurveyItem"
              >
                <div :class="$style.surveyRank">{{ index + 1 }}</div>
                <div :class="$style.surveyInfo">
                  <div :class="$style.surveyTitle">{{ survey.title }}</div>
                  <div :class="$style.surveyStats">
                    {{ survey.response_count }} responses • {{ survey.completion_rate }}% completion
                  </div>
                </div>
                <div :class="$style.surveyProgress">
                  <div :class="$style.progressBar">
                    <div 
                      :class="$style.progressFill" 
                      :style="{ width: `${survey.completion_rate}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else :class="$style.loadingContainer">
          <div :class="$style.loadingSpinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { SurveyAnalytics } from '../../types/survey.types'

// Props
interface Props {
  analytics: SurveyAnalytics | null
}

defineProps<Props>()

// Emits
defineEmits<{
  close: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modalContainer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modalHeader {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, 
    rgba(74, 144, 226, 0.05) 0%,
    rgba(80, 200, 120, 0.02) 100%);
}

.modalTitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.modalIcon {
  color: var(--primary-color);
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.closeButton:hover {
  background: rgba(156, 163, 175, 0.1);
  color: var(--text-color);
}

.modalBody {
  padding: 32px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.statCard {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.statCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.statNumber {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.statLabel {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section {
  margin-bottom: 32px;
}

.sectionTitle {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--text-color);
}

.activityGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.activityCard {
  background: rgba(74, 144, 226, 0.05);
  border: 1px solid rgba(74, 144, 226, 0.1);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.activityCard:hover {
  background: rgba(74, 144, 226, 0.08);
  border-color: rgba(74, 144, 226, 0.2);
  transform: translateY(-2px);
}

.activityIcon {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activityContent {
  flex: 1;
}

.activityNumber {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.activityLabel {
  font-size: 0.9rem;
  opacity: 0.7;
  line-height: 1.4;
}

.topSurveysList {
  background: rgba(74, 144, 226, 0.02);
  border: 1px solid rgba(74, 144, 226, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.topSurveyItem {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
}

.topSurveyItem:last-child {
  border-bottom: none;
}

.surveyRank {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.surveyInfo {
  flex: 1;
}

.surveyTitle {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-color);
}

.surveyStats {
  font-size: 0.85rem;
  opacity: 0.7;
}

.surveyProgress {
  width: 120px;
  flex-shrink: 0;
}

.progressBar {
  width: 100%;
  height: 8px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}

.loadingSpinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.1);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark Theme */
.modalContainer[data-theme="night"] {
  background: rgba(30, 35, 48, 0.95);
  border-color: rgba(74, 144, 226, 0.2);
}

.modalContainer[data-theme="night"] .modalHeader {
  background: linear-gradient(135deg, 
    rgba(74, 144, 226, 0.08) 0%,
    rgba(80, 200, 120, 0.04) 100%);
  border-color: rgba(74, 144, 226, 0.15);
}

.modalContainer[data-theme="night"] .statCard {
  background: rgba(30, 35, 48, 0.8);
  border-color: rgba(74, 144, 226, 0.15);
}

.modalContainer[data-theme="night"] .activityCard {
  background: rgba(74, 144, 226, 0.08);
  border-color: rgba(74, 144, 226, 0.15);
}

.modalContainer[data-theme="night"] .topSurveysList {
  background: rgba(74, 144, 226, 0.05);
  border-color: rgba(74, 144, 226, 0.15);
}

.modalContainer[data-theme="night"] .topSurveyItem {
  border-color: rgba(74, 144, 226, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalContainer {
    margin: 20px;
    max-width: none;
    width: calc(100% - 40px);
    max-height: calc(100vh - 40px);
  }

  .modalHeader {
    padding: 20px 24px;
  }

  .modalBody {
    padding: 24px;
  }

  .statsGrid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .activityGrid {
    grid-template-columns: 1fr;
  }

  .topSurveyItem {
    flex-wrap: wrap;
    gap: 12px;
  }

  .surveyProgress {
    width: 100%;
  }
}
</style>

<template>
  <div :class="$style.csatBar" :data-theme="currentTheme">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري التحميل...</p>
    </div>

    <div v-else-if="!hasData" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-smile"></i>
      </div>
      <p :class="$style.emptyText">لا توجد بيانات CSAT</p>
    </div>

    <div v-else :class="$style.csatContainer">
      <!-- Score Header -->
      <div :class="$style.scoreHeader">
        <div :class="$style.scoreValue" :style="{ color: scoreColor }">
          {{ Math.round(csatScore) }}%
        </div>
        <div :class="$style.scoreLabel">{{ interpretation }}</div>
      </div>

      <!-- Horizontal Stacked Bar -->
      <div :class="$style.stackedBar">
        <div
          :class="$style.barSegment"
          :style="{
            width: `${satisfiedPct}%`,
            backgroundColor: '#4CAF50'
          }"
          :title="`راضون: ${satisfiedPctFormatted}%`"
        >
          <span v-if="satisfiedPct > 15" :class="$style.barLabel">{{ satisfiedPctFormatted }}%</span>
        </div>
        <div
          :class="$style.barSegment"
          :style="{
            width: `${neutralPct}%`,
            backgroundColor: '#FFC107'
          }"
          :title="`محايدون: ${neutralPctFormatted}%`"
        >
          <span v-if="neutralPct > 15" :class="$style.barLabel">{{ neutralPctFormatted }}%</span>
        </div>
        <div
          :class="$style.barSegment"
          :style="{
            width: `${dissatisfiedPct}%`,
            backgroundColor: '#F44336'
          }"
          :title="`غير راضون: ${dissatisfiedPctFormatted}%`"
        >
          <span v-if="dissatisfiedPct > 15" :class="$style.barLabel">{{ dissatisfiedPctFormatted }}%</span>
        </div>
      </div>

      <!-- Legend -->
      <div :class="$style.legend">
        <div :class="$style.legendItem">
          <div :class="$style.legendDot" style="background: #4CAF50;"></div>
          <div :class="$style.legendContent">
            <span :class="$style.legendLabel">راضون</span>
            <span :class="$style.legendValue">{{ satisfiedCount }} ({{ satisfiedPctFormatted }}%)</span>
          </div>
        </div>

        <div :class="$style.legendItem">
          <div :class="$style.legendDot" style="background: #FFC107;"></div>
          <div :class="$style.legendContent">
            <span :class="$style.legendLabel">محايدون</span>
            <span :class="$style.legendValue">{{ neutralCount }} ({{ neutralPctFormatted }}%)</span>
          </div>
        </div>

        <div :class="$style.legendItem">
          <div :class="$style.legendDot" style="background: #F44336;"></div>
          <div :class="$style.legendContent">
            <span :class="$style.legendLabel">غير راضون</span>
            <span :class="$style.legendValue">{{ dissatisfiedCount }} ({{ dissatisfiedPctFormatted }}%)</span>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div :class="$style.total">
        إجمالي الردود: <strong>{{ totalResponses }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  csatData: {
    score: number
    satisfied_count: number
    neutral_count: number
    dissatisfied_count: number
    satisfied_pct: number
    neutral_pct: number
    dissatisfied_pct: number
    total_responses: number
    interpretation?: string
  } | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)

const hasData = computed(() => props.csatData && props.csatData.total_responses > 0)

const csatScore = computed(() => props.csatData?.score || 0)
const satisfiedCount = computed(() => props.csatData?.satisfied_count || 0)
const neutralCount = computed(() => props.csatData?.neutral_count || 0)
const dissatisfiedCount = computed(() => props.csatData?.dissatisfied_count || 0)
const satisfiedPct = computed(() => props.csatData?.satisfied_pct || 0)
const neutralPct = computed(() => props.csatData?.neutral_pct || 0)
const dissatisfiedPct = computed(() => props.csatData?.dissatisfied_pct || 0)
const totalResponses = computed(() => props.csatData?.total_responses || 0)
const interpretation = computed(() => props.csatData?.interpretation || 'غير متوفر')

const satisfiedPctFormatted = computed(() => satisfiedPct.value.toFixed(1))
const neutralPctFormatted = computed(() => neutralPct.value.toFixed(1))
const dissatisfiedPctFormatted = computed(() => dissatisfiedPct.value.toFixed(1))

const scoreColor = computed(() => {
  const score = csatScore.value
  if (score >= 80) return '#4CAF50' // Excellent - Green
  if (score >= 70) return '#8BC34A' // Good - Light Green
  if (score >= 60) return '#FFC107' // Fair - Yellow
  if (score >= 50) return '#FF9800' // Poor - Orange
  return '#F44336' // Critical - Red
})
</script>

<style module>
.csatBar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 400px;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  gap: 16px;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loadingText,
.emptyText {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.emptyIcon {
  font-size: 48px;
  color: var(--muted);
  opacity: 0.5;
}

.csatContainer {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.scoreHeader {
  text-align: center;
  padding-bottom: 8px;
}

.scoreValue {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.scoreLabel {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stackedBar {
  display: flex;
  width: 100%;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  background: var(--surface-variant);
}

.barSegment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  position: relative;
  min-width: 0;
}

.barSegment:hover {
  opacity: 0.9;
}

.barSegment:first-child {
  border-radius: 24px 0 0 24px;
}

.barSegment:last-child {
  border-radius: 0 24px 24px 0;
}

.barSegment:only-child {
  border-radius: 24px;
}

.barLabel {
  font-size: 13px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  padding: 0 8px;
}

.legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface-variant);
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.legendItem:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.legendDot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.legendContent {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.legendLabel {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legendValue {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.total {
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.total strong {
  color: var(--ink);
  font-weight: 700;
  font-size: 14px;
}

/* Dark theme */
.csatBar[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
}

.csatBar[data-theme="night"] .legendItem {
  background: #1a202c;
}

.csatBar[data-theme="night"] .stackedBar {
  background: #1a202c;
}

/* Responsive */
@media (max-width: 768px) {
  .csatBar {
    padding: 16px;
    min-height: 350px;
  }

  .csatContainer {
    gap: 24px;
  }

  .scoreValue {
    font-size: 42px;
  }
  
  .scoreLabel {
    font-size: 12px;
  }
  
  .stackedBar {
    height: 40px;
  }

  .barLabel {
    font-size: 12px;
  }
  
  .legend {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .legendItem {
    padding: 10px 12px;
  }

  .legendValue {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .scoreValue {
    font-size: 36px;
  }

  .stackedBar {
    height: 36px;
  }

  .barLabel {
    font-size: 11px;
  }
}
</style>

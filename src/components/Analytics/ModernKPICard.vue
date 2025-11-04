<template>
  <div :class="$style.kpiCard" :data-theme="currentTheme" :style="{ '--accent-color': color }">
    <div :class="$style.kpiHeader">
      <div :class="$style.kpiIcon">
        <i :class="icon"></i>
      </div>
      <div v-if="trend !== undefined" :class="[$style.kpiTrend, trendClass]">
        <i :class="trendIcon"></i>
        <span>{{ Math.abs(trend).toFixed(1) }}%</span>
      </div>
    </div>

    <div :class="$style.kpiContent">
      <div :class="$style.kpiValue">
        <span v-if="prefix" :class="$style.kpiPrefix">{{ prefix }}</span>
        {{ formattedValue }}
        <span v-if="suffix" :class="$style.kpiSuffix">{{ suffix }}</span>
      </div>
      <div :class="$style.kpiLabel">{{ label }}</div>
      <div v-if="subtitle" :class="$style.kpiSubtitle">{{ subtitle }}</div>
    </div>

    <div v-if="showProgress && percentage !== undefined" :class="$style.kpiProgress">
      <div :class="$style.progressBar">
        <div
          :class="$style.progressFill"
          :style="{ width: `${Math.min(percentage, 100)}%` }"
        ></div>
      </div>
      <div :class="$style.progressLabel">{{ percentage.toFixed(1) }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  value: number | string
  label: string
  icon: string
  color?: string
  trend?: number
  subtitle?: string
  prefix?: string
  suffix?: string
  percentage?: number
  showProgress?: boolean
  formatAsNumber?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#4CAF50',
  showProgress: false,
  formatAsNumber: true
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (!props.formatAsNumber) return props.value
  return new Intl.NumberFormat().format(props.value)
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? 'trendUp' : 'trendDown'
})

const trendIcon = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
})
</script>

<style module>
.kpiCard {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid var(--accent-color);
  position: relative;
  overflow: hidden;
}

.kpiCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--accent-color) 0%, transparent 50%);
  opacity: 0.05;
  pointer-events: none;
}

.kpiCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.kpiHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kpiIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color);
  border-radius: 12px;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpiTrend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.trendUp {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.trendDown {
  color: #F44336;
  background: rgba(244, 67, 54, 0.1);
}

.kpiContent {
  position: relative;
  z-index: 1;
}

.kpiValue {
  font-size: 36px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpiPrefix,
.kpiSuffix {
  font-size: 18px;
  font-weight: 500;
  color: var(--muted);
}

.kpiLabel {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.kpiSubtitle {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.kpiProgress {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progressBar {
  flex: 1;
  height: 8px;
  background: var(--surface-variant);
  border-radius: 4px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.progressLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-color);
  min-width: 45px;
  text-align: right;
}

/* Dark theme */
.kpiCard[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
  .kpiCard {
    padding: 20px;
  }
  
  .kpiValue {
    font-size: 28px;
  }
  
  .kpiIcon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>

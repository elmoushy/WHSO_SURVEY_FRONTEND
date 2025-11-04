<template>
  <div :class="$style.surveyPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
      <section :class="$style.heroSection">
        <div :class="$style.heroContent">
          <div :class="$style.heroText">
            <div :class="$style.sectionHerto">
              <h1>الاستطلاعات</h1>
            </div>
          </div>

        </div>
      </section>
    <!-- Overview Section -->
     <section :class="$style.statsSection" v-if="accessSummary">
  <div :class="$style.kpiGrid">
    <div
      v-for="card in kpiCards"
      :key="card.key"
      :class="$style.kpiCard"
      role="status"
      aria-live="polite"
    >

  <!-- Top row: [ Head (title+badge) | Arrow ] -->
  <div :class="$style.kpiTop">
    <!-- RIGHT side: title + icon -->
    <div :class="$style.kpiHead">
        <div :class="[$style.kpiBadge, card.dot ? '' : '']" aria-hidden="true">
        <component :is="card.icon" />
      </div>
      <div :class="$style.kpiTitle">{{ card.title }}</div>
    </div>

    <!-- LEFT side: arrow -->
    <div :class="$style.kpiArrowWrap" v-if="card.trend !== undefined && card.trend !== null">
      <!-- Up arrow for positive trend -->
      <svg v-if="card.trend >= 0" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9.01562 5V6.96875H15.625L4 18.5938L5.40625 20L17.0312 8.375V14.9844H19V5H9.01562Z" fill="#00A350"/>
      </svg>
      <!-- Down arrow for negative trend -->
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9.01562 19V17.0312H15.625L4 5.40625L5.40625 4L17.0312 15.625V9.01562H19V19H9.01562Z" fill="#DC3545"/>
      </svg>
    </div>
  </div>




      <!-- Number row: unit + number (in RTL: number left, unit to its right) -->
      <div :class="$style.kpiMain">
        <span :class="$style.kpiNumber">{{ card.value }}</span>
        <span :class="$style.kpiUnit">{{ card.unit }}</span>
      </div>

      <!-- Bottom row -->
      <!-- <div :class="$style.kpiBottom">
      
        <span :class="$style.kpiFoot">{{ isRTL ? 'في هذا الشهر' : 'this month' }}</span>
       <span 
          v-if="card.trend !== undefined && card.trend !== null"
          :class="[$style.kpiTrend, card.trend >= 0 ? $style.positive : $style.negative]"
        >
          {{ (card.trend >= 0 ? '+' : '') + Math.round(card.trend) + '%' }}
        </span>
      </div> -->
    </div>
  </div>
      </section>


    <!-- Filters and Search -->
   

    <!-- Surveys Grid -->
    <section :class="$style.surveysSection">
      <!-- Loading State -->
        <section :class="$style.filtersSection">
      <div :class="$style.filtersGrid">
        <div :class="$style.searchGroup">
          <div :class="$style.searchInputWrapper">
            <i class="fas fa-search" :class="$style.searchIcon"></i>
            <input
              type="text"
              :class="$style.searchInput"
              :placeholder="t('survey.shared.search.placeholder')"
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
        </div>
        
        <div :class="$style.filterGroup">
          <select :class="$style.filterSelect" v-model="visibilityFilter" @change="applyFilters">
            <option value="">{{ t('survey.shared.filters.allShared') }}</option>
            <option value="AUTH">{{ t('survey.shared.filters.authOnly') }}</option>
            <option value="PUBLIC">{{ t('survey.shared.filters.publicOnly') }}</option>
            <option value="PRIVATE">{{ t('survey.shared.filters.privateOnly') }}</option>
            <option value="GROUPS">{{ t('survey.shared.filters.groupsOnly') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="activeFilter" @change="applyFilters">
            <option value="">{{ t('survey.filters.all') }}</option>
            <option value="true">{{ t('survey.shared.filters.activeOnly') }}</option>
            <option value="false">{{ t('survey.filters.inactive') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="lockedFilter" @change="applyFilters">
            <option value="">{{ t('survey.filters.all') }}</option>
            <option value="false">{{ t('survey.shared.filters.unlockedOnly') }}</option>
            <option value="true">{{ t('survey.filters.locked') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="sortOrder" @change="applyFilters">
            <option value="-created_at">{{ t('survey.sorting.newest') }}</option>
            <option value="created_at">{{ t('survey.sorting.oldest') }}</option>
            <option value="title">{{ t('survey.sorting.titleAZ') }}</option>
            <option value="-title">{{ t('survey.sorting.titleZA') }}</option>
            <option value="-updated_at">{{ t('survey.sorting.lastUpdated') }}</option>
          </select>
        </div>
      </div>
    </section>
      <div v-if="isLoading" :class="$style.loadingState">
        <div :class="$style.loadingSpinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>جاري تحميل الاستطلاعات...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="$style.errorState">
        <div :class="$style.errorIcon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>فشل في تحميل الاستطلاعات</h3>
        <p>{{ error }}</p>
        <button :class="$style.retryButton" @click="refreshData">
          <i class="fas fa-redo"></i>
          إعادة المحاولة
        </button>
      </div>

      <!-- Timeout Error State -->
      <div v-else-if="timeoutError" :class="$style.errorState">
        <div :class="$style.errorIcon">
          <i class="fas fa-clock"></i>
        </div>
        <h3>انتهت مهلة الطلب</h3>
        <p>فشل في تحميل الاستطلاعات خلال 15 ثانية</p>
        <div :class="$style.errorActions">
          <button :class="$style.retryButton" @click="refreshData">
            <i class="fas fa-redo"></i>
            إعادة المحاولة
          </button>
          <button :class="$style.refreshButton" @click="refreshPage">
            <i class="fas fa-sync-alt"></i>
            تحديث الصفحة
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="surveys.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3>{{ searchQuery ? t('survey.shared.search.noResults') : t('survey.shared.search.emptyState') }}</h3>
        <p v-if="!searchQuery">{{ t('survey.shared.search.emptyState') }}</p>
      </div>

      <!-- Surveys Grid -->
      <div v-else :class="$style.surveysGrid">
        <div 
          v-for="survey in surveys" 
          :key="survey.id" 
          :class="[$style.surveyCard, { [$style.nonClickable]: !canTakeSurvey(survey) && !survey.access_info.has_submitted }]"
          @click="canTakeSurvey(survey) || survey.access_info.has_submitted ? handleSurveyClick(survey) : null"
        >
          <!-- Card Header -->
          <div >
            <div :class="$style.cardHeader">
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="44" height="44" rx="22" fill="#F5F7FA"/>
<path d="M13 20C13 16.2288 13 14.3431 14.1716 13.1716C15.3431 12 17.2288 12 21 12H23C26.7712 12 28.6569 12 29.8284 13.1716C31 14.3431 31 16.2288 31 20V24C31 27.7712 31 29.6569 29.8284 30.8284C28.6569 32 26.7712 32 23 32H21C17.2288 32 15.3431 32 14.1716 30.8284C13 29.6569 13 27.7712 13 24V20Z" stroke="#A17D23" stroke-width="1.5"/>
<path d="M18 20H26" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round"/>
<path d="M18 24H23" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round"/>
</svg>

            <div :class="$style.cardTitle">{{ survey.title }}</div>
            </div>
                  
                      <p :class="$style.cardDescription">{{ survey.description || 'لا يوجد وصف' }}</p>

          </div>

                      <div :class="$style.cardDivider"></div>

          <!-- Card Content -->
          <div :class="$style.cardContent">
            
            <div :class="$style.cardChips">
              <div :class="$style.chip">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99967 0.833374C6.25077 0.833374 4.83301 2.25114 4.83301 4.00004C4.83301 5.74894 6.25077 7.16671 7.99967 7.16671C9.74858 7.16671 11.1663 5.74894 11.1663 4.00004C11.1663 2.25114 9.74858 0.833374 7.99967 0.833374ZM5.83301 4.00004C5.83301 2.80342 6.80306 1.83337 7.99967 1.83337C9.19629 1.83337 10.1663 2.80342 10.1663 4.00004C10.1663 5.19666 9.19629 6.16671 7.99967 6.16671C6.80306 6.16671 5.83301 5.19666 5.83301 4.00004Z" fill="#717784"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99967 8.16671C6.64012 8.16671 5.38469 8.48054 4.45177 9.01363C3.53301 9.53864 2.83301 10.3401 2.83301 11.3334C2.83301 12.3266 3.53301 13.1281 4.45177 13.6531C5.38469 14.1862 6.64012 14.5 7.99967 14.5C9.35923 14.5 10.6147 14.1862 11.5476 13.6531C12.4663 13.1281 13.1663 12.3266 13.1663 11.3334C13.1663 10.3401 12.4663 9.53864 11.5476 9.01363C10.6147 8.48054 9.35923 8.16671 7.99967 8.16671ZM3.83301 11.3334C3.83301 10.8539 4.17768 10.322 4.94791 9.88188C5.704 9.44983 6.7819 9.16671 7.99967 9.16671C9.21745 9.16671 10.2953 9.44983 11.0514 9.88188C11.8217 10.322 12.1663 10.8539 12.1663 11.3334C12.1663 11.8129 11.8217 12.3447 11.0514 12.7849C10.2953 13.2169 9.21745 13.5 7.99967 13.5C6.7819 13.5 5.704 13.2169 4.94791 12.7849C4.17768 12.3447 3.83301 11.8129 3.83301 11.3334Z" fill="#717784"/>
</svg>

                <span>{{ t('survey.shared.card.createdBy') }}: {{ survey.creator.name || survey.creator.email }}</span>
              </div>
              
              <div :class="$style.chip">
<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.25 7.5C1.25 4.55372 1.25 3.08058 2.16529 2.16529C3.08058 1.25 4.55372 1.25 7.5 1.25C10.4463 1.25 11.9194 1.25 12.8347 2.16529C13.75 3.08058 13.75 4.55372 13.75 7.5C13.75 10.4463 13.75 11.9194 12.8347 12.8347C11.9194 13.75 10.4463 13.75 7.5 13.75C4.55372 13.75 3.08058 13.75 2.16529 12.8347C1.25 11.9194 1.25 10.4463 1.25 7.5Z" stroke="#717784" stroke-width="0.9375"/>
<path d="M6.32812 5.54688C6.32812 4.89967 6.85279 4.375 7.5 4.375C8.14721 4.375 8.67188 4.89967 8.67188 5.54688C8.67188 5.97653 8.44065 6.35218 8.09585 6.55617C7.79877 6.73194 7.5 6.99857 7.5 7.34375V8.125" stroke="#717784" stroke-width="0.9375" stroke-linecap="round"/>
<circle cx="7.5" cy="10" r="0.625" fill="#717784"/>
</svg>
                <span>{{ survey.questions_count }} {{ t('survey.shared.card.questionsCount') }}</span>
              </div>
              
            </div>

            <!-- Survey Status -->
            <!-- <div :class="$style.statusIndicators">
              <div v-if="survey.status === 'scheduled'" :class="[$style.statusBadge, $style.scheduled]">
                <i class="fas fa-calendar-alt"></i>
                {{ t('survey.shared.card.isScheduled') }}
              </div>
              
              <div v-if="!survey.is_active" :class="[$style.statusBadge, $style.inactive]">
                <i class="fas fa-pause"></i>
                {{ t('survey.shared.card.isInactive') }}
              </div>
              
              <div v-if="survey.is_locked" :class="[$style.statusBadge, $style.locked]">
                <i class="fas fa-lock"></i>
                {{ t('survey.shared.card.isLocked') }}
              </div>
              
              <div v-if="survey.access_info.has_submitted" :class="[$style.statusBadge, $style.submitted]">
                <i class="fas fa-check"></i>
                {{ t('survey.shared.card.hasSubmitted') }}
              </div>
            </div> -->
          </div>

          <!-- Card Actions -->
          <div :class="$style.cardActions">
            <button 
              v-if="canTakeSurvey(survey)" 
              :class="[$style.actionButton, $style.primary]"
              @click.stop="takeSurvey(survey)"
            >
              <i class="fas fa-play"></i>
              {{ t('survey.shared.card.takeNow') }}
            </button>
            
            <button 
              v-else-if="survey.access_info.has_submitted" 
              :class="[$style.actionButton, $style.completed]"
              disabled
            >
              <i class="fas fa-check"></i>
              {{ t('survey.shared.card.alreadySubmitted') }}
            </button>
            
            <button 
              v-else 
              :class="[$style.actionButton, $style.disabled]"
              disabled
            >
              <i class="fas fa-eye"></i>
              {{ t('survey.shared.card.viewOnly') }}
            </button>
          </div>

          <!-- Card Footer -->
          <!-- <div :class="$style.cardFooter">
          </div> -->
        </div>
      </div>

      <!-- Pagination -->
      <div :class="$style.paginationSection">
        <div :class="$style.paginationInfo">
          {{ t('common.pagination.showing') }} 
          {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} - 
          {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }} 
          {{ t('common.pagination.of') }} {{ pagination.total }}
        </div>
        
        <div :class="$style.paginationControls">
          <button 
            :class="$style.pageButton" 
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
          >
            <i class="fas fa-chevron-right" v-if="isRTL"></i>
            <i class="fas fa-chevron-left" v-if="!isRTL"></i>
            {{ t('common.pagination.previous') }}
          </button>
          
          <span :class="$style.pageNumbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              :class="[$style.pageNumber, { [$style.active]: page === pagination.currentPage }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </span>
          
          <button 
            :class="$style.pageButton" 
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)"
          >
            {{ t('common.pagination.next') }}
            <i class="fas fa-chevron-left" v-if="isRTL"></i>
            <i class="fas fa-chevron-right" v-if="!isRTL"></i>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineComponent, h, unref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { surveyService } from '@/services/surveyService'
import Swal from 'sweetalert2'
import type { 
  SharedSurvey, 
  SharedSurveysResponse, 
  SharedSurveysAccessSummary,
  SharedSurveysFilters,
  ApiResponse,
  PaginatedApiResponse
} from '@/types/survey.types'

// Composables
const router = useRouter()
const { t, currentLanguage, currentTheme, isRTL } = useI18n()

// Reactive data
const surveys = ref<SharedSurvey[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const timeoutError = ref(false)
const accessSummary = ref<SharedSurveysAccessSummary | null>(null)

// Search and filters
const searchQuery = ref('')
const visibilityFilter = ref<string>('')
const activeFilter = ref<string>('')
const lockedFilter = ref<string>('')
const sortOrder = ref('-created_at')

// Pagination
const pagination = ref({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// Computed properties
const availableSurveysCount = computed(() => {
  return surveys.value.filter(survey => 
    survey.is_active && 
    !survey.is_locked && 
    survey.access_info.can_submit && 
    !survey.access_info.has_submitted
  ).length
})

const visiblePages = computed(() => {
  const totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)
  const current = pagination.value.currentPage
  const delta = 2
  const pages: number[] = []
  
  const start = Math.max(1, current - delta)
  const end = Math.min(totalPages, current + delta)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadSurveys = async () => {
  isLoading.value = true
  error.value = null
  timeoutError.value = false
  
  try {
    const filters: SharedSurveysFilters = {
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize,
      ordering: sortOrder.value
    }
    
    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim()
    }
    
    if (visibilityFilter.value) {
      filters.visibility = visibilityFilter.value as 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
    }
    
    if (activeFilter.value) {
      filters.is_active = activeFilter.value === 'true'
    }
    
    if (lockedFilter.value) {
      filters.is_locked = lockedFilter.value === 'true'
    }
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })
    
    const response = await Promise.race([
      surveyService.getMySharedSurveys(filters),
      timeoutPromise
    ]) as PaginatedApiResponse<SharedSurvey> | ApiResponse<SharedSurveysResponse>
    
    // Handle different response formats
    if ('count' in response) {
      // Paginated response
      const paginatedResponse = response as PaginatedApiResponse<SharedSurvey>
      surveys.value = paginatedResponse.results
      pagination.value.total = paginatedResponse.count
      
      // Estimate access summary from current page data
      const authCount = surveys.value.filter(s => s.visibility === 'AUTH' || s.visibility === 'PUBLIC').length
      const privateCount = surveys.value.filter(s => s.visibility === 'PRIVATE' || s.visibility === 'GROUPS').length
      accessSummary.value = {
        auth_surveys: authCount,
        private_shared: privateCount
      }
    } else {
      // Wrapped API response
      const apiResponse = response as ApiResponse<SharedSurveysResponse>
      surveys.value = apiResponse.data.surveys
      pagination.value.total = apiResponse.data.total_count
      accessSummary.value = apiResponse.data.access_summary
    }
    
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      timeoutError.value = true
      await Swal.fire({
        title: 'انتهت مهلة الطلب',
        text: 'فشل في تحميل الاستطلاعات خلال 15 ثانية. يرجى المحاولة مرة أخرى.',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else {
      error.value = err.message || 'فشل في تحميل الاستطلاعات'
      await Swal.fire({
        title: 'خطأ في تحميل الاستطلاعات',
        text: err.message || 'فشل في تحميل الاستطلاعات',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    }
    // Logging removed for production
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadSurveys()
}

const refreshPage = () => {
  window.location.reload()
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadSurveys()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadSurveys()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= Math.ceil(pagination.value.total / pagination.value.pageSize)) {
    pagination.value.currentPage = page
    loadSurveys()
  }
}

const canTakeSurvey = (survey: SharedSurvey): boolean => {
  return survey.is_active && 
         !survey.is_locked && 
         survey.access_info.can_submit && 
         !survey.access_info.has_submitted
}

const takeSurvey = (survey: SharedSurvey) => {
  // Navigate to survey taking page
  router.push(`/surveys/take/${survey.id}`)
}

const handleSurveyClick = (survey: SharedSurvey) => {
  // Navigate to survey details or taking page
  if (canTakeSurvey(survey)) {
    takeSurvey(survey)
  } else {
    router.push(`/surveys/view/${survey.id}`)
  }
}

// Lifecycle
onMounted(() => {
  loadSurveys()
})

// Watchers
watch(currentLanguage, () => {
  // Reload data when language changes for proper date formatting
  loadSurveys()
})

const IconBadgeCheck = defineComponent({
  name: 'IconBadgeCheck',
  setup() {
    return () =>
      h(
        'svg',
        {
          width: 24,
          height: 24,
          viewBox: '0 0 24 24',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        [
          h('path', {
            d: 'M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z',
            stroke: '#181B25',
            'stroke-width': '1.5',
          }),
          h('path', {
            d: 'M8 10H16',
            stroke: '#181B25',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
          }),
          h('path', {
            d: 'M8 14H13',
            stroke: '#181B25',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
          }),
        ]
      )
  },
})
 const IconBadgeCheck2 = defineComponent({
  name: 'IconBadgeCheck',
  setup() {
    return () =>
      h(
        'svg',
        {
          width: 24,
          height: 24,
          viewBox: '0 0 24 24',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        [
          h('path', {
            d: 'M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z',
            stroke: '#181B25',
            'stroke-width': '1.5',
          }),
          h('path', {
            d: 'M8 10H16',
            stroke: '#181B25',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
          }),
          h('path', {
            d: 'M8 14H13',
            stroke: '#181B25',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
          }),
          h('rect', {
            x: '17',
            y: '0',
            width: '5',
            height: '5',
            rx: '2.5',
            fill: '#D44333',
          }),
        ]
      )
  },
})

/* --- computed cards --- */
const kpiCards = computed(() => {
  const rtl = unref(isRTL)
  const summary = accessSummary.value
  const totalShared = (summary?.auth_surveys ?? 0) + (summary?.private_shared ?? 0)
  const authCount = summary?.auth_surveys ?? 0
  const privateCount = summary?.private_shared ?? 0
  const availableCount = availableSurveysCount.value

  const surveysUnit = rtl ? 'استطلاع' : 'surveys'

  // Get trend values from backend (if available)
  const authTrend = (summary as any)?.auth_surveys_trend ?? null
  const privateTrend = (summary as any)?.private_shared_trend ?? null
  const totalTrend = authTrend !== null && privateTrend !== null 
    ? ((authTrend + privateTrend) / 2) 
    : null

  return [
    {
      key: 'total-shared',
      title: t('survey.shared.overview.totalShared'),
      value: totalShared,
      unit: surveysUnit,
      trend: totalTrend,
      icon: IconBadgeCheck,
      dot: false
    },
    {
      key: 'auth-shared',
      title:t('survey.shared.overview.authSurveys'),
      value: authCount,
      unit: surveysUnit,
      trend: authTrend,
      icon: IconBadgeCheck2,
      dot: true
    },
    {
      key: 'private-shared',
      title: t('survey.shared.overview.privateShared'),
      value: privateCount,
      unit: surveysUnit,
      trend: privateTrend,
      icon: IconBadgeCheck,
      dot: false
    },
    {
      key: 'available',
      title: t('survey.shared.overview.available'),
      value: availableCount,
      unit: surveysUnit,
      trend: null,
      icon: IconBadgeCheck,
      dot: false
    },
   
  ]
})
</script>

<style module src="./Surveys.module.css"></style>

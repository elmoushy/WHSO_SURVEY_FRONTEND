<template>
  <div :class="$style.surveyPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Main Survey Control View -->
    <!-- Hero -->
    <section :class="$style.heroSection">
        <div :class="$style.heroContent">
          <div :class="$style.heroText">
            <div :class="$style.sectionHerto">
              <h1>{{ t('survey.title') }}</h1>
            </div>
        </div>

          <div :class="$style.heroActions">
            <!-- Create Survey -->
            <div :class="$style.createButtonContainer" ref="createButtonRef">
              <button :class="$style.primaryButton" @click="toggleCreateDropdown">
                <i class="fas fa-plus"></i>
                {{ t('survey.list.createSurvey') }}
                <i :class="['fas', showCreateDropdown ? 'fa-chevron-up' : 'fa-chevron-down', $style.dropdownIcon]"></i>
              </button>
            </div>

            <!-- Dropdown (teleported) -->
            <Teleport to="body">
              <div
                v-if="showCreateDropdown"
                :class="$style.createDropdown"
                :style="dropdownPosition"
                data-dropdown="create-survey"
                @mousedown.prevent
              >
                <button :class="$style.dropdownItem" @click="createDefaultSurvey">
                  <i class="fas fa-file-alt"></i>
                  <div :class="$style.dropdownItemContent">
                    <span :class="$style.dropdownItemTitle">{{ isRTL ? 'استطلاع افتراضي' : 'Default Survey' }}</span>
                    <span :class="$style.dropdownItemDescription">
                      {{ isRTL ? 'إنشاء استطلاع فارغ من البداية' : 'Create a blank survey from scratch' }}
                    </span>
                  </div>
                </button>

                <button :class="$style.dropdownItem" @click="openTemplateGallery">
                  <i class="fas fa-layer-group"></i>
                  <div :class="$style.dropdownItemContent">
                    <span :class="$style.dropdownItemTitle">{{ isRTL ? 'من قالب' : 'From Template' }}</span>
                    <span :class="$style.dropdownItemDescription">
                      {{ isRTL ? 'اختر من القوالب الجاهزة أو استطلاعاتك السابقة' : 'Choose from ready templates or your previous surveys' }}
                    </span>
                  </div>
                </button>
              </div>
            </Teleport>
          </div>
        </div>
      </section>

<!-- Stats -->
<section :class="$style.statsSection" v-if="analytics">
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
        <span :class="$style.kpiUnit">{{ isRTL ? 'استطلاع' : 'surveys' }}</span>
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



      <!-- Controls / Filters -->
     

      <!-- Bulk actions -->
      <div v-if="selectedSurveys?.length > 0" :class="$style.bulkActionsBar">
        <div :class="$style.bulkInfo">
          <span :class="$style.selectedCount">{{ selectedSurveys?.length || 0 }}</span>
          <span>{{ t('survey.list.selectedItems') }}</span>
        </div>

        <div :class="$style.bulkActions">
          <button :class="$style.bulkButton" @click="bulkActivate" :disabled="bulkOperationLoading">
            <i class="fas fa-play"></i>
            {{ t('survey.bulk.operations.activate') }}
          </button>
          <button :class="$style.bulkButton" @click="bulkDeactivate" :disabled="bulkOperationLoading">
            <i class="fas fa-pause"></i>
            {{ t('survey.bulk.operations.deactivate') }}
          </button>
          <button :class="[$style.bulkButton, $style.danger]" @click="bulkDelete" :disabled="bulkOperationLoading">
            <i class="fas fa-trash"></i>
            {{ t('survey.bulk.operations.delete') }}
          </button>
        </div>
      </div>

      <!-- Grid view -->
      <section  :class="$style.surveysSection">
         <section :class="$style.controlsSection">
        <div :class="$style.filtersGroup">
          <input
            type="text"
            :class="$style.searchInput"
            :placeholder="t('survey.list.searchPlaceholder')"
            v-model="searchQuery"
            @input="handleSearch"
          />

          <select :class="$style.filterSelect" v-model="selectedFilter" @change="applyFilters">
            <option value="all">{{ t('survey.filters.all') }}</option>
            <option value="active">{{ t('survey.filters.active') }}</option>
            <option value="inactive">{{ t('survey.filters.inactive') }}</option>
            <option value="private">{{ t('survey.filters.private') }}</option>
            <option value="auth_required">{{ t('survey.filters.auth') }}</option>
            <option value="public">{{ t('survey.filters.public') }}</option>
          </select>

          <select :class="$style.filterSelect" v-model="selectedSort" @change="applySorting">
            <option value="newest">{{ t('survey.sorting.newest') }}</option>
            <option value="oldest">{{ t('survey.sorting.oldest') }}</option>
            <option value="title_asc">{{ t('survey.sorting.titleAZ') }}</option>
            <option value="title_desc">{{ t('survey.sorting.titleZA') }}</option>
            <option value="most_responses">{{ t('survey.sorting.mostResponses') }}</option>
          </select>
        </div>

        <div :class="$style.viewControls">
          <button :class="$style.secondaryButton" @click="refreshData">
            <i class="fas fa-sync-alt"></i>
            {{ t('survey.list.refreshData') }}
          </button>
        </div>
      </section>
      <div v-if="!isLoading && surveys?.length > 0">

        <div :class="$style.surveysGrid" v-if="viewMode === 'grid'">
          <div
            v-for="survey in paginatedSurveys"
            :key="survey.id"
            :class="[$style.surveyCard, { [$style.selected]: selectedSurveys?.includes(survey.id) }]"
            @click="toggleSurveySelection(survey.id)"
            :aria-pressed="selectedSurveys?.includes(survey.id)"
          >
            <div :class="$style.cardHeader">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="44" height="44" rx="22" fill="#F5F7FA"/>
<path d="M13 20C13 16.2288 13 14.3431 14.1716 13.1716C15.3431 12 17.2288 12 21 12H23C26.7712 12 28.6569 12 29.8284 13.1716C31 14.3431 31 16.2288 31 20V24C31 27.7712 31 29.6569 29.8284 30.8284C28.6569 32 26.7712 32 23 32H21C17.2288 32 15.3431 32 14.1716 30.8284C13 29.6569 13 27.7712 13 24V20Z" stroke="#A17D23" stroke-width="1.5"/>
<path d="M18 20H26" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round"/>
<path d="M18 24H23" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round"/>
</svg>

              <div :class="$style.cardStatus">
                <span :class="[$style.statusBadge, $style[survey.is_active ? 'active' : 'inactive']]">
                  {{ survey.is_active ? t('survey.status.active') : t('survey.status.inactive') }}
                </span>
                <span v-if="survey.status === 'draft'" :class="[$style.statusBadge, $style.draft]">
                  {{ isRTL ? 'مسودة' : 'Draft' }}
                </span>
                <!-- <span v-if="survey.visibility" :class="[$style.statusBadge, $style[survey.visibility.toLowerCase()]]">
                  {{ t(`survey.status.${survey.visibility.toLowerCase()}`) }}
                </span> -->
                <span v-else :class="[$style.statusBadge, $style.private]">
                  {{ t('survey.status.private') }}
                </span>
              </div>
             
            </div>
<div :class="$style.cardContent">
            <h3 :class="$style.cardTitle" :title="survey.title">{{ survey.title }}</h3>
            <p :class="$style.cardDescription" :title="survey.description">{{ survey.description }}</p>
</div>

            <div :class="$style.cardDivider"></div>

            <div :class="$style.cardChips">
              <div :class="$style.chip">
                <i class="fas fa-users" :class="$style.chipIcon"></i>
                <span>{{ survey.response_count }} {{ t('survey.card.responses') }}</span>
              </div>
              <div :class="$style.chip">
                <i class="fas fa-question-circle" :class="$style.chipIcon"></i>
                <span>{{ survey.questions?.length || 0 }} {{ t('survey.questions.title').toLowerCase() }}</span>
              </div>
              <div :class="$style.chip">
                <i class="fas fa-calendar-alt" :class="$style.chipIcon"></i>
                <span>{{ formatDate(survey.updated_at, survey.created_at) }}</span>
              </div>
              <div :class="$style.chip">
                <i class="fas fa-user" :class="$style.chipIcon"></i>
                <span>{{ t('survey.card.createdBy') }}: {{ getCreatorDisplayName(survey.creator_email) }}</span>
              </div>
            </div>

            <div :class="$style.cardActions">
              <button
                v-if="survey.status === 'draft'"
                :class="[$style.actionButton, $style.primaryAction]"
                @click.stop="submitDraftSurvey(survey.id)"
                :title="isRTL ? 'إرسال الاستطلاع' : 'Submit Survey'"
              >
                <i class="fas fa-paper-plane"></i>
                <span :class="$style.actionButtonText">{{ isRTL ? 'إرسال' : 'Submit' }}</span>
              </button>

              <button
                v-if="survey.status !== 'draft'"
                :class="[$style.actionButton, $style.outlinedAction]"
                @click.stop="viewResponses(survey.id)"
                :title="t('survey.card.viewResponses')"
              >
                <i class="fas fa-eye"></i>
                <span :class="$style.actionButtonText">{{ t('survey.card.viewResponses') }}</span>
              </button>

              <button
                v-if="survey.status === 'draft'"
                :class="[$style.actionButton, $style.outlinedAction]"
                @click.stop="editSurveyWithEditor(survey)"
                :title="isRTL ? 'تحرير باستخدام المحرر' : 'Edit with Editor'"
              >
                <i class="fas fa-pen"></i>
                <span :class="$style.actionButtonText">{{ isRTL ? 'محرر' : 'Editor' }}</span>
              </button>

              <button
                v-if="survey.status === 'submitted' && survey.response_count === 0"
                :class="[$style.actionButton, $style.outlinedAction]"
                @click.stop="manageSurveyAccess(survey)"
                :title="isRTL ? 'إدارة الوصول' : 'Manage Access'"
              >
                <i class="fas fa-share-alt"></i>
                <span :class="$style.actionButtonText">{{ isRTL ? 'إدارة الوصول' : 'Manage Access' }}</span>
              </button>

              <button
                v-if="survey.status !== 'submitted' && survey.status !== 'draft'"
                :class="[$style.actionButton, $style.outlinedAction]"
                @click.stop="manageSurveyAccess(survey)"
                :title="t('survey.card.manageAccess')"
              >
                <i class="fas fa-share-alt"></i>
                <span :class="$style.actionButtonText">{{ t('survey.card.share') }}</span>
              </button>

              <button
                v-if="survey.visibility === 'PUBLIC' && survey.status !== 'draft'"
                :class="[$style.actionButton, $style.outlinedAction]"
                @click.stop="openLinkSharingModal(survey)"
                :title="t('survey.card.shareLink')"
              >
                <i class="fas fa-link"></i>
                <span :class="$style.actionButtonText">{{ t('survey.card.shareLink') }}</span>
              </button>

              <button
                :class="[$style.actionButton, $style.dangerAction]"
                @click.stop="deleteSurvey(survey.id)"
                :title="t('survey.card.delete')"
              >
                <i class="fas fa-trash"></i>
                <span :class="$style.actionButtonText">{{ t('survey.card.delete') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- (Optional) List view preserved for later -->
        <div :class="$style.surveysList" v-else-if="viewMode === 'list'">
          <div :class="$style.listHeader">
            <div :class="$style.listHeaderCheckbox">
              <input
                type="checkbox"
                :class="$style.headerCheckbox"
                :checked="selectedSurveys?.length === paginatedSurveys?.length && paginatedSurveys?.length > 0"
                @change="toggleSelectAll"
              />
            </div>
            <div :class="$style.listHeaderTitle">{{ t('survey.list.title') }}</div>
            <div :class="$style.listHeaderStats">{{ t('survey.list.stats') }}</div>
            <div :class="$style.listHeaderStatus">{{ t('survey.list.status') }}</div>
            <div :class="$style.listHeaderDate">{{ t('survey.list.lastUpdated') }}</div>
            <div :class="$style.listHeaderActions">{{ t('survey.list.actions') }}</div>
          </div>

          <div
            v-for="survey in paginatedSurveys"
            :key="survey.id"
            :class="[$style.listItem, { [$style.selected]: selectedSurveys?.includes(survey.id) }]"
            @click="toggleSurveySelection(survey.id)"
          >
            <div :class="$style.listItemCheckbox">
              <input
                type="checkbox"
                :class="$style.itemCheckbox"
                :checked="selectedSurveys?.includes(survey.id)"
                @click.stop="toggleSurveySelection(survey.id)"
              />
            </div>

            <div :class="$style.listItemContent">
              <h4 :class="$style.listItemTitle">{{ survey.title }}</h4>
              <p :class="$style.listItemDescription">{{ survey.description }}</p>
              <div :class="$style.listItemMeta">
                <span>{{ t('survey.card.createdBy') }}: {{ getCreatorDisplayName(survey.creator_email) }}</span>
              </div>
            </div>

            <div :class="$style.listItemStats">
              <div :class="$style.listStatItem">
                <i class="fas fa-users" :class="$style.listStatIcon"></i>
                <span>{{ survey.response_count }}</span>
              </div>
              <div :class="$style.listStatItem">
                <i class="fas fa-question-circle" :class="$style.listStatIcon"></i>
                <span>{{ survey.questions?.length || 0 }}</span>
              </div>
            </div>

            <div :class="$style.listItemStatus">
              <span :class="[$style.statusBadge, $style[survey.is_active ? 'active' : 'inactive']]">
                {{ survey.is_active ? t('survey.status.active') : t('survey.status.inactive') }}
              </span>
              <span v-if="survey.status === 'draft'" :class="[$style.statusBadge, $style.draft]">
                {{ isRTL ? 'مسودة' : 'Draft' }}
              </span>
              <span v-if="survey.visibility" :class="[$style.statusBadge, $style[survey.visibility.toLowerCase()]]">
                {{ t(`survey.status.${survey.visibility.toLowerCase()}`) }}
              </span>
              <span v-else :class="[$style.statusBadge, $style.private]">
                {{ t('survey.status.private') }}
              </span>
            </div>

            <div :class="$style.listItemDate">
              {{ formatDate(survey.updated_at, survey.created_at) }}
            </div>

            <div :class="$style.listItemActions">
              <div :class="[$style.actionsDropdown, 'actionsDropdown']">
                <button :class="$style.actionsToggle" @click.stop="toggleActionMenu(survey.id)">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div :class="[$style.actionsMenu, { [$style.active]: activeActionMenu === survey.id }]">
                  <button v-if="survey.status === 'draft'" :class="$style.actionMenuItem" @click.stop="editSurvey(survey)">
                    <i class="fas fa-edit"></i>
                    {{ t('survey.card.edit') }}
                  </button>
                  <button
                    v-if="survey.status === 'draft'"
                    :class="[$style.actionMenuItem, $style.editorAction]"
                    @click.stop="editSurveyWithEditor(survey)"
                  >
                    <i class="fas fa-pen-fancy"></i>
                    {{ isRTL ? 'محرر' : 'Editor' }}
                  </button>
                  <button
                    v-if="survey.status === 'draft'"
                    :class="[$style.actionMenuItem, $style.submitAction]"
                    @click.stop="submitDraftSurvey(survey.id)"
                  >
                    <i class="fas fa-paper-plane"></i>
                    {{ isRTL ? 'إرسال' : 'Submit' }}
                  </button>
                  <button
                    v-if="survey.status === 'submitted' && survey.response_count === 0"
                    :class="$style.actionMenuItem"
                    @click.stop="manageSurveyAccess(survey)"
                  >
                    <i class="fas fa-share-alt"></i>
                    {{ isRTL ? 'إدارة الوصول' : 'Manage Access' }}
                  </button>
                  <button
                    v-if="survey.status !== 'submitted' && survey.status !== 'draft'"
                    :class="$style.actionMenuItem"
                    @click.stop="manageSurveyAccess(survey)"
                  >
                    <i class="fas fa-share-alt"></i>
                    {{ t('survey.card.share') }}
                  </button>
                  <button :class="$style.actionMenuItem" @click.stop="viewResponses(survey.id)">
                    <i class="fas fa-chart-bar"></i>
                    {{ t('survey.card.viewResponses') }}
                  </button>
                  <button :class="$style.actionMenuItem" @click.stop="cloneSurvey(survey.id)">
                    <i class="fas fa-copy"></i>
                    {{ t('survey.card.clone') }}
                  </button>
                  <button :class="[$style.actionMenuItem, $style.danger]" @click.stop="deleteSurvey(survey.id)">
                    <i class="fas fa-trash"></i>
                    {{ t('survey.card.delete') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
      <div :class="$style.paginationSection">
        <div :class="$style.paginationInfo">
          {{ t('common.pagination.showing') }}
          {{ paginationRange.start }} - {{ paginationRange.end }}
          {{ t('common.pagination.of') }} {{ pagination.total }}
        </div>

        <div :class="$style.paginationControls">
          <button
            :class="$style.pageButton"
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
          >
            <i class="fas fa-chevron-right" v-if="isRTL"></i>
            <i class="fas fa-chevron-left" v-else></i>
            {{ t('common.pagination.previous') }}
          </button>

          <span :class="$style.pageNumbers">
            <template v-for="page in visiblePages" :key="`page-${page}`">
              <span v-if="page === -1" :class="$style.ellipsis">…</span>
              <button
                v-else
                :class="[$style.pageNumber, { [$style.pageNumberActive]: page === pagination.currentPage }]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
            </template>
          </span>

          <button
            :class="$style.pageButton"
            @click="changePage(pagination.currentPage + 1)"
            :disabled="!pagination.hasNext && pagination.currentPage >= pagination.totalPages"
          >
            {{ t('common.pagination.next') }}
            <i class="fas fa-chevron-left" v-if="isRTL"></i>
            <i class="fas fa-chevron-right" v-else></i>
          </button>
        </div>
      </div>
              </div>

      </section>

      <!-- Empty -->
      <div v-if="!isLoading && surveys?.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon"><i class="fas fa-poll-h"></i></div>
        <h3 :class="$style.emptyTitle">{{ t('survey.list.noSurveys') }}</h3>
        <button :class="$style.primaryButton" @click="showCreateModal = true">
          <i class="fas fa-plus"></i>
          {{ t('survey.list.createSurvey') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" :class="$style.loadingContainer">
        <div :class="$style.loadingSpinner"></div>
      </div>

      <!-- Modals -->
      <SurveyModal v-if="showCreateModal" :survey="selectedSurveyForEdit" @save="handleSurveySave" @cancel="closeModal" />

      <AnalyticsModal v-if="showAnalytics" :analytics="analytics" @close="showAnalytics = false" />

      <SurveyAccessModal
        v-if="showAccessModal && selectedSurveyForAccess"
        :survey="selectedSurveyForAccess"
        :is-submission-flow="isSubmissionFlow"
        @save="handleAccessSave"
        @cancel="closeAccessModal"
      />

      <LinkSharingModal
        v-if="showLinkSharingModal && selectedSurveyForLinkSharing"
        :is-visible="showLinkSharingModal"
        :survey="selectedSurveyForLinkSharing"
        :public-link="publicLinkForSharing"
        @close="closeLinkSharingModal"
        @link-generated="handleLinkGenerated"
        @status-update="handleStatusUpdate"
      />

      <TemplateGalleryModal
        v-if="showTemplateGallery"
        @close="closeTemplateGallery"
        @template-selected="handleTemplateSelected"
        @recent-survey-selected="handleRecentSurveySelected"
        @create-new-template="handleCreateNewTemplate"
      />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import type {
  Survey,
  SurveyAnalytics,
  SurveyVisibility,
  QuestionType,
  PublicContactMethod,
  PredefinedTemplate,
  SurveyTemplate,
  RecentSurvey
} from '../../types/survey.types'
import SurveyModal from '../../components/SurveyModal/SurveyModal.vue'
import AnalyticsModal from '../../components/AnalyticsModal/AnalyticsModal.vue'
import SurveyAccessModal from '../../components/SurveyAccessModal/SurveyAccessModal.vue'
import LinkSharingModal from '../../components/LinkSharingModal/LinkSharingModal.vue'
import TemplateGalleryModal from '../../components/TemplateGalleryModal/TemplateGalleryModal.vue'
import Swal from 'sweetalert2'

// Router & Store
const router = useRouter()
const route = useRoute()
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)

// Theme & i18n
const isRTL = computed(() => currentLanguage.value === 'ar')
const t = store.t

// State
const surveys = ref<Survey[]>([])
const analytics = ref<SurveyAnalytics | null>(null)
const isLoading = ref(false)

const searchQuery = ref('')
const selectedFilter = ref('all')
const selectedSort = ref('newest')
const viewMode = ref<'grid' | 'list'>('grid')

const selectedSurveys = ref<string[]>([])
const bulkOperationLoading = ref(false)
const activeActionMenu = ref<string | null>(null)

const createButtonRef = ref<HTMLElement | null>(null)
const showCreateDropdown = ref(false)

const showCreateModal = ref(false)
const showAnalytics = ref(false)
const showAccessModal = ref(false)
const showLinkSharingModal = ref(false)
const showTemplateGallery = ref(false)

const selectedSurveyForEdit = ref<Survey | null>(null)
const selectedSurveyForAccess = ref<Survey | null>(null)
const selectedSurveyForLinkSharing = ref<Survey | null>(null)
const publicLinkForSharing = ref<any | null>(null)
const isSubmissionFlow = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(0)
const totalItems = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)

// Debounced search
const debouncedSearch = ref('')
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null)

// Dropdown absolute position (teleport)
const dropdownPosition = computed(() => {
  if (!createButtonRef.value) {
    return { position: 'fixed', top: '0px', left: '0px', zIndex: '9999', width: 'auto' } as const
  }
  const rect = createButtonRef.value.getBoundingClientRect()
  const style: Record<string, string> = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    zIndex: '9999',
    width: `${rect.width}px`
  }
  if (isRTL.value) style.right = `${window.innerWidth - rect.right}px`
  else style.left = `${rect.left}px`
  return style
})

const pagination = computed(() => ({
  currentPage: currentPage.value,
  pageSize: itemsPerPage.value,
  total: totalItems.value,
  totalPages: totalPages.value,
  hasNext: hasNext.value,
  hasPrevious: hasPrevious.value
}))

const paginationRange = computed(() => {
  if (totalItems.value === 0) {
    return { start: 0, end: 0 }
  }
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
  return { start, end }
})

// Visible page numbers (with ellipsis)
const visiblePages = computed(() => {
  const pages: number[] = []
  if (totalPages.value <= 7) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  } else {
    pages.push(1)
    let start = Math.max(2, currentPage.value - 2)
    let end = Math.min(totalPages.value - 1, currentPage.value + 2)
    if (start > 2) pages.push(-1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages.value - 1) pages.push(-1)
    if (totalPages.value > 1) pages.push(totalPages.value)
  }
  return pages
})

// API loads
const loadSurveys = async (resetPage = false) => {
  try {
    isLoading.value = true
    if (resetPage) currentPage.value = 1

    const params: any = {
      page: currentPage.value,
      per_page: itemsPerPage.value
    }
    if (debouncedSearch.value.trim()) params.search = debouncedSearch.value.trim()
    if (selectedFilter.value && selectedFilter.value !== 'all') params.survey_status = selectedFilter.value
    if (selectedSort.value) params.sort_by = selectedSort.value

    const response = await surveyService.getAllSurveys(params)

    if (response && 'results' in response) {
      surveys.value = response.results.map((s: Survey) => ({ ...s, questions: s.questions || [] }))
      totalPages.value = response.total_pages || 0
      const totalCount = response.count ?? response.results?.length ?? 0
      totalItems.value = typeof totalCount === 'number' ? totalCount : 0
      itemsPerPage.value = response.per_page ?? itemsPerPage.value
      currentPage.value = response.current_page ?? currentPage.value
      if (totalPages.value === 0 && totalItems.value > 0 && itemsPerPage.value > 0) {
        totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value)
      }
      hasNext.value = !!response.next
      hasPrevious.value = !!response.previous
    } else {
      surveys.value = []
      totalPages.value = 0
      totalItems.value = 0
      hasNext.value = false
      hasPrevious.value = false
    }
  } catch (error) {
    // Fallback demo data for UI
    surveys.value = [
      {
        id: '1',
        title: 'Customer Satisfaction Survey 2024',
        description: 'Help us improve our services by sharing your feedback and experience with our products.',
        visibility: 'PUBLIC' as SurveyVisibility,
        public_contact_method: 'email' as PublicContactMethod,
        shared_with: [],
        creator: 1,
        creator_email: 'admin@weaponpowercloud.com',
        is_locked: false,
        is_active: true,
        start_date: null,
        end_date: null,
        status: 'active',
        is_currently_active: true,
        created_at: '2024-08-01T10:00:00Z',
        updated_at: '2024-08-02T15:30:00Z',
        response_count: 147,
        shared_with_emails: [],
        can_submit: true,
        has_submitted: false,
        questions: [
          { id: '1', text: 'How satisfied are you with our service?', question_type: 'rating' as QuestionType, is_required: true, order: 1, options: '', created_at: '', updated_at: '' },
          { id: '2', text: 'What can we improve?', question_type: 'textarea' as QuestionType, is_required: false, order: 2, options: '', created_at: '', updated_at: '' }
        ]
      },
      {
        id: '2',
        title: 'Product Feature Feedback',
        description: 'Your input on our latest features helps us create better experiences for all users.',
        visibility: 'AUTH' as SurveyVisibility,
        shared_with: [1],
        creator: 2,
        creator_email: 'product@weaponpowercloud.com',
        is_locked: false,
        is_active: true,
        start_date: null,
        end_date: null,
        status: 'active',
        is_currently_active: true,
        created_at: '2024-07-25T14:20:00Z',
        updated_at: '2024-08-01T09:45:00Z',
        response_count: 89,
        shared_with_emails: ['team@weaponpowercloud.com'],
        can_submit: true,
        has_submitted: false,
        questions: [
          { id: '3', text: 'Which features do you use most?', question_type: 'multiple_choice' as QuestionType, is_required: true, order: 1, options: '["Analytics", "Reports", "Dashboards", "Surveys"]', created_at: '', updated_at: '' }
        ]
      },
      {
        id: '3',
        title: 'Employee Engagement Survey',
        description: 'Internal survey to measure team satisfaction and identify areas for workplace improvement.',
        visibility: 'PRIVATE' as SurveyVisibility,
        shared_with: [1, 3],
        creator: 3,
        creator_email: 'hr@weaponpowercloud.com',
        is_locked: true,
        is_active: false,
        start_date: null,
        end_date: null,
        status: 'inactive',
        is_currently_active: false,
        created_at: '2024-07-20T08:15:00Z',
        updated_at: '2024-07-22T16:00:00Z',
        response_count: 23,
        shared_with_emails: ['hr@weaponpowercloud.com', 'management@weaponpowercloud.com'],
        can_submit: false,
        has_submitted: false,
        questions: [
          { id: '4', text: 'How would you rate your work-life balance?', question_type: 'rating' as QuestionType, is_required: true, order: 1, options: '', created_at: '', updated_at: '' },
          { id: '5', text: 'Do you feel valued at work?', question_type: 'yes_no' as QuestionType, is_required: true, order: 2, options: '', created_at: '', updated_at: '' }
        ]
      }
    ]
    totalPages.value = 1
    totalItems.value = surveys.value.length
    hasNext.value = false
    hasPrevious.value = false
  } finally {
    isLoading.value = false
  }
}

const loadAnalytics = async () => {
  try {
    const response = await surveyService.getAnalyticsDashboard()
    analytics.value = response.data
  } catch {
    // Fallback demo analytics
    analytics.value = {
      total_surveys: 12,
      active_surveys: 8,
      total_responses: 1247,
      avg_response_rate: 73.5,
      recent_activity: {
        new_surveys_this_week: 3,
        new_responses_this_week: 89
      },
      top_surveys: []
    }
  }
}

const refreshData = async () => {
  await Promise.all([loadSurveys(), loadAnalytics()])
}

// Search/Filters/Sorting
const handleSearch = () => {
  if (searchDebounceTimer.value) clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = setTimeout(() => {
    debouncedSearch.value = searchQuery.value
    loadSurveys(true)
  }, 500)
}
const applyFilters = () => loadSurveys(true)
const applySorting = () => loadSurveys(true)

// Pagination actions
const paginatedSurveys = computed(() => surveys.value || [])
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadSurveys()
  }
}
const changePage = (page: number) => {
  if (page === currentPage.value) return
  goToPage(page)
}


// Selection & actions
const toggleSurveySelection = (id: string) => {
  const idx = selectedSurveys.value.indexOf(id)
  if (idx > -1) selectedSurveys.value.splice(idx, 1)
  else selectedSurveys.value.push(id)
}
const toggleSelectAll = () => {
  const current = paginatedSurveys.value
  if (selectedSurveys.value.length === current.length && current.length > 0) selectedSurveys.value = []
  else selectedSurveys.value = current.map(s => s.id)
}

// CRUD helpers
const editSurvey = (survey: Survey) => {
  selectedSurveyForEdit.value = survey
  showCreateModal.value = true
}

const editSurveyWithEditor = async (survey: Survey) => {
  router.push({
    name: 'SurveyEdit',
    params: { id: survey.id }
  })
}

const manageSurveyAccess = (survey: Survey) => {
  selectedSurveyForAccess.value = survey
  isSubmissionFlow.value = false
  showAccessModal.value = true
}

const openLinkSharingModal = (survey: Survey) => {
  selectedSurveyForLinkSharing.value = survey
  publicLinkForSharing.value = null
  showLinkSharingModal.value = true
}

const handleAccessSave = async (_data: any) => {
  // If needed you can wire post-save behavior here
  showAccessModal.value = false
  selectedSurveyForAccess.value = null
  isSubmissionFlow.value = false
  
  // ✅ Clear query parameters if they exist
  if (route.query.openAccess || route.query.surveyId || route.query.isSubmission) {
    router.replace({ name: 'SurveyControl', query: {} })
  }
  
  await loadSurveys()
}

const closeAccessModal = () => {
  showAccessModal.value = false
  selectedSurveyForAccess.value = null
  isSubmissionFlow.value = false
  
  // ✅ Clear query parameters if they exist
  if (route.query.openAccess || route.query.surveyId || route.query.isSubmission) {
    router.replace({ name: 'SurveyControl', query: {} })
  }
}
const closeLinkSharingModal = () => {
  showLinkSharingModal.value = false
  selectedSurveyForLinkSharing.value = null
  publicLinkForSharing.value = null
}
const handleLinkGenerated = (link: any) => { publicLinkForSharing.value = link }
const handleStatusUpdate = (_msg: string, _type: string) => {}

const viewResponses = (surveyId: string) => router.push({ name: 'SurveyResponses', params: { surveyId } })

const cloneSurvey = async (surveyId: string) => {
  try {
    await surveyService.cloneSurvey(surveyId)
    await loadSurveys()
  } catch {
    Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في نسخ الاستطلاع', confirmButtonText: 'موافق' })
  }
}

const deleteSurvey = async (surveyId: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'تأكيد الحذف',
    text: 'هل أنت متأكد من أنك تريد حذف هذا الاستطلاع؟',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })
  if (result.isConfirmed) {
    try {
      await surveyService.deleteSurvey(surveyId)
      await Promise.all([loadSurveys(), loadAnalytics()])
      Swal.fire({ icon: 'success', title: 'تم الحذف', text: 'تم حذف الاستطلاع بنجاح', confirmButtonText: 'موافق' })
    } catch {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في حذف الاستطلاع', confirmButtonText: 'موافق' })
    }
  }
}

const submitDraftSurvey = async (surveyId: string) => {
  try {
    const isArabic = store.currentLanguage === 'ar'
    const survey = surveys.value.find(s => s.id === surveyId)
    if (!survey) throw new Error(isArabic ? 'لم يتم العثور على الاستطلاع' : 'Survey not found')

    selectedSurveyForAccess.value = survey
    isSubmissionFlow.value = true
    showAccessModal.value = true
    ;(survey as any)._isSubmissionFlow = true
  } catch (error: any) {
    const isArabic = store.currentLanguage === 'ar'
    Swal.fire({ title: isArabic ? 'خطأ' : 'Error', text: error.message || (isArabic ? 'حدث خطأ' : 'An error occurred'), icon: 'error', confirmButtonText: isArabic ? 'موافق' : 'OK' })
  }
}

const handleSurveySave = async (surveyData: any, existingSurvey?: any) => {
  try {
    if (existingSurvey) {
      closeModal()
      await Promise.all([loadSurveys(), loadAnalytics()])
      return
    }

    if (selectedSurveyForEdit.value) {
      await surveyService.updateSurvey(selectedSurveyForEdit.value.id, surveyData)
    } else {
      const surveyResponse = await surveyService.createSurvey({
        title: surveyData.title,
        description: surveyData.description,
        visibility: surveyData.visibility || 'AUTH',
        is_active: surveyData.is_active
      })

      if (surveyData.questions?.length) {
        const surveyId = surveyResponse.data.id
        for (const q of surveyData.questions) {
          try {
            await surveyService.addQuestion(surveyId, {
              text: q.text,
              question_type: q.question_type,
              options: q.options,
              is_required: q.is_required || false,
              order: q.order
            })
          } catch { /* continue */ }
        }
      }
    }

    closeModal()
    await Promise.all([loadSurveys(), loadAnalytics()])
  } catch {
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: selectedSurveyForEdit.value ? 'فشل في تحديث الاستطلاع' : 'فشل في إنشاء الاستطلاع',
      confirmButtonText: 'موافق'
    })
  }
}

const closeModal = () => {
  showCreateModal.value = false
  selectedSurveyForEdit.value = null
}

// Bulk ops
const bulkActivate = async () => performBulkOperation('activate')
const bulkDeactivate = async () => performBulkOperation('deactivate')
const bulkDelete = async () => {
  const count = selectedSurveys.value?.length || 0
  const result = await Swal.fire({
    icon: 'warning',
    title: 'تأكيد الحذف الجماعي',
    text: `هل أنت متأكد من أنك تريد حذف ${count} استطلاع؟`,
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف الكل',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })
  if (result.isConfirmed) await performBulkOperation('delete')
}
const performBulkOperation = async (operation: string) => {
  try {
    bulkOperationLoading.value = true
    await surveyService.performBulkOperation({ operation: operation as any, survey_ids: selectedSurveys.value || [] })
    selectedSurveys.value = []
    await Promise.all([loadSurveys(), loadAnalytics()])

    let msg = ''
    if (operation === 'activate') msg = 'تم تفعيل الاستطلاعات بنجاح'
    else if (operation === 'deactivate') msg = 'تم إلغاء تفعيل الاستطلاعات بنجاح'
    else if (operation === 'delete') msg = 'تم حذف الاستطلاعات بنجاح'
    else msg = 'تمت العملية بنجاح'
    Swal.fire({ icon: 'success', title: 'نجحت العملية', text: msg, confirmButtonText: 'موافق' })
  } catch {
    Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشلت العملية الجماعية', confirmButtonText: 'موافق' })
  } finally {
    bulkOperationLoading.value = false
  }
}

// Utils
const formatDate = (dateString: string | null | undefined, fallbackDate?: string | null) => {
  const dateToUse = dateString || fallbackDate
  if (!dateToUse) return isRTL.value ? 'تاريخ غير متاح' : 'Date not available'
  const date = new Date(dateToUse)
  if (isNaN(date.getTime())) return isRTL.value ? 'تاريخ غير صحيح' : 'Invalid date'
  const locale = isRTL.value ? 'ar-SA' : 'en-US'
  return date.toLocaleDateString(locale, { calendar: 'gregory' })
}
const getCreatorDisplayName = (email: string | null) => (email ? email : isRTL.value ? 'هذا الشخص لم يعد متاح' : 'This person is no longer available')

// Create dropdown
const toggleCreateDropdown = () => {
  showCreateDropdown.value = !showCreateDropdown.value
}
const handleDropdownClickOutside = (e: MouseEvent) => {
  if (!showCreateDropdown.value) return
  const target = e.target as Element
  if (createButtonRef.value && !createButtonRef.value.contains(target)) {
    const dropdown = document.querySelector('[data-dropdown="create-survey"]')
    if (dropdown && !dropdown.contains(target)) showCreateDropdown.value = false
  }
}
const createDefaultSurvey = () => {
  showCreateDropdown.value = false
  router.push({ name: 'SurveyCreate' })
}
const openTemplateGallery = () => {
  showCreateDropdown.value = false
  showTemplateGallery.value = true
}
const closeTemplateGallery = () => { showTemplateGallery.value = false }
const handleTemplateSelected = (template: PredefinedTemplate | SurveyTemplate) => {
  closeTemplateGallery()
  router.push({ 
    name: 'SurveyCreate',
    query: {
      templateId: template.id,
      type: 'name' in template ? 'predefined' : 'custom'
    }
  })
}
const handleRecentSurveySelected = async (survey: RecentSurvey) => {
  closeTemplateGallery()
  router.push({
    name: 'SurveyCreate',
    query: {
      templateId: survey.id,
      type: 'recent'
    }
  })
}
const handleCreateNewTemplate = () => {
  const isArabic = store.currentLanguage === 'ar'
  Swal.fire({
    icon: 'info',
    title: isArabic ? 'إنشاء قالب محدد مسبقاً' : 'Create Predefined Template',
    html: isArabic
      ? 'سيتم فتح محرر الاستطلاع حيث يمكنك إنشاء قالب جديد.<br><br>بعد إنشاء القالب، سيتم حفظه كقالب محدد مسبقاً متاح لجميع المستخدمين.'
      : 'The survey editor will open where you can create a new template.<br><br>After creating the template, it will be saved as a predefined template available to all users.',
    confirmButtonText: isArabic ? 'متابعة' : 'Continue',
    showCancelButton: true,
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel'
  }).then((r) => {
    if (r.isConfirmed) {
      closeTemplateGallery()
      router.push({
        name: 'SurveyCreate',
        query: { createTemplate: 'true' }
      })
    }
  })
}

// List actions menu
const toggleActionMenu = (id: string) => {
  activeActionMenu.value = activeActionMenu.value === id ? null : id
}
const handleClickOutside = (e: Event) => {
  const target = e.target as Element
  if (!target.closest('.actionsDropdown')) activeActionMenu.value = null
}

// Lifecycle
onMounted(async () => {
  refreshData()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleDropdownClickOutside)
  
  // Check if we need to open access modal (from redirect after publish)
  if (route.query.openAccess === 'true' && route.query.surveyId) {
    const surveyId = route.query.surveyId as string
    
    // First, try to find the survey in the existing list
    let survey = surveys.value.find(s => s.id === surveyId)
    
    // If not found (new draft), fetch it from the API
    if (!survey) {
      try {
        const response = await surveyService.getSurvey(surveyId)
        survey = response.data
      } catch (error) {
        console.error('Failed to load survey for access modal:', error)
      }
    }
    
    if (survey) {
      selectedSurveyForAccess.value = survey
      isSubmissionFlow.value = route.query.isSubmission === 'true'
      showAccessModal.value = true
      
      // ✅ Clear query parameters to prevent modal from reopening on refresh
      router.replace({ name: 'SurveyControl', query: {} })
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleDropdownClickOutside)
  if (searchDebounceTimer.value) clearTimeout(searchDebounceTimer.value)
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
  const a = analytics.value
  const rtl = isRTL.value

  // if backend doesn’t send trends, default to +10
  const trends: Record<string, number | undefined> = (a as any)?.trends || {}

  return [
    {
      key: 'total',
      title: rtl ? 'إجمالي الاستطلاعات' : 'Total surveys',
      value: a?.total_surveys ?? 0,
      trend: trends.total ?? null,
      icon: IconBadgeCheck,
      dot: false
    },
 
    {
      key: 'active',
      title: rtl ? 'الاستطلاعات النشطة' : 'Active surveys',
      value: a?.active_surveys ?? 0,
      trend: trends.active ?? null,
      icon: IconBadgeCheck2,   // with notification dot
      dot: true
    },
    {
      key: 'responses',
      title: rtl ? 'إجمالي الردود' : 'Total responses',
      value: a?.total_responses ?? 0,
      trend: trends.responses ?? null,
      icon: IconBadgeCheck,
      dot: false
    }
  ]
})

</script>

<style module src="./SurveyControl.module.css">

</style>

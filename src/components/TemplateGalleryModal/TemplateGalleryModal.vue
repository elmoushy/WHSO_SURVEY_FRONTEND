<template>
  <Teleport to="body">
    <div :class="$style.modalOverlay">
      <div 
        :class="$style.modalContainer" 
        :data-theme="currentTheme" 
        :dir="isRTL ? 'rtl' : 'ltr'"
        @click.stop
      >
        <!-- Header -->
        <div :class="$style.modalHeader">
          <h2 :class="$style.modalTitle">
            <i class="fas fa-layer-group" :class="$style.modalIcon"></i>
            {{ isRTL ? 'معرض قوالب الاستطلاعات' : 'Survey Templates Gallery' }}
          </h2>
          <button :class="$style.closeButton" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div :class="$style.modalBody">
          <!-- Tabs Navigation -->
          <div :class="$style.tabsContainer">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              :class="[$style.tabButton, { [$style.active]: activeTab === tab.value }]"
              @click="activeTab = tab.value as 'predefined' | 'recent' | 'user'"
            >
              <i :class="['fas', tab.icon]"></i>
              <span>{{ isRTL ? tab.label_ar : tab.label }}</span>
              <span v-if="tab.value !== 'user'" :class="$style.tabBadge">
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" :class="$style.loadingContainer">
            <div :class="$style.loadingSpinner"></div>
            <p>{{ isRTL ? 'جاري التحميل...' : 'Loading...' }}</p>
          </div>

          <!-- Predefined Templates Tab -->
          <div v-else-if="activeTab === 'predefined'" :class="$style.tabContent">
            <div :class="$style.templatesGrid">
              <div
                v-for="template in predefinedTemplates"
                :key="template.id"
                :class="$style.templateCard"
                @click="selectTemplate(template)"
              >
                <div :class="$style.templateIcon">
                  <i :class="['fas', template.icon]"></i>
                </div>

                <div :class="$style.templateContent">
                  <h3 :class="$style.templateTitle">
                    {{ isRTL ? template.name_ar : template.name }}
                  </h3>
                  <p :class="$style.templateDescription">
                    {{ isRTL ? template.description_ar : template.description }}
                  </p>

                  <div :class="$style.templateMeta">
                    <div :class="$style.metaItem">
                      <i class="fas fa-question-circle" :class="$style.metaIcon"></i>
                      <span>{{ template.questions.length }} {{ isRTL ? 'أسئلة' : 'questions' }}</span>
                    </div>
                    <span :class="$style.categoryBadge">
                      {{ getCategoryLabel(template.category) }}
                    </span>
                  </div>
                </div>

                <div :class="$style.templateActions">
                  <button 
                    :class="$style.primaryButton"
                    @click.stop="selectTemplate(template)"
                  >
                    <i class="fas fa-check"></i>
                    <span>{{ isRTL ? 'استخدم هذا القالب' : 'Use Template' }}</span>
                  </button>
                  <button 
                    :class="$style.deleteButton"
                    @click.stop="deletePredefinedTemplate(template.id)"
                    :title="isRTL ? 'حذف القالب' : 'Delete Template'"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State for Predefined -->
            <div v-if="predefinedTemplates.length === 0" :class="$style.emptyState">
              <i class="fas fa-layer-group" :class="$style.emptyIcon"></i>
              <p :class="$style.emptyText">{{ isRTL ? 'لا توجد قوالب محددة مسبقاً' : 'No predefined templates available' }}</p>
            </div>
          </div>

          <!-- Recent Surveys Tab -->
          <div v-else-if="activeTab === 'recent'" :class="$style.tabContent">
            <div :class="$style.surveysGrid">
              <div
                v-for="survey in recentSurveys"
                :key="survey.id"
                :class="$style.surveyCard"
                @click="selectRecentSurvey(survey)"
              >
                <div :class="$style.surveyHeader">
                  <h3 :class="$style.surveyTitle">
                    {{ survey.title }}
                  </h3>
                  <span 
                    :class="[$style.statusBadge, $style[survey.status]]"
                  >
                    {{ getStatusLabel(survey.status) }}
                  </span>
                </div>

                <p :class="$style.surveyDescription">
                  {{ survey.description }}
                </p>

                <div :class="$style.surveyMeta">
                  <div :class="$style.metaItem">
                    <i class="fas fa-users" :class="$style.metaIcon"></i>
                    <span>{{ survey.response_count }} {{ isRTL ? 'إجابات' : 'responses' }}</span>
                  </div>
                  <div :class="$style.metaItem">
                    <i class="fas fa-calendar" :class="$style.metaIcon"></i>
                    <span>{{ formatDate(survey.created_at) }}</span>
                  </div>
                </div>

                <div :class="$style.surveyActions">
                  <button 
                    :class="$style.fullWidthButton"
                    @click.stop="selectRecentSurvey(survey)"
                  >
                    <i class="fas fa-copy"></i>
                    <span>{{ isRTL ? 'استنساخ هذا الاستطلاع' : 'Clone This Survey' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State for Recent Surveys -->
            <div v-if="recentSurveys.length === 0" :class="$style.emptyState">
              <i class="fas fa-history" :class="$style.emptyIcon"></i>
              <p :class="$style.emptyText">{{ isRTL ? 'لا توجد استطلاعات حديثة' : 'No recent surveys' }}</p>
            </div>
          </div>

          <!-- User Templates Tab -->
          <div v-else-if="activeTab === 'user'" :class="$style.tabContent">
            <div :class="$style.templatesGrid">
              <div
                v-for="template in userTemplates"
                :key="template.id"
                :class="$style.templateCard"
              >
                <div :class="$style.templateContent" @click="selectTemplate(template)">
                  <h3 :class="$style.templateTitle">
                    {{ template.name }}
                  </h3>
                  <p :class="$style.templateDescription">
                    {{ template.description }}
                  </p>

                  <div :class="$style.templateMeta">
                    <div :class="$style.metaItem">
                      <i class="fas fa-question-circle" :class="$style.metaIcon"></i>
                      <span>{{ template.questions?.length || 0 }} {{ isRTL ? 'أسئلة' : 'questions' }}</span>
                    </div>
                    <span :class="$style.categoryBadge">
                      {{ getCategoryLabel(template.category) }}
                    </span>
                    <div :class="$style.metaItem">
                      <i class="fas fa-calendar" :class="$style.metaIcon"></i>
                      <span>{{ formatDate(template.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <div :class="$style.templateActions">
                  <button 
                    :class="$style.primaryButton"
                    @click.stop="selectTemplate(template)"
                  >
                    <i class="fas fa-check"></i>
                    <span>{{ isRTL ? 'استخدم' : 'Use' }}</span>
                  </button>
                  <button 
                    :class="$style.deleteButton"
                    @click.stop="deleteUserTemplate(template.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State for User Templates -->
            <div v-if="userTemplates.length === 0" :class="$style.emptyState">
              <i class="fas fa-folder-open" :class="$style.emptyIcon"></i>
              <p :class="$style.emptyText">{{ isRTL ? 'لم تقم بإنشاء أي قوالب بعد' : "You haven't created any templates yet" }}</p>
              <button :class="$style.createTemplateButton" @click="handleCreateTemplate">
                <i class="fas fa-plus"></i>
                <span>{{ isRTL ? 'إنشاء قالب' : 'Create Template' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { templateService } from '../../services/templateService'
import type { PredefinedTemplate, RecentSurvey, SurveyTemplate } from '../../types/survey.types'
import Swal from 'sweetalert2'

// Emits
const emit = defineEmits<{
  close: []
  templateSelected: [template: PredefinedTemplate | SurveyTemplate]
  recentSurveySelected: [survey: RecentSurvey]
  createNewTemplate: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// State
const activeTab = ref<'predefined' | 'recent' | 'user'>('predefined')
const isLoading = ref(false)
const predefinedTemplates = ref<PredefinedTemplate[]>([])
const recentSurveys = ref<RecentSurvey[]>([])
const userTemplates = ref<SurveyTemplate[]>([])

// Tabs configuration
const tabs = computed(() => [
  {
    value: 'predefined',
    label: 'Predefined Templates',
    label_ar: 'قوالب ',
    icon: 'fa-star',
    count: predefinedTemplates.value.length
  },
  {
    value: 'recent',
    label: 'Recent Surveys',
    label_ar: 'الاستطلاعات الحديثة',
    icon: 'fa-history',
    count: recentSurveys.value.length
  },
  {
    value: 'user',
    label: 'My Templates',
    label_ar: 'انشاء قالب للجميع',
    icon: 'fa-folder',
    count: userTemplates.value.length
  }
])

// Methods
const loadTemplateGallery = async () => {
  try {
    isLoading.value = true
    const response = await templateService.getTemplateGallery()
    
    predefinedTemplates.value = response.predefined_templates || []
    userTemplates.value = response.user_templates || []
    recentSurveys.value = response.recent_surveys || []
  } catch (error) {
    console.error('Error loading template gallery:', error)
    
    // Fallback to demo data if API fails
    predefinedTemplates.value = getPredefinedTemplatesDemo()
    recentSurveys.value = []
    userTemplates.value = []
    
    Swal.fire({
      icon: 'warning',
      title: isRTL.value ? 'تحذير' : 'Warning',
      text: isRTL.value ? 'تم تحميل القوالب التجريبية. تأكد من اتصال الخادم للحصول على قوالب حقيقية.' : 'Demo templates loaded. Ensure server connection for real templates.',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
  } finally {
    isLoading.value = false
  }
}

const selectTemplate = (template: PredefinedTemplate | SurveyTemplate) => {
  emit('templateSelected', template)
}

const selectRecentSurvey = (survey: RecentSurvey) => {
  emit('recentSurveySelected', survey)
}

const handleCreateTemplate = () => {
  emit('createNewTemplate')
}

const deleteUserTemplate = async (templateId: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الحذف' : 'Confirm Deletion',
    text: isRTL.value ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'نعم، احذف' : 'Yes, Delete',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })

  if (result.isConfirmed) {
    try {
      await templateService.deleteTemplate(templateId)
      
      userTemplates.value = userTemplates.value.filter(t => t.id !== templateId)
      
      Swal.fire({
        icon: 'success',
        title: isRTL.value ? 'تم الحذف' : 'Deleted',
        text: isRTL.value ? 'تم حذف القالب بنجاح' : 'Template deleted successfully',
        confirmButtonText: isRTL.value ? 'موافق' : 'OK'
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: isRTL.value ? 'خطأ' : 'Error',
        text: isRTL.value ? 'فشل في حذف القالب' : 'Failed to delete template',
        confirmButtonText: isRTL.value ? 'موافق' : 'OK'
      })
    }
  }
}

const deletePredefinedTemplate = async (templateId: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الحذف' : 'Confirm Deletion',
    html: isRTL.value 
      ? '<p>هل أنت متأكد من حذف هذا القالب المحدد مسبقاً؟</p><p><strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه وسيؤثر على جميع المستخدمين.</p>' 
      : '<p>Are you sure you want to delete this predefined template?</p><p><strong>Warning:</strong> This action cannot be undone and will affect all users.</p>',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'نعم، احذف' : 'Yes, Delete',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })

  if (result.isConfirmed) {
    try {
      // Show loading
      Swal.fire({
        title: isRTL.value ? 'جاري الحذف...' : 'Deleting...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      await templateService.deletePredefinedTemplate(templateId)
      
      // Remove from local state
      predefinedTemplates.value = predefinedTemplates.value.filter(t => t.id !== templateId)
      
      Swal.fire({
        icon: 'success',
        title: isRTL.value ? 'تم الحذف' : 'Deleted',
        text: isRTL.value ? 'تم حذف القالب المحدد مسبقاً بنجاح' : 'Predefined template deleted successfully',
        confirmButtonText: isRTL.value ? 'موافق' : 'OK'
      })
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: isRTL.value ? 'خطأ' : 'Error',
        text: error.message || (isRTL.value ? 'فشل في حذف القالب. ربما ليس لديك الصلاحيات الكافية.' : 'Failed to delete template. You may not have sufficient permissions.'),
        confirmButtonText: isRTL.value ? 'موافق' : 'OK'
      })
    }
  }
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, { en: string; ar: string }> = {
    contact: { en: 'Contact', ar: 'معلومات الاتصال' },
    event: { en: 'Event', ar: 'فعالية' },
    feedback: { en: 'Feedback', ar: 'تعليقات' },
    registration: { en: 'Registration', ar: 'تسجيل' },
    custom: { en: 'Custom', ar: 'مخصص' }
  }
  return isRTL.value ? labels[category]?.ar || category : labels[category]?.en || category
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, { en: string; ar: string }> = {
    active: { en: 'Active', ar: 'نشط' },
    inactive: { en: 'Inactive', ar: 'غير نشط' },
    draft: { en: 'Draft', ar: 'مسودة' },
    scheduled: { en: 'Scheduled', ar: 'مجدول' }
  }
  return isRTL.value ? labels[status]?.ar || status : labels[status]?.en || status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(isRTL.value ? 'ar-SA' : 'en-US', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Demo data for predefined templates
const getPredefinedTemplatesDemo = (): PredefinedTemplate[] => {
  return [
    {
      id: 'contact-info',
      name: 'Contact Information',
      name_ar: 'معلومات الاتصال',
      description: 'Collect contact details from respondents',
      description_ar: 'جمع معلومات الاتصال من المستجيبين',
      category: 'contact',
      icon: 'fa-address-card',
      questions: [
        {
          text: 'What is your full name?',
          text_ar: 'ما هو اسمك الكامل؟',
          question_type: 'text',
          is_required: true,
          order: 1
        },
        {
          text: 'What is your email address?',
          text_ar: 'ما هو عنوان بريدك الإلكتروني؟',
          question_type: 'text',
          is_required: true,
          order: 2,
          placeholder: 'email@example.com'
        },
        {
          text: 'What is your phone number?',
          text_ar: 'ما هو رقم هاتفك؟',
          question_type: 'text',
          is_required: false,
          order: 3
        },
        {
          text: 'Additional comments or notes',
          text_ar: 'تعليقات أو ملاحظات إضافية',
          question_type: 'textarea',
          is_required: false,
          order: 4
        }
      ]
    },
    {
      id: 'rsvp',
      name: 'RSVP',
      name_ar: 'تأكيد الحضور',
      description: 'Event attendance confirmation',
      description_ar: 'تأكيد حضور الفعالية',
      category: 'event',
      icon: 'fa-calendar-check',
      questions: [
        {
          text: 'Will you be attending?',
          text_ar: 'هل ستحضر؟',
          question_type: 'yes_no',
          is_required: true,
          order: 1
        },
        {
          text: 'How many guests will you bring?',
          text_ar: 'كم عدد الضيوف الذين ستحضرهم؟',
          question_type: 'text',
          is_required: false,
          order: 2,
          placeholder: '0'
        },
        {
          text: 'Do you have any dietary restrictions?',
          text_ar: 'هل لديك أي قيود غذائية؟',
          question_type: 'textarea',
          is_required: false,
          order: 3
        }
      ]
    },
    {
      id: 'party-invite',
      name: 'Party Invite',
      name_ar: 'دعوة حفلة',
      description: 'Party invitation and preferences',
      description_ar: 'دعوة حفلة وتفضيلات',
      category: 'event',
      icon: 'fa-gift',
      questions: [
        {
          text: 'Can you attend the party?',
          text_ar: 'هل يمكنك حضور الحفلة؟',
          question_type: 'yes_no',
          is_required: true,
          order: 1
        },
        {
          text: 'What type of music do you prefer?',
          text_ar: 'ما نوع الموسيقى التي تفضلها؟',
          question_type: 'multiple_choice',
          options: JSON.stringify(['Pop', 'Rock', 'Jazz', 'Classical', 'Electronic']),
          is_required: false,
          order: 2
        },
        {
          text: 'Any song requests?',
          text_ar: 'أي طلبات أغاني؟',
          question_type: 'text',
          is_required: false,
          order: 3
        }
      ]
    },
    {
      id: 'tshirt-signup',
      name: 'T-Shirt Sign Up',
      name_ar: 'تسجيل القميص',
      description: 'Collect t-shirt size preferences',
      description_ar: 'جمع تفضيلات مقاس القميص',
      category: 'registration',
      icon: 'fa-tshirt',
      questions: [
        {
          text: 'What is your t-shirt size?',
          text_ar: 'ما هو مقاس قميصك؟',
          question_type: 'single_choice',
          options: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
          is_required: true,
          order: 1
        },
        {
          text: 'Preferred color?',
          text_ar: 'اللون المفضل؟',
          question_type: 'single_choice',
          options: JSON.stringify(['Black', 'White', 'Blue', 'Red', 'Green']),
          is_required: true,
          order: 2
        },
        {
          text: 'Any special requests?',
          text_ar: 'أي طلبات خاصة؟',
          question_type: 'textarea',
          is_required: false,
          order: 3
        }
      ]
    },
    {
      id: 'event-registration',
      name: 'Event Registration',
      name_ar: 'تسجيل الفعالية',
      description: 'Complete event registration form',
      description_ar: 'نموذج تسجيل الفعالية الكامل',
      category: 'registration',
      icon: 'fa-clipboard-list',
      questions: [
        {
          text: 'Full Name',
          text_ar: 'الاسم الكامل',
          question_type: 'text',
          is_required: true,
          order: 1
        },
        {
          text: 'Email Address',
          text_ar: 'عنوان البريد الإلكتروني',
          question_type: 'text',
          is_required: true,
          order: 2,
          placeholder: 'email@example.com'
        },
        {
          text: 'Organization/Company',
          text_ar: 'المنظمة/الشركة',
          question_type: 'text',
          is_required: false,
          order: 3
        },
        {
          text: 'Which sessions are you interested in?',
          text_ar: 'ما هي الجلسات التي تهتم بها؟',
          question_type: 'multiple_choice',
          options: JSON.stringify(['Morning Session', 'Afternoon Session', 'Evening Session', 'Workshop']),
          is_required: true,
          order: 4
        },
        {
          text: 'Additional notes',
          text_ar: 'ملاحظات إضافية',
          question_type: 'textarea',
          is_required: false,
          order: 5
        }
      ]
    },
    {
      id: 'customer-feedback',
      name: 'Customer Feedback',
      name_ar: 'ملاحظات العملاء',
      description: 'Gather customer satisfaction feedback',
      description_ar: 'جمع ملاحظات رضا العملاء',
      category: 'feedback',
      icon: 'fa-comments',
      questions: [
        {
          text: 'How satisfied are you with our service?',
          text_ar: 'ما مدى رضاك عن خدمتنا؟',
          question_type: 'rating',
          is_required: true,
          order: 1
        },
        {
          text: 'What did you like most?',
          text_ar: 'ما الذي أعجبك أكثر؟',
          question_type: 'textarea',
          is_required: false,
          order: 2
        },
        {
          text: 'What can we improve?',
          text_ar: 'ما الذي يمكننا تحسينه؟',
          question_type: 'textarea',
          is_required: false,
          order: 3
        },
        {
          text: 'Would you recommend us to others?',
          text_ar: 'هل تنصح الآخرين بنا؟',
          question_type: 'yes_no',
          is_required: true,
          order: 4
        }
      ]
    }
  ]
}

// Lifecycle
onMounted(() => {
  loadTemplateGallery()
})
</script>

<style module src="./TemplateGalleryModal.module.css">
/* CSS Module styles are imported from TemplateGalleryModal.module.css */
</style>

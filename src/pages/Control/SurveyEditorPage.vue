<template>
  <SurveyEditor
    :template="templateData"
    :isCreatingPredefinedTemplate="isCreatingPredefinedTemplate"
    @back="handleBack"
    @publish="handlePublish"
    @saveDraft="handleSaveDraft"
    @saveTemplate="handleSaveTemplate"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import { templateService } from '../../services/templateService'
import SurveyEditor from '../../components/SurveyEditor/SurveyEditor.vue'
import type { PredefinedTemplate, SurveyTemplate, RecentSurvey, Survey } from '../../types/survey.types'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const templateData = ref<PredefinedTemplate | SurveyTemplate | RecentSurvey | Survey | null>(null)
const isCreatingPredefinedTemplate = ref(false)

// Watch for templateData changes
watch(templateData, (newValue) => {
  console.log('🔄 TemplateData changed in SurveyEditorPage:', newValue)
})

onMounted(async () => {
  const isArabic = store.currentLanguage === 'ar'
  
  // Check if we're creating a predefined template
  if (route.query.createTemplate === 'true') {
    isCreatingPredefinedTemplate.value = true
    return
  }

  // Check if we're editing an existing survey
  const surveyId = route.params.id as string
  if (surveyId) {
    try {
      Swal.fire({
        title: isArabic ? 'جاري تحميل الاستطلاع...' : 'Loading Survey...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })
      
      const response = await surveyService.getSurvey(surveyId)
      const survey = response.data
      
      // Debug: Log the loaded survey data
      console.log('📊 Loaded Survey Data:', survey)
      console.log('📝 Title:', survey.title)
      console.log('📄 Description:', survey.description)
      console.log('❓ Questions:', survey.questions)
      
      // Ensure questions array exists
      if (!survey.questions) {
        survey.questions = []
      }
      
      console.log('✅ Setting templateData.value to survey object')
      templateData.value = survey
      
      // Double-check the ref value after setting
      console.log('🔍 templateData.value is now:', templateData.value)
      console.log('🔍 Is it the same object?', templateData.value === survey)
      
      Swal.close()
      return // Exit early when editing
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: isArabic ? 'خطأ' : 'Error',
        text: error.message || (isArabic ? 'فشل في تحميل الاستطلاع' : 'Failed to load survey'),
        confirmButtonText: isArabic ? 'موافق' : 'OK'
      }).then(() => {
        router.push({ name: 'SurveyControl' })
      })
      return
    }
  }
  
  // Check if we're using a template from query params
  if (route.query.templateId) {
    try {
      const templateId = route.query.templateId as string
      const type = route.query.type as string
      
      if (type === 'predefined') {
        const response = await templateService.getPredefinedTemplates()
        const template = response.templates.find(t => t.id === templateId)
        if (template) {
          console.log('📋 Found predefined template:', template)
          
          // Transform predefined template to survey format with bilingual support
          const transformedTemplate = {
            title: isArabic ? (template.name_ar || template.name) : template.name,
            description: isArabic ? (template.description_ar || template.description) : template.description,
            questions: template.questions.map((q: any, index: number) => ({
              text: isArabic ? (q.text_ar || q.text) : q.text,
              question_type: q.question_type,
              options: q.options || undefined,
              is_required: q.is_required || false,
              order: q.order || index + 1,
              placeholder: q.placeholder || undefined,
              validation_type: q.validation_type || 'none',
              NPS_Calculate: false,
              CSAT_Calculate: false,
              min_scale: 0,
              max_scale: 5,
              semantic_tag: 'none',
              options_satisfaction_values: []
            }))
          }
          
          console.log('✅ Transformed template:', transformedTemplate)
          templateData.value = transformedTemplate as any
        }
      } else if (type === 'custom') {
        const response = await templateService.getTemplate(templateId)
        templateData.value = response.template
      } else if (type === 'recent') {
        const response = await surveyService.getSurvey(templateId)
        const { id: _id, ...surveyAsTemplate } = response.data
        templateData.value = surveyAsTemplate as any
      }
    } catch (error: any) {
      const isArabic = store.currentLanguage === 'ar'
      Swal.fire({
        icon: 'error',
        title: isArabic ? 'خطأ' : 'Error',
        text: error.message || (isArabic ? 'فشل في تحميل القالب' : 'Failed to load template'),
        confirmButtonText: isArabic ? 'موافق' : 'OK'
      })
    }
  }
})

const handleBack = () => {
  router.push({ name: 'SurveyControl' })
}

const handleSaveDraft = async (data: any) => {
  try {
    const isArabic = store.currentLanguage === 'ar'
    const surveyId = route.params.id as string
    
    Swal.fire({
      title: isArabic ? 'جاري حفظ المسودة...' : 'Saving Draft...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })
    
    if (surveyId) {
      await surveyService.updateSurvey(surveyId, data)
    } else {
      await surveyService.createDraft(data)
    }
    
    Swal.close()
    
    await Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الحفظ بنجاح' : 'Saved Successfully',
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
    
    router.push({ name: 'SurveyControl' })
  } catch (error: any) {
    const isArabic = store.currentLanguage === 'ar'
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error.message || (isArabic ? 'فشل في حفظ المسودة' : 'Failed to save draft'),
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
  }
}

const handlePublish = async (data: any) => {
  try {
    const isArabic = store.currentLanguage === 'ar'
    const surveyId = route.params.id as string
    
    Swal.fire({
      title: isArabic ? 'جاري حفظ الاستطلاع...' : 'Saving Survey...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })
    
    let created: Survey
    if (surveyId) {
      const update = await surveyService.updateSurvey(surveyId, data)
      created = update.data
    } else {
      const draft = await surveyService.createDraft(data)
      created = draft.data
    }
    
    Swal.close()
    
    // Navigate to access management with the created survey
    // The access modal will handle the final submission after access is configured
    router.push({
      name: 'SurveyControl',
      query: { 
        openAccess: 'true',
        surveyId: created.id,
        isSubmission: 'true'
      }
    })
  } catch (error: any) {
    const isArabic = store.currentLanguage === 'ar'
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error.message || (isArabic ? 'فشل في حفظ الاستطلاع' : 'Failed to save survey'),
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
  }
}

const handleSaveTemplate = async (templateData: any) => {
  try {
    const isArabic = store.currentLanguage === 'ar'
    
    Swal.fire({
      title: isArabic ? 'جاري حفظ القالب...' : 'Saving Template...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })
    
    await templateService.createPredefinedTemplate(templateData)
    
    Swal.close()
    
    await Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الحفظ بنجاح' : 'Saved Successfully',
      text: isArabic 
        ? 'تم حفظ القالب المحدد مسبقاً بنجاح وهو الآن متاح لجميع المستخدمين' 
        : 'Predefined template saved successfully and is now available to all users',
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
    
    router.push({ name: 'SurveyControl' })
  } catch (error: any) {
    const isArabic = store.currentLanguage === 'ar'
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error.message || (isArabic ? 'فشل في حفظ القالب' : 'Failed to save template'),
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
  }
}
</script>

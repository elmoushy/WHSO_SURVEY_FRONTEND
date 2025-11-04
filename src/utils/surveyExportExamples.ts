/**
 * Survey Export Usage Examples
 * How to use the survey export utilities
 */

import { 
  downloadAllSurveyResponses, 
  exportResponsesWithProgress, 
  quickExportSurveyResponses 
} from './surveyExportUtils'

// Example 1: Simple quick export
export async function simpleExport() {
  try {
    const surveyId = "123" // Replace with your survey ID
    await quickExportSurveyResponses(surveyId)
    alert('تم تحميل جميع الاستجابات بنجاح!')
  } catch (error) {
    alert('فشل في تحميل الاستجابات')
  }
}

// Example 2: Export with progress tracking
export async function exportWithProgress() {
  const surveyId = "123" // Replace with your survey ID
  
  try {
    await exportResponsesWithProgress(surveyId, {
      includeIncomplete: true,
      format: 'csv',
      progressCallback: (_current, _total) => {
        // Progress tracking removed for production
      }
    })
    
    alert('تم تحميل جميع الاستجابات بنجاح!')
  } catch (error) {
    console.error('خطأ في التحميل:', error)
    alert('فشل في تحميل الاستجابات')
  }
}

// Example 3: Export with custom options
export async function customExport() {
  const surveyId = "123" // Replace with your survey ID
  
  try {
    await downloadAllSurveyResponses({
      surveyId,
      includeIncomplete: false, // Only completed responses
      format: 'csv',
      filename: 'استجابات_مكتملة_فقط.csv',
      batchSize: 50, // Smaller batch size for slower connections
      progressCallback: (_current, _total) => {
        // Progress tracking removed for production
      }
    })
    
    alert('تم تحميل الاستجابات المكتملة بنجاح!')
  } catch (error) {
    console.error('خطأ في التحميل:', error)
    alert('فشل في تحميل الاستجابات')
  }
}

// Example 4: Export for Vue.js component
export function createVueExportFunction() {
  return {
    // Method to be used in Vue component
    async exportAllResponses(this: any, surveyId: string) {
      try {
        // Show loading state
        this.isExporting = true
        
        await downloadAllSurveyResponses({
          surveyId,
          includeIncomplete: true,
          format: 'csv',
          progressCallback: (current, total) => {
            // Update Vue reactive data
            this.exportProgress = Math.round((current / total) * 100)
          }
        })
        
        // Show success message
        this.$toast.success('تم تحميل جميع الاستجابات بنجاح!')
        
      } catch (error) {
        console.error('Export error:', error)
        this.$toast.error('فشل في تحميل الاستجابات')
      } finally {
        // Hide loading state
        this.isExporting = false
        this.exportProgress = 0
      }
    }
  }
}

// Example 5: Export with error handling and retry
export async function exportWithRetry(surveyId: string, maxRetries = 3) {
  let attempt = 1
  
  while (attempt <= maxRetries) {
    try {
      
      await downloadAllSurveyResponses({
        surveyId,
        includeIncomplete: true,
        format: 'csv',
        batchSize: 50, // Smaller batches for reliability
        progressCallback: (_current, _total) => {
          // Progress tracking for retry attempts
        }
      })
      
      return // Success, exit loop
      
    } catch (error) {
      console.error(`فشلت المحاولة ${attempt}:`, error)
      
      if (attempt === maxRetries) {
        throw new Error(`فشل في تحميل الاستجابات بعد ${maxRetries} محاولات`)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
      attempt++
    }
  }
}

/**
 * Integration with existing Vue component
 */
export const vueIntegrationMixin = {
  methods: {
    async downloadAllResponses(this: any) {
      try {
        this.isExporting = true
        
        await downloadAllSurveyResponses({
          surveyId: this.surveyId,
          includeIncomplete: this.includeIncomplete,
          format: 'csv',
          progressCallback: (current, total) => {
            this.exportProgress = Math.round((current / total) * 100)
            this.exportStatusText = `جاري تحميل ${current} من أصل ${total} استجابة...`
          }
        })
        
        this.$toast.success('تم تحميل جميع الاستجابات بنجاح!')
        
      } catch (error) {
        console.error('Export error:', error)
        this.$toast.error('فشل في تحميل الاستجابات')
      } finally {
        this.isExporting = false
        this.exportProgress = 0
        this.exportStatusText = ''
      }
    }
  }
}

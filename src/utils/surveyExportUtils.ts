/**
 * Survey Export Utilities
 * Professional data entry utilities for downloading survey responses with Arabic text support
 */

import { apiClient } from '../services/jwtAuthService'

export interface SurveyResponse {
  id: string | number
  respondent: {
    email?: string
    type: 'authenticated' | 'anonymous'
  }
  submitted_at: string
  is_complete: boolean
  ip_address?: string
  answer_count?: number
  answers: SurveyAnswer[]
}

export interface SurveyAnswer {
  question_id: string | number
  question_order: number
  question_text: string
  question_type: 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'rating' | 'yes_no'
  question_options?: string[]
  answer_text: string | string[]
  raw_value?: string
  is_required?: boolean
}

export interface ExportOptions {
  surveyId: string
  includeIncomplete?: boolean
  format?: 'csv' | 'json' | 'xlsx'
  filename?: string
  batchSize?: number
  progressCallback?: (progress: number, total: number) => void
}

/**
 * Download all survey responses as CSV with proper Arabic text encoding
 */
export async function downloadAllSurveyResponses(options: ExportOptions): Promise<void> {
  const {
    surveyId,
    includeIncomplete = true,
    format = 'csv',
    filename,
    batchSize = 100,
    progressCallback
  } = options

  try {
    // Fetch all responses with pagination
    const allResponses = await fetchAllResponses(surveyId, includeIncomplete, batchSize, progressCallback)

    if (allResponses.length === 0) {
      throw new Error('لا توجد استجابات لتصديرها')
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case 'json':
        content = JSON.stringify(allResponses, null, 2)
        mimeType = 'application/json'
        fileExtension = 'json'
        break
      case 'xlsx':
        // For XLSX, you would need a library like xlsx or exceljs
        throw new Error('XLSX format not implemented yet')
      case 'csv':
      default:
        content = generateArabicCSV(allResponses)
        mimeType = 'text/csv'
        fileExtension = 'csv'
        break
    }

    // Create and download file
    const BOM = '\uFEFF' // UTF-8 BOM for proper Arabic display
    const blob = new Blob([BOM + content], { 
      type: `${mimeType};charset=utf-8;` 
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const timestamp = new Date().toISOString().split('T')[0]
    const defaultFilename = `جميع_استجابات_الاستبيان_${surveyId}_${timestamp}.${fileExtension}`
    link.download = filename || defaultFilename

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

/**
 * Fetch all responses with pagination handling
 */
async function fetchAllResponses(
  surveyId: string, 
  includeIncomplete: boolean = true,
  batchSize: number = 100,
  progressCallback?: (progress: number, total: number) => void
): Promise<SurveyResponse[]> {
  const allResponses: SurveyResponse[] = []
  let page = 1
  let hasMore = true
  let totalEstimated = 0

  while (hasMore) {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', batchSize.toString())

      // Include only completed responses if specified
      if (!includeIncomplete) {
        params.append('is_complete', 'true')
      }

      const response = await apiClient.get(`/surveys/admin/surveys/${surveyId}/responses/?${params.toString()}`)

      if (response.data?.results) {
        allResponses.push(...response.data.results)

        // Update progress
        if (progressCallback) {
          if (page === 1 && response.data.count) {
            totalEstimated = response.data.count
          }
          progressCallback(allResponses.length, totalEstimated || allResponses.length)
        }

        // Check if there are more pages
        hasMore = !!response.data.next
        page++
      } else {
        hasMore = false
      }

    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      hasMore = false
    }
  }

  return allResponses
}

/**
 * Generate CSV content with proper Arabic support
 */
function generateArabicCSV(responses: SurveyResponse[]): string {
  if (responses.length === 0) return ''

  // Get all unique questions from all responses
  const allQuestions = new Map<string | number, {
    order: number
    text: string
    type: string
  }>()

  responses.forEach(response => {
    response.answers?.forEach(answer => {
      if (!allQuestions.has(answer.question_id)) {
        allQuestions.set(answer.question_id, {
          order: answer.question_order || 0,
          text: answer.question_text || `سؤال ${answer.question_order || answer.question_id}`,
          type: answer.question_type || 'text'
        })
      }
    })
  })

  // Sort questions by order
  const sortedQuestions = Array.from(allQuestions.entries()).sort((a, b) => a[1].order - b[1].order)

  // Create header row with questions and answers
  const headers = [
    'رقم الاستجابة',
    'المستجيب',
    'نوع المستجيب',
    'تاريخ الإرسال',
    'نسبة الإكمال'
  ]

  // Add question-answer pairs to headers
  sortedQuestions.forEach(([_, q]) => {
    headers.push(`السؤال ${q.order}: ${q.text}`)
    headers.push(`الإجابة ${q.order}`)
  })

  // Create data rows
  const rows = responses.map((response, index) => {
    const answerMap = new Map<string | number, {
      question: string
      answer: string
      type: string
      order: number
    }>()
    
    response.answers?.forEach(answer => {
      answerMap.set(answer.question_id, {
        question: answer.question_text || `سؤال ${answer.question_order}`,
        answer: formatAnswerForCSV(answer),
        type: answer.question_type,
        order: answer.question_order
      })
    })

    const row = [
      (index + 1).toString(),
      response.respondent?.email || 'مجهول',
      response.respondent?.type === 'authenticated' ? 'مسجل' : 'مجهول',
      formatDateForCSV(response.submitted_at),
      `${calculateCompletionPercentage(response)}%`
    ]

    // Add question-answer pairs to row
    sortedQuestions.forEach(([questionId]) => {
      const qa = answerMap.get(questionId)
      if (qa) {
        row.push(qa.question)
        row.push(qa.answer)
      } else {
        row.push('لا يوجد سؤال')
        row.push('لا يوجد إجابة')
      }
    })

    return row
  })

  // Combine headers and rows
  const allRows = [headers, ...rows]

  // Convert to CSV format with proper escaping
  return allRows.map(row => 
    row.map(cell => {
      const cellStr = String(cell || '')
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (cellStr.includes('"') || cellStr.includes(',') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  ).join('\n')
}

/**
 * Format answer for CSV export
 */
function formatAnswerForCSV(answer: SurveyAnswer): string {
  if (!answer.answer_text) return 'لا يوجد إجابة'

  let formattedAnswer = answer.answer_text.toString()

  // Handle different question types
  switch (answer.question_type) {
    case 'rating':
      const maxRating = answer.question_options ? answer.question_options.length : 5
      formattedAnswer = `${answer.answer_text}/${maxRating}`
      break

    case 'yes_no':
      const normalizedAnswer = formattedAnswer.toLowerCase()
      formattedAnswer = ['yes', 'نعم', '1', 'true'].includes(normalizedAnswer) ? 'نعم' : 'لا'
      break

    case 'multiple_choice':
      // Handle multiple selections
      if (Array.isArray(answer.answer_text)) {
        formattedAnswer = answer.answer_text.join('؛ ')
      }
      break

    case 'single_choice':
    case 'text':
    case 'textarea':
    default:
      // Keep original text, but clean up newlines for CSV
      formattedAnswer = formattedAnswer.replace(/\n/g, ' ').replace(/\r/g, ' ')
      break
  }

  return formattedAnswer
}

/**
 * Format date for CSV export in Arabic locale with Gregorian calendar
 */
function formatDateForCSV(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)

  // Format in Arabic locale with Gregorian calendar
  return date.toLocaleString('ar-SA', {
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Riyadh' // Adjust timezone as needed
  })
}

/**
 * Calculate completion percentage for a response
 */
function calculateCompletionPercentage(response: SurveyResponse): number {
  const totalQuestions = response.answers?.length || 0
  const answeredQuestions = response.answers?.filter(answer => 
    answer.answer_text && answer.answer_text.toString().trim() !== ''
  ).length || 0

  if (totalQuestions === 0) return 0
  return Math.round((answeredQuestions / totalQuestions) * 100)
}

/**
 * Export responses with progress tracking
 */
export async function exportResponsesWithProgress(
  surveyId: string, 
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const exportOptions: ExportOptions = {
    surveyId,
    includeIncomplete: true,
    format: 'csv',
    batchSize: 100,
    ...options,
    progressCallback: options.progressCallback || ((_current, _total) => {
      // Default progress callback for production
    })
  }

  return downloadAllSurveyResponses(exportOptions)
}

/**
 * Simple usage function for quick export
 */
export async function quickExportSurveyResponses(surveyId: string): Promise<void> {
  try {
    await downloadAllSurveyResponses({
      surveyId,
      includeIncomplete: true,
      format: 'csv'
    })
    
    // Export completed successfully
  } catch (error) {
    console.error('فشل في تحميل الاستجابات:', error)
    throw error
  }
}

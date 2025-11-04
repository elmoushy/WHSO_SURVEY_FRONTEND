// Survey Management Types based on surveys_admin_api.json

// Base API Response interface
export interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

// Enhanced Paginated API Response interface for new surveys endpoint
export interface PaginatedApiResponse<T> {
  count: number
  total_pages: number
  current_page: number
  per_page: number
  next: string | null
  previous: string | null
  results: T[]
  applied_filters?: {
    search?: string
    survey_status?: string
    sort_by?: string
    visibility?: string
    is_active?: string
    status?: string
  }
  available_filters?: {
    sort_options: Array<{
      value: string
      label: string
      label_en: string
    }>
    status_options: Array<{
      value: string
      label: string
      label_en: string
    }>
  }
}

// Survey visibility levels
export type SurveyVisibility = 'PRIVATE' | 'AUTH' | 'PUBLIC' | 'GROUPS'

// Survey contact methods for public surveys
export type PublicContactMethod = 'email' | 'phone'

// Question types supported by the system
export type QuestionType = 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'rating' | 'yes_no'

// Semantic tag for questions
export type SemanticTag = 'none' | 'nps' | 'csat'

// Survey Question interface
export interface SurveyQuestion {
  id: string
  text: string
  question_type: QuestionType
  options?: string // JSON array of options for choice questions
  is_required: boolean
  order: number
  created_at: string
  updated_at: string
  NPS_Calculate?: boolean
  CSAT_Calculate?: boolean
  min_scale?: number | null
  max_scale?: number | null
  semantic_tag?: SemanticTag
  validation_type?: 'none' | 'email' | 'phone' | 'number' | 'url' // Input validation for text questions
}

// Question Option interface (for single_choice questions with CSAT)
export interface QuestionOption {
  text: string
  satisfaction_value?: 0 | 1 | 2 | null // 0=Dissatisfied, 1=Neutral, 2=Satisfied
}

// Survey Answer interface
export interface SurveyAnswer {
  id: number
  question: string // UUID of the question
  answer_text: string
  created_at: string
}

// Survey Response interface
export interface SurveyResponse {
  id: string
  survey: string // UUID of the survey
  respondent: number | null // User ID or null for anonymous
  respondent_email: string | null
  respondent_phone: string | null
  submitted_at: string
  is_complete: boolean
  answers: SurveyAnswer[]
}

// Main Survey interface
export interface Survey {
  id: string
  title: string
  description: string
  visibility: SurveyVisibility
  public_contact_method?: PublicContactMethod // Only applies to PUBLIC surveys
  per_device_access?: boolean // For device-based access control
  shared_with: any[] // Array of user IDs or groups
  creator: number
  creator_email: string
  is_locked: boolean
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  status: string
  is_currently_active: boolean
  questions: SurveyQuestion[]
  response_count: number
  shared_with_emails: string[]
  can_submit?: boolean
  has_submitted?: boolean
  created_at: string
  updated_at: string
}

// Survey creation/update request
export interface SurveyCreateRequest {
  title: string
  description?: string
  visibility?: SurveyVisibility
  public_contact_method?: PublicContactMethod
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
  questions?: QuestionCreateRequest[] // Optional questions array for frontend use
}

export interface SurveyUpdateRequest {
  title?: string
  description?: string
  visibility?: SurveyVisibility
  public_contact_method?: PublicContactMethod
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
  is_locked?: boolean
}

// Question creation request
export interface QuestionCreateRequest {
  text: string
  question_type: QuestionType
  options?: string
  is_required?: boolean
  order?: number
  // Analytics fields
  NPS_Calculate?: boolean
  CSAT_Calculate?: boolean
  min_scale?: number | null
  max_scale?: number | null
  semantic_tag?: SemanticTag
}

// Survey response submission types
export interface AnonymousResponseSubmission {
  survey_id: string
  email?: string // Required for email surveys
  phone?: string // Required for phone surveys
  answers: Array<{
    question_id: string
    answer: string | string[]
  }>
}

export interface AuthenticatedResponseSubmission {
  survey_id: string
  answers: Array<{
    question_id: string
    answer: string | string[]
  }>
}

export interface ResponseSubmissionResult {
  response_id: string
  survey_id: string
  submitted_at: string
  is_complete: boolean
  answers_count: number
  respondent_email?: string
}

// Survey audience configuration
export interface SurveyAudienceRequest {
  visibility: SurveyVisibility
  user_ids?: number[]
  emails?: string[]
}

// Public link management
export interface PublicLinkResponse {
  link: string
  token: string
  expires_at: string
  password?: string // Password for password-protected links
  is_password_protected?: boolean
  is_contact_restricted?: boolean
  restricted_email?: string
  restricted_phone?: string
}

export interface PublicLinkRequest {
  days_to_expire?: number // Number of days until expiration
}

// Password-protected link management
export interface PasswordProtectedLinkRequest {
  days_to_expire?: number
  email?: string // Optional single email restriction (legacy)
  phone?: string // Optional single phone restriction (legacy)
  restricted_email?: string[] // Optional array of email restrictions
  restricted_phone?: string[] // Optional array of phone restrictions
}

export interface PasswordProtectedLinkResponse {
  token: string
  password: string
  expires_at: string
  is_password_protected: boolean
  is_contact_restricted: boolean
  restricted_email?: string | string[] // Support both single value and array
  restricted_phone?: string | string[] // Support both single value and array
  link: string // Full frontend URL
}

// Current link response types - unified response for both password-protected and public links
export interface CurrentLinkResponseData {
  token: string
  expires_at: string
  survey_visibility: string
  note: string
  // Password-protected link specific fields
  password?: string
  is_password_protected?: boolean
  is_contact_restricted?: boolean
  restricted_email?: string
  restricted_phone?: string
  closed_links_info?: {
    closed_count: number
    closed_type: string
    message: string
  }
  // Public link specific fields
  auto_generated?: boolean
}

export interface CurrentLinkResponse {
  status: string
  message: string
  data: CurrentLinkResponseData
}

// User search and selection
export interface User {
  id: number
  email: string
  name: string
  avatar?: string
}

export interface UserSearchResponse {
  users: User[]
  total: number
}

// Share management
export interface ShareRequest {
  user_ids?: number[]
  emails?: string[]
  message?: string
}

export interface ShareResponse {
  shared_users: User[]
  total_shared: number
}

// Access validation
export interface AccessRequest {
  token?: string
  survey_id: string
}

export interface AccessResponse {
  has_access: boolean
  survey?: Survey
}

// Shared surveys specific types
export interface SharedSurveyCreator {
  id: number
  email: string
  name: string
}

export interface SharedSurveyAccessInfo {
  access_type: 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
  can_submit: boolean
  has_submitted: boolean
  is_shared_explicitly: boolean
  is_shared_via_group: boolean
  is_creator: boolean
}

export interface SharedSurvey {
  id: string
  title: string
  description: string
  visibility: 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
  reason: 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
  is_active: boolean
  is_locked: boolean
  status: 'active' | 'scheduled' | 'inactive'
  is_currently_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  creator: SharedSurveyCreator
  questions_count: number
  estimated_time: number
  access_info: SharedSurveyAccessInfo
}

export interface SharedSurveysAccessSummary {
  auth_surveys: number
  private_shared: number
}

export interface SharedSurveysResponse {
  surveys: SharedSurvey[]
  total_count: number
  access_summary: SharedSurveysAccessSummary
}

export interface SharedSurveysFilters {
  visibility?: 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
  is_active?: boolean
  is_locked?: boolean
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

// Analytics interfaces
export interface SurveyAnalytics {
  total_surveys: number
  active_surveys: number
  total_responses: number
  avg_response_rate: number
  recent_activity: {
    new_surveys_this_week: number
    new_responses_this_week: number
  }
  top_surveys: TopSurvey[]
}

export interface TopSurvey {
  id: string
  title: string
  response_count: number
  completion_rate: number
}

// Dashboard API v2 Response Types
export interface HeatmapData {
  matrix: number[][] // 7x24 array (days x hours)
  totals_by_day: number[] // 7 integers
  totals_by_hour: number[] // 24 integers
}

export interface NPSDistribution {
  score: number
  count: number
  pct: number
}

export interface NPSData {
  score: number // -100 to 100
  promoters_count: number
  passives_count: number
  detractors_count: number
  promoters_pct: number
  passives_pct: number
  detractors_pct: number
  total_responses: number
  question_id: string
  question_text: string
  scale_min: number
  scale_max: number
  detractor_range: string
  passive_range: string
  promoter_range: string
  distribution: NPSDistribution[]
  interpretation: string
}

export interface CSATTrackingPoint {
  period: string // "YYYY-MM-DD" or "YYYY-W##" or "YYYY-MM"
  score: number // 0-100
  satisfied: number
  neutral: number
  dissatisfied: number
  total: number
}

export interface QuestionSummary {
  question_id: string
  question_text: string
  question_type: QuestionType
  response_count: number
  answers?: any // Depends on question type
}

export interface DashboardV2Response {
  heatmap: HeatmapData
  nps: NPSData | null
  csat_tracking: CSATTrackingPoint[]
  questions_summary: QuestionSummary[]
}

// Bulk operations
export type BulkOperation = 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete'

export interface BulkOperationRequest {
  operation: BulkOperation
  survey_ids: string[]
}

export interface BulkOperationResult {
  operation: BulkOperation
  successful: number
  failed: number
  errors: string[]
}

// Export options
export type ExportFormat = 'csv' | 'excel' | 'json'

export interface ExportRequest {
  format?: ExportFormat
  include_personal_data?: boolean
}

// Filter and search parameters
export interface SurveyFilters {
  visibility?: SurveyVisibility
  is_active?: boolean
  creator?: number
  search?: string
  ordering?: string
}

// Pagination interface
export interface PaginatedResponse<T> {
  status: string
  message: string
  data: T[]
  count: number
  next: string | null
  previous: string | null
}

// UI state interfaces
export interface SurveyFormState {
  isLoading: boolean
  errors: Record<string, string[]>
  isDirty: boolean
}

export interface SurveyListState {
  surveys: Survey[]
  isLoading: boolean
  error: string | null
  filters: SurveyFilters
  selectedSurveys: string[]
  bulkOperationLoading: boolean
}

export interface SurveyDetailState {
  survey: Survey | null
  responses: SurveyResponse[]
  analytics: SurveyAnalytics | null
  isLoading: boolean
  error: string | null
}

// Form validation rules
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FormValidation {
  title: ValidationRule
  description: ValidationRule
  question_text: ValidationRule
  options: ValidationRule
}

// Component props interfaces
export interface SurveyCardProps {
  survey: Survey
  selected?: boolean
  onSelect?: (surveyId: string) => void
  onEdit?: (survey: Survey) => void
  onDelete?: (surveyId: string) => void
  onClone?: (surveyId: string) => void
  onToggleActive?: (surveyId: string, isActive: boolean) => void
}

export interface QuestionFormProps {
  question?: SurveyQuestion
  onSave: (question: QuestionCreateRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export interface SurveyStatsProps {
  analytics: SurveyAnalytics
  loading?: boolean
}

// Token-accessible survey types
export interface TokenAccessibleSurvey {
  id: string
  title: string
  description: string
  estimated_time: number // minutes
  questions_count: number
  visibility: SurveyVisibility
  is_active: boolean
  created_at: string
  creator_email: string
  access_permissions: {
    can_submit: boolean
    can_view_results: boolean
    access_type: string
  }
  token_info: {
    expires_at: string
    is_expired: boolean
    created_at: string
  }
}

export interface TokenAccessibleSurveysResponse {
  surveys: TokenAccessibleSurvey[]
  total_count: number
}

// Authenticated survey response types
export interface AuthSurvey {
  id: string
  title: string
  description: string
  estimated_time?: number
  questions_count: number
  questions: SurveyQuestion[]
}

export interface AuthSurveyResponse {
  status: string
  message: string
  data: {
    survey: AuthSurvey
  }
}

// Auth response submission types
export interface AuthResponseAnswer {
  question_id: string
  answer_text: string
}

export interface AuthResponseSubmission {
  survey_id: string
  answers: AuthResponseAnswer[]
}

export interface AuthResponseResult {
  status: string
  message: string
  data: {
    response_id: string
    survey_id: string
    submitted_at: string
    answers_count: number
  }
}

// Password-protected survey response types
export interface PasswordProtectedSurveyAccess {
  password: string
  email?: string // Required if token is email-restricted
  phone?: string // Required if token is phone-restricted
}

export interface PasswordProtectedAccessValidation {
  survey_id: string
  survey_title: string
  survey_description: string
  has_access: boolean
  is_password_protected: boolean
  is_contact_restricted: boolean
  token_expires_at: string
  access_instructions: {
    survey_endpoint: string
    submission_endpoint: string
    required_headers: {
      Authorization: string
    }
    required_fields: string[]
  }
}

export interface PasswordProtectedResponseSubmission {
  survey_id: string
  token: string
  password: string
  email?: string
  phone?: string
  answers: Array<{
    question_id: string
    answer: string | string[]
  }>
}

export interface PasswordProtectedResponseResult {
  response_id: string
  survey_id: string
  submitted_at: string
  answers_count: number
  access_method: 'password_token'
}

// Admin Groups for survey sharing
export interface AdminGroup {
  id: number
  name: string
  description: string
  user_count: number
  admin_level: 'group_admin' | 'super_admin'
}

export interface AdminGroupsResponse {
  groups: AdminGroup[]
  total_count: number
  user_role: string
}

// Survey Template Types
export type TemplateCategory = 'contact' | 'event' | 'feedback' | 'registration' | 'custom'

export interface SurveyTemplate {
  id: string
  name: string
  name_ar: string
  description: string
  description_ar: string
  category: TemplateCategory
  icon: string
  preview_image?: string
  is_predefined: boolean // Built-in vs user-created
  usage_count?: number
  created_by?: number
  created_at: string
  updated_at: string
  questions: TemplateQuestion[]
}

export interface TemplateQuestion {
  text: string
  text_ar: string
  question_type: QuestionType
  options?: string
  is_required: boolean
  order: number
  placeholder?: string
  placeholder_ar?: string
}

export interface PredefinedTemplate {
  id: string
  name: string
  name_ar: string
  description: string
  description_ar: string
  category: TemplateCategory
  icon: string
  preview_image?: string
  questions: TemplateQuestion[]
}

export interface RecentSurvey {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  questions_count: number
  response_count: number
  visibility: SurveyVisibility
  status: string
  can_use_as_template: boolean
}

export interface TemplateGalleryResponse {
  predefined_templates: PredefinedTemplate[]
  user_templates: SurveyTemplate[]
  recent_surveys: RecentSurvey[]
  total_predefined: number
  total_user: number
  total_recent: number
}

export interface CreateTemplateRequest {
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  category: TemplateCategory
  survey_id: string // Source survey to create template from
}

export interface CreateTemplateResponse {
  template: SurveyTemplate
  message: string
}

export interface CreateSurveyFromTemplateRequest {
  template_id: string
  title?: string // Optional custom title
  description?: string // Optional custom description
}

export interface CreateSurveyFromTemplateResponse {
  survey: Survey
  message: string
}

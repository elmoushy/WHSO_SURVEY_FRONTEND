import type {
  Survey,
  SurveyCreateRequest,
  SurveyUpdateRequest,
  SurveyQuestion,
  QuestionCreateRequest,
  SurveyResponse,
  SurveyAnalytics,
  // SurveyFilters, // Currently unused
  SurveyAudienceRequest,
  BulkOperationRequest,
  BulkOperationResult,
  ExportRequest,
  ApiResponse,
  PaginatedApiResponse,
  PublicLinkResponse,
  PublicLinkRequest,
  PasswordProtectedLinkRequest,
  PasswordProtectedLinkResponse,
  CurrentLinkResponse,
  PasswordProtectedSurveyAccess,
  PasswordProtectedAccessValidation,
  PasswordProtectedResponseSubmission,
  PasswordProtectedResponseResult,
  // User, // Unused - commenting out
  UserSearchResponse,
  ShareRequest,
  ShareResponse,
  // AccessRequest, // Unused - commenting out
  AccessResponse,
  TokenAccessibleSurveysResponse,
  SharedSurvey,
  SharedSurveysResponse,
  SharedSurveysFilters,
  AuthSurveyResponse,
  AuthResponseSubmission,
  AuthResponseResult,
  // AdminGroup, // Unused - commenting out
  AdminGroupsResponse,
  AnonymousResponseSubmission,
  AuthenticatedResponseSubmission,
  ResponseSubmissionResult
} from '../types/survey.types'
import { apiClient } from './jwtAuthService'
import { getDeviceMacAddress, getDeviceHeaders } from '../utils/deviceFingerprint'

class SurveyService {
  private baseURL = '/surveys/'

  // Helper method for API calls using the shared apiClient
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      let response
      const method = options.method || 'GET'
      
      if (method === 'GET') {
        response = await apiClient.get(url)
      } else if (method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {}
        response = await apiClient.post(url, body)
      } else if (method === 'PATCH') {
        const body = options.body ? JSON.parse(options.body as string) : {}
        response = await apiClient.patch(url, body)
      } else if (method === 'DELETE') {
        response = await apiClient.delete(url)
      } else {
        throw new Error(`Unsupported method: ${method}`)
      }

      // Debug log
      
      // Handle the nested response structure from your Django API
      // The API returns: { status: 'success', message: '...', data: [...] }
      if (response.data && typeof response.data === 'object') {
        // If the response already has the expected structure, return it
        if ('status' in response.data && 'data' in response.data) {
          return response.data
        }
        // If it's just the data array/object, wrap it in the expected structure
        return {
          status: 'success',
          message: 'Data retrieved successfully',
          data: response.data
        } as T
      }

      return response.data
    } catch (error: any) {
      // Logging removed for production
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error(error.message || `HTTP error! status: ${error.response?.status}`)
    }
  }

  // Enhanced Survey CRUD operations with new API support
  async getAllSurveys(filters?: any): Promise<PaginatedApiResponse<Survey>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const endpoint = `surveys${params.toString() ? `?${params.toString()}` : ''}`
    
    try {
      // Use apiClient directly since Django returns paginated response
      const response = await apiClient.get(`${this.baseURL}${endpoint}`)
      
      // Handle the nested response structure: response.data.data contains the actual paginated data
      const responseData = response.data?.data || response.data
      
      if (responseData && 'results' in responseData) {
        return {
          count: responseData.count || 0,
          total_pages: responseData.total_pages || 0,
          current_page: responseData.current_page || 1,
          per_page: responseData.per_page || 10,
          next: responseData.next || null,
          previous: responseData.previous || null,
          results: responseData.results || [],
          applied_filters: response.data?.applied_filters || responseData.applied_filters || {},
          available_filters: responseData.available_filters || {}
        } as PaginatedApiResponse<Survey>
      }
      
      // Check if it's the direct nested structure from your API
      if (response.data?.status === 'success' && response.data?.data) {
        const data = response.data.data
        return {
          count: data.count || 0,
          total_pages: data.total_pages || 0,
          current_page: data.current_page || 1,
          per_page: data.per_page || 10,
          next: data.next || null,
          previous: data.previous || null,
          results: data.results || [],
          applied_filters: response.data.applied_filters || {},
          available_filters: data.available_filters || {}
        } as PaginatedApiResponse<Survey>
      }
      
      // Fallback for legacy response format
      return {
        count: 0,
        total_pages: 0,
        current_page: 1,
        per_page: 10,
        next: null,
        previous: null,
        results: []
      }
    } catch (error: any) {
      console.error('API Error:', error)
      // Return a fallback structure if the API call fails
      return {
        count: 0,
        total_pages: 0,
        current_page: 1,
        per_page: 10,
        next: null,
        previous: null,
        results: []
      }
    }
  }

  async getSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    return this.apiCall<ApiResponse<Survey>>(`surveys/${surveyId}/`)
  }

  async createSurvey(surveyData: SurveyCreateRequest): Promise<ApiResponse<Survey>> {
    return this.apiCall<ApiResponse<Survey>>('surveys/', {
      method: 'POST',
      body: JSON.stringify(surveyData)
    })
  }

  async createDraft(surveyData: SurveyCreateRequest): Promise<ApiResponse<Survey>> {
    // Add per_device_access: false to avoid 400 Bad Request error
    const draftData = {
      ...surveyData,
      per_device_access: false
    }
    
    return this.apiCall<ApiResponse<Survey>>('draft/', {
      method: 'POST',
      body: JSON.stringify(draftData)
    })
  }

  async submitSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    return this.apiCall<ApiResponse<Survey>>('submit/', {
      method: 'POST',
      body: JSON.stringify({ survey_id: surveyId })
    })
  }

  async updateSurvey(
    surveyId: string,
    surveyData: SurveyUpdateRequest
  ): Promise<ApiResponse<Survey>> {
    // Validate survey ID
    if (!surveyId || surveyId === 'undefined' || surveyId === 'null') {
      throw new Error('Survey ID is required and cannot be undefined')
    }
    
    // If access_level is provided, map it to visibility
    const updateData = { ...surveyData }
    if ('access_level' in updateData) {
      const accessLevel = (updateData as any).access_level
      switch (accessLevel) {
        case 'public':
          updateData.visibility = 'PUBLIC'
          break
        case 'authenticated':
          updateData.visibility = 'AUTH'
          break
        case 'private':
          updateData.visibility = 'PRIVATE'
          break
      }
      delete (updateData as any).access_level
    }

    const response = await apiClient.patch(`/surveys/surveys/${surveyId}/`, updateData)
    
    if (response.data.status === 'success') {
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to update survey')
    }
  }

  // Dedicated method for updating access level and contact method
  async updateSurveyAccess(
    surveyId: string, 
    accessLevel: 'public' | 'authenticated' | 'private' | 'groups',
    contactMethod?: 'email' | 'phone',
    perDeviceAccess?: boolean
  ): Promise<ApiResponse<Survey>> {
    // Validate survey ID
    if (!surveyId || surveyId === 'undefined' || surveyId === 'null') {
      throw new Error('Survey ID is required and cannot be undefined')
    }
    
    // Map access level to visibility for the PATCH API
    let visibility: 'PUBLIC' | 'AUTH' | 'PRIVATE' | 'GROUPS'
    switch (accessLevel) {
      case 'public':
        visibility = 'PUBLIC'
        break
      case 'authenticated':
        visibility = 'AUTH'
        break
      case 'private':
        visibility = 'PRIVATE'
        break
      case 'groups':
        visibility = 'GROUPS'
        break
      default:
        visibility = 'PRIVATE'
    }
    
    // Build update data
    const updateData: any = { visibility }
    
    // Add per_device_access if enabled for public surveys
    if (visibility === 'PUBLIC' && perDeviceAccess === true) {
      updateData.per_device_access = true
    } else if (visibility === 'PUBLIC' && contactMethod && perDeviceAccess !== true) {
      // Only add contact method if per_device_access is not enabled
      updateData.public_contact_method = contactMethod
    }
    
    return this.updateSurvey(surveyId, updateData)
  }

  async deleteSurvey(surveyId: string): Promise<void> {
    await this.apiCall(`surveys/${surveyId}/`, {
      method: 'DELETE'
    })
  }

  async cloneSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    return this.apiCall<ApiResponse<Survey>>(`surveys/${surveyId}/clone/`, {
      method: 'POST'
    })
  }

  // Audience management
  async setSurveyAudience(
    surveyId: string,
    audienceData: SurveyAudienceRequest
  ): Promise<ApiResponse<{ visibility: string; shared_count: number }>> {
    return this.apiCall(`surveys/${surveyId}/audience/`, {
      method: 'POST',
      body: JSON.stringify(audienceData)
    })
  }

  // Public Link Management
  async generatePublicLink(
    surveyId: string,
    _options: PublicLinkRequest = {}
  ): Promise<ApiResponse<PublicLinkResponse>> {
    const response = await apiClient.get(`/surveys/surveys/${surveyId}/public-link/`)
    
    if (response.data.status === 'success') {
      // Construct the full frontend URL since backend only returns token
      const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
      const fullLink = `${frontendBaseUrl}/survey/public/${response.data.data.token}`
      
      return {
        data: {
          link: fullLink,
          token: response.data.data.token,
          expires_at: response.data.data.expires_at
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to generate public link')
    }
  }

  async getPublicLink(surveyId: string): Promise<ApiResponse<PublicLinkResponse | null>> {
    try {
      const response = await apiClient.get(`/surveys/surveys/${surveyId}/public-link/`)
      
      if (response.data.status === 'success' && response.data.data) {
        // Construct the full frontend URL since backend only returns token
        const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
        const fullLink = `${frontendBaseUrl}/survey/public/${response.data.data.token}`
        
        return {
          data: {
            link: fullLink,
            token: response.data.data.token,
            expires_at: response.data.data.expires_at
          },
          message: response.data.message,
          status: response.data.status
        }
      } else {
        return {
          data: null,
          message: response.data.message || 'No public link found',
          status: response.data.status || 'success'
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          data: null,
          message: 'No public link found',
          status: 'success'
        }
      }
      // Logging removed for production
      throw error
    }
  }

  async revokePublicLink(surveyId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/surveys/surveys/${surveyId}/public-link/`)
    
    if (response.data.status === 'success') {
      return {
        data: { message: response.data.message },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to revoke public link')
    }
  }

  // Get current link (unified method for both password-protected and public links)
  async getCurrentLink(surveyId: string): Promise<CurrentLinkResponse> {
    const response = await apiClient.get(`/surveys/surveys/${surveyId}/current-link/`)
    
    if (response.data.status === 'success') {
      // Construct the full frontend URL since backend only returns token
      const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
      
      // Add the full link to the response data
      const responseData = {
        ...response.data.data,
        link: `${frontendBaseUrl}/survey/public/${response.data.data.token}`
      }
      
      return {
        status: response.data.status,
        message: response.data.message,
        data: responseData
      }
    } else {
      throw new Error(response.data.message || 'Failed to get current link')
    }
  }

  // Password-Protected Link Management
  async generatePasswordProtectedLink(
    surveyId: string,
    options: PasswordProtectedLinkRequest = {}
  ): Promise<ApiResponse<PasswordProtectedLinkResponse>> {
    const requestData: any = {
      days_to_expire: options.days_to_expire || 30
    }

    // Add optional email/phone restrictions
    if (options.email) {
      requestData.email = options.email
    }
    if (options.phone) {
      requestData.phone = options.phone
    }
    // Add new array-based restrictions
    if (options.restricted_email && options.restricted_email.length > 0) {
      requestData.restricted_email = options.restricted_email
    }
    if (options.restricted_phone && options.restricted_phone.length > 0) {
      requestData.restricted_phone = options.restricted_phone
    }

    const response = await apiClient.post(`/surveys/surveys/${surveyId}/generate-password-link/`, requestData)
    
    if (response.data.status === 'success') {
      // Construct the full frontend URL since backend only returns token
      const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
      const fullLink = `${frontendBaseUrl}/survey/password/${response.data.data.token}`
      
      return {
        data: {
          token: response.data.data.token,
          password: response.data.data.password,
          expires_at: response.data.data.expires_at,
          is_password_protected: response.data.data.is_password_protected,
          is_contact_restricted: response.data.data.is_contact_restricted,
          restricted_email: response.data.data.restricted_email,
          restricted_phone: response.data.data.restricted_phone,
          link: fullLink
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to generate password-protected link')
    }
  }

  async accessPasswordProtectedSurvey(
    surveyId: string,
    token: string,
    accessData: PasswordProtectedSurveyAccess
  ): Promise<ApiResponse<Survey>> {
    const response = await apiClient.post(
      `/surveys/password-surveys/${surveyId}/`,
      {
        password: accessData.password,
        email: accessData.email,
        phone: accessData.phone
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data.status === 'success') {
      return {
        data: response.data.survey_details,
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to access password-protected survey')
    }
  }

  // Alternative method to validate password access by token only (if backend supports it)
  async validatePasswordAccessByToken(
    token: string,
    accessData: PasswordProtectedSurveyAccess
  ): Promise<ApiResponse<PasswordProtectedAccessValidation>> {
    // Try a simpler approach: use token in the URL path itself
    // This follows the pattern: /surveys/password-access/{token}/
    const response = await apiClient.post(
      `/surveys/password-access/${token}/`,
      {
        password: accessData.password,
        email: accessData.email,
        phone: accessData.phone
      }
    )
    
    if (response.data.status === 'success') {
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to access password-protected survey')
    }
  }

  // Get password-protected survey data after validation
  async getPasswordProtectedSurvey(
    surveyId: string,
    authToken: string,
    password: string
  ): Promise<ApiResponse<Survey>> {
    const response = await apiClient.post(`/surveys/password-surveys/${surveyId}/`, {
      password: password
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (response.data.status === 'success') {
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to fetch password-protected survey')
    }
  }

  async submitPasswordProtectedResponse(
    submissionData: PasswordProtectedResponseSubmission
  ): Promise<ApiResponse<PasswordProtectedResponseResult>> {
    // Get device MAC address and additional headers for device tracking
    const macAddress = await getDeviceMacAddress()
    const deviceHeaders = getDeviceHeaders()
    
    const response = await apiClient.post('/surveys/password-responses/', submissionData, {
      headers: {
        'X-Mac-Address': macAddress,
        ...deviceHeaders
      }
    })
    
    if (response.data.status === 'success') {
      return {
        data: {
          response_id: response.data.data.response_id,
          survey_id: response.data.data.survey_id,
          submitted_at: response.data.data.submitted_at,
          answers_count: response.data.data.answers_count,
          access_method: 'password_token'
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to submit password-protected response')
    }
  }

  // User Search and Management
  async searchUsers(query: string): Promise<ApiResponse<UserSearchResponse>> {
    if (query.length < 2) {
      return {
        data: {
          users: [],
          total: 0
        },
        message: 'Query too short',
        status: 'success'
      }
    }
    
    const response = await apiClient.get('/surveys/users/search/', {
      params: { query }
    })
    
    if (response.data.status === 'success') {
      return {
        data: {
          users: response.data.data.users || [],
          total: response.data.data.users?.length || 0
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to search users')
    }
  }

  // Get admin groups for survey sharing
  async getMyAdminGroups(): Promise<ApiResponse<AdminGroupsResponse>> {
    const response = await apiClient.get('/surveys/my-admin-groups/')
    
    // Check for both 'success' and 'status' fields for compatibility
    if (response.data.success || response.data.status === 'success') {
      return {
        data: response.data.data,
        message: response.data.message,
        status: 'success'
      }
    } else {
      throw new Error(response.data.message || 'Failed to get admin groups')
    }
  }

  async getAllUsers(limit: number = 50): Promise<ApiResponse<UserSearchResponse>> {
    const params = new URLSearchParams({
      limit: limit.toString()
    })
    return this.apiCall<ApiResponse<UserSearchResponse>>(`users?${params.toString()}`)
  }

  // Survey Sharing
  async shareSurvey(
    surveyId: string,
    shareData: ShareRequest
  ): Promise<ApiResponse<ShareResponse>> {
    const response = await apiClient.post(`/surveys/surveys/${surveyId}/share/`, shareData)
    
    if (response.data.status === 'success') {
      return {
        data: {
          shared_users: response.data.data.shared_users,
          total_shared: response.data.data.total_shared
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to share survey')
    }
  }

  async getSharedUsers(surveyId: string): Promise<ApiResponse<ShareResponse>> {
    return this.apiCall<ApiResponse<ShareResponse>>(`surveys/${surveyId}/shared-users/`)
  }

  async removeSharedUser(
    surveyId: string,
    userId: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.apiCall<ApiResponse<{ message: string }>>(`surveys/${surveyId}/shared-users/${userId}/`, {
      method: 'DELETE'
    })
  }

  // Access Validation
  async validateAccess(
    token: string
  ): Promise<ApiResponse<AccessResponse>> {
    const params = { token }
    // Use the new endpoint that doesn't require surveyId when using token
    const response = await apiClient.get('/surveys/surveys/access/', { params })
    
    if (response.data.status === 'success') {
      return {
        data: {
          has_access: response.data.data.has_access,
          survey: response.data.data.survey
        },
        message: response.data.message,
        status: response.data.status
      }
    } else {
      throw new Error(response.data.message || 'Failed to validate access')
    }
  }

  // Survey Response Submission - Anonymous (Email or Phone)
  async submitAnonymousResponse(
    submissionData: AnonymousResponseSubmission
  ): Promise<ApiResponse<ResponseSubmissionResult>> {
    try {
      // Get device MAC address and additional headers for device tracking
      const macAddress = await getDeviceMacAddress()
      const deviceHeaders = getDeviceHeaders()
      
      const response = await apiClient.post('/surveys/responses/', submissionData, {
        headers: {
          'X-Mac-Address': macAddress,
          ...deviceHeaders
        }
      })
      
      if (response.data.status === 'success') {
        return {
          data: response.data.data,
          message: response.data.message,
          status: response.data.status
        }
      } else {
        throw new Error(response.data.message || 'Failed to submit survey response')
      }
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error && (error as any).response?.data) {
        const apiError = (error as any).response.data
        if (apiError.status === 'error') {
          throw new Error(apiError.message || 'Failed to submit survey response')
        }
      }
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to submit survey response')
      }
    }
  }

  // Survey Response Submission - Authenticated
  async submitAuthenticatedResponse(
    submissionData: AuthenticatedResponseSubmission
  ): Promise<ApiResponse<ResponseSubmissionResult>> {
    try {
      // Get device MAC address and additional headers for device tracking
      const macAddress = await getDeviceMacAddress()
      const deviceHeaders = getDeviceHeaders()
      
      const response = await apiClient.post('/surveys/auth-responses/', submissionData, {
        headers: {
          'X-Mac-Address': macAddress,
          ...deviceHeaders
        }
      })
      
      if (response.data.status === 'success') {
        return {
          data: response.data.data,
          message: response.data.message,
          status: response.data.status
        }
      } else {
        throw new Error(response.data.message || 'Failed to submit survey response')
      }
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error && (error as any).response?.data) {
        const apiError = (error as any).response.data
        if (apiError.status === 'error') {
          throw new Error(apiError.message || 'Failed to submit survey response')
        }
      }
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to submit survey response')
      }
    }
  }

  // Legacy method - kept for backward compatibility
  async submitSurveyResponse(
    submissionData: {
      survey_id: string
      token?: string
      email?: string
      phone?: string
      answers: Array<{
        question_id: string
        answer: string | string[]
      }>
    }
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // Remove token from submission data since it's not needed for the API
      const { token: _token, ...apiSubmissionData } = submissionData
      
      const response = await apiClient.post('/surveys/responses/', apiSubmissionData)
      
      if (response.data.status === 'success') {
        return {
          data: { message: response.data.message },
          message: response.data.message,
          status: response.data.status
        }
      } else {
        throw new Error(response.data.message || 'Failed to submit survey response')
      }
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error && (error as any).response?.data) {
        const apiError = (error as any).response.data
        if (apiError.status === 'error') {
          throw new Error(apiError.message || 'Failed to submit survey response')
        }
      }
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to submit survey response')
      }
    }
  }

  // Public Survey Access (no authentication required)
  async getPublicSurvey(
    surveyId: string,
    token: string
  ): Promise<ApiResponse<Survey>> {
    const params = new URLSearchParams({ token })
    return this.apiCall<ApiResponse<Survey>>(`surveys/${surveyId}/public?${params.toString()}`)
  }

  // Question management - NOW IMPLEMENTED ✅
  async addQuestion(
    surveyId: string,
    questionData: QuestionCreateRequest
  ): Promise<ApiResponse<SurveyQuestion>> {
    return this.apiCall<ApiResponse<SurveyQuestion>>(`surveys/${surveyId}/questions/`, {
      method: 'POST',
      body: JSON.stringify(questionData)
    })
  }

  async updateQuestion(
    surveyId: string,
    questionId: string,
    questionData: Partial<QuestionCreateRequest>
  ): Promise<ApiResponse<SurveyQuestion>> {
    return this.apiCall<ApiResponse<SurveyQuestion>>(
      `surveys/${surveyId}/questions/${questionId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(questionData)
      }
    )
  }

  async deleteQuestion(surveyId: string, questionId: string): Promise<void> {
    await this.apiCall(`surveys/${surveyId}/questions/${questionId}/`, {
      method: 'DELETE'
    })
  }

  // Response management
  async getSurveyResponses(
    surveyId: string,
    filters?: {
      is_complete?: boolean
      respondent?: number
      ordering?: string
    }
  ): Promise<ApiResponse<SurveyResponse[]>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const endpoint = `surveys/${surveyId}/responses${
      params.toString() ? `?${params.toString()}` : ''
    }`
    return this.apiCall<ApiResponse<SurveyResponse[]>>(endpoint)
  }

  // Analytics - Using existing responses endpoint with analytics data
  async getAnalyticsDashboard(): Promise<ApiResponse<SurveyAnalytics>> {
    try {
      // Note: Analytics data is included in the responses endpoint
      // This is a placeholder implementation that aggregates from existing endpoints
      const surveys = await this.getAllSurveys()
      
      // Safely handle the surveys data - check if it exists and has the expected structure
      const surveysData = surveys?.results || []
      
      // Transform survey data into analytics format
      const analyticsData: SurveyAnalytics = {
        total_surveys: surveysData.length,
        active_surveys: surveysData.filter((s: Survey) => s?.is_active).length,
        total_responses: surveysData.reduce((sum: number, s: Survey) => sum + (s?.response_count || 0), 0),
        avg_response_rate: 0.75, // Placeholder calculation
        recent_activity: {
          new_surveys_this_week: 0, // Placeholder - would need date filtering
          new_responses_this_week: 0 // Placeholder - would need date filtering
        },
        top_surveys: surveysData
          .filter((s: Survey) => s && s.id && s.title) // Filter out any null/undefined surveys
          .sort((a: Survey, b: Survey) => (b?.response_count || 0) - (a?.response_count || 0))
          .slice(0, 5)
          .map((survey: Survey) => ({
            id: survey.id,
            title: survey.title,
            response_count: survey.response_count || 0,
            completion_rate: 0.85 // Placeholder calculation
          }))
      }

      return {
        status: 'success',
        message: 'Analytics retrieved successfully',
        data: analyticsData
      }
    } catch {
      // Return a fallback analytics object if there's an error
      return {
        status: 'success',
        message: 'Analytics retrieved with fallback data',
        data: {
          total_surveys: 0,
          active_surveys: 0,
          total_responses: 0,
          avg_response_rate: 0,
          recent_activity: {
            new_surveys_this_week: 0,
            new_responses_this_week: 0
          },
          top_surveys: []
        }
      }
    }
  }

  // Question Analytics - Get detailed analytics for a specific question
  async getQuestionAnalytics(surveyId: string, questionId: string, params?: {
    start_date?: string
    end_date?: string
    include_demographics?: boolean
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.include_demographics) queryParams.append('include_demographics', 'true')
    
    const queryString = queryParams.toString()
    const endpoint = `surveys/${surveyId}/analytics/questions/${questionId}/${queryString ? '?' + queryString : ''}`
    
    return this.apiCall<ApiResponse<any>>(endpoint)
  }

  // Export - NOW IMPLEMENTED ✅
  async exportSurveyData(
    surveyId: string,
    exportOptions: ExportRequest = { format: 'csv', include_personal_data: false }
  ): Promise<Blob> {
    const params = new URLSearchParams()
    if (exportOptions.format) {
      params.append('format', exportOptions.format)
    }
    if (exportOptions.include_personal_data !== undefined) {
      params.append('include_personal_data', exportOptions.include_personal_data.toString())
    }

    const queryString = params.toString()
    const endpoint = `/surveys/surveys/${surveyId}/export/${queryString ? `?${queryString}` : ''}`
    
    try {
      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Export failed: ${error.message}`)
    }
  }

  // Bulk operations - NOW IMPLEMENTED ✅
  async performBulkOperation(
    operationData: BulkOperationRequest
  ): Promise<ApiResponse<BulkOperationResult>> {
    return this.apiCall<ApiResponse<BulkOperationResult>>('bulk-operations/', {
      method: 'POST',
      body: JSON.stringify(operationData)
    })
  }

  // Utility methods
  async searchSurveys(query: string): Promise<PaginatedApiResponse<Survey>> {
    return this.getAllSurveys({ search: query })
  }

  async getSurveysByVisibility(visibility: string): Promise<PaginatedApiResponse<Survey>> {
    return this.getAllSurveys({ 
      visibility: visibility as 'PRIVATE' | 'AUTH' | 'PUBLIC' 
    })
  }

  async getActiveSurveys(): Promise<PaginatedApiResponse<Survey>> {
    return this.getAllSurveys({ is_active: true })
  }

  async getInactiveSurveys(): Promise<PaginatedApiResponse<Survey>> {
    return this.getAllSurveys({ is_active: false })
  }

  // Download exported file
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Validation helpers
  validateSurveyData(data: SurveyCreateRequest): string[] {
    const errors: string[] = []
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Survey title is required')
    }
    
    if (data.title && data.title.length > 200) {
      errors.push('Survey title must be less than 200 characters')
    }
    
    if (data.description && data.description.length > 1000) {
      errors.push('Survey description must be less than 1000 characters')
    }
    
    return errors
  }

  validateQuestionData(data: QuestionCreateRequest): string[] {
    const errors: string[] = []
    
    if (!data.text || data.text.trim().length === 0) {
      errors.push('Question text is required')
    }
    
    if (data.text && data.text.length > 500) {
      errors.push('Question text must be less than 500 characters')
    }
    
    if (['single_choice', 'multiple_choice'].includes(data.question_type)) {
      if (!data.options) {
        errors.push('Options are required for choice questions')
      } else {
        try {
          const options = JSON.parse(data.options)
          if (!Array.isArray(options) || options.length < 2) {
            errors.push('Choice questions must have at least 2 options')
          }
        } catch {
          errors.push('Options must be a valid JSON array')
        }
      }
    }
    
    return errors
  }

  // Token-accessible surveys endpoint
  async getTokenAccessibleSurveys(token: string): Promise<ApiResponse<TokenAccessibleSurveysResponse>> {
    try {
      // Use the token endpoint with the provided token
      const response = await apiClient.get(`/surveys/token/surveys/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      
      
      // Handle the response structure from the API
      if (response.data && typeof response.data === 'object') {
        if ('success' in response.data && 'data' in response.data) {
          return {
            status: 'success',
            message: response.data.message || 'Token-accessible surveys retrieved successfully',
            data: response.data.data
          }
        }
        
        // If it's the direct data structure, wrap it
        return {
          status: 'success',
          message: 'Token-accessible surveys retrieved successfully',
          data: response.data
        }
      }

      return response.data
    } catch (error: any) {
      // Logging removed for production
      
      // Handle specific error cases from the API documentation
      if (error.response?.status === 401) {
        if (error.response.data?.message?.includes('expired')) {
          throw new Error('Token has expired')
        } else if (error.response.data?.message?.includes('inactive')) {
          throw new Error('Associated survey is not active')
        } else {
          throw new Error('Invalid token')
        }
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to retrieve surveys')
    }
  }

  // Get shared surveys (my-shared endpoint)
  async getMySharedSurveys(filters?: SharedSurveysFilters): Promise<ApiResponse<SharedSurveysResponse> | PaginatedApiResponse<SharedSurvey>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const endpoint = `my-shared${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await apiClient.get(`${this.baseURL}${endpoint}`)
    // Debug log
    
    // Check if it's a paginated response from Django
    if (response.data && 'count' in response.data && 'results' in response.data) {
      return response.data as PaginatedApiResponse<SharedSurvey>
    }
    
    // Check if it's the wrapped API response structure
    if (response.data && 'status' in response.data && response.data.status === 'success') {
      return response.data as ApiResponse<SharedSurveysResponse>
    }
    
    // If it's the data directly, wrap it in the expected structure
    return {
      status: 'success',
      message: 'Shared surveys retrieved successfully',
      data: response.data
    } as ApiResponse<SharedSurveysResponse>
  }

  // Authenticated Survey Access Methods
  async getAuthSurvey(surveyId: string): Promise<AuthSurveyResponse> {
    try {
      const response = await apiClient.get(`/surveys/surveys/${surveyId}/auth-access/`)
      
      return {
        status: 'success',
        message: 'Survey retrieved successfully',
        data: response.data.data
      } as AuthSurveyResponse
    } catch (error: any) {
      // Logging removed for production
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required to access this survey')
      } else if (error.response?.status === 403) {
        throw new Error('Access denied to this survey')
      } else if (error.response?.status === 404) {
        throw new Error('Survey not found or not available')
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to load survey')
    }
  }

  async submitAuthResponse(submission: AuthResponseSubmission): Promise<AuthResponseResult> {
    try {
      // Get device MAC address and additional headers for device tracking
      const macAddress = await getDeviceMacAddress()
      const deviceHeaders = getDeviceHeaders()
      
      const response = await apiClient.post('/surveys/auth-responses/', submission, {
        headers: {
          'X-Mac-Address': macAddress,
          ...deviceHeaders
        }
      })
      
      return {
        status: 'success',
        message: 'Response submitted successfully',
        data: response.data.data
      } as AuthResponseResult
    } catch (error: any) {
      // Logging removed for production
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid request data')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required to submit response')
      } else if (error.response?.status === 403) {
        throw new Error('Access denied to this survey')
      } else if (error.response?.status === 404) {
        throw new Error('Survey not found')
      } else if (error.response?.status === 409) {
        throw new Error('لقد قمت بتقديم إجابة لهذا الاستطلاع من قبل')
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to submit response')
    }
  }
}

// Create and export a singleton instance
export const surveyService = new SurveyService()
export default surveyService

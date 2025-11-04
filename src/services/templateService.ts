/**
 * Template Service
 * Handles all API calls related to survey templates
 */

import { apiClient } from './jwtAuthService'
import type {
  TemplateGalleryResponse,
  SurveyTemplate,
  CreateTemplateRequest,
  CreateTemplateResponse,
  CreateSurveyFromTemplateRequest,
  CreateSurveyFromTemplateResponse,
  RecentSurvey,
  PredefinedTemplate
} from '../types/survey.types'

export const templateService = {
  /**
   * Get template gallery (predefined templates, user templates, recent surveys)
   * GET /surveys/templates/gallery/
   */
  async getTemplateGallery(): Promise<TemplateGalleryResponse> {
    try {
      const response = await apiClient.get('/surveys/templates/gallery/')
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to get template gallery:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to load template gallery')
    }
  },

  /**
   * Get all predefined templates
   * GET /surveys/templates/predefined/
   */
  async getPredefinedTemplates(): Promise<{ templates: PredefinedTemplate[] }> {
    try {
      const response = await apiClient.get('/surveys/templates/predefined/')
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to get predefined templates:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to load predefined templates')
    }
  },

  /**
   * Get user's custom templates
   * GET /surveys/templates/user/
   */
  async getUserTemplates(): Promise<{ templates: SurveyTemplate[] }> {
    try {
      const response = await apiClient.get('/surveys/templates/user/')
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to get user templates:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to load user templates')
    }
  },

  /**
   * Get recent surveys that can be used as templates
   * GET /surveys/recent/?can_template=true&limit=10
   */
  async getRecentSurveys(limit: number = 10): Promise<{ surveys: RecentSurvey[], total: number }> {
    try {
      const response = await apiClient.get('/surveys/recent/', {
        params: {
          can_template: true,
          limit
        }
      })
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to get recent surveys:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to load recent surveys')
    }
  },

  /**
   * Get a specific template by ID
   * GET /surveys/templates/{template_id}/
   */
  async getTemplate(templateId: string): Promise<{ template: SurveyTemplate }> {
    try {
      const response = await apiClient.get(`/surveys/templates/${templateId}/`)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to get template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to load template')
    }
  },

  /**
   * Create a custom template from an existing survey
   * POST /surveys/templates/create/
   */
  async createTemplate(data: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    try {
      const response = await apiClient.post('/surveys/templates/create/', data)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to create template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to create template')
    }
  },

  /**
   * Create a predefined template (Admin/Super Admin only)
   * POST /surveys/templates/predefined/create/
   */
  async createPredefinedTemplate(data: any): Promise<any> {
    try {
      const response = await apiClient.post('/surveys/templates/predefined/create/', data)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to create predefined template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to create predefined template')
    }
  },

  /**
   * Create a new survey from a template (predefined or user template)
   * POST /surveys/from-template/
   */
  async createSurveyFromTemplate(data: CreateSurveyFromTemplateRequest): Promise<CreateSurveyFromTemplateResponse> {
    try {
      const response = await apiClient.post('/surveys/from-template/', data)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to create survey from template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to create survey from template')
    }
  },

  /**
   * Create a survey from a recent survey (clone)
   * POST /surveys/{survey_id}/clone/
   */
  async createSurveyFromRecent(surveyId: string, customData?: { title?: string, description?: string }): Promise<{ survey: any }> {
    try {
      const response = await apiClient.post(`/surveys/${surveyId}/clone/`, customData || {})
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to clone survey:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to clone survey')
    }
  },

  /**
   * Delete a user template
   * DELETE /surveys/templates/{template_id}/
   */
  async deleteTemplate(templateId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/surveys/templates/${templateId}/`)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to delete template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete template')
    }
  },

  /**
   * Delete a predefined template (Admin/Super Admin only)
   * DELETE /surveys/templates/predefined/{template_id}/
   */
  async deletePredefinedTemplate(templateId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/surveys/templates/predefined/${templateId}/`)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to delete predefined template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete predefined template')
    }
  },

  /**
   * Update a user template
   * PATCH /surveys/templates/{template_id}/
   */
  async updateTemplate(templateId: string, data: Partial<CreateTemplateRequest>): Promise<{ template: SurveyTemplate }> {
    try {
      const response = await apiClient.patch(`/surveys/templates/${templateId}/`, data)
      
      // Handle the nested response structure from Django API
      if (response.data?.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error: any) {
      console.error('Failed to update template:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to update template')
    }
  }
}

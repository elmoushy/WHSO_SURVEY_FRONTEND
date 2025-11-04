import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type { 
  UserInfo, 
  HealthCheckResponse,
  UserProfileResponse,
  UserStatsResponse,
  LogoutResponse,
  UserUpdateRequest,
  AuthError
} from '../types/auth.types'

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Create axios instance for API calls
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Store for JWT ID token (from Azure AD)
let jwtIdToken: string | null = null

// Set JWT ID token for API requests
export const setAuthToken = (token: string | null): void => {
  jwtIdToken = token
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('azure_id_token', token)
  } else {
    delete apiClient.defaults.headers.common['Authorization']
    localStorage.removeItem('azure_id_token')
  }
}

// Get stored JWT ID token on app initialization
export const initializeAuthToken = (): void => {
  const storedToken = localStorage.getItem('azure_id_token')
  if (storedToken) {
    setAuthToken(storedToken)
  }
}

// Request interceptor to ensure token is present
apiClient.interceptors.request.use(
  (config) => {
    // Ensure we have the latest ID token
    const token = jwtIdToken || localStorage.getItem('azure_id_token')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log the request for debugging
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
    }
    return response
  },
  (error: AxiosError<AuthError>) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      setAuthToken(null)
      
      // CRITICAL: Don't redirect if we're on a survey page - surveys are public!
      if (window.location.pathname.startsWith('/survey/')) {
        return Promise.reject(error)
      }
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Log API errors in development - removed for production
    
    return Promise.reject(error)
  }
)

// Authentication API Service
export const authAPI = {
  // Get current authenticated user information
  getCurrentUser: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/auth/me/')
    return response.data
  },

  // Update current user profile information
  updateProfile: async (profileData: UserUpdateRequest): Promise<UserProfileResponse> => {
    const response = await apiClient.patch<UserProfileResponse>('/auth/me/', profileData)
    return response.data
  },

  // Get basic current user information (simplified version)
  getUserInfo: async (): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/auth/user-info/')
    return response.data
  },

  // Get user account statistics and metadata
  getUserStats: async (): Promise<UserStatsResponse> => {
    const response = await apiClient.get<UserStatsResponse>('/auth/stats/')
    return response.data
  },

  // Health check endpoint to verify authentication is working
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/auth/health/')
    return response.data
  },

  // Logout endpoint (signal to frontend to clear tokens)
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>('/auth/logout/')
    // Clear the token after successful logout
    setAuthToken(null)
    return response.data
  }
}

// Error handling utilities
export const handleApiError = (error: AxiosError<AuthError>): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Check if user is authenticated (has valid ID token)
export const isAuthenticated = (): boolean => {
  return !!jwtIdToken || !!localStorage.getItem('azure_id_token')
}

// Export the API client for direct use if needed
export { apiClient }

// Initialize token on module load
initializeAuthToken()

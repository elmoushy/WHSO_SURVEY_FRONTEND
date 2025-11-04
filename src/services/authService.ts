import { 
  PublicClientApplication, 
  type Configuration, 
  type AccountInfo, 
  type SilentRequest,
  InteractionRequiredAuthError,
  type AuthenticationResult
} from '@azure/msal-browser'
import { authAPI, setAuthToken, handleApiError } from './apiService'
import type { UserInfo, UserProfileResponse } from '../types/auth.types'

// Auth State Types
export enum AuthState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATING = 'authenticating',
  BACKEND_SYNC = 'backend_sync',
  AUTHENTICATED = 'authenticated',
  TOKEN_REFRESH = 'token_refresh',
  FAILED = 'failed'
}

export interface AuthContext {
  state: AuthState
  azureAccount: AccountInfo | null
  backendUser: UserInfo | null
  userProfile: UserProfileResponse | null
  error: string | null
  isLoading: boolean
  lastActivity: number
}

export interface AuthConfig {
  tokenRefreshThreshold: number // minutes before expiry to refresh
  sessionTimeout: number // minutes of inactivity
  maxRetries: number
  retryDelay: number // milliseconds
}

// MSAL Configuration with optimized settings
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: `${window.location.origin}/auth/complete/azuread-oauth2/`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: false, // Prevent automatic navigation
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
    secureCookies: true // For production
  },
  system: {
    loggerOptions: {
      loggerCallback: (_level, _message, containsPii) => {
        if (containsPii) return
        if (import.meta.env.VITE_ENVIRONMENT === 'development') {
          
        }
      },
      logLevel: import.meta.env.VITE_ENVIRONMENT === 'development' ? 3 : 1
    }
  }
}

// Centralized Authentication Service
export class AuthService {
  private msalInstance: PublicClientApplication
  private config: AuthConfig
  private context: AuthContext
  private listeners: Set<(context: AuthContext) => void> = new Set()
  private refreshTimer: number | null = null
  private activityTimer: number | null = null
  private retryCount = 0

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      tokenRefreshThreshold: 10, // 10 minutes
      sessionTimeout: 60, // 60 minutes
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      ...config
    }

    this.context = {
      state: AuthState.UNINITIALIZED,
      azureAccount: null,
      backendUser: null,
      userProfile: null,
      error: null,
      isLoading: false,
      lastActivity: Date.now()
    }

    this.msalInstance = new PublicClientApplication(msalConfig)
    this.setupActivityTracking()
  }

  // State Management
  private updateContext(updates: Partial<AuthContext>): void {
    this.context = { ...this.context, ...updates, lastActivity: Date.now() }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.context))
  }

  public subscribe(listener: (context: AuthContext) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.context)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Activity Tracking
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const updateActivity = () => {
      this.updateContext({ lastActivity: Date.now() })
    }
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check for session timeout every minute
    setInterval(() => {
      if (this.context.state === AuthState.AUTHENTICATED) {
        const inactiveTime = Date.now() - this.context.lastActivity
        if (inactiveTime > this.config.sessionTimeout * 60 * 1000) {
          this.logout('Session expired due to inactivity')
        }
      }
    }, 60000)
  }

  // Core Authentication Methods
  public async initialize(): Promise<void> {
    if (this.context.state !== AuthState.UNINITIALIZED) return

    this.updateContext({ 
      state: AuthState.INITIALIZING, 
      isLoading: true, 
      error: null 
    })

    try {
      await this.msalInstance.initialize()
      
      // Handle redirect response if present
      const response = await this.msalInstance.handleRedirectPromise()
      
      if (response?.account) {
        // Successful redirect authentication
        await this.handleAzureSuccess(response.account, response)
      } else {
        // Check for existing session
        const accounts = this.msalInstance.getAllAccounts()
        if (accounts.length > 0) {
          await this.handleAzureSuccess(accounts[0])
        } else {
          this.updateContext({ 
            state: AuthState.UNAUTHENTICATED, 
            isLoading: false 
          })
        }
      }
    } catch (error) {
      // Logging removed for production
      this.updateContext({ 
        state: AuthState.FAILED, 
        isLoading: false, 
        error: 'Failed to initialize authentication' 
      })
    }
  }

  public async login(method: 'redirect' | 'popup' = 'redirect'): Promise<void> {
    if (this.context.state === AuthState.AUTHENTICATING) return

    this.updateContext({ 
      state: AuthState.AUTHENTICATING, 
      isLoading: true, 
      error: null 
    })

    try {
      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account' as const
      }

      if (method === 'popup') {
        const response = await this.msalInstance.loginPopup(loginRequest)
        await this.handleAzureSuccess(response.account, response)
      } else {
        // Store intended redirect location
        const currentPath = window.location.pathname + window.location.search
        if (currentPath !== '/login') {
          sessionStorage.setItem('auth-redirect-to', currentPath)
        }
        
        await this.msalInstance.loginRedirect(loginRequest)
        // Note: Redirect will complete in handleRedirectPromise during next page load
      }
    } catch (error) {
      // Logging removed for production
      this.updateContext({ 
        state: AuthState.FAILED, 
        isLoading: false, 
        error: 'Login failed' 
      })
    }
  }

  private async handleAzureSuccess(
    account: AccountInfo, 
    _response?: AuthenticationResult
  ): Promise<void> {
    this.msalInstance.setActiveAccount(account)
    this.updateContext({ azureAccount: account })

    // Now sync with backend
    await this.syncWithBackend()
  }

  private async syncWithBackend(): Promise<void> {
    this.updateContext({ state: AuthState.BACKEND_SYNC })

    try {
      // Get fresh ID token
      const idToken = await this.getIdToken()
      if (!idToken) {
        throw new Error('Failed to acquire ID token')
      }

      // Set token for API requests
      setAuthToken(idToken)

      // Parallel requests for better performance
      const [_healthCheck, userInfo] = await Promise.all([
        authAPI.healthCheck(),
        authAPI.getUserInfo()
      ])

      this.updateContext({ 
        state: AuthState.AUTHENTICATED,
        backendUser: userInfo,
        isLoading: false,
        error: null
      })

      // Set up token refresh
      this.scheduleTokenRefresh(idToken)

      // Handle post-auth redirect
      this.handlePostAuthRedirect()

    } catch (error) {
      // Logging removed for production
      this.updateContext({ 
        state: AuthState.FAILED, 
        isLoading: false, 
        error: handleApiError(error as any) 
      })
    }
  }

  // Token Management
  private async getIdToken(): Promise<string | null> {
    const account = this.context.azureAccount
    if (!account) return null

    try {
      const request: SilentRequest = {
        scopes: ['openid', 'profile', 'email'],
        account
      }

      const response = await this.msalInstance.acquireTokenSilent(request)
      return response.idToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Try popup for seamless refresh
        try {
          const response = await this.msalInstance.acquireTokenPopup({
            scopes: ['openid', 'profile', 'email'],
            account
          })
          return response.idToken
        } catch (popupError) {
          // Logging removed for production
          return null
        }
      }
      // Logging removed for production
      return null
    }
  }

  private scheduleTokenRefresh(token: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    try {
      // Decode token to get expiry
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000 // Convert to milliseconds
      const refreshTime = expiryTime - (this.config.tokenRefreshThreshold * 60 * 1000)
      const delay = Math.max(0, refreshTime - Date.now())

      this.refreshTimer = window.setTimeout(async () => {
        await this.refreshToken()
      }, delay)

    } catch (error) {
      // Logging removed for production
      // Fallback: refresh in 5 minutes
      this.refreshTimer = window.setTimeout(async () => {
        await this.refreshToken()
      }, 5 * 60 * 1000)
    }
  }

  private async refreshToken(): Promise<void> {
    if (this.context.state !== AuthState.AUTHENTICATED) return

    this.updateContext({ state: AuthState.TOKEN_REFRESH })

    try {
      const newToken = await this.getIdToken()
      if (!newToken) {
        throw new Error('Failed to refresh token')
      }

      setAuthToken(newToken)
      this.scheduleTokenRefresh(newToken)
      
      this.updateContext({ 
        state: AuthState.AUTHENTICATED,
        error: null 
      })

    } catch (error) {
      // Logging removed for production
      await this.logout('Session expired')
    }
  }

  // User Data Management
  public async fetchUserProfile(): Promise<UserProfileResponse | null> {
    if (this.context.state !== AuthState.AUTHENTICATED) return null

    try {
      this.updateContext({ isLoading: true })
      const profile = await authAPI.getCurrentUser()
      this.updateContext({ userProfile: profile, isLoading: false })
      return profile
    } catch (error) {
      this.updateContext({ 
        error: handleApiError(error as any),
        isLoading: false 
      })
      return null
    }
  }

  // Logout
  public async logout(reason?: string): Promise<void> {
    try {
      // Clear timers
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
      if (this.activityTimer) {
        clearTimeout(this.activityTimer)
        this.activityTimer = null
      }

      // Backend logout
      if (this.context.state === AuthState.AUTHENTICATED) {
        try {
          await authAPI.logout()
        } catch (error) {
          // Logging removed for production
        }
      }

      // Clear API token
      setAuthToken(null)

      // Azure logout
      const logoutRequest = {
        account: this.context.azureAccount,
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
      }

      // Reset context
      this.updateContext({
        state: AuthState.UNAUTHENTICATED,
        azureAccount: null,
        backendUser: null,
        userProfile: null,
        error: reason || null,
        isLoading: false
      })

      // Perform MSAL logout
      await this.msalInstance.logoutRedirect(logoutRequest)

    } catch (error) {
      // Logging removed for production
      // Force reset even if logout fails
      this.updateContext({
        state: AuthState.UNAUTHENTICATED,
        azureAccount: null,
        backendUser: null,
        userProfile: null,
        error: 'Logout completed with errors',
        isLoading: false
      })
    }
  }

  // Utility Methods
  private handlePostAuthRedirect(): void {
    const redirectTo = sessionStorage.getItem('auth-redirect-to') || '/surveys'
    sessionStorage.removeItem('auth-redirect-to')
    
    // Use router navigation if available, otherwise redirect
    if (window.history.pushState) {
      window.history.pushState(null, '', redirectTo)
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else {
      window.location.href = redirectTo
    }
  }

  public retry(): void {
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++
      const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1)
      
      setTimeout(() => {
        if (this.context.azureAccount) {
          this.syncWithBackend()
        } else {
          this.initialize()
        }
      }, delay)
    }
  }

  public clearError(): void {
    this.updateContext({ error: null })
  }

  // Getters
  public getContext(): AuthContext {
    return { ...this.context }
  }

  public isAuthenticated(): boolean {
    return this.context.state === AuthState.AUTHENTICATED
  }

  public isLoading(): boolean {
    return this.context.isLoading || [
      AuthState.INITIALIZING,
      AuthState.AUTHENTICATING,
      AuthState.BACKEND_SYNC,
      AuthState.TOKEN_REFRESH
    ].includes(this.context.state)
  }
}

// Singleton instance
export const authService = new AuthService()

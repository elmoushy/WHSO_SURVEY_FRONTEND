import { apiClient } from './jwtAuthService'
import type { AxiosResponse } from 'axios'
import type {
  User,
  // Group, // Unused - commenting out
  // Role, // Unused - commenting out 
  // GroupDropdown, // Unused - commenting out
  DashboardStats,
  UserListResponse,
  GroupListResponse,
  GroupDetailsResponse,
  UserGroupsResponse,
  RoleListResponse,
  GroupDropdownResponse,
  SearchUsersResponse,
  CreateGroupResponse,
  UpdateGroupResponse,
  AddUserToGroupResponse,
  UpdateUserRoleResponse,
  BulkAddUsersResponse,
  InviteUserResponse,
  CreateUserResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddUserToGroupRequest,
  UpdateUserGroupRequest,
  UpdateUserRoleRequest,
  BulkAddUsersRequest,
  InviteUserRequest,
  CreateUserRequest,
  SearchUsersQuery,
  BulkDeleteRequest,
  BulkDeleteResponse
  // ApiResponse // Unused - commenting out
} from '../types/user-management.types'

// === USER ENDPOINTS ===

/**
 * Get current authenticated user information
 */
export const getCurrentUser = async (): Promise<User> => {
  const response: AxiosResponse<{ user: User; message: string }> = await apiClient.get('/auth/me/')
  return response.data.user
}

/**
 * List all users in the system (super_admin only)
 */
export const getUsers = async (): Promise<UserListResponse> => {
  const response: AxiosResponse<UserListResponse> = await apiClient.get('/auth/users/')
  return response.data
}

/**
 * Search users by name or email
 */
export const searchUsers = async (query: SearchUsersQuery): Promise<SearchUsersResponse> => {
  const params = new URLSearchParams()
  if (query.q) params.append('q', query.q)
  if (query.limit) params.append('limit', query.limit.toString())
  
  const response: AxiosResponse<SearchUsersResponse> = await apiClient.get(
    `/auth/users/search/?${params.toString()}`
  )
  return response.data
}

/**
 * Create a new user (admin and super_admin only)
 */
export const createUser = async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
  const response: AxiosResponse<CreateUserResponse> = await apiClient.post('/auth/add-user/', userData)
  return response.data
}

/**
 * Update user role (super_admin only)
 */
export const updateUserRole = async (userId: number, roleData: UpdateUserRoleRequest): Promise<UpdateUserRoleResponse> => {
  const response: AxiosResponse<UpdateUserRoleResponse> = await apiClient.put(
    `/auth/users/${userId}/role/`,
    roleData
  )
  return response.data
}

/**
 * Reset user password (admin and super_admin only)
 */
export const resetUserPassword = async (userId: number, newPassword: string): Promise<{ message: string; user: { id: number; email: string; username: string } }> => {
  const response: AxiosResponse<{ message: string; user: { id: number; email: string; username: string } }> = await apiClient.post(
    '/auth/users/reset-password/',
    {
      user_id: userId,
      new_password: newPassword
    }
  )
  return response.data
}

/**
 * Get all groups a specific user belongs to
 */
export const getUserGroups = async (userId: number): Promise<UserGroupsResponse> => {
  const response: AxiosResponse<UserGroupsResponse> = await apiClient.get(`/auth/users/${userId}/groups/`)
  return response.data
}

/**
 * Invite new users to the system
 */
export const inviteUser = async (inviteData: InviteUserRequest): Promise<InviteUserResponse> => {
  const response: AxiosResponse<InviteUserResponse> = await apiClient.post('/auth/users/invite/', inviteData)
  return response.data
}

/**
 * Bulk delete users (admin and super_admin only)
 */
export const bulkDeleteUsers = async (deleteData: BulkDeleteRequest): Promise<BulkDeleteResponse> => {
  const response: AxiosResponse<BulkDeleteResponse> = await apiClient.post('/auth/users/bulk-delete/', deleteData)
  return response.data
}

// === GROUP ENDPOINTS ===

/**
 * List groups based on user role
 */
export const getGroups = async (): Promise<GroupListResponse> => {
  const response: AxiosResponse<GroupListResponse> = await apiClient.get('/auth/groups/')
  return response.data
}

/**
 * Get detailed group information with members and admins (using same endpoint as getGroups)
 */
export const getGroupsWithDetails = async (): Promise<GroupListResponse> => {
  const response: AxiosResponse<GroupListResponse> = await apiClient.get('/auth/groups/')
  return response.data
}

/**
 * Create a new group with admin assignments (super_admin only)
 */
export const createGroup = async (groupData: CreateGroupRequest): Promise<CreateGroupResponse> => {
  const response: AxiosResponse<CreateGroupResponse> = await apiClient.post('/auth/groups/', groupData)
  return response.data
}

/**
 * Get detailed information about a specific group
 */
export const getGroupDetails = async (groupId: number): Promise<GroupDetailsResponse> => {
  const response: AxiosResponse<GroupDetailsResponse> = await apiClient.get(`/auth/groups/${groupId}/`)
  return response.data
}

/**
 * Update group information (super_admin only)
 */
export const updateGroup = async (groupId: number, groupData: UpdateGroupRequest): Promise<UpdateGroupResponse> => {
  const response: AxiosResponse<UpdateGroupResponse> = await apiClient.put(`/auth/groups/${groupId}/`, groupData)
  return response.data
}

/**
 * Delete a group (super_admin only)
 */
export const deleteGroup = async (groupId: number): Promise<{ message: string }> => {
  const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/auth/groups/${groupId}/`)
  return response.data
}

/**
 * Add a user to a group
 */
export const addUserToGroup = async (groupId: number, userData: AddUserToGroupRequest): Promise<AddUserToGroupResponse> => {
  const response: AxiosResponse<AddUserToGroupResponse> = await apiClient.post(
    `/auth/groups/${groupId}/users/`,
    userData
  )
  return response.data
}

/**
 * Update user's group membership (toggle admin status)
 */
export const updateUserGroupMembership = async (
  groupId: number,
  userId: number,
  membershipData: UpdateUserGroupRequest
): Promise<AddUserToGroupResponse> => {
  const response: AxiosResponse<AddUserToGroupResponse> = await apiClient.put(
    `/auth/groups/${groupId}/users/${userId}/`,
    membershipData
  )
  return response.data
}

/**
 * Remove a user from a group
 */
export const removeUserFromGroup = async (groupId: number, userId: number): Promise<{ message: string }> => {
  const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/auth/groups/${groupId}/users/${userId}/`)
  return response.data
}

/**
 * Add multiple users to a group at once
 */
export const bulkAddUsersToGroup = async (bulkData: BulkAddUsersRequest): Promise<BulkAddUsersResponse> => {
  const response: AxiosResponse<BulkAddUsersResponse> = await apiClient.post('/auth/groups/bulk-add-users/', bulkData)
  return response.data
}

// === UTILITY ENDPOINTS ===

/**
 * Get list of available user roles for dropdowns
 */
export const getRoles = async (): Promise<RoleListResponse> => {
  const response: AxiosResponse<RoleListResponse> = await apiClient.get('/auth/roles/')
  return response.data
}

/**
 * Get lightweight list of groups for dropdown selections
 */
export const getGroupsDropdown = async (): Promise<GroupDropdownResponse> => {
  const response: AxiosResponse<GroupDropdownResponse> = await apiClient.get('/auth/groups/dropdown/')
  return response.data
}

/**
 * Get dashboard statistics for user management overview
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response: AxiosResponse<DashboardStats> = await apiClient.get('/auth/stats/dashboard/')
  return response.data
}

// === ERROR HANDLING UTILITIES ===

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length > 0) {
      return errors[firstKey][0]
    }
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Check if user has permission for specific actions
 */
export const hasPermission = (userRole: string, requiredRole: 'super_admin' | 'admin' | 'user'): boolean => {
  const roleHierarchy = {
    'super_admin': 3,
    'admin': 2,
    'user': 1
  }
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

export default {
  // User endpoints
  getCurrentUser,
  getUsers,
  searchUsers,
  createUser,
  updateUserRole,
  getUserGroups,
  inviteUser,
  bulkDeleteUsers,
  
  // Group endpoints
  getGroups,
  getGroupsWithDetails,
  createGroup,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  updateUserGroupMembership,
  removeUserFromGroup,
  bulkAddUsersToGroup,
  
  // Utility endpoints
  getRoles,
  getGroupsDropdown,
  getDashboardStats,
  
  // Utilities
  getErrorMessage,
  hasPermission
}

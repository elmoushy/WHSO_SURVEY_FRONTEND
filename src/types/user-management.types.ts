// User Management Types
export interface User {
  id: number
  azure_object_id?: string
  username?: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  initials?: string
  role: 'super_admin' | 'admin' | 'user'
  role_display: string
  is_active: boolean
  is_staff?: boolean
  date_joined: string
  last_login: string | null
}

export interface Group {
  id: number
  name: string
  description?: string
  admin_count: number
  user_count: number
  user_groups?: UserGroup[]
  members?: User[]
  admins?: User[]
  created_at: string
  updated_at: string
}

export interface UserGroup {
  id: number
  user: {
    id: number
    email: string
    full_name: string
    role: string
  }
  group: {
    id: number
    name: string
  }
  is_group_admin: boolean
  joined_at: string
}

export interface Role {
  value: string
  display: string
}

export interface GroupDropdown {
  id: number
  name: string
}

export interface DashboardStats {
  total_users: number
  total_groups: number
  active_users: number
  super_admins: number
  admins: number
  regular_users: number
  recent_activity: RecentActivity[]
}

export interface RecentActivity {
  id: number
  user: string
  action: string
  timestamp: string
  description: string
}

// Request/Response Types
export interface CreateGroupRequest {
  name: string
  description?: string
  admin_user_ids: number[]
}

export interface UpdateGroupRequest {
  name: string
  description?: string
}

export interface AddUserToGroupRequest {
  user_id: number
  is_group_admin: boolean
}

export interface UpdateUserGroupRequest {
  is_group_admin: boolean
}

export interface UpdateUserRoleRequest {
  role: 'super_admin' | 'admin' | 'user'
}

export interface BulkAddUsersRequest {
  group_id: number
  user_ids: number[]
  is_group_admin: boolean
}

export interface InviteUserRequest {
  email: string
  first_name: string
  last_name: string
  groups: number[]
  role: 'super_admin' | 'admin' | 'user'
}

export interface CreateUserRequest {
  email: string
  auth_type: 'regular' | 'azure'
  password?: string
  first_name?: string
  last_name?: string
  role?: 'super_admin' | 'admin' | 'user'
}

export interface SearchUsersQuery {
  q?: string
  limit?: number
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  message?: string
  detail?: string
  errors?: Record<string, string[]>
}

export interface UserListResponse {
  users: User[]
  count: number
}

export interface GroupListResponse {
  groups: Group[]
  count: number
}

export interface GroupDetailsResponse extends Group {}

export interface UserGroupsResponse {
  user: User
  groups: Array<{
    id: number
    name: string
    description: string
    is_group_admin: boolean
    joined_at: string
  }>
  group_count: number
}

export interface RoleListResponse {
  roles: Role[]
}

export interface GroupDropdownResponse {
  groups: GroupDropdown[]
}

export interface SearchUsersResponse {
  users: User[]
  count: number
}

export interface CreateGroupResponse {
  group: Group
  message: string
}

export interface UpdateGroupResponse extends Group {}

export interface AddUserToGroupResponse {
  group: Group
  message: string
}

export interface UpdateUserRoleResponse {
  user: User
  message: string
}

export interface BulkAddUsersResponse {
  group: {
    id: number
    name: string
    user_count: number
    admin_count: number
  }
  added_users: User[]
  message: string
}

export interface InviteUserResponse {
  user: User
  message: string
}

export interface CreateUserResponse {
  user: User
  message: string
}

// Filter and Sort Types
export interface UserFilters {
  role?: string
  is_active?: boolean
  group_id?: number
  search?: string
}

export interface GroupFilters {
  search?: string
  has_admins?: boolean
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Modal and Form Types
export interface UserModalMode {
  type: 'create' | 'edit' | 'view' | 'invite'
  user?: User
}

export interface GroupModalMode {
  type: 'create' | 'edit' | 'view'
  group?: Group
}

export interface BulkActionMode {
  type: 'add_to_group' | 'remove_from_group' | 'change_role' | 'bulk_delete'
  selected_users: User[]
}

// Bulk Delete Types
export interface BulkDeleteRequest {
  user_ids: number[]
}

export interface BulkDeleteSuccessfulUser {
  id: number
  email: string
  username: string
  role: string
}

export interface BulkDeleteFailedUser {
  id: number
  email?: string
  username?: string
  error: string
}

export interface BulkDeleteSummary {
  total_requested: number
  successful_deletions: number
  failed_deletions: number
}

export interface BulkDeleteResults {
  successful: BulkDeleteSuccessfulUser[]
  failed: BulkDeleteFailedUser[]
}

export interface BulkDeleteResponse {
  message: string
  summary: BulkDeleteSummary
  results: BulkDeleteResults
}

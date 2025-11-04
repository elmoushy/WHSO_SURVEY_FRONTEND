import { ref, computed, type Ref } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import {
  getCurrentUser,
  getUsers,
  getGroups,
  searchUsers,
  createUser,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  updateUserRole,
  bulkAddUsersToGroup,
  inviteUser,
  // getGroupDetails, // Unused - commenting out
  // getUserGroups, // Unused - commenting out
  getRoles,
  getGroupsDropdown,
  getDashboardStats,
  getErrorMessage,
  hasPermission
} from '../services/userManagementService'
import type {
  User,
  Group,
  DashboardStats,
  UserFilters,
  GroupFilters,
  SortOptions,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddUserToGroupRequest,
  UpdateUserRoleRequest,
  BulkAddUsersRequest,
  InviteUserRequest,
  CreateUserRequest
} from '../types/user-management.types'

export function useUserManagement() {
  const store = useAppStore()
  
  // Reactive state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const groups = ref<Group[]>([])
  const selectedUsers = ref<User[]>([])
  const selectedGroups = ref<Group[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)
  const roles = ref<Array<{ value: string; display: string }>>([])
  const groupsDropdown = ref<Array<{ id: number; name: string }>>([])
  
  // Filters and sorting
  const userFilters = ref<UserFilters>({})
  const groupFilters = ref<GroupFilters>({})
  const userSort = ref<SortOptions>({ field: 'email', direction: 'asc' })
  const groupSort = ref<SortOptions>({ field: 'name', direction: 'asc' })
  
  // Pagination
  const usersPage = ref(1)
  const groupsPage = ref(1)
  const itemsPerPage = 20
  
  // Computed properties
  const filteredUsers = computed(() => {
    let filtered = [...users.value]
    
    // Apply filters
    if (userFilters.value.role) {
      filtered = filtered.filter(user => user.role === userFilters.value.role)
    }
    
    if (userFilters.value.is_active !== undefined) {
      filtered = filtered.filter(user => user.is_active === userFilters.value.is_active)
    }
    
    if (userFilters.value.search) {
      const search = userFilters.value.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(search) ||
        user.full_name.toLowerCase().includes(search) ||
        user.first_name.toLowerCase().includes(search) ||
        user.last_name.toLowerCase().includes(search)
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[userSort.value.field as keyof User] as string
      const bValue = b[userSort.value.field as keyof User] as string
      
      if (userSort.value.direction === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
    
    return filtered
  })
  
  const filteredGroups = computed(() => {
    let filtered = [...groups.value]
    
    // Apply filters
    if (groupFilters.value.search) {
      const search = groupFilters.value.search.toLowerCase()
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(search) ||
        (group.description?.toLowerCase().includes(search))
      )
    }
    
    if (groupFilters.value.has_admins !== undefined) {
      filtered = filtered.filter(group => 
        groupFilters.value.has_admins ? group.admin_count > 0 : group.admin_count === 0
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[groupSort.value.field as keyof Group] as string | number
      const bValue = b[groupSort.value.field as keyof Group] as string | number
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (groupSort.value.direction === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else {
        if (groupSort.value.direction === 'asc') {
          return (aValue as number) - (bValue as number)
        } else {
          return (bValue as number) - (aValue as number)
        }
      }
    })
    
    return filtered
  })
  
  const paginatedUsers = computed(() => {
    const start = (usersPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredUsers.value.slice(start, end)
  })
  
  const paginatedGroups = computed(() => {
    const start = (groupsPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredGroups.value.slice(start, end)
  })
  
  const totalUsersPages = computed(() => 
    Math.ceil(filteredUsers.value.length / itemsPerPage)
  )
  
  const totalGroupsPages = computed(() => 
    Math.ceil(filteredGroups.value.length / itemsPerPage)
  )
  
  const hasSelectedUsers = computed(() => selectedUsers.value.length > 0)
  const hasSelectedGroups = computed(() => selectedGroups.value.length > 0)
  
  const isCurrentUserSuperAdmin = computed(() => 
    currentUser.value?.role === 'super_admin'
  )
  
  const isCurrentUserAdmin = computed(() => 
    currentUser.value?.role === 'admin' || isCurrentUserSuperAdmin.value
  )
  
  // Translation helper
  const t = computed(() => store.t)
  
  // === API METHODS ===
  
  /**
   * Initialize user management data
   */
  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      await Promise.all([
        loadCurrentUser(),
        loadDashboardStats(),
        loadRoles(),
        loadGroupsDropdown()
      ])
      
      if (isCurrentUserAdmin.value) {
        await Promise.all([
          loadUsers(),
          loadGroups()
        ])
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Load current user information
   */
  const loadCurrentUser = async () => {
    try {
      currentUser.value = await getCurrentUser()
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Load all users
   */
  const loadUsers = async () => {
    try {
      const response = await getUsers()
      users.value = response.users
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Load all groups
   */
  const loadGroups = async () => {
    try {
      const response = await getGroups()
      groups.value = response.groups
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Load dashboard statistics
   */
  const loadDashboardStats = async () => {
    try {
      dashboardStats.value = await getDashboardStats()
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Load available roles
   */
  const loadRoles = async () => {
    try {
      const response = await getRoles()
      roles.value = response.roles
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Load groups dropdown
   */
  const loadGroupsDropdown = async () => {
    try {
      const response = await getGroupsDropdown()
      groupsDropdown.value = response.groups
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }
  
  /**
   * Search users
   */
  const searchUsersQuery = async (query: string, limit?: number) => {
    try {
      loading.value = true
      const response = await searchUsers({ q: query, limit })
      return response.users
    } catch (err: any) {
      error.value = getErrorMessage(err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create a new group
   */
  const createNewGroup = async (groupData: CreateGroupRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await createGroup(groupData)
      groups.value.push(response.group)
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update an existing group
   */
  const updateExistingGroup = async (groupId: number, groupData: UpdateGroupRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const updatedGroup = await updateGroup(groupId, groupData)
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = updatedGroup
      }
      
      return updatedGroup
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a group
   */
  const deleteExistingGroup = async (groupId: number) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await deleteGroup(groupId)
      groups.value = groups.value.filter(g => g.id !== groupId)
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Add user to group
   */
  const addUserToExistingGroup = async (groupId: number, userData: AddUserToGroupRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await addUserToGroup(groupId, userData)
      
      // Update the group in the local state
      const groupIndex = groups.value.findIndex(g => g.id === groupId)
      if (groupIndex !== -1) {
        groups.value[groupIndex] = response.group
      }
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Remove user from group
   */
  const removeUserFromExistingGroup = async (groupId: number, userId: number) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await removeUserFromGroup(groupId, userId)
      
      // Reload groups to get updated counts
      await loadGroups()
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update user role
   */
  const updateExistingUserRole = async (userId: number, roleData: UpdateUserRoleRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await updateUserRole(userId, roleData)
      
      // Update the user in the local state
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex] = response.user
      }
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Bulk add users to group
   */
  const bulkAddUsersToExistingGroup = async (bulkData: BulkAddUsersRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await bulkAddUsersToGroup(bulkData)
      
      // Reload groups to get updated counts
      await loadGroups()
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Invite new user
   */
  const inviteNewUser = async (inviteData: InviteUserRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await inviteUser(inviteData)
      
      // Reload users to include the new invited user
      await loadUsers()
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create new user
   */
  const createNewUser = async (userData: CreateUserRequest) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await createUser(userData)
      
      // Reload users to include the new user
      await loadUsers()
      
      return response
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // === SELECTION METHODS ===
  
  /**
   * Toggle user selection
   */
  const toggleUserSelection = (user: User) => {
    const index = selectedUsers.value.findIndex(u => u.id === user.id)
    if (index === -1) {
      selectedUsers.value.push(user)
    } else {
      selectedUsers.value.splice(index, 1)
    }
  }
  
  /**
   * Toggle group selection
   */
  const toggleGroupSelection = (group: Group) => {
    const index = selectedGroups.value.findIndex(g => g.id === group.id)
    if (index === -1) {
      selectedGroups.value.push(group)
    } else {
      selectedGroups.value.splice(index, 1)
    }
  }
  
  /**
   * Select all users on current page
   */
  const selectAllUsersOnPage = () => {
    paginatedUsers.value.forEach(user => {
      const exists = selectedUsers.value.find(u => u.id === user.id)
      if (!exists) {
        selectedUsers.value.push(user)
      }
    })
  }
  
  /**
   * Clear user selection
   */
  const clearUserSelection = () => {
    selectedUsers.value = []
  }
  
  /**
   * Clear group selection
   */
  const clearGroupSelection = () => {
    selectedGroups.value = []
  }
  
  // === FILTER AND SORT METHODS ===
  
  /**
   * Update user filters
   */
  const updateUserFilters = (filters: Partial<UserFilters>) => {
    userFilters.value = { ...userFilters.value, ...filters }
    usersPage.value = 1 // Reset to first page
  }
  
  /**
   * Update group filters
   */
  const updateGroupFilters = (filters: Partial<GroupFilters>) => {
    groupFilters.value = { ...groupFilters.value, ...filters }
    groupsPage.value = 1 // Reset to first page
  }
  
  /**
   * Update user sorting
   */
  const updateUserSort = (sort: SortOptions) => {
    userSort.value = sort
  }
  
  /**
   * Update group sorting
   */
  const updateGroupSort = (sort: SortOptions) => {
    groupSort.value = sort
  }
  
  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    userFilters.value = {}
    groupFilters.value = {}
    usersPage.value = 1
    groupsPage.value = 1
  }
  
  // === PAGINATION METHODS ===
  
  /**
   * Go to users page
   */
  const goToUsersPage = (page: number) => {
    usersPage.value = Math.max(1, Math.min(page, totalUsersPages.value))
  }
  
  /**
   * Go to groups page
   */
  const goToGroupsPage = (page: number) => {
    groupsPage.value = Math.max(1, Math.min(page, totalGroupsPages.value))
  }
  
  /**
   * Check if user has specific permission
   */
  const checkPermission = (requiredRole: 'super_admin' | 'admin' | 'user'): boolean => {
    if (!currentUser.value) return false
    return hasPermission(currentUser.value.role, requiredRole)
  }
  
  /**
   * Refresh all data
   */
  const refreshData = async () => {
    await initialize()
  }
  
  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }
  
  return {
    // State
    loading: loading as Ref<boolean>,
    error: error as Ref<string | null>,
    currentUser: currentUser as Ref<User | null>,
    users: users as Ref<User[]>,
    groups: groups as Ref<Group[]>,
    selectedUsers: selectedUsers as Ref<User[]>,
    selectedGroups: selectedGroups as Ref<Group[]>,
    dashboardStats: dashboardStats as Ref<DashboardStats | null>,
    roles: roles as Ref<Array<{ value: string; display: string }>>,
    groupsDropdown: groupsDropdown as Ref<Array<{ id: number; name: string }>>,
    
    // Filters and sorting
    userFilters: userFilters as Ref<UserFilters>,
    groupFilters: groupFilters as Ref<GroupFilters>,
    userSort: userSort as Ref<SortOptions>,
    groupSort: groupSort as Ref<SortOptions>,
    
    // Pagination
    usersPage: usersPage as Ref<number>,
    groupsPage: groupsPage as Ref<number>,
    itemsPerPage,
    
    // Computed
    filteredUsers,
    filteredGroups,
    paginatedUsers,
    paginatedGroups,
    totalUsersPages,
    totalGroupsPages,
    hasSelectedUsers,
    hasSelectedGroups,
    isCurrentUserSuperAdmin,
    isCurrentUserAdmin,
    t,
    
    // Methods
    initialize,
    loadCurrentUser,
    loadUsers,
    loadGroups,
    loadDashboardStats,
    loadRoles,
    loadGroupsDropdown,
    searchUsersQuery,
    createNewGroup,
    updateExistingGroup,
    deleteExistingGroup,
    addUserToExistingGroup,
    removeUserFromExistingGroup,
    updateExistingUserRole,
    bulkAddUsersToExistingGroup,
    inviteNewUser,
    createNewUser,
    
    // Selection methods
    toggleUserSelection,
    toggleGroupSelection,
    selectAllUsersOnPage,
    clearUserSelection,
    clearGroupSelection,
    
    // Filter and sort methods
    updateUserFilters,
    updateGroupFilters,
    updateUserSort,
    updateGroupSort,
    clearAllFilters,
    
    // Pagination methods
    goToUsersPage,
    goToGroupsPage,
    
    // Utility methods
    checkPermission,
    refreshData,
    clearError
  }
}

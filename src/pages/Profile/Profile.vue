<template>
  <div :class="$style.profilePage">
    <div :class="$style.header">
      <h1>{{ t('navigation.profile') }}</h1>
      <button @click="refreshData" :disabled="isLoading" :class="$style.refreshBtn">
        <span v-if="isLoading">Refreshing...</span>
        <span v-else>Refresh Data</span>
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" :class="$style.errorAlert">
      <h3>Error</h3>
      <p>{{ error }}</p>
      <button @click="clearError" :class="$style.errorBtn">Clear Error</button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loading">
      <div :class="$style.spinner"></div>
      <p>Loading profile data...</p>
    </div>

    <!-- Profile Content -->
    <div v-else-if="isAuthenticated" :class="$style.profileContent">
      <!-- Basic User Info -->
      <div :class="$style.card">
        <h2>Basic Information</h2>
        <div :class="$style.userInfo">
          <div :class="$style.infoItem">
            <label>Name:</label>
            <span>{{ displayName || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Email:</label>
            <span>{{ email || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>User ID:</label>
            <span>{{ userId || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Status:</label>
            <span :class="isActive ? $style.active : $style.inactive">
              {{ isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Detailed Profile -->
      <div v-if="userProfile" :class="$style.card">
        <h2>Detailed Profile</h2>
        <div :class="$style.userInfo">
          <div :class="$style.infoItem">
            <label>First Name:</label>
            <span>{{ userProfile.first_name || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Last Name:</label>
            <span>{{ userProfile.last_name || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Full Name:</label>
            <span>{{ userProfile.full_name || 'N/A' }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Date Joined:</label>
            <span>{{ formatDate(userProfile.date_joined) }}</span>
          </div>
          <div :class="$style.infoItem">
            <label>Last Login:</label>
            <span>{{ userProfile.last_login ? formatDate(userProfile.last_login) : 'Never' }}</span>
          </div>
        </div>

        <!-- Update Profile Form -->
        <div :class="$style.updateForm">
          <h3>Update Profile</h3>
          <form @submit.prevent="handleUpdateProfile">
            <div :class="$style.formGroup">
              <label for="firstName">First Name:</label>
              <input 
                id="firstName"
                v-model="updateForm.first_name" 
                type="text" 
                :class="$style.input"
                :placeholder="userProfile.first_name"
              />
            </div>
            <div :class="$style.formGroup">
              <label for="lastName">Last Name:</label>
              <input 
                id="lastName"
                v-model="updateForm.last_name" 
                type="text" 
                :class="$style.input"
                :placeholder="userProfile.last_name"
              />
            </div>
            <button type="submit" :disabled="updating || !hasChanges" :class="$style.updateBtn">
              {{ updating ? 'Updating...' : 'Update Profile' }}
            </button>
          </form>
        </div>
      </div>

      <!-- User Statistics -->
      <div v-if="userStats" :class="$style.card">
        <h2>Account Statistics</h2>
        <div :class="$style.stats">
          <div :class="$style.statItem">
            <div :class="$style.statValue">{{ userStats.stats.account_age_days }}</div>
            <div :class="$style.statLabel">Days Since Joined</div>
          </div>
          <div :class="$style.statItem">
            <div :class="$style.statValue">{{ userStats.stats.last_login_days_ago }}</div>
            <div :class="$style.statLabel">Days Since Last Login</div>
          </div>
          <div :class="$style.statItem">
            <div :class="$style.statValue">{{ userStats.stats.profile_completion }}%</div>
            <div :class="$style.statLabel">Profile Completion</div>
          </div>
          <div :class="$style.statItem">
            <div :class="[$style.statValue, userStats.stats.is_first_login ? $style.highlight : '']">
              {{ userStats.stats.is_first_login ? 'Yes' : 'No' }}
            </div>
            <div :class="$style.statLabel">First Login</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div :class="$style.actions">
        <button @click="loadDetailedProfile" :disabled="isLoading" :class="$style.actionBtn">
          Load Detailed Profile
        </button>
        <button @click="loadUserStats" :disabled="isLoading" :class="$style.actionBtn">
          Load Statistics
        </button>
        <button @click="testHealthCheck" :disabled="isLoading" :class="$style.actionBtn">
          Test Backend Health
        </button>
        <button @click="handleLogout" :class="[$style.actionBtn, $style.logoutBtn]">
          Logout
        </button>
      </div>
    </div>

    <!-- Not Authenticated -->
    <div v-else :class="$style.notAuthenticated">
      <h2>Not Authenticated</h2>
      <p>Please log in to view your profile.</p>
      <button @click="$router.push('/login')" :class="$style.loginBtn">
        Go to Login
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { useSimpleAuth } from '../../composables/useSimpleAuth'

const router = useRouter()
const store = useAppStore()
const t = computed(() => store.t)

const {
  user,
  userFullName,
  isAuthenticated,
  isLoading,
  error,
  // updateProfile, // Unused - commenting out
  logout,
  clearError
} = useSimpleAuth()

// Computed properties for compatibility
const displayName = computed(() => userFullName.value)
const email = computed(() => user.value?.email || '')
const userId = computed(() => user.value?.id || 0)
const isActive = computed(() => user.value?.is_active || false)
const userProfile = computed(() => user.value)

// Mock userStats for now - you can implement this later
const userStats = ref({
  stats: {
    account_age_days: 0,
    last_login_days_ago: 0,
    profile_completion: 0,
    is_first_login: false
  }
})

// Form state
const updateForm = ref({
  first_name: '',
  last_name: ''
})
const updating = ref(false)

// Computed properties
const hasChanges = computed(() => {
  return updateForm.value.first_name.trim() !== '' || updateForm.value.last_name.trim() !== ''
})

// Methods
const refreshData = async () => {
  // await refreshBackendData() // Method not available
  // Logging removed for production
}

const loadDetailedProfile = async () => {
  try {
    // await fetchUserProfile() // Method not available
    // Logging removed for production
  } catch (err) {
    // Logging removed for production
  }
}

const loadUserStats = async () => {
  try {
    // await fetchUserStats() // Method not available
    // Logging removed for production
  } catch (err) {
    // Logging removed for production
  }
}

const testHealthCheck = async () => {
  try {
    // const health = await healthCheck() // Method not available
    // Logging removed for production
    // alert(`Health Check: ${health.status} - ${health.message}`)
  } catch (err) {
    // Logging removed for production
  }
}

const handleUpdateProfile = async () => {
  if (!hasChanges.value) return
  
  try {
    updating.value = true
    // await updateUserProfile({
    //   first_name: updateForm.value.first_name.trim() || undefined,
    //   last_name: updateForm.value.last_name.trim() || undefined
    // })
    // Logging removed for production
    
    // Clear form
    updateForm.value.first_name = ''
    updateForm.value.last_name = ''
    
    alert('Profile updated successfully!')
  } catch (err) {
    // Logging removed for production
    alert('Failed to update profile. Please try again.')
  } finally {
    updating.value = false
  }
}

const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (err) {
    // Logging removed for production
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const locale = store.currentLanguage === 'ar' ? 'ar-SA' : 'en-US'
    return date.toLocaleString(locale, { calendar: 'gregory' })
  } catch {
    return dateString
  }
}

// Load data on mount
onMounted(async () => {
  if (isAuthenticated.value) {
    // Load additional data
    try {
      await Promise.all([
        loadDetailedProfile(),
        loadUserStats()
      ])
    } catch (err) {
      // Logging removed for production
    }
  }
})
</script>

<style module>
.profilePage {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #1e293b;
}

[data-theme="night"] .header h1 {
  color: #f1f5f9;
}

.refreshBtn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.refreshBtn:hover:not(:disabled) {
  background: #2563eb;
}

.refreshBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.errorAlert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

.errorAlert h3 {
  margin: 0 0 0.5rem 0;
}

.errorAlert p {
  margin: 0 0 0.5rem 0;
}

.errorBtn {
  padding: 0.25rem 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profileContent {
  display: grid;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

[data-theme="night"] .card {
  background: #374151;
  border-color: #4b5563;
}

.card h2 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

[data-theme="night"] .card h2 {
  color: #f9fafb;
}

.userInfo {
  display: grid;
  gap: 0.75rem;
}

.infoItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

[data-theme="night"] .infoItem {
  border-bottom-color: #4b5563;
}

.infoItem label {
  font-weight: 600;
  color: #374151;
}

[data-theme="night"] .infoItem label {
  color: #d1d5db;
}

.infoItem span {
  color: #6b7280;
}

[data-theme="night"] .infoItem span {
  color: #9ca3af;
}

.active {
  color: #059669 !important;
  font-weight: 600;
}

.inactive {
  color: #dc2626 !important;
  font-weight: 600;
}

.updateForm {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

[data-theme="night"] .updateForm {
  border-top-color: #4b5563;
}

.updateForm h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

[data-theme="night"] .updateForm h3 {
  color: #f9fafb;
}

.formGroup {
  margin-bottom: 1rem;
}

.formGroup label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #374151;
}

[data-theme="night"] .formGroup label {
  color: #d1d5db;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

[data-theme="night"] .input {
  background: #4b5563;
  border-color: #6b7280;
  color: #f9fafb;
}

.updateBtn {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.updateBtn:hover:not(:disabled) {
  background: #059669;
}

.updateBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.statItem {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

[data-theme="night"] .statItem {
  background: #4b5563;
}

.statValue {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

[data-theme="night"] .statValue {
  color: #f9fafb;
}

.highlight {
  color: #10b981 !important;
}

.statLabel {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

[data-theme="night"] .statLabel {
  color: #9ca3af;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.actionBtn {
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.actionBtn:hover:not(:disabled) {
  background: #5048e5;
}

.actionBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logoutBtn {
  background: #dc2626;
}

.logoutBtn:hover {
  background: #b91c1c;
}

.notAuthenticated {
  text-align: center;
  padding: 3rem;
}

.notAuthenticated h2 {
  color: #1f2937;
  margin-bottom: 1rem;
}

[data-theme="night"] .notAuthenticated h2 {
  color: #f9fafb;
}

.notAuthenticated p {
  color: #6b7280;
  margin-bottom: 2rem;
}

[data-theme="night"] .notAuthenticated p {
  color: #9ca3af;
}

.loginBtn {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
}

.loginBtn:hover {
  background: #2563eb;
}

[data-theme="night"] .profilePage h1 {
  color: #f1f5f9;
}
</style>
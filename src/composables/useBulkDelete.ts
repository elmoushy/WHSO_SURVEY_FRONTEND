import { ref } from 'vue'
import Swal from 'sweetalert2'
import { useAppStore } from '../stores/useAppStore'
import { bulkDeleteUsers } from '../services/userManagementService'
import type { User, BulkDeleteRequest, BulkDeleteResponse } from '../types/user-management.types'

export const useBulkDelete = () => {
  const store = useAppStore()
  const isLoading = ref(false)

  const showConfirmDialog = async (selectedUsers: User[]): Promise<boolean> => {
    const count = selectedUsers.length
    const t = store.t
    
    // Get confirmation text based on batch size
    const getText = () => {
      if (count > 20) {
        return t('userManagement.messages.bulkDelete.confirm.largeBatchWarning').replace('{{count}}', count.toString())
      }
      return t('userManagement.messages.bulkDelete.confirm.text')
    }

    const result = await Swal.fire({
      title: t('userManagement.messages.bulkDelete.confirm.title'),
      text: getText(),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: t('userManagement.messages.bulkDelete.confirm.confirmButtonText'),
      cancelButtonText: t('userManagement.messages.bulkDelete.confirm.cancelButtonText'),
      reverseButtons: true,
      customClass: {
        popup: 'swal-rtl-popup',
        title: 'swal-rtl-title',
        htmlContainer: 'swal-rtl-content'
      }
    })

    return result.isConfirmed
  }

  const performBulkDelete = async (selectedUsers: User[]): Promise<BulkDeleteResponse> => {
    isLoading.value = true
    
    try {
      const deleteRequest: BulkDeleteRequest = {
        user_ids: selectedUsers.map(user => user.id)
      }
      
      const response = await bulkDeleteUsers(deleteRequest)
      return response
    } catch (error) {
      console.error('Bulk delete error:', error) // Debug log
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const showResultDialog = async (response: BulkDeleteResponse) => {
    const t = store.t
    const { summary } = response
    const { total_requested, successful_deletions, failed_deletions } = summary
    
    if (failed_deletions === 0) {
      // Complete success (200)
      await Swal.fire({
        title: t('userManagement.messages.bulkDelete.results.success.title'),
        text: t('userManagement.messages.bulkDelete.results.success.text')
          .replace('{{total}}', total_requested.toString())
          .replace('{{success}}', successful_deletions.toString())
          .replace('{{failed}}', failed_deletions.toString()),
        icon: 'success',
        confirmButtonText: t('userManagement.messages.bulkDelete.results.success.confirmButtonText'),
        customClass: {
          popup: 'swal-rtl-popup',
          title: 'swal-rtl-title',
          htmlContainer: 'swal-rtl-content'
        }
      })
    } else {
      // Partial success (207)
      await Swal.fire({
        title: t('userManagement.messages.bulkDelete.results.partial.title'),
        text: t('userManagement.messages.bulkDelete.results.partial.text')
          .replace('{{total}}', total_requested.toString())
          .replace('{{success}}', successful_deletions.toString())
          .replace('{{failed}}', failed_deletions.toString()),
        icon: 'warning',
        confirmButtonText: t('userManagement.messages.bulkDelete.results.partial.confirmButtonText'),
        customClass: {
          popup: 'swal-rtl-popup',
          title: 'swal-rtl-title',
          htmlContainer: 'swal-rtl-content'
        }
      })
    }
  }

  const showErrorDialog = async (error: any) => {
    const t = store.t
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400:
          // Bad request - various scenarios
          let title = t('userManagement.messages.bulkDelete.results.badRequest.title')
          let text = ''
          
          if (data.message?.includes('cannot delete yourself') || data.message?.includes('self')) {
            title = t('userManagement.messages.bulkDelete.results.badRequest.texts.cannotDeleteCurrentUser')
            text = t('userManagement.messages.bulkDelete.results.badRequest.texts.cannotDeleteCurrentUserDesc')
          } else if (data.message?.includes('last super admin')) {
            title = t('userManagement.messages.bulkDelete.results.badRequest.texts.cannotDeleteLastSuperAdmin')
            text = t('userManagement.messages.bulkDelete.results.badRequest.texts.cannotDeleteLastSuperAdminDesc')
          } else if (data.message?.includes('invalid')) {
            text = t('userManagement.messages.bulkDelete.results.badRequest.texts.invalidData')
          } else {
            text = data.message || t('userManagement.messages.bulkDelete.results.badRequest.texts.noUsersDeleted')
          }
          
          await Swal.fire({
            title,
            text,
            icon: 'error',
            confirmButtonText: t('userManagement.messages.bulkDelete.results.badRequest.confirmButtonText'),
            customClass: {
              popup: 'swal-rtl-popup',
              title: 'swal-rtl-title',
              htmlContainer: 'swal-rtl-content'
            }
          })
          break

        case 401:
          await Swal.fire({
            title: t('userManagement.messages.bulkDelete.results.unauthorized.title'),
            text: t('userManagement.messages.bulkDelete.results.unauthorized.text'),
            icon: 'error',
            confirmButtonText: t('userManagement.messages.bulkDelete.results.unauthorized.confirmButtonText'),
            customClass: {
              popup: 'swal-rtl-popup',
              title: 'swal-rtl-title',
              htmlContainer: 'swal-rtl-content'
            }
          })
          break

        case 403:
          await Swal.fire({
            title: t('userManagement.messages.bulkDelete.results.forbidden.title'),
            text: t('userManagement.messages.bulkDelete.results.forbidden.text'),
            icon: 'error',
            confirmButtonText: t('userManagement.messages.bulkDelete.results.forbidden.confirmButtonText'),
            customClass: {
              popup: 'swal-rtl-popup',
              title: 'swal-rtl-title',
              htmlContainer: 'swal-rtl-content'
            }
          })
          break

        default:
          await Swal.fire({
            title: t('userManagement.messages.bulkDelete.results.serverError.title'),
            text: t('userManagement.messages.bulkDelete.results.serverError.text'),
            icon: 'error',
            confirmButtonText: t('userManagement.messages.bulkDelete.results.serverError.confirmButtonText'),
            customClass: {
              popup: 'swal-rtl-popup',
              title: 'swal-rtl-title',
              htmlContainer: 'swal-rtl-content'
            }
          })
      }
    } else {
      // Network error or other error
      await Swal.fire({
        title: t('userManagement.messages.bulkDelete.results.serverError.title'),
        text: t('userManagement.messages.bulkDelete.results.serverError.text'),
        icon: 'error',
        confirmButtonText: t('userManagement.messages.bulkDelete.results.serverError.confirmButtonText'),
        customClass: {
          popup: 'swal-rtl-popup',
          title: 'swal-rtl-title',
          htmlContainer: 'swal-rtl-content'
        }
      })
    }
  }

  const executeBulkDelete = async (selectedUsers: User[], currentUser: User | null): Promise<boolean> => {
    try {
      // Validate permissions and selection
      if (!currentUser) return false
      
      // Check if user has permission
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        await showErrorDialog({ response: { status: 403 } })
        return false
      }
      
      // Check if trying to delete self
      const hasSelfSelected = selectedUsers.some(user => user.id === currentUser.id)
      if (hasSelfSelected) {
        await showErrorDialog({ 
          response: { 
            status: 400, 
            data: { message: 'cannot delete yourself' } 
          } 
        })
        return false
      }
      
      // Show confirmation dialog
      const confirmed = await showConfirmDialog(selectedUsers)
      if (!confirmed) return false
      
      // Perform bulk delete
      const response = await performBulkDelete(selectedUsers)
      
      // Show result dialog
      await showResultDialog(response)
      
      return true
    } catch (error) {
      console.error('Error in executeBulkDelete:', error) // Debug log
      await showErrorDialog(error)
      return false
    }
  }

  return {
    isLoading,
    executeBulkDelete
  }
}

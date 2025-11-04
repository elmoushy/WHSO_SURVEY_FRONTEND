// Example: Using the Current Link Endpoint

import { surveyService } from './services/surveyService'

// Example 1: Get current active link for a survey
async function getCurrentSurveyLink(surveyId: string) {
  try {
    const response = await surveyService.getCurrentLink(surveyId)
    
    if (response.data) {
      const currentLink = response.data
      
      console.log('Link Details:')
      console.log('- Type:', currentLink.type)
      console.log('- URL:', currentLink.link)
      console.log('- Token:', currentLink.token)
      console.log('- Expires:', new Date(currentLink.expires_at).toLocaleString())
      console.log('- Is Password Protected:', currentLink.is_password_protected)
      console.log('- Is Contact Restricted:', currentLink.is_contact_restricted)
      console.log('- Survey Visibility:', currentLink.survey_visibility)
      
      if (currentLink.password) {
        console.log('- Password:', currentLink.password)
      }
      
      return currentLink
    } else {
      console.log('No active link found for this survey')
      return null
    }
  } catch (error) {
    console.error('Error fetching current link:', error)
    throw error
  }
}

// Example 2: Handle different link types
async function handleSurveySharing(surveyId: string) {
  const currentLink = await getCurrentSurveyLink(surveyId)
  
  if (!currentLink) {
    console.log('No link available - you may need to generate one')
    return
  }
  
  if (currentLink.type === 'Password-protected link') {
    console.log('This is a secure link requiring password:', currentLink.password)
    
    // For password-protected links, you might want to show additional UI
    const shareMessage = `Survey Link: ${currentLink.link}\nPassword: ${currentLink.password}`
    navigator.clipboard.writeText(shareMessage)
    
  } else if (currentLink.type === 'Public link') {
    console.log('This is a public link - no password required')
    
    // For public links, simple sharing
    navigator.clipboard.writeText(currentLink.link!)
  }
}

// Example 3: Check link status and expiration
async function checkLinkStatus(surveyId: string) {
  const response = await surveyService.getCurrentLink(surveyId)
  
  if (response.data) {
    const link = response.data
    const expiryDate = new Date(link.expires_at)
    const now = new Date()
    
    if (expiryDate > now) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`Link is active and expires in ${daysUntilExpiry} days`)
    } else {
      console.log('Link has expired')
    }
    
    return {
      isActive: link.is_active,
      isExpired: expiryDate <= now,
      daysUntilExpiry: Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  
  return null
}

// Example 4: Integration with Vue component
export function useSurveyLinkSharing(surveyId: string) {
  const currentLink = ref<CurrentLinkResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchCurrentLink = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await surveyService.getCurrentLink(surveyId)
      currentLink.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch current link'
    } finally {
      isLoading.value = false
    }
  }
  
  const shareLink = async (method: 'email' | 'whatsapp' | 'sms') => {
    if (!currentLink.value?.link) {
      throw new Error('No active link available')
    }
    
    const link = currentLink.value.link
    const password = currentLink.value.password
    
    let shareText = `Survey Link: ${link}`
    if (password) {
      shareText += `\nPassword: ${password}`
    }
    
    switch (method) {
      case 'email':
        window.location.href = `mailto:?subject=Survey Invitation&body=${encodeURIComponent(shareText)}`
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`)
        break
      case 'sms':
        window.location.href = `sms:?&body=${encodeURIComponent(shareText)}`
        break
    }
  }
  
  return {
    currentLink: readonly(currentLink),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchCurrentLink,
    shareLink
  }
}

export default {
  getCurrentSurveyLink,
  handleSurveySharing,
  checkLinkStatus,
  useSurveyLinkSharing
}

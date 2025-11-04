<template>
  <Teleport to="body">
    <div v-if="isVisible" :class="$style.modalOverlay">
      <div 
        :class="$style.modalContainer" 
        :data-theme="currentTheme" 
        :dir="isRTL ? 'rtl' : 'ltr'"
        @click.stop
      >
        <!-- Header -->
        <div :class="$style.modalHeader">
          <h2 :class="$style.modalTitle">
            <i class="fas fa-share-alt" :class="$style.modalIcon"></i>
            {{ getText('survey.linkSharing.title') }}
          </h2>
          <button :class="$style.closeButton" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div :class="$style.modalBody">
          <div v-if="publicLink || passwordProtectedLink || currentLinkData" :class="$style.linkContainer">
            <!-- Password Protection Notice -->
            <div v-if="isPasswordProtected" :class="$style.passwordNotice">
              <div :class="$style.passwordHeader">
                <i class="fas fa-shield-alt" :class="$style.shieldIcon"></i>
                <h3 :class="$style.passwordTitle">{{ getText('survey.access.passwordProtected') }}</h3>
              </div>
              <div :class="$style.passwordInfo">
                <div :class="$style.passwordRow">
                  <label :class="$style.passwordLabel">{{ getText('survey.access.password') }}:</label>
                  <div :class="$style.passwordValue">
                    <span :class="$style.passwordText">{{ currentPassword }}</span>
                    <button 
                      :class="$style.copyPasswordButton"
                      @click="copyToClipboard(currentPassword)"
                      :title="getText('survey.access.copyPassword')"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div v-if="isContactRestricted" :class="$style.restrictionInfo">
                  <div v-if="restrictedEmail" :class="$style.restrictionRow">
                    <i class="fas fa-envelope"></i>
                    <span>{{ getText('survey.access.restrictedToEmail') }}: {{ restrictedEmail }}</span>
                  </div>
                  <div v-if="restrictedPhone" :class="$style.restrictionRow">
                    <i class="fas fa-phone"></i>
                    <span>{{ getText('survey.access.restrictedToPhone') }}: {{ restrictedPhone }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Link Display -->
            <div :class="$style.linkDisplay">
              <input 
                type="text" 
                :value="currentLink" 
                :class="$style.linkInput"
                readonly
              />
              <button 
                :class="$style.copyButton"
                @click="copyToClipboard(currentLink)"
                :title="getText('common.copy')"
              >
               <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.668 6.66669H8.33464C7.41416 6.66669 6.66797 7.41288 6.66797 8.33335V16.6667C6.66797 17.5872 7.41416 18.3334 8.33464 18.3334H16.668C17.5884 18.3334 18.3346 17.5872 18.3346 16.6667V8.33335C18.3346 7.41288 17.5884 6.66669 16.668 6.66669Z" stroke="#525866" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.33464 13.3334C2.41797 13.3334 1.66797 12.5834 1.66797 11.6667V3.33335C1.66797 2.41669 2.41797 1.66669 3.33464 1.66669H11.668C12.5846 1.66669 13.3346 2.41669 13.3346 3.33335" stroke="#525866" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              </button>
            </div>

            <!-- QR Code Display -->
            <div :class="$style.qrDisplay">
              <div :class="$style.qrCodeContainer">
                <canvas 
                  ref="qrCanvas" 
                  :class="$style.qrCanvas"
                  width="200" 
                  height="200"
                ></canvas>
                <div :class="$style.qrLabel">
                  {{ getText('survey.access.scanToAccess') }}
                </div>
              </div>
          
            </div>

            <!-- Share Actions -->
            <div :class="$style.shareActions">
              <button 
                :class="$style.actionButton1"
                @click="downloadQRCode"
                :title="getText('survey.access.downloadQR')"
              >
                <i class="fas fa-download"></i>
                {{ getText('survey.access.download') }}
              </button>
              <button 
                :class="$style.actionButton2"
                @click="copyQRToClipboard"
                :title="getText('survey.access.copyQR')"
              >
                <i class="fas fa-copy"></i>
                {{ getText('survey.access.copy') }}
              </button>
              <button 
                :class="[$style.actionButton3, { [$style.disabled]: !currentLinkData && !publicLink }]"
                @click="shareByEmail"
                :disabled="!currentLinkData && !publicLink"
                :title="getText('survey.access.shareByEmail')"
              >
                <i class="fas fa-envelope"></i>
                {{ getText('survey.access.email') }}
              </button>
            </div>
          </div>
          
          <div v-else-if="!currentLinkData" :class="$style.generateLinkSection">
            <button :class="$style.generateButton" @click="generateLink" :disabled="isGeneratingLink">
              <div v-if="isGeneratingLink" :class="$style.loadingSpinner"></div>
              <i v-else class="fas fa-link"></i>
              {{ getText('survey.access.generateLink') }}
            </button>
          </div>

          <!-- Status Message -->
          <div v-if="statusMessage" :class="[$style.statusMessage, statusMessage.type]">
            <i :class="statusMessage.icon"></i>
            <span>{{ statusMessage.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import QRCode from 'qrcode'
import type { 
  Survey, 
  PublicLinkResponse,
  PasswordProtectedLinkResponse,
  CurrentLinkResponseData
} from '../../types/survey.types'

// Props
interface Props {
  isVisible: boolean
  survey: Survey
  publicLink: PublicLinkResponse | null
  passwordProtectedLink?: PasswordProtectedLinkResponse | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  linkGenerated: [link: PublicLinkResponse]
  statusUpdate: [message: string, type: 'success' | 'error' | 'warning' | 'info']
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const currentLanguage = computed(() => store.currentLanguage)

// State
const isGeneratingLink = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const currentLinkData = ref<CurrentLinkResponseData | null>(null)

// Get the current link - use the unified current link data if available, otherwise fallback to props
const currentLink = computed(() => {
  if (currentLinkData.value) {
    // Use the link from getCurrentLink response
    const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
    const pathType = currentLinkData.value.is_password_protected ? 'password' : 'public'
    return `${frontendBaseUrl}/survey/${pathType}/${currentLinkData.value.token}`
  }
  return props.passwordProtectedLink?.link || props.publicLink?.link || ''
})

// Check if current link is password protected based on unified data
const isPasswordProtected = computed(() => {
  return currentLinkData.value?.is_password_protected || false
})

// Get password from unified data
const currentPassword = computed(() => {
  return currentLinkData.value?.password || props.passwordProtectedLink?.password || ''
})

// Get contact restrictions from unified data
const isContactRestricted = computed(() => {
  return currentLinkData.value?.is_contact_restricted || props.passwordProtectedLink?.is_contact_restricted || false
})

const restrictedEmail = computed(() => {
  return currentLinkData.value?.restricted_email || props.passwordProtectedLink?.restricted_email || ''
})

const restrictedPhone = computed(() => {
  return currentLinkData.value?.restricted_phone || props.passwordProtectedLink?.restricted_phone || ''
})

// Status message for user feedback
const statusMessage = ref<{
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
} | null>(null)

// Inline translations
const translations = computed(() => {
  const translationsMap: Record<string, string> = currentLanguage.value === 'ar' ? {
    // Modal
    'survey.linkSharing.title': 'مشاركة الاستطلاع',
    'survey.access.scanToAccess': 'امسح للوصول إلى الاستطلاع',
    'survey.access.generateLink': 'الحصول على الرابط',
    'survey.access.download': 'تحميل',
    'survey.access.copy': 'نسخ',
    'survey.access.downloadQR': 'تحميل رمز QR',
    'survey.access.copyQR': 'نسخ رمز QR',
    'survey.access.shareByEmail': 'مشاركة عبر البريد الإلكتروني',
    'survey.access.shareByWhatsApp': 'مشاركة عبر واتساب',
    'survey.access.shareBySMS': 'مشاركة عبر الرسائل النصية',
    'survey.access.email': 'بريد إلكتروني',
    'survey.access.whatsapp': 'واتساب',
    'survey.access.sms': 'رسائل نصية',
    'common.copy': 'نسخ',
    
    // Password Protection
    'survey.access.passwordProtected': 'استطلاع محمي بكلمة مرور',
    'survey.access.password': 'كلمة المرور',
    'survey.access.copyPassword': 'نسخ كلمة المرور',
    'survey.access.restrictedToEmail': 'مقصور على البريد الإلكتروني',
    'survey.access.restrictedToPhone': 'مقصور على رقم الهاتف'
  } : {
    // Modal
    'survey.linkSharing.title': 'Share Survey Link',
    'survey.access.scanToAccess': 'Scan to access survey',
    'survey.access.generateLink': 'Get Link',
    'survey.access.download': 'Download',
    'survey.access.copy': 'Copy',
    'survey.access.downloadQR': 'Download QR Code',
    'survey.access.copyQR': 'Copy QR Code',
    'survey.access.shareByEmail': 'Share by Email',
    'survey.access.shareByWhatsApp': 'Share by WhatsApp',
    'survey.access.shareBySMS': 'Share by SMS',
    'survey.access.email': 'Email',
    'survey.access.whatsapp': 'WhatsApp',
    'survey.access.sms': 'SMS',
    'common.copy': 'Copy',
    
    // Password Protection
    'survey.access.passwordProtected': 'Password Protected Survey',
    'survey.access.password': 'Password',
    'survey.access.copyPassword': 'Copy Password',
    'survey.access.restrictedToEmail': 'Restricted to email',
    'survey.access.restrictedToPhone': 'Restricted to phone'
  }
  return translationsMap
})

// Translation helper function
const getText = (key: string, fallback?: string) => {
  return translations.value[key] || fallback || key
}

// Methods
const setStatusMessage = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }
  
  statusMessage.value = {
    text,
    type,
    icon: iconMap[type]
  }
  
  emit('statusUpdate', text, type)
  
  // Auto-clear after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.value = null
    }, 5000)
  }
}

// Load current link data using the unified endpoint
const loadCurrentLink = async () => {
  try {
    const response = await surveyService.getCurrentLink(props.survey.id)
    currentLinkData.value = response.data
    
    // Generate QR code for the current link
    await nextTick()
    const link = currentLink.value
    if (link) {
      generateQRCode(link)
    }
  } catch (error: any) {
    // If no link exists, that's fine - we'll show the generate button
    currentLinkData.value = null
  }
}

const generateLink = async () => {
  try {
    isGeneratingLink.value = true
    
    // Use getCurrentLink which will either return existing link or auto-generate one
    const response = await surveyService.getCurrentLink(props.survey.id)
    currentLinkData.value = response.data
    
    // Create a PublicLinkResponse-like object for backward compatibility with the emit
    const linkResponse = {
      link: currentLink.value,
      token: response.data.token,
      expires_at: response.data.expires_at
    }
    
    emit('linkGenerated', linkResponse)
    
    const successMessage = response.data.auto_generated 
      ? 'Public link auto-generated successfully'
      : 'Current link retrieved successfully'
    
    setStatusMessage(successMessage, 'success')
    
    // Generate QR code for the current link
    await nextTick()
    const link = currentLink.value
    if (link) {
      generateQRCode(link)
    }
    
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to get current link'
    setStatusMessage(errorMessage, 'error')
  } finally {
    isGeneratingLink.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    setStatusMessage('Link copied to clipboard', 'success')
  } catch (error) {
    setStatusMessage('Failed to copy link', 'error')
  }
}

// QR Code Functions
const generateQRCode = async (text: string): Promise<void> => {
  if (!qrCanvas.value || !text) return

  try {
    // Clear the canvas first
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 200, 200)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 200, 200)
    }

    await QRCode.toCanvas(qrCanvas.value, text, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',  // Black foreground
        light: '#FFFFFF'  // White background
      }
    })
    
  } catch (error) {
    console.error('QR Code generation error:', error)
    setStatusMessage('Failed to generate QR code', 'error')
  }
}

const downloadQRCode = () => {
  if (!qrCanvas.value) return

  try {
    const link = document.createElement('a')
    link.download = `survey-qr-${props.survey.id}.png`
    link.href = qrCanvas.value.toDataURL()
    link.click()
    setStatusMessage('QR code downloaded successfully', 'success')
  } catch (error) {
    setStatusMessage('Failed to download QR code', 'error')
  }
}

const copyQRToClipboard = async () => {
  if (!qrCanvas.value) return

  try {
    const canvas = qrCanvas.value
    canvas.toBlob(async (blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setStatusMessage('QR code copied to clipboard', 'success')
      }
    })
  } catch (error) {
    setStatusMessage('Failed to copy QR code', 'error')
  }
}

// Share Functions
const getShareMessage = (platform: 'email' | 'whatsapp' | 'sms' = 'email') => {
  const surveyTitle = props.survey.title
  const link = currentLink.value
  const isPasswordProtectedValue = isPasswordProtected.value
  const password = currentPassword.value
  
  if (currentLanguage.value === 'ar') {
    if (platform === 'email') {
      let message = `مرحباً!\n\nأدعوك للمشاركة في استطلاع: "${surveyTitle}"\n\nيمكنك الوصول إليه من خلال النقر على الرابط:\n\n${link}\n\n`
      
      if (isPasswordProtectedValue && password) {
        message += `⚠️ هذا الاستطلاع محمي بكلمة مرور\nكلمة المرور: ${password}\n\nتأكد من إدخال كلمة المرور بعد النقر على الرابط.\n\n`
        
        if (isContactRestricted.value) {
          if (restrictedEmail.value) {
            message += `📧 تقييد البريد الإلكتروني: ${restrictedEmail.value}\n`
          }
          if (restrictedPhone.value) {
            message += `📱 تقييد رقم الهاتف: ${restrictedPhone.value}\n`
          }
          message += '\n'
        }
      } else {
        message += `أو نسخ الرابط ولصقه في المتصفح.\n\n`
      }
      
      message += `شكراً لمشاركتك! 🙏`
      return message
    } else if (platform === 'whatsapp') {
      let message = `🔗 مرحباً!\n\nأدعوك للمشاركة في استطلاع:\n*${surveyTitle}*\n\nالرابط:\n${link}\n`
      
      if (isPasswordProtectedValue && password) {
        message += `\n🔒 كلمة المرور: *${password}*\n`
        
        if (isContactRestricted.value) {
          if (restrictedEmail.value) {
            message += `📧 البريد المطلوب: ${restrictedEmail.value}\n`
          }
          if (restrictedPhone.value) {
            message += `📱 الهاتف المطلوب: ${restrictedPhone.value}\n`
          }
        }
      }
      
      message += `\nشكراً لمشاركتك! 🙏`
      return message
    } else { // SMS
      let message = `استطلاع: ${surveyTitle}\n\nالرابط:\n${link}\n`
      
      if (isPasswordProtectedValue && password) {
        message += `\nكلمة المرور: ${password}\n`
      }
      
      message += `\nشكراً لك!`
      return message
    }
  } else {
    if (platform === 'email') {
      let message = `Hello!\n\nYou're invited to participate in the survey: "${surveyTitle}"\n\nAccess it by clicking this link:\n\n${link}\n\n`
      
      if (isPasswordProtectedValue && password) {
        message += `⚠️ This survey is password protected\nPassword: ${password}\n\nMake sure to enter the password after clicking the link.\n\n`
        
        if (isContactRestricted.value) {
          if (restrictedEmail.value) {
            message += `📧 Email restriction: ${restrictedEmail.value}\n`
          }
          if (restrictedPhone.value) {
            message += `📱 Phone restriction: ${restrictedPhone.value}\n`
          }
          message += '\n'
        }
      } else {
        message += `Or copy and paste the link into your browser.\n\n`
      }
      
      message += `Thank you for your participation! 🙏`
      return message
    } else if (platform === 'whatsapp') {
      let message = `🔗 Hello!\n\nYou're invited to participate in the survey:\n*${surveyTitle}*\n\nLink:\n${link}\n`
      
      if (isPasswordProtectedValue && password) {
        message += `\n🔒 Password: *${password}*\n`
        
        if (isContactRestricted.value) {
          if (restrictedEmail.value) {
            message += `📧 Required email: ${restrictedEmail.value}\n`
          }
          if (restrictedPhone.value) {
            message += `📱 Required phone: ${restrictedPhone.value}\n`
          }
        }
      }
      
      message += `\nThank you for your participation! 🙏`
      return message
    } else { // SMS
      let message = `Survey: ${surveyTitle}\n\nLink:\n${link}\n`
      
      if (isPasswordProtectedValue && password) {
        message += `\nPassword: ${password}\n`
      }
      
      message += `\nThank you!`
      return message
    }
  }
}

const shareByEmail = async () => {
  if (!currentLinkData.value && !props.publicLink) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط أولاً' : 'Please generate a link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('email')
    const subject = currentLanguage.value === 'ar' 
      ? `دعوة للمشاركة في استطلاع: ${props.survey.title}`
      : `Survey Invitation: ${props.survey.title}`
    
    const emailBody = currentLanguage.value === 'ar' 
      ? `${message}\n\n💡 تلميح: يمكنك أيضاً تحميل رمز QR من صفحة مشاركة الاستطلاع لسهولة المشاركة مع الآخرين.`
      : `${message}\n\n💡 Tip: You can also download the QR code from the survey sharing page for easy sharing with others.`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    
    try {
      window.location.href = mailtoLink
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح تطبيق البريد الإلكتروني' : 'Email client opened', 'success')
    } catch (e) {
      const fullEmailContent = `${currentLanguage.value === 'ar' ? 'الموضوع' : 'Subject'}: ${subject}\n\n${emailBody}`
      await navigator.clipboard.writeText(fullEmailContent)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ محتوى البريد الإلكتروني - يمكنك لصقه في تطبيق البريد الإلكتروني المفضل لديك'
          : 'Email content copied - you can paste it in your preferred email app', 
        'info'
      )
    }
  } catch (error) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر البريد الإلكتروني' : 'Failed to share by email', 'error')
  }
}

// const shareByWhatsApp = async () => {
//   if (!currentLinkData.value && !props.publicLink) {
//     setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط أولاً' : 'Please generate a link first', 'warning')
//     return
//   }
  
//   try {
//     const message = getShareMessage('whatsapp')
//     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    
//     try {
//       window.open(whatsappUrl, '_blank')
//       setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح واتساب' : 'WhatsApp opened', 'success')
//     } catch (e) {
//       await navigator.clipboard.writeText(message)
//       setStatusMessage(
//         currentLanguage.value === 'ar' 
//           ? 'تم نسخ الرسالة - يمكنك لصقها في واتساب'
//           : 'Message copied - you can paste it in WhatsApp', 
//         'info'
//       )
//     }
//   } catch (error) {
//     setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر واتساب' : 'Failed to share by WhatsApp', 'error')
//   }
// }

// Watchers
watch(() => currentLinkData.value, async (newData) => {
  if (newData && props.isVisible) {
    await nextTick()
    const link = currentLink.value
    if (link) {
      generateQRCode(link)
    }
  }
}, { immediate: true })

watch(() => props.isVisible, async (visible) => {
  if (visible) {
    // Load current link data when modal becomes visible
    await loadCurrentLink()
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open')
  } else {
    // Restore body scroll when modal is closed
    document.body.classList.remove('modal-open')
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Load current link data if modal is visible
  if (props.isVisible) {
    loadCurrentLink()
    document.body.classList.add('modal-open')
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Restore body scroll when component is unmounted
  document.body.classList.remove('modal-open')
})
</script>

<style module src="./LinkSharingModal.module.css">
/* CSS Module styles are imported from LinkSharingModal.module.css */
</style>

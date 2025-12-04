<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useThrottleFn, useDebounceFn } from '@vueuse/core'
import { useChat } from '../../composables/useChat'
import { validateFile } from '../../services/chatService'

const {
  sendMessage,
  replyingTo,
  editingMessage,
  canPostMessages,
  uploadFile,
  uploadProgress,
  removeUpload,
  clearUploads,
  updateUploadCaption,
  setReplyingTo,
  setEditingMessage,
  editMessage,
  sendTypingIndicator,
  rateLimits,
  isRateLimited,
  rateLimitCooldown
} = useChat()

const messageText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isSending = ref(false)
const typingTimeout = ref<NodeJS.Timeout | null>(null)

const MAX_LENGTH = 5000

// Character count
const charCount = computed(() => messageText.value.length)
const showCharCount = computed(() => charCount.value > 4000)
const isOverLimit = computed(() => charCount.value > MAX_LENGTH)

// Check if can send
const canSend = computed(() => {
  if (isSending.value || !canPostMessages.value || isOverLimit.value || isRateLimited.value) return false
  const hasText = messageText.value.trim().length > 0
  const hasAttachments = uploadProgress.value.some(u => u.status === 'completed')
  return hasText || hasAttachments
})

// Throttled message sending (1 per second)
const sendMessageThrottled = useThrottleFn(async () => {
  if (!canSend.value) return

  isSending.value = true

  try {
    // Filter completed uploads and re-upload those with captions
    const completedUploads = uploadProgress.value.filter(u => u.status === 'completed')
    const attachmentIds: string[] = []
    
    for (const upload of completedUploads) {
      // If upload has a caption that was added after initial upload, we need to re-upload
      if (upload.caption && upload.caption.trim()) {
        console.log(`📎 Re-uploading ${upload.file_name} with caption`)
        // Note: For now, we'll just use the existing attachment ID
        // If backend requires re-upload with caption, implement that here
        if (upload.attachmentId) {
          attachmentIds.push(upload.attachmentId)
        }
      } else if (upload.attachmentId) {
        attachmentIds.push(upload.attachmentId)
      }
    }

    if (editingMessage.value) {
      // Edit existing message
      await editMessage(editingMessage.value.id, messageText.value)
      setEditingMessage(null)
    } else {
      // Send new message
      await sendMessage(messageText.value, attachmentIds.length > 0 ? attachmentIds : undefined)
    }

    // Clear input
    messageText.value = ''
    clearUploads()
    setReplyingTo(null)
    
    // Stop typing indicator
    sendTypingIndicator(false)
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }
    
    // Reset textarea height
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  } finally {
    isSending.value = false
  }
}, 1000) // 1 second throttle

// Watch editing message to populate textarea
watch(editingMessage, (msg) => {
  if (msg) {
    messageText.value = msg.content
    textareaRef.value?.focus()
  }
})

// Auto-resize textarea
const autoResize = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }
}

// Handle typing indicator with debounce (2 seconds as per rate limiting guide)
const sendTypingDebounced = useDebounceFn(() => {
  sendTypingIndicator(true)
}, 2000)

const handleTyping = () => {
  sendTypingDebounced()
  
  // Clear existing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  // Stop typing after 3 seconds of inactivity
  typingTimeout.value = setTimeout(() => {
    sendTypingIndicator(false)
  }, 3000)
}

watch(messageText, () => {
  autoResize()
  if (messageText.value.length > 0) {
    handleTyping()
  }
})

// Handle file selection
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      continue
    }

    // Upload file without caption initially (caption can be added after upload)
    await uploadFile(file)
  }

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Handle caption update for uploaded file
const handleCaptionChange = (uploadId: string, caption: string) => {
  updateUploadCaption(uploadId, caption)
}

// Handle send (uses throttled function)
const handleSend = () => {
  sendMessageThrottled()
}

// Handle keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  // Enter to send (Shift+Enter for new line)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }

  // Escape to cancel reply/edit
  if (event.key === 'Escape') {
    setReplyingTo(null)
    setEditingMessage(null)
    messageText.value = ''
  }
}

// Cancel reply/edit
const cancelAction = () => {
  setReplyingTo(null)
  setEditingMessage(null)
  messageText.value = ''
}

// Get file icon
const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'bi-file-image text-primary'
  if (ext === 'pdf') return 'bi-file-pdf text-danger'
  if (['doc', 'docx'].includes(ext || '')) return 'bi-file-word text-primary'
  if (['xls', 'xlsx'].includes(ext || '')) return 'bi-file-excel text-success'
  return 'bi-file-earmark'
}
</script>

<template>
  <div :class="$style.messageInput">
    <!-- Rate Limit Warning -->
    <div v-if="isRateLimited" :class="$style.rateLimitWarning">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div :class="$style.warningContent">
        <strong>معدل إرسال مرتفع</strong>
        <span>يرجى الانتظار {{ rateLimitCooldown }} ثانية قبل الإرسال مرة أخرى</span>
      </div>
    </div>

    <!-- Rate Limit Status (optional - show when getting close to limit) -->
    <div 
      v-if="!isRateLimited && rateLimits?.message_send?.remaining < 10" 
      :class="$style.rateLimitStatus"
    >
      <div :class="$style.statusBar">
        <div 
          :class="$style.statusFill"
          :style="{ width: ((rateLimits?.message_send?.remaining || 0) / (rateLimits?.message_send?.limit || 60) * 100) + '%' }"
        ></div>
      </div>
      <span :class="$style.statusText">
        {{ rateLimits?.message_send?.remaining || 0 }} رسالة متبقية
      </span>
    </div>

    <!-- Reply/Edit Banner -->
    <div 
      v-if="replyingTo || editingMessage" 
      :class="$style.actionBanner"
    >
      <div :class="$style.bannerContent">
        <i :class="editingMessage ? 'bi bi-pencil' : 'bi bi-reply-fill'"></i>
        <div>
          <div :class="$style.bannerTitle">
            {{ editingMessage ? 'تعديل الرسالة' : 'الرد على' }}
            {{ replyingTo ? `${replyingTo.sender.first_name} ${replyingTo.sender.last_name}` : '' }}
          </div>
          <div :class="$style.bannerPreview">
            {{ editingMessage?.content || replyingTo?.content }}
          </div>
        </div>
      </div>
      <button :class="$style.bannerClose" @click="cancelAction">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadProgress.length > 0" :class="$style.uploads">
      <div 
        v-for="upload in uploadProgress" 
        :key="upload.id"
        :class="$style.uploadItem"
      >
        <i :class="['bi', getFileIcon(upload.file_name)]"></i>
        <div :class="$style.uploadInfo">
          <span :class="$style.uploadName">{{ upload.file_name }}</span>
          
          <!-- Caption Input (only for completed uploads) -->
          <input
            v-if="upload.status === 'completed'"
            type="text"
            :value="upload.caption || ''"
            @input="handleCaptionChange(upload.id, ($event.target as HTMLInputElement).value)"
            placeholder="إضافة تعليق (اختياري)..."
            :class="$style.captionInput"
            maxlength="2000"
          />
          
          <!-- Progress Bar -->
          <div 
            v-if="upload.status === 'uploading'" 
            :class="$style.progressBar"
          >
            <div 
              :class="$style.progressFill"
              :style="{ width: upload.progress + '%' }"
            ></div>
          </div>
          
          <span 
            v-else-if="upload.status === 'error'" 
            :class="$style.uploadError"
          >
            فشل الرفع
          </span>
          <span 
            v-else-if="upload.status === 'completed'"
            :class="$style.uploadSuccess"
          >
            <i class="bi bi-check-circle-fill"></i> اكتمل الرفع
          </span>
        </div>
        <button 
          :class="$style.uploadRemove"
          @click="removeUpload(upload.id)"
          title="إزالة المرفق"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>

    <!-- Disabled State -->
    <div v-if="!canPostMessages" :class="$style.disabled">
      <i class="bi bi-lock-fill"></i>
      <span>يمكن للمسؤولين فقط نشر الرسائل</span>
    </div>

    <!-- Input Area -->
    <div v-else :class="$style.inputArea">
      <!-- Attach File Button -->
      <button 
        :class="$style.iconBtn"
        @click="fileInput?.click()"
        title="إرفاق ملف"
        :disabled="uploadProgress.some(u => u.status === 'uploading')"
      >
        <i class="bi bi-paperclip"></i>
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
        style="display: none"
        @change="handleFileSelect"
      />

      <!-- Text Input -->
      <div :class="$style.textInputWrapper">
        <textarea
          ref="textareaRef"
          v-model="messageText"
          :class="$style.textarea"
          placeholder="اكتب رسالة..."
          rows="1"
          maxlength="5000"
          @keydown="handleKeyDown"
        ></textarea>

        <!-- Character Count -->
        <div 
          v-if="showCharCount" 
          :class="[$style.charCount, { [$style.overLimit]: isOverLimit }]"
        >
          {{ charCount }} / {{ MAX_LENGTH }}
        </div>
      </div>

      <!-- Send Button -->
      <button 
        :class="[$style.sendBtn, { [$style.canSend]: canSend, [$style.rateLimited]: isRateLimited }]"
        :disabled="!canSend"
        @click="handleSend"
        :title="isRateLimited ? `انتظر ${rateLimitCooldown}s` : 'إرسال الرسالة'"
      >
        <span v-if="isRateLimited" :class="$style.cooldown">{{ rateLimitCooldown }}s</span>
        <i v-else-if="isSending" class="bi bi-hourglass-split"></i>
        <i v-else class="bi bi-send-fill"></i>
      </button>
    </div>

    <!-- Hints -->
    <div :class="$style.hints">
      <span>اضغط Enter للإرسال، Shift+Enter لسطر جديد</span>
    </div>
  </div>
</template>

<style module>
.messageInput {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.rateLimitWarning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}

.rateLimitWarning i {
  color: #ef4444;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warningContent {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.warningContent strong {
  font-size: 0.875rem;
  color: #991b1b;
}

.warningContent span {
  font-size: 0.8125rem;
  color: #b91c1c;
}

.rateLimitStatus {
  padding: 0.625rem 1rem;
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.statusBar {
  flex: 1;
  height: 0.375rem;
  background: #fde68a;
  border-radius: 9999px;
  overflow: hidden;
}

.statusFill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  transition: width 0.3s ease;
}

.statusText {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 600;
  white-space: nowrap;
}

.actionBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
}

.bannerContent {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.bannerContent i {
  color: #d4af37;
  font-size: 1rem;
}

.bannerTitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.125rem;
}

.bannerPreview {
  font-size: 0.875rem;
  color: #78350f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bannerClose {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #92400e;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.bannerClose:hover {
  background: rgba(146, 64, 14, 0.1);
}

.uploads {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.uploadItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.uploadItem i:first-child {
  font-size: 1.5rem;
}

.uploadInfo {
  flex: 1;
  min-width: 0;
}

.uploadName {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.captionInput {
  width: 100%;
  padding: 0.5rem 0.625rem;
  margin-top: 0.375rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-family: inherit;
  color: #374151;
  background: #f9fafb;
  transition: all 0.2s;
}

.captionInput:focus {
  outline: none;
  border-color: #d4af37;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
}

.captionInput::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.progressBar {
  height: 0.25rem;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37 0%, #f4d03f 100%);
  transition: width 0.3s;
}

.uploadSuccess {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #10b981;
}

.uploadError {
  font-size: 0.75rem;
  color: #ef4444;
}

.uploadRemove {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.uploadRemove:hover {
  background: #f3f4f6;
  color: #ef4444;
}

.disabled {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.inputArea {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem;
}

.iconBtn {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-size: 1.25rem;
}

.iconBtn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

.iconBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.textInputWrapper {
  flex: 1;
  position: relative;
}

.textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-family: inherit;
  color: #111827;
  resize: none;
  max-height: 8rem;
  overflow-y: auto;
  transition: all 0.2s;
}

.textarea:focus {
  outline: none;
  border-color: #d4af37;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.charCount {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.6875rem;
  color: #9ca3af;
  pointer-events: none;
}

.charCount.overLimit {
  color: #ef4444;
  font-weight: 600;
}

.sendBtn {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border: none;
  color: #9ca3af;
  cursor: not-allowed;
  border-radius: 50%;
  transition: all 0.2s;
  font-size: 1rem;
}

.sendBtn.canSend {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(212, 175, 55, 0.2);
}

.sendBtn.canSend:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
}

.sendBtn.rateLimited {
  background: #f87171;
  color: #ffffff;
  cursor: not-allowed;
}

.cooldown {
  font-size: 0.75rem;
  font-weight: 600;
}

.hints {
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.hints span {
  font-size: 0.6875rem;
  color: #9ca3af;
}

/* Dark theme - Matching Surveys.vue color scheme */
[data-theme="night"] .messageInput {
  background: rgba(27, 30, 36, 0.92);
  border-top-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .rateLimitWarning {
  background: rgba(220, 53, 69, 0.15);
  border-bottom-color: rgba(220, 53, 69, 0.3);
}

[data-theme="night"] .warningContent strong {
  color: #fca5a5;
}

[data-theme="night"] .warningContent span {
  color: #f87171;
}

[data-theme="night"] .rateLimitStatus {
  background: rgba(161, 125, 35, 0.15);
  border-bottom-color: rgba(161, 125, 35, 0.3);
}

[data-theme="night"] .statusText {
  color: #CEA55B;
}

[data-theme="night"] .actionBanner {
  background: rgba(161, 125, 35, 0.15);
  border-bottom-color: rgba(161, 125, 35, 0.3);
}

[data-theme="night"] .bannerTitle {
  color: #CEA55B;
}

[data-theme="night"] .bannerPreview {
  color: rgba(226, 232, 240, 0.82);
}

[data-theme="night"] .bannerClose {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .bannerClose:hover {
  background: rgba(161, 125, 35, 0.2);
}

[data-theme="night"] .uploads {
  background: rgba(40, 43, 51, 0.7);
  border-bottom-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .uploadItem {
  background: rgba(24, 28, 36, 0.76);
  border-color: rgba(226, 232, 240, 0.18);
}

[data-theme="night"] .uploadName {
  color: #E5E8E1;
}

[data-theme="night"] .captionInput {
  background: rgba(24, 28, 36, 0.76);
  border-color: rgba(226, 232, 240, 0.18);
  color: #E5E8E1;
}

[data-theme="night"] .captionInput::placeholder {
  color: rgba(209, 213, 219, 0.78);
}

[data-theme="night"] .captionInput:focus {
  background: rgba(40, 43, 51, 0.9);
  border-color: rgba(161, 125, 35, 0.4);
}

[data-theme="night"] .uploadRemove {
  color: rgba(226, 232, 240, 0.6);
}

[data-theme="night"] .uploadRemove:hover {
  background: rgba(220, 53, 69, 0.15);
  color: #f87171;
}

[data-theme="night"] .disabled {
  background: rgba(40, 43, 51, 0.5);
  color: rgba(226, 232, 240, 0.5);
}

[data-theme="night"] .inputArea {
  background: rgba(27, 30, 36, 0.92);
}

[data-theme="night"] .iconBtn {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .iconBtn:hover:not(:disabled) {
  background: rgba(161, 125, 35, 0.2);
  color: #CEA55B;
}

[data-theme="night"] .textarea {
  background: rgba(24, 28, 36, 0.76);
  border-color: rgba(226, 232, 240, 0.18);
  color: #E5E8E1;
}

[data-theme="night"] .textarea::placeholder {
  color: rgba(209, 213, 219, 0.78);
}

[data-theme="night"] .textarea:focus {
  background: rgba(40, 43, 51, 0.9);
  border-color: rgba(161, 125, 35, 0.4);
}

[data-theme="night"] .charCount {
  color: rgba(209, 198, 172, 0.7);
}

[data-theme="night"] .sendBtn {
  background: rgba(40, 43, 51, 0.7);
  color: rgba(226, 232, 240, 0.5);
}

[data-theme="night"] .sendBtn.canSend {
  box-shadow: 0 2px 4px rgba(161, 125, 35, 0.35);
}

[data-theme="night"] .sendBtn.canSend:hover {
  box-shadow: 0 4px 8px rgba(161, 125, 35, 0.45);
}

[data-theme="night"] .hints {
  background: rgba(40, 43, 51, 0.7);
  border-top-color: rgba(161, 125, 35, 0.18);
}

[data-theme="night"] .hints span {
  color: rgba(209, 198, 172, 0.6);
}
</style>

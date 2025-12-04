<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useChat } from '../../composables/useChat'
import { formatMessageTime, isMyMessage, chatAPI } from '../../services/chatService'
import type { Message } from '../../types/chat.types'

const emit = defineEmits<{
  reply: [message: Message]
  edit: [message: Message]
  delete: [messageId: string]
}>()

const {
  messages,
  currentUserId,
  hasMoreMessages,
  loadMoreMessages,
  addReaction,
  removeReaction,
  typingUsers
} = useChat()

const messagesContainer = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const showEmojiPicker = ref<string | null>(null)
const processingReactions = ref<Set<string>>(new Set())
const imagePreview = ref<{ 
  attachmentId: string;
  blobUrl: string | null; 
  name: string;
  loading: boolean;
  error: boolean;
} | null>(null)

const highlightedMessageId = ref<string | null>(null)

const scrollToMessage = (messageId: string) => {
  const element = document.getElementById(`message-${messageId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedMessageId.value = messageId
    setTimeout(() => {
      highlightedMessageId.value = null
    }, 2000)
  } else {
    console.warn('Message not found in current view')
  }
}

// Emoji picker refs for positioning

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// Close emoji picker when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (showEmojiPicker.value) {
    const target = event.target as HTMLElement
    if (!target.closest('[data-emoji-picker]') && !target.closest('[data-emoji-toggle]')) {
      showEmojiPicker.value = null
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Typing indicator text
const typingText = computed(() => {
  const users = Array.from(typingUsers.value.values())
  if (users.length === 0) return ''
  if (users.length === 1) return `${users[0]} يكتب...`
  return `${users.join(', ')} يكتبون...`
})

// Group messages by date
const groupedMessages = computed(() => {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  messages.value.forEach(message => {
    const messageDate = new Date(message.created_at).toLocaleDateString()
    
    if (messageDate !== currentDate) {
      currentDate = messageDate
      groups.push({ date: messageDate, messages: [] })
    }
    
    groups[groups.length - 1].messages.push(message)
  })

  return groups
})

// Format date separator
const formatDateSeparator = (date: string): string => {
  const today = new Date().toLocaleDateString()
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
  
  if (date === today) return 'اليوم'
  if (date === yesterday) return 'أمس'
  return date
}

// Scroll to bottom
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for new messages and scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})

// Handle scroll for loading more messages
const handleScroll = async () => {
  if (!messagesContainer.value || isLoadingMore.value) return
  
  if (messagesContainer.value.scrollTop === 0 && hasMoreMessages.value) {
    isLoadingMore.value = true
    await loadMoreMessages()
    isLoadingMore.value = false
  }
}

// Reaction handling
const handleReaction = async (messageId: string, emoji: string) => {
  // Create unique key for this reaction operation
  const reactionKey = `${messageId}-${emoji}`
  
  // Prevent duplicate processing (e.g., rapid clicks or WebSocket echo)
  if (processingReactions.value.has(reactionKey)) {
    console.log('⏭️ Skipping duplicate reaction request:', reactionKey)
    return
  }
  
  processingReactions.value.add(reactionKey)
  
  try {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return

    const reaction = message.reactions.find(r => r.emoji === emoji)
    const hasReacted = reaction?.users.some(u => isCurrentUser(u.id))

    if (hasReacted) {
      await removeReaction(messageId, emoji)
    } else {
      await addReaction(messageId, emoji)
    }

    showEmojiPicker.value = null
  } finally {
    // Remove from processing set after a short delay to prevent rapid re-clicks
    setTimeout(() => {
      processingReactions.value.delete(reactionKey)
    }, 500)
  }
}

// Download attachment using dedicated endpoint
const downloadAttachment = async (attachmentId: string, file_name: string) => {
  try {
    console.log(`🔽 Starting download for: ${file_name} (ID: ${attachmentId})`)
    
    // Use the chatAPI method which handles the download endpoint
    const { chatAPI } = await import('../../services/chatService')
    
    // ✅ CRITICAL: Pass attachment.file_name to ensure correct download name
    await chatAPI.downloadAttachmentFile(attachmentId, file_name)
    
    console.log(`✅ Download completed: ${file_name}`)
  } catch (error) {
    console.error('❌ Download failed:', error)
    alert('Failed to download file. Please try again.')
  }
}

// Check if attachment is an image
const isImage = (contentType: string): boolean => {
  return contentType.startsWith('image/')
}

// Get file icon class
const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return 'bi-file-image text-primary'
  if (contentType.includes('pdf')) return 'bi-file-pdf text-danger'
  if (contentType.includes('word')) return 'bi-file-word text-primary'
  if (contentType.includes('excel')) return 'bi-file-excel text-success'
  return 'bi-file-earmark'
}

// Open image preview with authenticated blob loading
const openImagePreview = async (attachmentId: string, name: string) => {
  // Initialize preview with loading state
  imagePreview.value = {
    attachmentId,
    blobUrl: null,
    name,
    loading: true,
    error: false
  }

  try {
    // Fetch image as authenticated base64 data URL
    const dataUrl = await chatAPI.fetchImageAsBlob(attachmentId)
    
    if (imagePreview.value?.attachmentId === attachmentId) {
      imagePreview.value.blobUrl = dataUrl
      imagePreview.value.loading = false
    }
  } catch (error) {
    console.error('Failed to load image preview:', error)
    if (imagePreview.value?.attachmentId === attachmentId) {
      imagePreview.value.error = true
      imagePreview.value.loading = false
    }
  }
}

// Close image preview (no need to revoke data URLs)
const closeImagePreview = () => {
  imagePreview.value = null
}

const isCurrentUser = (userId: number | string) => {
  if (!currentUserId.value) return false
  return String(userId) === String(currentUserId.value)
}
</script>

<template>
  <div 
    ref="messagesContainer"
    :class="$style.messageList"
    @scroll="handleScroll"
  >
    <!-- Loading more indicator -->
    <div v-if="isLoadingMore" :class="$style.loadingMore">
      <i class="bi bi-hourglass-split"></i>
      <span>جاري تحميل الرسائل السابقة...</span>
    </div>

    <!-- No messages -->
    <div v-if="messages.length === 0" :class="$style.empty">
      <i class="bi bi-chat-text"></i>
      <p>لا توجد رسائل بعد</p>
      <span>ابدأ المحادثة!</span>
    </div>

    <!-- Messages grouped by date -->
    <div v-for="group in groupedMessages" :key="group.date">
      <!-- Date separator -->
      <div :class="$style.dateSeparator">
        <span>{{ formatDateSeparator(group.date) }}</span>
      </div>

      <!-- Messages -->
      <div
        v-for="message in group.messages"
        :key="message.id"
        :id="`message-${message.id}`"
        :class="[
          $style.messageWrapper,
          { 
            [$style.myMessage]: isMyMessage(message, currentUserId || 0),
            [$style.highlighted]: highlightedMessageId === message.id
          }
        ]"
      >
        <div :class="$style.message">
          <!-- Avatar (for other users) -->
          <div 
              v-if="!isMyMessage(message, currentUserId ?? 0)" 
              :class="$style.avatar"
            >
              <span>
                {{ message.sender.first_name.charAt(0) }}{{ message.sender.last_name.charAt(0) }}
              </span>
            </div>

          <div :class="$style.messageContent">
            <!-- Sender name (for other users) -->
            <div 
              v-if="!isMyMessage(message, currentUserId ?? 0)" 
              :class="$style.senderName"
            >
              {{ message.sender.first_name }} {{ message.sender.last_name }}
            </div>            <!-- Message bubble -->
            <div 
              :class="[
                $style.messageBubble,
                { 
                  [$style.deleted]: message.is_deleted,
                  [$style.myBubble]: isMyMessage(message, currentUserId ?? 0)
                }
              ]"
            >
              <!-- Reply reference -->
              <div 
                v-if="message.reply_to" 
                :class="$style.replyRef"
                @click="scrollToMessage(message.reply_to.id)"
              >
                <div :class="$style.replyBar"></div>
                <div :class="$style.replyInfo">
                  <span :class="$style.replySender">
                    {{ message.reply_to.sender.first_name }} {{ message.reply_to.sender.last_name }}
                  </span>
                  <span :class="$style.replyText">
                    {{ message.reply_to.content || 'مرفق 📎' }}
                  </span>
                </div>
              </div>

              <!-- Message text -->
              <p :class="$style.messageText">{{ message.content }}</p>

              <!-- Attachments -->
              <div v-if="message.attachments.length > 0" :class="$style.attachments">
                <div 
                  v-for="attachment in message.attachments" 
                  :key="attachment.id"
                  :class="$style.attachment"
                >
                  <i :class="['bi', getFileIcon(attachment.content_type)]"></i>
                  <div :class="$style.attachmentInfo">
                    <span :class="$style.attachmentName">{{ attachment.file_name }}</span>
                    <span :class="$style.attachmentSize">
                      {{ (attachment.size / 1024).toFixed(1) }} KB
                    </span>
                    <!-- Display caption if exists -->
                    <span v-if="attachment.caption" :class="$style.attachmentCaption">
                      💬 {{ attachment.caption }}
                    </span>
                  </div>
                  
                  <!-- Action buttons -->
                  <div :class="$style.attachmentActions">
                    <!-- Preview button for images -->
                    <button 
                      v-if="isImage(attachment.content_type)"
                      @click.stop="openImagePreview(attachment.id, attachment.file_name)"
                      :class="$style.previewBtn"
                      title="معاينة الصورة"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                    
                    <!-- Download button -->
                    <button 
                      @click.stop="downloadAttachment(attachment.id, attachment.file_name)"
                      :class="$style.downloadBtn"
                      title="تحميل"
                    >
                      <i class="bi bi-download"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Reactions -->
              <div v-if="message.reactions.length > 0" :class="$style.reactions">
                <button
                  v-for="reaction in message.reactions"
                  :key="reaction.emoji"
                  :class="[
                    $style.reaction,
                    { [$style.reacted]: reaction.users.some(u => isCurrentUser(u.id)) }
                  ]"
                  @click="handleReaction(message.id, reaction.emoji)"
                  :title="reaction.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')"
                >
                  <span>{{ reaction.emoji }}</span>
                  <span>{{ reaction.users.length }}</span>
                </button>
              </div>

              <!-- Message footer -->
              <div :class="$style.messageFooter">
                <span :class="$style.timestamp">
                  {{ formatMessageTime(message.created_at) }}
                </span>
                <span v-if="message.edited_at" :class="$style.edited">
                  معدلة
                </span>
              </div>
            </div>

            <!-- Message actions -->
            <div 
              v-if="!message.is_deleted" 
              :class="[
                $style.messageActions,
                { [$style.myMessageActions]: isMyMessage(message, currentUserId ?? 0) }
              ]"
            >
              <!-- Emoji picker toggle -->
              <button 
                :class="$style.actionBtn"
                @click.stop="showEmojiPicker = showEmojiPicker === message.id ? null : message.id"
                title="تفاعل"
                data-emoji-toggle
              >
                <i class="bi bi-emoji-smile"></i>
              </button>

              <!-- Emoji picker -->
              <div 
                v-if="showEmojiPicker === message.id" 
                :class="[
                  $style.emojiPicker,
                  { [$style.emojiPickerRight]: isMyMessage(message, currentUserId ?? 0) }
                ]"
                data-emoji-picker
                @click.stop
              >
                <button
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  :class="$style.emojiBtn"
                  @click="handleReaction(message.id, emoji)"
                >
                  {{ emoji }}
                </button>
              </div>

              <!-- Reply -->
              <button 
                :class="$style.actionBtn"
                @click="$emit('reply', message)"
                title="رد"
              >
                <i class="bi bi-reply"></i>
              </button>

              <!-- Edit (if own message) -->
              <button 
                v-if="isMyMessage(message, currentUserId ?? 0)"
                :class="$style.actionBtn"
                @click="$emit('edit', message)"
                title="تعديل"
              >
                <i class="bi bi-pencil"></i>
              </button>

              <!-- Delete (if own message) -->
              <button 
                v-if="isMyMessage(message, currentUserId ?? 0)"
                :class="$style.actionBtn"
                @click="$emit('delete', message.id)"
                title="حذف"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Typing Indicator -->
    <div v-if="typingText" :class="$style.typingIndicator">
      <div :class="$style.typingBubble">
        <span :class="$style.typingDots">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span :class="$style.typingText">{{ typingText }}</span>
      </div>
    </div>
  </div>

  <!-- Image Preview Modal -->
  <div v-if="imagePreview" :class="$style.imageModal" @click="closeImagePreview">
    <div :class="$style.imageModalContent" @click.stop>
      <button :class="$style.closeModal" @click="closeImagePreview">
        <i class="bi bi-x-lg"></i>
      </button>
      
      <!-- Loading State -->
      <div v-if="imagePreview.loading" :class="$style.imageLoading">
        <i class="bi bi-hourglass-split"></i>
        <span>جاري تحميل الصورة...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="imagePreview.error" :class="$style.imageError">
        <i class="bi bi-exclamation-triangle"></i>
        <span>فشل تحميل الصورة</span>
      </div>
      
      <!-- Image Display -->
      <template v-else-if="imagePreview.blobUrl">
        <img 
          :src="imagePreview.blobUrl" 
          :alt="imagePreview.name" 
          :class="$style.previewImage" 
        />
        <div :class="$style.imageName">{{ imagePreview.name }}</div>
        <button 
          :class="$style.downloadModalBtn"
          @click="downloadAttachment(imagePreview.attachmentId, imagePreview.name)"
        >
          <i class="bi bi-download"></i> تحميل الصورة
        </button>
      </template>
    </div>
  </div>
</template>

<style module>
.messageList {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 0; /* Critical for flex child to allow shrinking */
}

.loadingMore {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  text-align: center;
}

.empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.empty span {
  font-size: 0.875rem;
}

.dateSeparator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0;
}

.dateSeparator span {
  padding: 0.375rem 1rem;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.messageWrapper {
  margin-bottom: 1rem;
  transition: background-color 0.5s ease;
  border-radius: 0.5rem;
}

.highlighted {
  background-color: rgba(212, 175, 55, 0.15);
  padding: 0.5rem;
  margin: 0.5rem -0.5rem;
  animation: pulse 2s ease-out;
}

@keyframes pulse {
  0% { background-color: rgba(212, 175, 55, 0.3); }
  100% { background-color: transparent; }
}

.messageWrapper.myMessage {
  display: flex;
  justify-content: flex-end;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 70%;
}

.myMessage .message {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.75rem;
}

.messageContent {
  flex: 1;
  min-width: 0;
}

.senderName {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.messageBubble {
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border-radius: 1.25rem;
  border-bottom-right-radius: 0.25rem; /* Tail on right for other messages */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.2s ease;
}

.messageBubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.myMessage .messageBubble {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  border-radius: 1.25rem;
  border-bottom-left-radius: 0.25rem; /* Tail on left for my messages */
  border-bottom-right-radius: 1.25rem;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
}

.messageBubble.deleted {
  opacity: 0.6;
  font-style: italic;
}

.replyRef {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s;
}

.replyRef:hover {
  background: rgba(0, 0, 0, 0.08);
}

.myMessage .replyRef:hover {
  background: rgba(255, 255, 255, 0.25);
}

.myMessage .replyRef {
  background: rgba(255, 255, 255, 0.15);
}

.replyBar {
  width: 3px;
  background: #d4af37;
  border-radius: 2px;
  flex-shrink: 0;
}

.myMessage .replyBar {
  background: rgba(255, 255, 255, 0.6);
}

.replyInfo {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.replySender {
  font-weight: 700;
  color: #d4af37;
}

.myMessage .replySender {
  color: rgba(255, 255, 255, 0.95);
}

.replyText {
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.myMessage .replyText {
  color: rgba(255, 255, 255, 0.8);
}

.messageText {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.attachments {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.myMessage .attachment {
  background: rgba(255, 255, 255, 0.2);
}

.attachment:hover {
  background: rgba(0, 0, 0, 0.1);
}

.attachment i:first-child {
  font-size: 1.5rem;
}

.attachmentInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.attachmentName {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachmentSize {
  font-size: 0.75rem;
  opacity: 0.7;
}

.attachmentCaption {
  display: block;
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.25rem;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.myMessage .attachmentCaption {
  color: rgba(255, 255, 255, 0.9);
}

.attachmentActions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.previewBtn,
.downloadBtn {
  padding: 0.375rem 0.5rem;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 0.375rem;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.myMessage .previewBtn,
.myMessage .downloadBtn {
  background: rgba(255, 255, 255, 0.3);
}

.previewBtn:hover,
.downloadBtn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.myMessage .previewBtn:hover,
.myMessage .downloadBtn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.imageModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.imageModalContent {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.closeModal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.25rem;
  color: #111827;
  z-index: 1;
}

.closeModal:hover {
  background: #ffffff;
  transform: rotate(90deg);
}

.previewImage {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.imageName {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.downloadModalBtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.downloadModalBtn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.downloadModalBtn i {
  font-size: 1rem;
}

.imageLoading,
.imageError {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: #ffffff;
}

.imageLoading i,
.imageError i {
  font-size: 3rem;
  opacity: 0.8;
}

.imageLoading span,
.imageError span {
  font-size: 1rem;
  font-weight: 500;
}

.imageLoading i {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.reaction {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  border-radius: 9999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.myMessage .reaction {
  background: rgba(255, 255, 255, 0.2);
}

.reaction:hover {
  background: rgba(0, 0, 0, 0.1);
}

.reaction.reacted {
  background: #fef3c7;
  border-color: #d4af37;
}

.myMessage .reaction.reacted {
  background: rgba(255, 255, 255, 0.4);
}

.messageFooter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.375rem;
}

.timestamp {
  font-size: 0.6875rem;
  opacity: 0.7;
}

.edited {
  font-size: 0.6875rem;
  opacity: 0.7;
  font-style: italic;
}

.messageActions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
  margin-top: 0.25rem;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.2s ease;
  position: relative;
}

.myMessageActions {
  flex-direction: row-reverse;
}

.messageWrapper:hover .messageActions {
  opacity: 1;
  transform: translateY(0);
}

/* Show actions on touch devices */
@media (hover: none) {
  .messageActions {
    opacity: 1;
  }
}

.actionBtn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.actionBtn:hover {
  background: #f3f4f6;
  color: #d4af37;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #d4af37;
}

.emojiPicker {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  left: 0;
  z-index: 100;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: max-content;
  animation: emojiPickerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom left;
}

/* Position on right side for own messages */
.emojiPickerRight {
  left: auto;
  right: 0;
  transform-origin: bottom right;
}

/* Add a small arrow/tail to the emoji picker */
.emojiPicker::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 1rem;
  width: 12px;
  height: 12px;
  background: inherit;
  transform: rotate(45deg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05);
}

.emojiPickerRight::after {
  left: auto;
  right: 1rem;
}

@keyframes emojiPickerPop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mobile responsive emoji picker */
@media (max-width: 480px) {
  .emojiPicker {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -50%);
    padding: 1rem;
    gap: 0.5rem;
    border-radius: 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
    animation: emojiPickerMobileFadeIn 0.2s ease-out;
  }
  
  .emojiPickerRight {
    left: 50% !important;
    right: auto !important;
  }
  
  @keyframes emojiPickerMobileFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .emojiBtn {
    padding: 0.75rem;
    font-size: 1.75rem;
  }
}

/* Tablet responsive */
@media (min-width: 481px) and (max-width: 768px) {
  .emojiPicker {
    padding: 0.625rem;
  }
  
  .emojiBtn {
    padding: 0.5rem;
    font-size: 1.5rem;
  }
}

.emojiBtn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1;
}

.emojiBtn:hover {
  background: #f3f4f6;
  transform: scale(1.2);
}

.emojiBtn:active {
  transform: scale(0.95);
}

.typingIndicator {
  display: flex;
  align-items: center;
  margin: 1rem 0;
  padding: 0 1rem;
}

.typingBubble {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f1f1f1;
  border-radius: 1.25rem;
  border-bottom-right-radius: 0.25rem;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.typingDots {
  display: flex;
  gap: 0.25rem;
}

.typingDots span {
  width: 0.5rem;
  height: 0.5rem;
  background: #9ca3af;
  border-radius: 50%;
  animation: typingDot 1.4s infinite;
}

.typingDots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typingDots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-0.5rem);
    opacity: 1;
  }
}

.typingText {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

/* Dark theme - Matching Surveys.vue color scheme */
[data-theme="night"] .messageList {
  background: linear-gradient(135deg, #231F20 0%, #4D4D4F 50%, #2A2A2A 100%);
}

[data-theme="night"] .empty {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .empty i {
  color: rgba(161, 125, 35, 0.4);
}

[data-theme="night"] .dateSeparator span {
  background: rgba(40, 43, 51, 0.9);
  color: rgba(209, 198, 172, 0.8);
}

[data-theme="night"] .senderName {
  color: #CEA55B;
}

[data-theme="night"] .messageBubble {
  background: rgba(40, 43, 51, 0.7);
  color: #E5E8E1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme="night"] .messageBubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

[data-theme="night"] .myMessage .messageBubble {
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.4) 0%, rgba(183, 138, 65, 0.3) 100%);
}

[data-theme="night"] .messageText {
  color: #E5E8E1;
}

[data-theme="night"] .replyRef {
  background: rgba(24, 28, 36, 0.6);
}

[data-theme="night"] .myMessage .replyRef {
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="night"] .replySender {
  color: #CEA55B;
}

[data-theme="night"] .replyText {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .attachment {
  background: rgba(24, 28, 36, 0.6);
}

[data-theme="night"] .attachment:hover {
  background: rgba(40, 43, 51, 0.8);
}

[data-theme="night"] .attachmentName {
  color: #E5E8E1;
}

[data-theme="night"] .attachmentSize {
  color: rgba(209, 198, 172, 0.7);
}

[data-theme="night"] .attachmentCaption {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .reaction {
  background: rgba(40, 43, 51, 0.7);
}

[data-theme="night"] .reaction:hover {
  background: rgba(161, 125, 35, 0.15);
}

[data-theme="night"] .reaction.reacted {
  background: rgba(161, 125, 35, 0.25);
  border-color: rgba(161, 125, 35, 0.5);
}

[data-theme="night"] .timestamp {
  color: rgba(209, 198, 172, 0.6);
}

[data-theme="night"] .edited {
  color: rgba(209, 198, 172, 0.6);
}

[data-theme="night"] .actionBtn {
  background: rgba(40, 43, 51, 0.9);
  border-color: rgba(161, 125, 35, 0.2);
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .actionBtn:hover {
  background: rgba(161, 125, 35, 0.2);
  border-color: rgba(161, 125, 35, 0.4);
  color: #CEA55B;
}

[data-theme="night"] .emojiPicker {
  background: rgba(27, 30, 36, 0.95);
  border-color: rgba(161, 125, 35, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

[data-theme="night"] .emojiPicker::after {
  background: rgba(27, 30, 36, 0.95);
  border-color: rgba(161, 125, 35, 0.2);
}

[data-theme="night"] .emojiBtn:hover {
  background: rgba(161, 125, 35, 0.2);
}

[data-theme="night"] .loadingMore {
  color: rgba(209, 198, 172, 0.8);
}

[data-theme="night"] .typingBubble {
  background: rgba(40, 43, 51, 0.7);
}

[data-theme="night"] .typingDots span {
  background: #CEA55B;
}

[data-theme="night"] .typingText {
  color: rgba(226, 232, 240, 0.75);
}

[data-theme="night"] .imageModal {
  background: rgba(35, 31, 32, 0.95);
}

[data-theme="night"] .closeModal {
  background: rgba(40, 43, 51, 0.9);
  color: #E5E8E1;
}

[data-theme="night"] .closeModal:hover {
  background: rgba(161, 125, 35, 0.3);
}
</style>

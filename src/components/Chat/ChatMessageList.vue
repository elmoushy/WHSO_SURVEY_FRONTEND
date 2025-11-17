<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useChat } from '../../composables/useChat'
import { formatMessageTime, isMyMessage } from '../../services/chatService'
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

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

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
  const message = messages.value.find(m => m.id === messageId)
  if (!message) return

  const reaction = message.reactions.find(r => r.emoji === emoji)
  const hasReacted = reaction?.users.some(u => u.id === currentUserId.value)

  if (hasReacted) {
    await removeReaction(messageId, emoji)
  } else {
    await addReaction(messageId, emoji)
  }

  showEmojiPicker.value = null
}

// Download attachment
const downloadAttachment = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Get file icon class
const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return 'bi-file-image text-primary'
  if (contentType.includes('pdf')) return 'bi-file-pdf text-danger'
  if (contentType.includes('word')) return 'bi-file-word text-primary'
  if (contentType.includes('excel')) return 'bi-file-excel text-success'
  return 'bi-file-earmark'
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
        :class="[
          $style.messageWrapper,
          { [$style.myMessage]: isMyMessage(message, currentUserId || 0) }
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
              <div v-if="message.reply_to" :class="$style.replyRef">
                <i class="bi bi-reply-fill"></i>
                <span>Replying to a message</span>
              </div>

              <!-- Message text -->
              <p :class="$style.messageText">{{ message.content }}</p>

              <!-- Attachments -->
              <div v-if="message.attachments.length > 0" :class="$style.attachments">
                <div 
                  v-for="attachment in message.attachments" 
                  :key="attachment.id"
                  :class="$style.attachment"
                  @click="downloadAttachment(attachment.file, attachment.filename)"
                >
                  <i :class="['bi', getFileIcon(attachment.content_type)]"></i>
                  <div :class="$style.attachmentInfo">
                    <span :class="$style.attachmentName">{{ attachment.filename }}</span>
                    <span :class="$style.attachmentSize">
                      {{ (attachment.size / 1024).toFixed(1) }} KB
                    </span>
                  </div>
                  <i class="bi bi-download" :class="$style.downloadIcon"></i>
                </div>
              </div>

              <!-- Reactions -->
              <div v-if="message.reactions.length > 0" :class="$style.reactions">
                <button
                  v-for="reaction in message.reactions"
                  :key="reaction.emoji"
                  :class="[
                    $style.reaction,
                    { [$style.reacted]: reaction.users.some(u => u.id === currentUserId) }
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
              :class="$style.messageActions"
            >
              <!-- Emoji picker toggle -->
              <button 
                :class="$style.actionBtn"
                @click="showEmojiPicker = showEmojiPicker === message.id ? null : message.id"
                title="تفاعل"
              >
                <i class="bi bi-emoji-smile"></i>
              </button>

              <!-- Emoji picker -->
              <div v-if="showEmojiPicker === message.id" :class="$style.emojiPicker">
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
</template>

<style module>
.messageList {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
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
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
}

.myMessage .messageBubble {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
}

.messageBubble.deleted {
  opacity: 0.6;
  font-style: italic;
}

.replyRef {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
}

.myMessage .replyRef {
  background: rgba(255, 255, 255, 0.2);
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
  cursor: pointer;
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

.downloadIcon {
  opacity: 0.7;
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
  opacity: 0;
  transition: opacity 0.2s;
  position: relative;
}

.messageWrapper:hover .messageActions {
  opacity: 1;
}

.actionBtn {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.actionBtn:hover {
  background: #f3f4f6;
  color: #111827;
}

.emojiPicker {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.emojiBtn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.emojiBtn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
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
  border-radius: 1rem;
  max-width: 70%;
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
</style>

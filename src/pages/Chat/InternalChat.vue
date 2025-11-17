<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useChat } from '../../composables/useChat'
import ChatThreadList from '../../components/Chat/ChatThreadList.vue'
import ChatMessageList from '../../components/Chat/ChatMessageList.vue'
import ChatMessageInput from '../../components/Chat/ChatMessageInput.vue'
import CreateThreadModal from '../../components/Chat/CreateThreadModal.vue'
import type { Message } from '../../types/chat.types'

const {
  currentThread,
  currentThreadDisplayName,
  selectThread,
  deleteMessage,
  setReplyingTo,
  setEditingMessage,
  stopThreadPolling,
  stopMessagePolling
} = useChat()

const showCreateModal = ref(false)
const showThreadInfo = ref(false)

const handleSelectThread = (threadId: string) => {
  selectThread(threadId)
  showThreadInfo.value = false
}

const handleCreateThread = () => {
  showCreateModal.value = true
}

const handleReply = (message: Message) => {
  setReplyingTo(message)
}

const handleEdit = (message: Message) => {
  setEditingMessage(message)
}

const handleDelete = async (messageId: string) => {
  if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
    await deleteMessage(messageId)
  }
}

const toggleThreadInfo = () => {
  showThreadInfo.value = !showThreadInfo.value
}

// Cleanup on unmount
onUnmounted(() => {
  stopThreadPolling()
  stopMessagePolling()
})
</script>

<template>
  <div :class="$style.chatPage">
    <!-- Thread List Sidebar -->
    <aside :class="$style.threadListSidebar">
      <ChatThreadList
        @select-thread="handleSelectThread"
        @create-thread="handleCreateThread"
      />
    </aside>

    <!-- Main Chat Area -->
    <main :class="$style.chatMain">
      <!-- No thread selected -->
      <div v-if="!currentThread" :class="$style.noThread">
        <div :class="$style.noThreadContent">
          <i class="bi bi-chat-left-dots"></i>
          <h2>المحادثات</h2>
          <p>اختر محادثة للبدء</p>
          <button :class="$style.startBtn" @click="showCreateModal = true">
            <i class="bi bi-plus-circle"></i>
            ابدأ محادثة
          </button>
        </div>
      </div>

      <!-- Thread selected -->
      <div v-else :class="$style.chatContainer">
        <!-- Chat Header -->
        <header :class="$style.chatHeader">
          <div :class="$style.headerLeft">
            <div :class="$style.threadAvatar">
              <span>{{ currentThreadDisplayName.charAt(0) }}</span>
            </div>
            <div :class="$style.headerInfo">
              <h3 :class="$style.threadTitle">{{ currentThreadDisplayName }}</h3>
              <span :class="$style.threadStatus">
                <template v-if="currentThread.type === 'direct'">
                  مباشرة
                </template>
                <template v-else>
                  {{ currentThread.participants.length }} المشاركون
                </template>
              </span>
            </div>
          </div>

          <div :class="$style.headerActions">
            <button 
              :class="$style.headerBtn"
              @click="toggleThreadInfo"
              title="Thread Info"
            >
              <i class="bi bi-info-circle"></i>
            </button>
          </div>
        </header>

        <!-- Messages -->
        <ChatMessageList
          @reply="handleReply"
          @edit="handleEdit"
          @delete="handleDelete"
        />

        <!-- Message Input -->
        <ChatMessageInput />
      </div>
    </main>

    <!-- Thread Info Sidebar (Simple version) -->
    <aside 
      v-if="showThreadInfo && currentThread" 
      :class="$style.threadInfoSidebar"
    >
      <div :class="$style.infoHeader">
        <h3>نوع المحادثة</h3>
        <button :class="$style.closeBtn" @click="showThreadInfo = false">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div :class="$style.infoContent">
        <div :class="$style.infoSection">
          <h4>نوع المحادثة</h4>
          <p>{{ currentThread.type === 'direct' ? 'رسالة مباشرة' : 'محادثة جماعية' }}</p>
        </div>

        <div :class="$style.infoSection">
          <h4>المشاركون ({{ currentThread.participants.length }})</h4>
          <div :class="$style.participantsList">
            <div 
              v-for="participant in currentThread.participants" 
              :key="participant.user.id"
              :class="$style.participant"
            >
              <div :class="$style.participantAvatar">
                {{ participant.user.first_name.charAt(0) }}{{ participant.user.last_name.charAt(0) }}
              </div>
              <div :class="$style.participantInfo">
                <span :class="$style.participantName">{{ participant.user.first_name }} {{ participant.user.last_name }}</span>
                <span :class="$style.participantRole">{{ participant.role === 'owner' ? 'المالك' : participant.role === 'admin' ? 'مسؤول' : 'عضو' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentThread.type === 'group' && currentThread.group_settings" :class="$style.infoSection">
          <h4>إعدادات المجموعة</h4>
          <div :class="$style.settingItem">
            <span>من يمكنه النشر:</span>
            <strong>{{ currentThread.group_settings.posting_mode === 'all' ? 'الجميع' : 'المسؤولون فقط' }}</strong>
          </div>
          <div :class="$style.settingItem">
            <span>يمكن للأعضاء إضافة آخرين:</span>
            <strong>{{ currentThread.group_settings.members_can_add_others ? 'نعم' : 'لا' }}</strong>
          </div>
        </div>
      </div>
    </aside>

    <!-- Create Thread Modal -->
    <CreateThreadModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
    />
  </div>
</template>

<style module>
.chatPage {
  display: flex;
  height: 100vh;
  background: #ffffff;
}

.threadListSidebar {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
}

.chatMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.noThread {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f9fafb;
}

.noThreadContent {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.noThreadContent i {
  font-size: 5rem;
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.noThreadContent h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.noThreadContent p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.startBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(212, 175, 55, 0.2);
}

.startBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(212, 175, 55, 0.3);
}

.chatContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chatHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.threadAvatar {
  width: 2.75rem;
  height: 2.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
}

.headerInfo {
  display: flex;
  flex-direction: column;
}

.threadTitle {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.125rem 0;
}

.threadStatus {
  font-size: 0.8125rem;
  color: #6b7280;
}

.headerActions {
  display: flex;
  gap: 0.5rem;
}

.headerBtn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-size: 1.125rem;
}

.headerBtn:hover {
  background: #f3f4f6;
  color: #111827;
}

.threadInfoSidebar {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #e5e7eb;
  background: #ffffff;
  overflow-y: auto;
}

.infoHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.infoHeader h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.closeBtn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.closeBtn:hover {
  background: #f3f4f6;
  color: #111827;
}

.infoContent {
  padding: 1rem 1.25rem;
}

.infoSection {
  margin-bottom: 1.5rem;
}

.infoSection:last-child {
  margin-bottom: 0;
}

.infoSection h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.infoSection p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

.participantsList {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.participantAvatar {
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.participantInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.participantName {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participantRole {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: capitalize;
}

.settingItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0;
  font-size: 0.875rem;
}

.settingItem span {
  color: #6b7280;
}

.settingItem strong {
  color: #111827;
}

/* Responsive */
@media (max-width: 1024px) {
  .threadInfoSidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -4px 0 6px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .threadListSidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 90;
    box-shadow: 4px 0 6px rgba(0, 0, 0, 0.1);
  }
}
</style>

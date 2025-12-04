<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useChat } from '../../composables/useChat'
import { formatRelativeTime } from '../../services/chatService'
import type { Thread } from '../../types/chat.types'

defineProps<{
  isCollapsed?: boolean
  hideToggleButton?: boolean
}>()

const emit = defineEmits<{
  selectThread: [threadId: string]
  createThread: []
  toggleCollapse: []
}>()

const {
  threads,
  fetchThreads,
  selectedThreadId,
  totalUnreadCount,
  currentUserId
} = useChat()

const searchQuery = ref('')
const filterType = ref<'all' | 'direct' | 'group'>('all')
const isLoading = ref(false)

// Watch for thread changes for reactivity
watch(threads, () => {
  // Threads updated - UI will react automatically
}, { deep: true })

// Watch totalUnreadCount
watch(totalUnreadCount, () => {
  // Total unread count changed - UI will react automatically
}, { immediate: true })

onMounted(async () => {
  isLoading.value = true
  await fetchThreads()
  isLoading.value = false
  // WebSocket will handle real-time updates, no polling needed
})

const filteredThreads = computed(() => {
  let filtered = threads.value

  // Filter by type
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => t.type === filterType.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => {
      // Always search by chat_name if available
      return (t.chat_name?.toLowerCase().includes(query)) || (t.title?.toLowerCase().includes(query))
    })
  }

  return filtered
})

const getThreadName = (thread: Thread): string => {
  return thread.chat_name || thread.title || 'مجموعة بدون عنوان'
}

const getThreadAvatar = (thread: Thread): string => {
  if (thread.type === 'group') {
    return thread.title?.charAt(0).toUpperCase() || 'G'
  }
  const otherParticipant = thread.participants.find(p => p.user.id !== currentUserId.value)
  const firstName = otherParticipant?.user.first_name?.charAt(0) || ''
  const lastName = otherParticipant?.user.last_name?.charAt(0) || ''
  return (firstName + lastName).toUpperCase() || '?'
}

const getLastMessagePreview = (thread: Thread): string => {
  if (!thread.last_message) return 'لا توجد رسائل بعد'
  const content = thread.last_message.content
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

const handleThreadClick = (threadId: string) => {
  emit('selectThread', threadId)
}

const handleCreateThread = () => {
  emit('createThread')
}

const handleToggleCollapse = () => {
  emit('toggleCollapse')
}
</script>

<template>
  <div :class="[$style.threadList, { [$style.collapsed]: isCollapsed }]">
    <!-- Toggle Button (hidden when parent controls it) -->
    <button 
      v-if="!hideToggleButton"
      :class="$style.toggleBtn" 
      @click="handleToggleCollapse"
      :title="isCollapsed ? 'فتح قائمة المحادثات' : 'إغلاق قائمة المحادثات'"
    >
      <i :class="['bi', isCollapsed ? 'bi-chevron-left' : 'bi-chevron-right']"></i>
    </button>

    <!-- Header -->
    <div :class="$style.header" v-show="!isCollapsed">
      <div :class="$style.headerContent">
        <h2 :class="$style.title">الرسائل</h2>
        <span v-if="totalUnreadCount > 0" :class="$style.unreadBadge">
          {{ totalUnreadCount }}
        </span>
      </div>
      <button 
        :class="$style.newChatBtn" 
        @click="handleCreateThread"
        title="محادثة جديدة"
      >
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <!-- Search and Filter -->
    <div :class="$style.searchSection" v-show="!isCollapsed">
      <div :class="$style.searchBox">
        <i class="bi bi-search" :class="$style.searchIcon"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="البحث في المحادثات..."
          :class="$style.searchInput"
        />
      </div>

      <div :class="$style.filterTabs">
        <button
          :class="[$style.filterTab, { [$style.active]: filterType === 'all' }]"
          @click="filterType = 'all'"
        >
          الكل
        </button>
        <button
          :class="[$style.filterTab, { [$style.active]: filterType === 'direct' }]"
          @click="filterType = 'direct'"
        >
          مباشرة
        </button>
        <button
          :class="[$style.filterTab, { [$style.active]: filterType === 'group' }]"
          @click="filterType = 'group'"
        >
          المجموعات
        </button>
      </div>
    </div>

    <!-- Thread List -->
    <div :class="$style.threads" v-show="!isCollapsed">
      <div v-if="isLoading" :class="$style.loading">
        <i class="bi bi-hourglass-split"></i>
        <span>جاري تحميل المحادثات...</span>
      </div>

      <div v-else-if="filteredThreads.length === 0" :class="$style.empty">
        <i class="bi bi-chat-dots"></i>
        <p>{{ searchQuery ? 'لم يتم العثور على محادثات' : 'لا توجد محادثات بعد' }}</p>
        <button :class="$style.emptyBtn" @click="handleCreateThread">
          ابدأ محادثة
        </button>
      </div>

      <div
        v-for="thread in filteredThreads"
        :key="thread.id"
        :class="[
          $style.threadItem,
          { [$style.active]: thread.id === selectedThreadId },
          { [$style.hasUnread]: thread.unread_count > 0 }
        ]"
        @click="handleThreadClick(thread.id)"
      >
        <!-- Avatar -->
        <div :class="$style.avatar">
          <span :class="$style.avatarText">{{ getThreadAvatar(thread) }}</span>
          <i 
            v-if="thread.type === 'group'" 
            class="bi bi-people-fill" 
            :class="$style.groupIcon"
          ></i>
          <!-- Unread indicator dot -->
          <span 
            v-if="thread.unread_count > 0" 
            :class="$style.unreadDot"
            :title="`${thread.unread_count} رسالة غير مقروءة`"
          ></span>
        </div>

        <!-- Thread Info -->
        <div :class="$style.threadInfo">
          <div :class="$style.threadHeader">
            <span :class="$style.threadName">{{ getThreadName(thread) }}</span>
            <span :class="$style.timestamp">
              {{ formatRelativeTime(thread.updated_at) }}
            </span>
          </div>

          <div :class="$style.threadPreview">
            <p :class="$style.lastMessage">
              <span v-if="thread.last_message?.sender.id === currentUserId">
                أنت: 
              </span>
              {{ getLastMessagePreview(thread) }}
            </p>
            <span 
              v-if="thread.unread_count > 0" 
              :class="$style.unreadCount"
            >
              {{ thread.unread_count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style module src="./ChatThreadList.module.css"></style>

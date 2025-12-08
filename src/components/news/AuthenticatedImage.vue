<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAuthenticatedImage } from '../../composables/useAuthenticatedImage'

interface Props {
  src: string | null | undefined
  alt?: string
  class?: string
  /** Version string for cache invalidation (e.g., updated_at timestamp) */
  version?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  class: '',
  version: undefined
})

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error'): void
}>()

// Compute options for cache
const imageOptions = computed(() => ({
  version: props.version
}))

const { blobUrl, error, isFromCache } = useAuthenticatedImage(
  computed(() => props.src),
  imageOptions
)

// Watch for load completion
watch([blobUrl, error], ([newBlobUrl, newError]) => {
  if (newBlobUrl) {
    emit('load')
  } else if (newError) {
    emit('error')
  }
})
</script>

<template>
  <img 
    v-if="blobUrl" 
    :src="blobUrl" 
    :alt="alt" 
    :class="props.class"
    :data-cached="isFromCache ? 'true' : 'false'"
  />
</template>


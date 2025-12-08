<script setup lang="ts">
import { computed } from 'vue'
import { useAuthenticatedImage } from '../composables/useAuthenticatedImage'

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

const imageUrl = computed(() => props.src)
const imageOptions = computed(() => ({ version: props.version }))
const { blobUrl, isLoading, isFromCache } = useAuthenticatedImage(imageUrl, imageOptions)
</script>

<template>
  <div v-if="isLoading" :class="$style.skeleton"></div>
  <img
    v-else-if="blobUrl"
    :src="blobUrl"
    :alt="alt"
    :class="props.class"
    :data-cached="isFromCache ? 'true' : 'false'"
  />
</template>

<style module>
.skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>

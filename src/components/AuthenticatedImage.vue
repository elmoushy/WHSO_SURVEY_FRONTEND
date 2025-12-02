<script setup lang="ts">
import { computed } from 'vue'
import { useAuthenticatedImage } from '../composables/useAuthenticatedImage'

interface Props {
  src: string | null | undefined
  alt?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  class: ''
})

const imageUrl = computed(() => props.src)
const { blobUrl, isLoading } = useAuthenticatedImage(imageUrl)
</script>

<template>
  <div v-if="isLoading" :class="$style.skeleton"></div>
  <img
    v-else-if="blobUrl"
    :src="blobUrl"
    :alt="alt"
    :class="props.class"
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

<script setup lang="ts">
import { watch } from 'vue'
import { useAuthenticatedImage } from '../../composables/useAuthenticatedImage'

interface Props {
  src: string | null | undefined
  alt?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  class: ''
})

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error'): void
}>()

const { blobUrl, error } = useAuthenticatedImage(props.src)

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
  />
</template>


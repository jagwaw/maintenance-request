<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <div v-for="(src, i) in previews" :key="src" class="relative">
        <img :src="src" alt="" class="h-20 w-20 rounded object-cover" />
        <button type="button" class="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gray-800 text-xs text-white" :aria-label="`Remove photo ${i + 1}`" @click="remove(i)">✕</button>
      </div>
    </div>
    <label v-if="photos.length < MAX_PHOTOS" class="btn-secondary mt-2 inline-block cursor-pointer">
      Add photo
      <input type="file" accept="image/*" multiple class="sr-only" @change="onPick" />
    </label>
    <p class="mt-1 text-sm text-gray-500">Optional, up to {{ MAX_PHOTOS }}.</p>
    <p v-if="error" class="mt-1 text-sm text-red-700">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { MAX_PHOTOS } from '~~/config/maintenance'

/** Selected photos, already resized to JPEG in the browser. */
const photos = defineModel<Blob[]>({ required: true })
const previews = computed(() => photos.value.map((p) => URL.createObjectURL(p)))
const error = ref('')
watch(previews, (_, old) => old?.forEach((url) => URL.revokeObjectURL(url)))

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  error.value = ''
  for (const file of Array.from(input.files ?? [])) {
    if (photos.value.length >= MAX_PHOTOS) {
      error.value = `You can add up to ${MAX_PHOTOS} photos.`
      break
    }
    if (!file.type.startsWith('image/')) {
      error.value = 'Only images can be added.'
      continue
    }
    try {
      photos.value = [...photos.value, await resizeImage(file)]
    } catch {
      error.value = `Couldn't read "${file.name}". Try a JPEG or PNG.`
    }
  }
  input.value = ''
}

const remove = (i: number) => (photos.value = photos.value.filter((_, j) => j !== i))
</script>

<template>
  <div>
    <div v-if="previews.length" class="mb-3 grid grid-cols-3 gap-3">
      <div v-for="(src, i) in previews" :key="src" class="relative">
        <img :src="src" alt="" class="aspect-square w-full rounded-lg object-cover" />
        <button type="button" class="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-800 text-white" :aria-label="`Remove photo ${i + 1}`" @click="remove(i)"><Icon name="x" :size="16" /></button>
      </div>
    </div>
    <label v-if="photos.length < MAX_PHOTOS || adding" class="btn-secondary w-full cursor-pointer focus-within:ring-2 focus-within:ring-blue-600" :class="{ 'opacity-50': adding }">
      <Icon name="camera" /> {{ adding ? 'Adding photo…' : 'Add a photo' }}
      <input type="file" accept="image/*" multiple class="sr-only" :disabled="adding" @change="onPick" />
    </label>
    <p class="mt-1.5 text-sm text-gray-600">You can add up to {{ MAX_PHOTOS }} photos.</p>
    <p v-if="error" role="alert" class="mt-1 text-red-700">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { MAX_PHOTOS } from '~~/config/maintenance'

/** Selected photos, already resized to JPEG in the browser. */
const photos = defineModel<Blob[]>({ required: true })
/** True while photos are being resized, so the form can wait before submitting. */
const adding = defineModel<boolean>('adding', { default: false })
const previews = computed(() => photos.value.map((p) => URL.createObjectURL(p)))
const error = ref('')
watch(previews, (_, old) => old?.forEach((url) => URL.revokeObjectURL(url)))

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  error.value = ''
  const files = Array.from(input.files ?? [])
  adding.value = true
  for (const file of files) {
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
  adding.value = false
  input.value = ''
}

const remove = (i: number) => (photos.value = photos.value.filter((_, j) => j !== i))
</script>

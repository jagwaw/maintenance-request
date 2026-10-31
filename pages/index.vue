<script setup lang="ts">
import type { RequestPayload } from '~/components/RequestForm.vue'

const refCode = ref('')

async function submit(data: RequestPayload, photos: Blob[]) {
  const body = new FormData()
  body.append('data', JSON.stringify(data))
  photos.forEach((p, i) => body.append('photos', p, `photo-${i + 1}.jpg`))
  const res = await $fetch('/api/requests', { method: 'POST', body })
  refCode.value = res.refCode
  window.scrollTo(0, 0)
}
</script>

<template>
  <main class="mx-auto max-w-xl space-y-6 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance request</h1>
    <EmergencyNotice />

    <div v-if="refCode" class="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
      <p class="text-lg font-medium">Thanks — we've got your request.</p>
      <p class="mt-4 text-sm text-gray-600">Your reference code</p>
      <p class="font-mono text-3xl font-bold tracking-wider">{{ refCode }}</p>
      <p class="mt-4 text-sm text-gray-600">Keep this code if you need to contact us about this request.</p>
    </div>

    <RequestForm v-else :submit="submit" />
  </main>
</template>

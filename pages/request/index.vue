<script setup lang="ts">
import type { RequestPayload } from '~/components/RequestForm.vue'

async function submit(data: RequestPayload, photos: Blob[]) {
  const body = new FormData()
  body.append('data', JSON.stringify(data))
  photos.forEach((p, i) => body.append('photos', p, `photo-${i + 1}.jpg`))
  const res = await $fetch('/api/requests', { method: 'POST', body })
  await navigateTo(`/request/submitted/${res.refCode}`)
}
</script>

<template>
  <main class="mx-auto max-w-xl space-y-6 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance request</h1>
    <EmergencyNotice />
    <RequestForm :submit="submit" />
  </main>
</template>

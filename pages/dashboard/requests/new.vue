<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-xl space-y-6 p-4 pb-16">
      <NuxtLink to="/dashboard" class="tap-link"><Icon name="arrow-left" :size="18" /> All requests</NuxtLink>
      <div>
        <h1 class="text-2xl font-semibold">New request</h1>
        <p class="mt-1 text-gray-600">For requests that came in by phone, text or in person.</p>
      </div>
      <RequestForm :submit="submit" staff />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { RequestPayload } from '~/components/RequestForm.vue'

useHead({ title: 'New request' })

async function submit(data: RequestPayload, photos: Blob[]) {
  const body = new FormData()
  body.append('data', JSON.stringify(data))
  photos.forEach((p, i) => body.append('photos', p, `photo-${i + 1}.jpg`))
  const res = await $fetch('/api/staff/requests', { method: 'POST', body })
  await navigateTo(`/dashboard/requests/${res.id}`)
}
</script>

<template>
  <main class="mx-auto max-w-xl space-y-6 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance request</h1>
    <EmergencyNotice />

    <div v-if="valid" class="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
      <p class="text-lg font-medium">Thanks — we've got your request.</p>
      <p class="mt-4 text-sm text-gray-600">Your reference code</p>
      <p class="font-mono text-3xl font-bold tracking-wider">{{ refCode }}</p>
      <p class="mt-4 text-sm text-gray-600">Keep this code if you need to contact us about this request.</p>
    </div>
    <p v-else class="text-gray-700">That doesn't look like a valid reference code.</p>

    <NuxtLink to="/request" class="btn-primary block w-full text-center">Submit another request</NuxtLink>
  </main>
</template>

<script setup lang="ts">
// Shows only the code from the URL — no request data is fetched, so this page reveals nothing.
const route = useRoute()
const refCode = String(route.params.ref).toUpperCase()
const valid = /^MR-[A-Z2-9]{6}$/.test(refCode)

useHead({ title: 'Request received' })
</script>

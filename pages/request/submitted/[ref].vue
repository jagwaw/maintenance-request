<template>
  <main class="mx-auto max-w-xl space-y-4 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance request</h1>
    <EmergencyNotice />

    <div v-if="valid" class="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
      <Icon name="circle-check" :size="40" class="mx-auto mb-2 text-green-700" />
      <p class="text-xl font-semibold">Thanks — we've got your request.</p>
      <p class="mt-4 text-gray-700">Your reference code</p>
      <p class="font-mono text-3xl font-bold tracking-wider">{{ refCode }}</p>
      <button type="button" class="btn-secondary mt-3 w-full" @click="copyCode">
        <Icon :name="copied ? 'check' : 'copy'" /> {{ copied ? 'Copied' : 'Copy code' }}
      </button>
      <p v-if="copyFailed" role="alert" class="mt-2 text-sm text-red-700">Couldn't copy it. Please write the code down.</p>
      <p class="mt-4 text-gray-700">The office will review your request and contact you. Keep this code in case you need to ask about it.</p>
    </div>
    <p v-else class="text-gray-700">That doesn't look like a valid reference code.</p>

    <NuxtLink to="/request" class="btn-secondary flex w-full">Submit another request</NuxtLink>
  </main>
</template>

<script setup lang="ts">
// Shows only the code from the URL — no request data is fetched, so this page reveals nothing.
const route = useRoute()
const refCode = String(route.params.ref).toUpperCase()
const valid = /^MR-[A-Z2-9]{6}$/.test(refCode)

useHead({ title: 'Request received' })

const copied = ref(false)
const copyFailed = ref(false)
async function copyCode() {
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(refCode)
    copied.value = true
  } catch {
    copyFailed.value = true
  }
}
</script>

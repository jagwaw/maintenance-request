<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
      <span class="font-semibold">Maintenance</span>
      <nav class="flex gap-4 text-sm">
        <NuxtLink to="/staff" class="hover:underline" exact-active-class="font-semibold">Requests</NuxtLink>
        <NuxtLink to="/staff/vendors" class="hover:underline" active-class="font-semibold">Vendors</NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-3 text-sm">
        <span class="text-gray-600">{{ staff?.name }}</span>
        <button type="button" class="text-blue-700 hover:underline" @click="signOut">Sign out</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { data: staff, error } = await useFetch('/api/staff/me')
if (error.value) await navigateTo('/staff/login')

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/staff/login')
}
</script>

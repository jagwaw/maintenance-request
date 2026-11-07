<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 py-1">
      <span class="text-lg font-semibold">Maintenance</span>
      <!-- On phones the nav drops to its own row, split evenly so both tabs are easy to tap. -->
      <nav class="order-last grid w-full grid-cols-2 gap-2 pb-2 sm:order-none sm:flex sm:w-auto sm:pb-0">
        <NuxtLink to="/dashboard" class="flex min-h-11 items-center justify-center rounded-lg px-3 font-medium text-gray-700 hover:bg-gray-100" exact-active-class="bg-blue-50 !text-blue-800">Requests</NuxtLink>
        <NuxtLink to="/dashboard/vendors" class="flex min-h-11 items-center justify-center rounded-lg px-3 font-medium text-gray-700 hover:bg-gray-100" active-class="bg-blue-50 !text-blue-800">Vendors</NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-3">
        <span class="hidden text-sm text-gray-600 sm:inline">{{ staff?.name }}</span>
        <button type="button" class="tap-link" @click="signOut">Sign out</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { data: staff, error } = await useFetch('/api/staff/me')
if (error.value) await navigateTo('/login')

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

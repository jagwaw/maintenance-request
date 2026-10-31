<template>
  <main class="mx-auto max-w-xl space-y-6 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance</h1>
    <EmergencyNotice />

    <div class="rounded-lg border border-gray-200 bg-white p-6 text-center">
      <p class="text-lg font-medium">Something broken at home?</p>
      <p class="mt-2 text-gray-600">Tell us what's wrong and we'll get it fixed. It takes about 2 minutes.</p>
      <NuxtLink to="/request" class="btn-primary mt-6 block w-full">Submit a maintenance request</NuxtLink>
    </div>

    <p class="text-center text-sm">
      <NuxtLink to="/staff/login" class="text-gray-500 hover:underline">Staff sign in</NuxtLink>
    </p>
  </main>
</template>

<template>
  <main class="mx-auto max-w-xl space-y-4 p-4 pb-16">
    <h1 class="text-2xl font-semibold">Maintenance</h1>
    <EmergencyNotice />

    <div class="card p-6 text-center">
      <p class="text-xl font-semibold">Something broken at home?</p>
      <p class="mt-2 text-gray-700">Tell us what's wrong and we'll get it fixed. It takes about 2 minutes.</p>
      <NuxtLink to="/request" class="btn-primary mt-6 flex w-full">Submit a maintenance request</NuxtLink>
    </div>

    <p class="text-center">
      <NuxtLink to="/login" class="inline-flex min-h-11 items-center text-sm text-gray-600 hover:underline">Staff sign in</NuxtLink>
    </p>
  </main>
</template>

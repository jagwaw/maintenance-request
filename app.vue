<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <!-- Thin bar at the top while a page is loading -->
    <NuxtLoadingIndicator color="#1d4ed8" :height="3" />
    <NuxtPage />
  </div>
</template>

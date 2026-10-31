<template>
  <span
    class="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
    :class="{
      'bg-gray-100 text-gray-700': !tone || tone === 'gray',
      'bg-amber-100 text-amber-800': tone === 'amber',
      'bg-red-100 text-red-800': tone === 'red',
      'bg-green-100 text-green-800': tone === 'green',
      'bg-blue-100 text-blue-800': tone === 'blue',
    }"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ tone?: 'gray' | 'amber' | 'red' | 'green' | 'blue' }>()
</script>

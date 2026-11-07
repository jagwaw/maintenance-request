<template>
  <span
    class="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium"
    :class="{
      'bg-gray-100 text-gray-700': !tone || tone === 'gray',
      'bg-amber-100 text-amber-800': tone === 'amber',
      'bg-red-100 text-red-800': tone === 'red',
      'bg-green-100 text-green-800': tone === 'green',
      'bg-blue-100 text-blue-800': tone === 'blue',
      'bg-violet-100 text-violet-800': tone === 'violet',
    }"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ tone?: 'gray' | 'amber' | 'red' | 'green' | 'blue' | 'violet' }>()
</script>

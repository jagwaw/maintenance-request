<template>
  <!-- Label above the value on phones, side by side on bigger screens. Use inside a <dl>. -->
  <div class="sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
    <dt class="text-sm text-gray-600">{{ label }}</dt>
    <dd class="break-words"><slot /></dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>

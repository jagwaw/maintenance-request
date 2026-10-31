<script setup lang="ts">
defineProps<{ steps: string[] }>()
defineEmits<{ continue: [] }>()
</script>

<template>
  <div class="rounded-lg border border-amber-300 bg-amber-50 p-4">
    <p class="font-medium">Before you submit, try these:</p>
    <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
      <li v-for="step in steps" :key="step">{{ step }}</li>
    </ul>
    <button type="button" class="btn-secondary mt-4" @click="$emit('continue')">Still not fixed — continue</button>
  </div>
</template>

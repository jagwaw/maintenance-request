<template>
  <div class="rounded-xl border border-amber-300 bg-amber-50 p-4">
    <p class="font-semibold">Before you continue, try these quick fixes:</p>
    <ul class="mt-2 list-disc space-y-2 pl-5">
      <li v-for="step in steps" :key="step">{{ step }}</li>
    </ul>
    <button type="button" class="btn-secondary mt-4 w-full" @click="$emit('continue')">Still not fixed — continue</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ steps: string[] }>()
defineEmits<{ continue: [] }>()
</script>

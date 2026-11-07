<template>
  <div role="alert" class="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
    <p class="font-medium">{{ EMERGENCY_TEXT }}</p>
    <a :href="`tel:${EMERGENCY_PHONE.replace(/\D/g, '')}`" class="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-center font-semibold text-white active:bg-red-800">
      <Icon name="phone" /> Call {{ EMERGENCY_PHONE }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { EMERGENCY_PHONE, EMERGENCY_TEXT } from '~~/config/maintenance'
</script>

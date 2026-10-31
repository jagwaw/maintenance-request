<template>
  <div role="alert" class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
    <p class="font-medium">{{ EMERGENCY_TEXT }}</p>
    <a :href="`tel:${EMERGENCY_PHONE.replace(/\D/g, '')}`" class="mt-2 inline-block font-semibold underline">
      Call {{ EMERGENCY_PHONE }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { EMERGENCY_PHONE, EMERGENCY_TEXT } from '~~/config/maintenance'
</script>

<script setup lang="ts">
import { STATUSES } from '~~/config/maintenance'

type HistoryEvent = { id: string; actor: string; type: string; from_value: string | null; to_value: string | null; note: string | null; created_at: string }
defineProps<{ events: HistoryEvent[] }>()

const statusLabel = (s: string | null) => (s ? STATUSES[s] ?? s : '—')

function describe(e: HistoryEvent) {
  switch (e.type) {
    case 'created':
      return 'Request created'
    case 'status_changed':
      return `Status: ${statusLabel(e.from_value)} → ${statusLabel(e.to_value)}`
    case 'assigned':
      return e.to_value ? `Assigned to ${e.to_value}` + (e.from_value ? ` (was ${e.from_value})` : '') : `Unassigned ${e.from_value ?? ''}`
    case 'note_added':
      return 'Note'
    default:
      return e.type
  }
}

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <ol class="space-y-4 border-l border-gray-200 pl-4">
    <li v-for="e in events" :key="e.id" class="relative">
      <span class="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-400" />
      <p class="text-sm font-medium">{{ describe(e) }}</p>
      <p v-if="e.note" class="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-sm">{{ e.note }}</p>
      <p class="mt-0.5 text-xs text-gray-500">{{ e.actor === 'tenant' ? 'Tenant' : e.actor }} · {{ formatDate(e.created_at) }}</p>
    </li>
  </ol>
</template>

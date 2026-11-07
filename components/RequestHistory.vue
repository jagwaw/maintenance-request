<template>
  <ol class="space-y-4 border-l border-gray-200 pl-4">
    <li v-for="e in shownEvents" :key="e.id" class="relative">
      <span class="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-400" />
      <p class="break-words font-medium">{{ describe(e) }}</p>
      <p v-if="e.note" class="mt-1 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2">{{ e.note }}</p>
      <p class="mt-0.5 break-words text-sm text-gray-600">{{ e.actor === 'tenant' ? 'Tenant' : e.actor }} · {{ formatDate(e.created_at) }}</p>
    </li>
  </ol>
  <button v-if="events.length > PREVIEW_COUNT" type="button" class="btn-secondary mt-4 w-full" @click="showAll = !showAll">
    {{ showAll ? 'Show less' : `Show all history (${events.length})` }}
  </button>
</template>

<script setup lang="ts">
import { STATUSES } from '~~/config/maintenance'

type HistoryEvent = { id: string; actor: string; type: string; from_value: string | null; to_value: string | null; note: string | null; created_at: string }
const props = defineProps<{ events: HistoryEvent[] }>()

// Newest first, so a note that was just added is always visible.
const PREVIEW_COUNT = 5
const showAll = ref(false)
const shownEvents = computed(() => {
  const newestFirst = [...props.events].reverse()
  return showAll.value ? newestFirst : newestFirst.slice(0, PREVIEW_COUNT)
})

const statusLabel = (s: string | null) => (s ? STATUSES[s] ?? s : '—')

function describe(e: HistoryEvent) {
  switch (e.type) {
    case 'created':
      return 'Request created'
    case 'status_changed':
      return `Status changed from ${statusLabel(e.from_value)} to ${statusLabel(e.to_value)}`
    case 'assigned':
      return e.to_value ? `Assigned to ${e.to_value}` + (e.from_value ? ` (was ${e.from_value})` : '') : `Removed ${e.from_value ?? 'vendor'} from this request`
    case 'note_added':
      return 'Note added'
    default:
      return e.type
  }
}
</script>

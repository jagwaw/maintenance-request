<script setup lang="ts">
import { CATEGORIES, SOURCES, STATUSES } from '~~/config/maintenance'

useHead({ title: 'Requests' })

// Filters live in the URL so a filtered view can be refreshed or shared.
const route = useRoute()
const router = useRouter()
const filter = (key: string) =>
  computed({
    get: () => (route.query[key] as string) || '',
    set: (value: string) => router.replace({ query: { ...route.query, [key]: value || undefined } }),
  })
const propertyId = filter('propertyId')
const status = filter('status')
const category = filter('category')

const { data: properties } = await useFetch('/api/properties')
const { data: requests, pending, error } = await useFetch('/api/staff/requests', {
  query: computed(() => ({ propertyId: propertyId.value || undefined, status: status.value || undefined, category: category.value || undefined })),
})

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-6xl space-y-4 p-4">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold">Requests</h1>
        <NuxtLink to="/staff/requests/new" class="btn-primary">New request</NuxtLink>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <select v-model="propertyId" class="input" aria-label="Filter by property">
          <option value="">All properties</option>
          <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-model="status" class="input" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option v-for="(label, key) in STATUSES" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="category" class="input" aria-label="Filter by category">
          <option value="">All categories</option>
          <option v-for="(c, key) in CATEGORIES" :key="key" :value="key">{{ c.label }}</option>
        </select>
      </div>

      <p v-if="error" class="text-red-700">Couldn't load requests.</p>
      <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white transition-opacity" :class="{ 'opacity-50': pending }" :aria-busy="pending">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th class="px-3 py-2 font-medium">Ref</th>
              <th class="px-3 py-2 font-medium">Created</th>
              <th class="px-3 py-2 font-medium">Property / unit</th>
              <th class="px-3 py-2 font-medium">Contact</th>
              <th class="px-3 py-2 font-medium">Category</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium">Vendor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r.id" class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td class="px-3 py-2 font-mono">
                <NuxtLink :to="`/staff/requests/${r.id}`" class="text-blue-700 hover:underline">{{ r.refCode }}</NuxtLink>
              </td>
              <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ formatDate(r.createdAt) }}</td>
              <td class="px-3 py-2">
                {{ r.property }} · {{ r.unit }}
                <Badge v-if="r.unitVacant" tone="red" class="ml-1">Vacant unit</Badge>
              </td>
              <td class="px-3 py-2">
                {{ r.contactName }}
                <Badge v-if="!r.contactVerified" tone="amber" class="ml-1">Unverified contact</Badge>
                <Badge v-if="r.source !== 'form'" class="ml-1">{{ SOURCES[r.source] ?? r.source }}</Badge>
              </td>
              <td class="px-3 py-2">{{ CATEGORIES[r.category]?.label ?? r.category }}</td>
              <td class="px-3 py-2"><Badge tone="blue">{{ STATUSES[r.status] ?? r.status }}</Badge></td>
              <td class="px-3 py-2 text-gray-600">{{ r.vendor ?? '—' }}</td>
            </tr>
            <tr v-if="!pending && !requests?.length">
              <td colspan="7" class="px-3 py-8 text-center text-gray-500">No requests match these filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

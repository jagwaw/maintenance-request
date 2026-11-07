<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-6xl space-y-4 p-4 pb-16">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-semibold">Requests</h1>
        <NuxtLink to="/dashboard/requests/new" class="btn-primary whitespace-nowrap">New request</NuxtLink>
      </div>

      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
        <select v-model="contact" class="input" aria-label="Filter by contact">
          <option value="">All contacts</option>
          <option value="unverified">Unverified contacts</option>
          <option value="verified">Verified contacts</option>
        </select>
      </div>

      <p v-if="error" role="alert" class="text-red-700">We couldn't load the requests. Please refresh the page.</p>
      <div v-else class="transition-opacity" :class="{ 'opacity-50': pending }" :aria-busy="pending">
        <ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <li v-for="r in requests" :key="r.id">
            <NuxtLink
              :to="{ path: `/dashboard/requests/${r.id}`, query: route.query }"
              class="card flex h-full flex-col gap-3 hover:border-blue-400 active:bg-gray-50"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="break-words text-lg font-semibold leading-snug">{{ CATEGORIES[r.category]?.label ?? r.category }}</p>
                  <p class="break-words text-gray-700">{{ r.property }} · {{ r.unit }}</p>
                </div>
                <Badge :tone="STATUS_TONES[r.status]">{{ STATUSES[r.status] ?? r.status }}</Badge>
              </div>

              <p v-if="r.description" class="line-clamp-3 break-words text-gray-800">{{ r.description }}</p>

              <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                <dt class="text-gray-600">Contact</dt>
                <dd class="break-words">{{ r.contactName }}</dd>
                <dt class="text-gray-600">Vendor</dt>
                <dd class="break-words">{{ r.vendor ?? 'Not assigned' }}</dd>
                <dt class="text-gray-600">Created</dt>
                <dd>{{ formatDate(r.createdAt) }}</dd>
              </dl>

              <div v-if="r.unitVacant || !r.contactVerified || r.source !== 'form'" class="flex flex-wrap gap-1">
                <Badge v-if="r.unitVacant" tone="red">Vacant unit</Badge>
                <Badge v-if="!r.contactVerified" tone="amber">Unverified contact</Badge>
                <Badge v-if="r.source !== 'form'">{{ SOURCES[r.source] ?? r.source }}</Badge>
              </div>

              <!-- Phones have no hover, so the card says outright that it can be tapped. -->
              <div class="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                <span class="font-mono text-gray-600">{{ r.refCode }}</span>
                <span class="inline-flex items-center font-semibold text-blue-700">View details <Icon name="chevron-right" :size="16" /></span>
              </div>
            </NuxtLink>
          </li>
        </ul>
        <p v-if="!pending && !requests.length" class="card py-8 text-center text-gray-600">
          No requests match these filters.
        </p>

        <nav v-if="requests.length" aria-label="Pages" class="mt-4 space-y-2">
          <p class="text-center text-sm text-gray-600">Showing {{ firstShown }}–{{ firstShown + requests.length - 1 }} of {{ result?.total }}</p>
          <div v-if="lastPage > 1" class="mx-auto grid max-w-sm grid-cols-2 gap-2">
            <NuxtLink v-if="currentPage > 1" :to="pageLink(currentPage - 1)" class="btn-secondary"><Icon name="chevron-left" /> Previous</NuxtLink>
            <span v-else class="btn-secondary opacity-50" aria-disabled="true"><Icon name="chevron-left" /> Previous</span>
            <NuxtLink v-if="currentPage < lastPage" :to="pageLink(currentPage + 1)" class="btn-secondary">Next <Icon name="chevron-right" /></NuxtLink>
            <span v-else class="btn-secondary opacity-50" aria-disabled="true">Next <Icon name="chevron-right" /></span>
          </div>
        </nav>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, PAGE_SIZE, SOURCES, STATUSES, STATUS_TONES } from '~~/config/maintenance'

useHead({ title: 'Requests' })

// Filters live in the URL so a filtered view can be refreshed or shared.
const route = useRoute()
const router = useRouter()
const filter = (key: string) =>
  computed({
    get: () => (route.query[key] as string) || '',
    // A new filter means a new list, so go back to its first page.
    set: (value: string) => router.replace({ query: { ...route.query, page: undefined, [key]: value || undefined } }),
  })
const propertyId = filter('propertyId')
const status = filter('status')
const category = filter('category')
const contact = filter('contact')

const { data: properties } = await useFetch('/api/properties')
const requestedPage = computed(() => Math.max(1, Math.floor(Number(route.query.page)) || 1))
const { data: result, pending, error } = await useFetch('/api/staff/requests', {
  query: computed(() => ({ propertyId: propertyId.value || undefined, status: status.value || undefined, category: category.value || undefined, contact: contact.value || undefined, page: requestedPage.value })),
})
const requests = computed(() => result.value?.requests ?? [])

// Pagination: the server says which page this really is (a page past the end becomes the last one).
const currentPage = computed(() => result.value?.page ?? 1)
const lastPage = computed(() => result.value?.lastPage ?? 1)
const firstShown = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1)
const pageLink = (page: number) => ({ query: { ...route.query, page: page > 1 ? page : undefined } })
watch(requestedPage, () => window.scrollTo({ top: 0 }))
</script>

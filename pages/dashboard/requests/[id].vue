<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-6xl space-y-4 p-4 pb-16">
      <NuxtLink to="/dashboard" class="text-sm text-blue-700 hover:underline">← All requests</NuxtLink>

      <p v-if="error" class="text-red-700">{{ error.statusCode === 404 ? 'Request not found.' : "Couldn't load this request." }}</p>

      <template v-else-if="request">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="font-mono text-xl font-semibold">{{ request.refCode }}</h1>
          <Badge tone="blue">{{ STATUSES[request.status] ?? request.status }}</Badge>
          <Badge v-if="!request.contactVerified" tone="amber">Unverified contact</Badge>
          <Badge v-if="request.unitVacant" tone="red">Vacant unit</Badge>
          <Badge v-if="request.source !== 'form'">{{ SOURCES[request.source] ?? request.source }}</Badge>
        </div>
        <p class="text-sm text-gray-600">{{ formatDate(request.createdAt) }} · via {{ SOURCES[request.source] ?? request.source }}</p>

        <div class="grid gap-4 lg:grid-cols-3">
          <!-- Details -->
          <div class="space-y-4 lg:col-span-2">
            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Where & who</h2>
              <dl class="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                <dt class="text-gray-500">Property / unit</dt><dd>{{ request.property }} · {{ request.unit }}</dd>
                <dt class="text-gray-500">Contact</dt><dd>{{ request.contactName }}</dd>
                <dt class="text-gray-500">Email</dt><dd>{{ request.contactEmail ?? '—' }}</dd>
                <dt class="text-gray-500">Phone</dt><dd>{{ request.contactPhone ?? '—' }}</dd>
                <dt class="text-gray-500">Matched tenant</dt><dd>{{ request.tenantName ?? 'No match' }}</dd>
              </dl>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Problem — {{ category?.label ?? request.category }}</h2>
              <dl v-if="answers.length" class="mt-2 space-y-2 text-sm">
                <div v-for="a in answers" :key="a.question">
                  <dt class="text-gray-500">{{ a.question }}</dt>
                  <dd>{{ a.answer }}</dd>
                </div>
              </dl>
              <p class="mt-3 whitespace-pre-wrap">{{ request.description }}</p>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Access</h2>
              <dl class="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                <dt class="text-gray-500">Permission to enter</dt><dd>{{ request.permissionToEnter ? 'Yes' : 'No' }}</dd>
                <dt class="text-gray-500">Pets</dt><dd>{{ request.pets ?? '—' }}</dd>
                <dt class="text-gray-500">Best times</dt><dd>{{ request.bestTimes ?? '—' }}</dd>
              </dl>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Photos</h2>
              <div v-if="request.photoUrls.length" class="mt-2 flex flex-wrap gap-2">
                <a v-for="(url, i) in request.photoUrls" :key="url" :href="url" target="_blank" rel="noopener">
                  <img :src="url" :alt="`Photo ${i + 1}`" class="h-32 w-32 rounded object-cover" />
                </a>
              </div>
              <p v-if="request.photosError" role="alert" class="mt-2 text-sm text-red-700">Photos couldn't load. Refresh to try again.</p>
              <p v-else-if="!request.photoUrls.length" class="mt-2 text-sm text-gray-500">No photos.</p>
              <p v-if="request.photoUrls.length" class="mt-2 text-xs text-gray-500">Photo links expire after 10 minutes — refresh the page for new ones.</p>
            </section>
          </div>

          <!-- Actions + history -->
          <div class="space-y-4">
            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Update</h2>
              <form class="mt-2 space-y-3" @submit.prevent="save">
                <div>
                  <label class="label" for="status">Status</label>
                  <select id="status" v-model="status" class="input">
                    <option v-for="(label, key) in STATUSES" :key="key" :value="key">{{ label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label" for="vendor">Vendor</label>
                  <select id="vendor" v-model="vendorId" class="input">
                    <option value="">Not assigned</option>
                    <option v-for="v in vendorOptions" :key="v.id" :value="v.id">{{ v.name }}{{ v.active ? '' : ' (inactive)' }}</option>
                  </select>
                </div>
                <p v-if="saveError" class="text-sm text-red-700">{{ saveError }}</p>
                <button type="submit" class="btn-primary w-full" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
              </form>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="font-semibold">Add note</h2>
              <form class="mt-2 space-y-3" @submit.prevent="addNote">
                <textarea v-model="note" class="input" rows="3" maxlength="2000" required placeholder="e.g. Called tenant, plumber coming Tuesday 10am" aria-label="Note" />
                <p v-if="noteError" class="text-sm text-red-700">{{ noteError }}</p>
                <button type="submit" class="btn-secondary w-full" :disabled="addingNote">{{ addingNote ? 'Adding…' : 'Add note' }}</button>
              </form>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="mb-3 font-semibold">History</h2>
              <RequestHistory :events="request.events" />
            </section>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, SOURCES, STATUSES } from '~~/config/maintenance'

const route = useRoute()
const id = String(route.params.id)
const { data: request, error, refresh } = await useFetch(`/api/staff/requests/${id}`)
const { data: vendors } = await useFetch('/api/staff/vendors')

useHead({ title: () => request.value?.refCode ?? 'Request' })

const category = computed(() => (request.value ? CATEGORIES[request.value.category] : undefined))
// Answers in the same order as the questions in config (the database doesn't keep key order).
const answers = computed(() => {
  const details = request.value?.details ?? {}
  const order = category.value?.followUps.map((q) => q.id) ?? []
  return Object.keys(details)
    .sort((a, b) => (order.indexOf(a) + 1 || Infinity) - (order.indexOf(b) + 1 || Infinity))
    .map((qid) => ({ question: category.value?.followUps.find((q) => q.id === qid)?.question ?? qid, answer: details[qid] }))
})
// Show inactive vendors only if one is already assigned to this request.
const vendorOptions = computed(() => vendors.value?.filter((v) => v.active || v.id === request.value?.vendorId) ?? [])

// Status + vendor form
const status = ref('')
const vendorId = ref('')
watchEffect(() => {
  status.value = request.value?.status ?? ''
  vendorId.value = request.value?.vendorId ?? ''
})
const saving = ref(false)
const saveError = ref('')
async function save() {
  saving.value = true
  saveError.value = ''
  try {
    await $fetch(`/api/staff/requests/${id}`, { method: 'PATCH', body: { status: status.value, vendorId: vendorId.value || null } })
    await refresh()
  } catch (e: any) {
    saveError.value = e?.data?.statusMessage || 'Could not save.'
  } finally {
    saving.value = false
  }
}

// Notes
const note = ref('')
const addingNote = ref(false)
const noteError = ref('')
async function addNote() {
  addingNote.value = true
  noteError.value = ''
  try {
    await $fetch(`/api/staff/requests/${id}/notes`, { method: 'POST', body: { note: note.value } })
    note.value = ''
    await refresh()
  } catch (e: any) {
    noteError.value = e?.data?.statusMessage || 'Could not add note.'
  } finally {
    addingNote.value = false
  }
}

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

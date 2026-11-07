<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-6xl space-y-4 p-4 pb-16">
      <!-- The list's page and filters travel in the link, so this returns to the same place. -->
      <NuxtLink :to="{ path: '/dashboard', query: route.query }" class="tap-link"><Icon name="arrow-left" :size="18" /> All requests</NuxtLink>

      <p v-if="error" role="alert" class="text-red-700">{{ error.statusCode === 404 ? "We couldn't find this request." : "We couldn't load this request. Please refresh the page." }}</p>

      <template v-else-if="request">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h1 class="min-w-0 break-words text-2xl font-semibold leading-tight">{{ category?.label ?? request.category }}</h1>
            <Badge :tone="STATUS_TONES[request.status]">{{ STATUSES[request.status] ?? request.status }}</Badge>
          </div>
          <p class="break-words text-lg text-gray-700">{{ request.property }} · {{ request.unit }}</p>
          <div v-if="!request.contactVerified" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <Badge tone="amber">Unverified contact</Badge>
            <p class="mt-1">This email or phone doesn't match anyone on file for this unit. Check before sending someone.</p>
          </div>
          <div v-if="request.unitVacant" class="rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <Badge tone="red">Vacant unit</Badge>
            <p class="mt-1">This unit is listed as empty. Check who reported this before sending someone.</p>
          </div>
          <p class="text-sm text-gray-600"><span class="font-mono">{{ request.refCode }}</span> · {{ formatDate(request.createdAt) }} · via {{ SOURCES[request.source] ?? request.source }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!--
            Phones: one column, "The problem" then "Update" first and "History" last (the order-* classes).
            "contents" lets the sections inside these two wrappers be ordered together.
            Large screens: the wrappers become two columns. Long content goes on the left, and
            the short actions on the right stay in view while scrolling.
          -->
          <div class="contents lg:col-span-2 lg:block lg:min-w-0 lg:space-y-4">
            <section class="card order-first">
              <h2 class="text-lg font-semibold">The problem</h2>
              <p class="mt-2 whitespace-pre-wrap break-words">{{ request.description }}</p>
              <dl v-if="answers.length" class="mt-3 space-y-3">
                <div v-for="a in answers" :key="a.question">
                  <dt class="text-sm text-gray-600">{{ a.question }}</dt>
                  <dd class="break-words">{{ a.answer }}</dd>
                </div>
              </dl>
            </section>

            <section class="card">
              <h2 class="text-lg font-semibold">Contact</h2>
              <dl class="mt-3 space-y-3">
                <DetailRow label="Name">{{ request.contactName }}</DetailRow>
                <DetailRow label="Phone">
                  <a v-if="request.contactPhone" :href="`tel:${request.contactPhone.replace(/[^\d+]/g, '')}`" class="tap-link underline">{{ request.contactPhone }}</a>
                  <template v-else>Not given</template>
                </DetailRow>
                <DetailRow label="Email">
                  <a v-if="request.contactEmail" :href="`mailto:${request.contactEmail}`" class="tap-link break-all underline">{{ request.contactEmail }}</a>
                  <template v-else>Not given</template>
                </DetailRow>
                <DetailRow label="Tenant on file">{{ request.tenantName ?? 'No match found' }}</DetailRow>
              </dl>
            </section>

            <section class="card">
              <h2 class="text-lg font-semibold">Getting in</h2>
              <dl class="mt-3 space-y-3">
                <DetailRow label="Can enter if no one's home">{{ request.permissionToEnter ? 'Yes' : 'No' }}</DetailRow>
                <DetailRow label="Pets">{{ request.pets ?? 'None mentioned' }}</DetailRow>
                <DetailRow label="Best times">{{ request.bestTimes ?? 'None mentioned' }}</DetailRow>
              </dl>
            </section>

            <section class="card">
              <h2 class="text-lg font-semibold">Photos</h2>
              <div v-if="request.photoUrls.length" class="mt-3 grid grid-cols-3 gap-2">
                <a v-for="(url, i) in request.photoUrls" :key="url" :href="url" target="_blank" rel="noopener">
                  <img :src="url" :alt="`Photo ${i + 1}`" class="aspect-square w-full rounded-lg object-cover" />
                </a>
              </div>
              <p v-if="request.photosError" role="alert" class="mt-2 text-red-700">Photos couldn't load. Refresh the page to try again.</p>
              <p v-else-if="!request.photoUrls.length" class="mt-2 text-gray-600">No photos.</p>
              <p v-if="request.photoUrls.length" class="mt-2 text-sm text-gray-600">Tap a photo to make it bigger. If one stops opening, refresh the page.</p>
            </section>

            <section class="card order-last">
              <h2 class="mb-3 text-lg font-semibold">History</h2>
              <RequestHistory :events="request.events" />
            </section>
          </div>

          <!-- Actions + history -->
          <div class="contents lg:sticky lg:top-4 lg:block lg:min-w-0 lg:space-y-4 lg:self-start">
            <section class="card -order-1">
              <h2 class="text-lg font-semibold">Update this request</h2>
              <form class="mt-3 space-y-3" @submit.prevent="save">
                <fieldset>
                  <legend class="label">Status</legend>
                  <div class="grid grid-cols-2 gap-2">
                    <label v-for="(label, key) in STATUSES" :key="key" class="choice">
                      <input v-model="status" class="sr-only" type="radio" name="status" :value="key" /> {{ label }}
                    </label>
                  </div>
                </fieldset>
                <div>
                  <label class="label" for="vendor">Vendor</label>
                  <select id="vendor" v-model="vendorId" class="input">
                    <option value="">Not assigned</option>
                    <option v-for="v in vendorOptions" :key="v.id" :value="v.id">{{ v.name }}{{ v.active ? '' : ' (inactive)' }}</option>
                  </select>
                </div>
                <p v-if="saveError" role="alert" class="text-red-700">{{ saveError }}</p>
                <p v-if="saved" role="status" class="flex items-center gap-1 font-medium text-green-800"><Icon name="check" :size="18" /> Saved</p>
                <button type="submit" class="btn-primary w-full" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
              </form>
            </section>

            <section class="card">
              <h2 class="text-lg font-semibold">Add a note</h2>
              <form class="mt-3 space-y-3" @submit.prevent="addNote">
                <textarea v-model="note" class="input" rows="3" maxlength="2000" required placeholder="e.g. Called tenant, plumber coming Tuesday 10am" aria-label="Note" />
                <p v-if="noteError" role="alert" class="text-red-700">{{ noteError }}</p>
                <button type="submit" class="btn-secondary w-full" :disabled="addingNote">{{ addingNote ? 'Adding…' : 'Add note' }}</button>
              </form>
            </section>

          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, SOURCES, STATUSES, STATUS_TONES } from '~~/config/maintenance'

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
const saved = ref(false)
watch([status, vendorId], () => (saved.value = false)) // "Saved" disappears once something changes again
async function save() {
  saving.value = true
  saveError.value = ''
  saved.value = false
  try {
    await $fetch(`/api/staff/requests/${id}`, { method: 'PATCH', body: { status: status.value, vendorId: vendorId.value || null } })
    await refresh()
    saved.value = true
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
  noteError.value = textError(note.value)
  if (noteError.value) return
  addingNote.value = true
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
</script>

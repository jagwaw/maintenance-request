<script setup lang="ts">
import { CATEGORIES } from '~~/config/maintenance'

export type RequestPayload = Record<string, unknown>

const props = defineProps<{
  /** Posts the request; throw to show an error. */
  submit: (data: RequestPayload, photos: Blob[]) => Promise<void>
}>()

const { data: properties } = await useFetch('/api/properties')

const form = reactive({
  propertyId: '',
  unitId: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  category: '',
  details: {} as Record<string, string>,
  description: '',
  permissionToEnter: null as boolean | null,
  pets: '',
  bestTimes: '',
  website: '', // honeypot — hidden from people, bots fill it in
})
const photos = ref<Blob[]>([])
const selfCheckDone = ref(false)
const submitting = ref(false)
const error = ref('')

// Contact errors show once the field has been left (or on submit).
const touched = reactive({ email: false, phone: false })
const emailMsg = computed(() => (touched.email ? emailError(form.contactEmail) : ''))
const phoneMsg = computed(() => (touched.phone ? phoneError(form.contactPhone) : ''))

const units = computed(() => properties.value?.find((p) => p.id === form.propertyId)?.units ?? [])
const category = computed(() => CATEGORIES[form.category])
const showRest = computed(() => category.value && (!category.value.selfCheck || selfCheckDone.value))

watch(() => form.propertyId, () => (form.unitId = ''))
watch(() => form.category, () => {
  form.details = {}
  selfCheckDone.value = false
})

async function onSubmit() {
  error.value = ''
  touched.email = touched.phone = true
  if (emailMsg.value || phoneMsg.value) {
    error.value = 'Please fix the email or phone number above.'
    return
  }
  if (!form.contactEmail.trim() && !form.contactPhone.trim()) {
    error.value = 'Please give an email or phone number so we can reach you.'
    return
  }
  // Send only filled-in fields; the server validates everything again.
  const { propertyId, ...rest } = form
  const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== ''))
  submitting.value = true
  try {
    await props.submit(data, photos.value)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div>
      <label class="label" for="property">Property</label>
      <select id="property" v-model="form.propertyId" class="input" required>
        <option value="" disabled>Choose your property</option>
        <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <div>
      <label class="label" for="unit">Unit</label>
      <select id="unit" v-model="form.unitId" class="input" required :disabled="!form.propertyId">
        <option value="" disabled>Choose your unit</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.label }}</option>
      </select>
    </div>

    <div>
      <label class="label" for="name">Your name</label>
      <input id="name" v-model="form.contactName" class="input" required maxlength="100" autocomplete="name" />
    </div>
    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="form.contactEmail"
          type="email"
          class="input"
          :class="{ 'border-red-500': emailMsg }"
          maxlength="254"
          autocomplete="email"
          :aria-invalid="Boolean(emailMsg)"
          aria-describedby="email-error"
          @blur="touched.email = true"
        />
        <p id="email-error" class="mt-1 text-sm text-red-700">{{ emailMsg }}</p>
      </div>
      <div>
        <label class="label" for="phone">Phone</label>
        <input
          id="phone"
          v-model="form.contactPhone"
          type="tel"
          class="input"
          :class="{ 'border-red-500': phoneMsg }"
          maxlength="30"
          autocomplete="tel"
          :aria-invalid="Boolean(phoneMsg)"
          aria-describedby="phone-error"
          @blur="touched.phone = true"
        />
        <p id="phone-error" class="mt-1 text-sm text-red-700">{{ phoneMsg }}</p>
      </div>
    </div>
    <p class="-mt-3 text-sm text-gray-500">Email or phone — at least one, so we can reach you.</p>

    <!-- Honeypot: invisible to people and screen readers -->
    <div class="hidden" aria-hidden="true">
      <label for="website">Website</label>
      <input id="website" v-model="form.website" tabindex="-1" autocomplete="off" />
    </div>

    <div>
      <label class="label" for="category">What's the problem?</label>
      <select id="category" v-model="form.category" class="input" required>
        <option value="" disabled>Choose a category</option>
        <option v-for="(c, key) in CATEGORIES" :key="key" :value="key">{{ c.label }}</option>
      </select>
    </div>

    <template v-if="category">
      <div v-for="q in category.followUps" :key="q.id">
        <label class="label" :for="q.id">{{ q.question }}</label>
        <select v-if="q.type === 'select'" :id="q.id" v-model="form.details[q.id]" class="input">
          <option :value="undefined" disabled>Choose one</option>
          <option v-for="o in q.options" :key="o" :value="o">{{ o }}</option>
        </select>
        <input v-else :id="q.id" v-model="form.details[q.id]" class="input" maxlength="500" />
        <EmergencyNotice v-if="q.emergencyIf && form.details[q.id] === q.emergencyIf" class="mt-3" />
      </div>

      <SelfCheck v-if="category.selfCheck && !selfCheckDone" :steps="category.selfCheck" @continue="selfCheckDone = true" />
    </template>

    <template v-if="showRest">
      <div>
        <label class="label" for="description">Describe the problem</label>
        <textarea id="description" v-model="form.description" class="input" rows="4" required maxlength="2000" />
      </div>

      <div>
        <span class="label">Photos</span>
        <PhotoPicker v-model="photos" />
      </div>

      <fieldset>
        <legend class="label">Can maintenance enter if you're not home?</legend>
        <div class="flex gap-6">
          <label class="flex items-center gap-2"><input v-model="form.permissionToEnter" type="radio" :value="true" required /> Yes</label>
          <label class="flex items-center gap-2"><input v-model="form.permissionToEnter" type="radio" :value="false" /> No</label>
        </div>
      </fieldset>

      <div>
        <label class="label" for="pets">Pets in the unit? (optional)</label>
        <input id="pets" v-model="form.pets" class="input" maxlength="200" placeholder="e.g. friendly dog in the bedroom" />
      </div>
      <div>
        <label class="label" for="best-times">Best times to come (optional)</label>
        <input id="best-times" v-model="form.bestTimes" class="input" maxlength="200" placeholder="e.g. weekdays after 3pm" />
      </div>

      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="submitting">
        {{ submitting ? 'Sending…' : 'Submit request' }}
      </button>
    </template>
  </form>
</template>

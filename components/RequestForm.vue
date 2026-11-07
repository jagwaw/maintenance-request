<template>
  <form ref="formEl" class="space-y-4" @submit.prevent="onSubmit">
    <section v-if="staff" class="card">
      <label class="label" for="source">How did this request come in?</label>
      <select id="source" v-model="form.source" class="input" required>
        <option value="" disabled>Choose one</option>
        <option v-for="(label, key) in staffSources" :key="key" :value="key">{{ label }}</option>
      </select>
    </section>

    <section class="card space-y-4">
      <h2 class="text-lg font-semibold">1. Where is the problem?</h2>
      <div>
        <label class="label" for="property">Property</label>
        <div v-if="propertiesError" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          We couldn't load the property list. Please refresh the page.
          <button type="button" class="tap-link ml-1 underline" @click="() => refreshProperties()">Try again</button>
        </div>
        <select v-else id="property" v-model="form.propertyId" class="input" required>
          <option value="" disabled>Choose your property</option>
          <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div>
        <label class="label" for="unit">Unit</label>
        <select id="unit" v-model="form.unitId" class="input" required :disabled="!form.propertyId">
          <option value="" disabled>{{ form.propertyId ? 'Choose your unit' : 'Choose a property first' }}</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.label }}</option>
        </select>
      </div>
    </section>

    <section class="card space-y-4">
      <div>
        <h2 class="text-lg font-semibold">2. {{ staff ? "Tenant's contact details" : 'How can we reach you?' }}</h2>
        <p class="mt-1 text-sm text-gray-600">Email or phone — we need at least one.</p>
      </div>
      <div>
        <label class="label" for="name">{{ staff ? 'Tenant name' : 'Your name' }}</label>
        <input id="name" v-model="form.contactName" class="input" :class="{ [INVALID]: nameMsg }" required maxlength="100" autocomplete="name" autocapitalize="words" :aria-invalid="Boolean(nameMsg)" aria-describedby="name-error" />
        <p id="name-error" class="mt-1 text-sm text-red-700 empty:hidden">{{ nameMsg }}</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="email">Email</label>
          <input
            id="email"
            v-model="form.contactEmail"
            type="email"
            class="input"
            :class="{ [INVALID]: emailMsg }"
            maxlength="254"
            autocomplete="email"
            autocapitalize="none"
            :aria-invalid="Boolean(emailMsg)"
            aria-describedby="email-error"
            @blur="touched.email = true"
          />
          <p id="email-error" class="mt-1 text-sm text-red-700 empty:hidden">{{ emailMsg }}</p>
        </div>
        <div>
          <label class="label" for="phone">Phone</label>
          <input
            id="phone"
            v-model="form.contactPhone"
            type="tel"
            class="input"
            :class="{ [INVALID]: phoneMsg }"
            maxlength="30"
            autocomplete="tel"
            :aria-invalid="Boolean(phoneMsg)"
            aria-describedby="phone-error"
            @blur="touched.phone = true"
          />
          <p id="phone-error" class="mt-1 text-sm text-red-700 empty:hidden">{{ phoneMsg }}</p>
        </div>
      </div>
    </section>

    <!-- Honeypot: invisible to people and screen readers -->
    <div v-if="!staff" class="hidden" aria-hidden="true">
      <label for="website">Website</label>
      <input id="website" v-model="form.website" tabindex="-1" autocomplete="off" />
    </div>

    <section class="card space-y-4">
      <fieldset>
        <legend class="mb-3 text-lg font-semibold">3. What's the problem?</legend>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="(c, key) in CATEGORIES" :key="key" class="choice">
            <input v-model="form.category" class="sr-only" type="radio" name="category" :value="key" required />
            <Icon v-if="c.icon" :name="c.icon" /> {{ c.label }}
          </label>
        </div>
      </fieldset>

      <template v-if="category">
        <div v-for="q in category.followUps" :key="q.id">
          <label class="label" :for="q.id">{{ q.question }}</label>
          <select v-if="q.type === 'select'" :id="q.id" v-model="form.details[q.id]" class="input">
            <option :value="undefined" disabled>Choose one</option>
            <option v-for="o in q.options" :key="o" :value="o">{{ o }}</option>
          </select>
          <template v-else>
            <input :id="q.id" v-model="form.details[q.id]" class="input" :class="{ [INVALID]: textError(form.details[q.id] ?? '') }" :aria-invalid="Boolean(textError(form.details[q.id] ?? ''))" maxlength="500" />
            <p class="mt-1 text-sm text-red-700 empty:hidden">{{ textError(form.details[q.id] ?? '') }}</p>
          </template>
          <EmergencyNotice v-if="q.emergencyIf && form.details[q.id] === q.emergencyIf" class="mt-3" />
        </div>

        <SelfCheck v-if="!staff && category.selfCheck && !selfCheckDone" :steps="category.selfCheck" @continue="selfCheckDone = true" />
      </template>
    </section>

    <template v-if="showRest">
      <section class="card space-y-4">
        <h2 class="text-lg font-semibold">4. Tell us more</h2>
        <div>
          <label class="label" for="description">Describe the problem</label>
          <textarea id="description" v-model="form.description" class="input" :class="{ [INVALID]: descriptionMsg }" :aria-invalid="Boolean(descriptionMsg)" rows="4" required maxlength="2000" placeholder="e.g. The kitchen tap has been dripping since Monday" />
          <p class="mt-1 text-sm text-red-700 empty:hidden">{{ descriptionMsg }}</p>
        </div>

        <div>
          <span class="label">Photos (optional)</span>
          <PhotoPicker v-model="photos" v-model:adding="addingPhotos" />
        </div>
      </section>

      <section class="card space-y-4">
        <h2 class="text-lg font-semibold">5. Getting into the unit</h2>
        <fieldset>
          <legend class="label">Can maintenance enter if you're not home?</legend>
          <div class="grid grid-cols-2 gap-2">
            <label class="choice"><input v-model="form.permissionToEnter" class="sr-only" type="radio" name="permission" :value="true" required /> Yes</label>
            <label class="choice"><input v-model="form.permissionToEnter" class="sr-only" type="radio" name="permission" :value="false" /> No</label>
          </div>
        </fieldset>

        <div>
          <label class="label" for="pets">Pets in the unit? (optional)</label>
          <input id="pets" v-model="form.pets" class="input" :class="{ [INVALID]: petsMsg }" :aria-invalid="Boolean(petsMsg)" maxlength="200" placeholder="e.g. friendly dog in the bedroom" />
          <p class="mt-1 text-sm text-red-700 empty:hidden">{{ petsMsg }}</p>
        </div>
        <div>
          <label class="label" for="best-times">Best times to come (optional)</label>
          <input id="best-times" v-model="form.bestTimes" class="input" :class="{ [INVALID]: bestTimesMsg }" :aria-invalid="Boolean(bestTimesMsg)" maxlength="200" placeholder="e.g. weekdays after 3pm" />
          <p class="mt-1 text-sm text-red-700 empty:hidden">{{ bestTimesMsg }}</p>
        </div>
      </section>

      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="submitting || addingPhotos">
        <template v-if="staff">{{ submitting ? 'Saving…' : 'Create request' }}</template>
        <template v-else>{{ submitting ? 'Sending…' : 'Submit request' }}</template>
      </button>
    </template>
  </form>
</template>

<script setup lang="ts">
import { CATEGORIES, SOURCES } from '~~/config/maintenance'

export type RequestPayload = Record<string, unknown>

const props = defineProps<{
  /** Posts the request; throw to show an error. */
  submit: (data: RequestPayload, photos: Blob[]) => Promise<void>
  /** Staff entering a request for a tenant: asks for the source, skips the self-check and honeypot. */
  staff?: boolean
}>()

// Every source except the online form itself.
const staffSources = Object.fromEntries(Object.entries(SOURCES).filter(([key]) => key !== 'form'))

const { data: properties, error: propertiesError, refresh: refreshProperties } = await useFetch('/api/properties')

const form = reactive({
  source: '', // staff only
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
const addingPhotos = ref(false)
const formEl = ref<HTMLFormElement>()
const selfCheckDone = ref(false)
const submitting = ref(false)
const error = ref('')

// Contact errors show once the field has been left (or on submit).
const touched = reactive({ email: false, phone: false })
const emailMsg = computed(() => (touched.email ? emailError(form.contactEmail) : ''))
const phoneMsg = computed(() => (touched.phone ? phoneError(form.contactPhone) : ''))
// A character that isn't allowed is wrong straight away, so these show while typing.
const nameMsg = computed(() => nameError(form.contactName))
const descriptionMsg = computed(() => textError(form.description))
const petsMsg = computed(() => textError(form.pets))
const bestTimesMsg = computed(() => textError(form.bestTimes))
const INVALID = 'border-red-500 focus:border-red-500 focus:ring-red-500'

const units = computed(() => properties.value?.find((p) => p.id === form.propertyId)?.units ?? [])
const category = computed(() => CATEGORIES[form.category])
const showRest = computed(() => category.value && (props.staff || !category.value.selfCheck || selfCheckDone.value))

watch(() => form.contactPhone, (value) => (form.contactPhone = cleanPhone(value)))
watch(() => form.contactEmail, (value) => (form.contactEmail = cleanEmail(value)))
watch(() => form.propertyId, () => (form.unitId = ''))
watch(() => form.category, () => {
  form.details = {}
  selfCheckDone.value = false
})

/** The form is long on a phone, so bring the field that needs fixing into view. */
async function showField(selector: string) {
  await nextTick()
  const field = formEl.value?.querySelector<HTMLElement>(selector)
  field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  field?.focus({ preventScroll: true })
}

async function onSubmit() {
  error.value = ''
  touched.email = touched.phone = true
  const detailsBad = Object.values(form.details).some((answer) => textError(answer))
  if (emailMsg.value || phoneMsg.value || nameMsg.value || descriptionMsg.value || petsMsg.value || bestTimesMsg.value || detailsBad) {
    error.value = 'Please fix the fields marked in red above.'
    await showField('[aria-invalid="true"]')
    return
  }
  if (!form.contactEmail.trim() && !form.contactPhone.trim()) {
    error.value = 'Please give an email or phone number so we can reach you.'
    await showField('#email')
    return
  }
  // Send only filled-in fields; the server validates everything again.
  const { propertyId, ...rest } = form
  const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== ''))
  submitting.value = true
  try {
    await props.submit(data, photos.value)
  } catch (e: any) {
    // 413 comes from the host before our server runs, so it has no message of ours.
    error.value = e?.statusCode === 413 ? 'Those photos are too large. Try adding fewer.' : e?.data?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

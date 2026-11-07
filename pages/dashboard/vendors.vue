<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-xl space-y-4 p-4 pb-16">
      <h1 class="text-2xl font-semibold">Vendors</h1>

      <div class="card">
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="add">
          <input v-model="newName" class="input" placeholder="New vendor name" maxlength="100" required aria-label="New vendor name" />
          <button type="submit" class="btn-primary whitespace-nowrap">Add vendor</button>
        </form>
        <p v-if="addError" role="alert" class="mt-2 text-red-700">{{ addError }}</p>
      </div>

      <p v-if="toggleError" role="alert" class="text-red-700">{{ toggleError }}</p>

      <ul class="space-y-3">
        <li v-for="v in vendors" :key="v.id" class="card">
          <div v-if="editingId === v.id">
            <form class="space-y-2" @submit.prevent="saveEdit">
              <input v-model="editName" class="input" maxlength="100" required aria-label="Vendor name" />
              <div class="grid grid-cols-2 gap-2">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" @click="editingId = null">Cancel</button>
              </div>
            </form>
            <p v-if="editError" role="alert" class="mt-2 text-red-700">{{ editError }}</p>
          </div>
          <template v-else>
            <div class="flex items-start justify-between gap-2">
              <span class="min-w-0 break-words font-medium" :class="{ 'text-gray-500': !v.active }">{{ v.name }}</span>
              <Badge v-if="!v.active">Inactive</Badge>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button type="button" class="btn-secondary" @click="startEdit(v)">Rename</button>
              <button v-if="v.active" type="button" class="btn-secondary !text-red-700" @click="setActive(v.id, false)">Deactivate</button>
              <button v-else type="button" class="btn-secondary" @click="setActive(v.id, true)">Reactivate</button>
            </div>
          </template>
        </li>
      </ul>
      <p class="text-gray-600">Inactive vendors can't be picked for new requests, but stay on requests they already have.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Vendors' })

const { data: vendors, refresh } = await useFetch('/api/staff/vendors')
// Each form shows its own error next to it.
const addError = ref('')
const editError = ref('')
const toggleError = ref('')

async function run(action: () => Promise<unknown>, error: Ref<string>) {
  error.value = ''
  try {
    await action()
    await refresh()
    return true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Something went wrong.'
    return false
  }
}

// Add
const newName = ref('')
async function add() {
  addError.value = textError(newName.value)
  if (addError.value) return
  if (await run(() => $fetch('/api/staff/vendors', { method: 'POST', body: { name: newName.value } }), addError)) newName.value = ''
}

// Rename (one row at a time)
const editingId = ref<string | null>(null)
const editName = ref('')
watch(editingId, () => (editError.value = ''))
function startEdit(v: { id: string; name: string }) {
  editingId.value = v.id
  editName.value = v.name
}
async function saveEdit() {
  editError.value = textError(editName.value)
  if (editError.value) return
  const id = editingId.value
  if (await run(() => $fetch(`/api/staff/vendors/${id}`, { method: 'PATCH', body: { name: editName.value } }), editError)) editingId.value = null
}

// Deactivate / reactivate
const setActive = (id: string, active: boolean) =>
  run(() => $fetch(`/api/staff/vendors/${id}`, { method: 'PATCH', body: { active } }), toggleError)
</script>

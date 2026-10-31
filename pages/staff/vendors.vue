<template>
  <div>
    <StaffHeader />
    <main class="mx-auto max-w-xl space-y-4 p-4 pb-16">
      <h1 class="text-xl font-semibold">Vendors</h1>

      <form class="flex gap-2" @submit.prevent="add">
        <input v-model="newName" class="input" placeholder="New vendor name" maxlength="100" required aria-label="New vendor name" />
        <button type="submit" class="btn-primary whitespace-nowrap">Add vendor</button>
      </form>

      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>

      <ul class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        <li v-for="v in vendors" :key="v.id" class="flex flex-wrap items-center gap-2 px-4 py-3">
          <form v-if="editingId === v.id" class="flex flex-1 gap-2" @submit.prevent="saveEdit">
            <input v-model="editName" class="input" maxlength="100" required aria-label="Vendor name" />
            <button type="submit" class="btn-primary">Save</button>
            <button type="button" class="btn-secondary" @click="editingId = null">Cancel</button>
          </form>
          <template v-else>
            <span class="flex-1" :class="{ 'text-gray-400': !v.active }">{{ v.name }}</span>
            <Badge v-if="!v.active">Inactive</Badge>
            <button type="button" class="text-sm text-blue-700 hover:underline" @click="startEdit(v)">Rename</button>
            <button v-if="v.active" type="button" class="text-sm text-red-700 hover:underline" @click="setActive(v.id, false)">Deactivate</button>
            <button v-else type="button" class="text-sm text-blue-700 hover:underline" @click="setActive(v.id, true)">Reactivate</button>
          </template>
        </li>
      </ul>
      <p class="text-sm text-gray-500">Inactive vendors can't be assigned to new requests, but stay on requests they already have.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Vendors' })

const { data: vendors, refresh } = await useFetch('/api/staff/vendors')
const error = ref('')

async function run(action: () => Promise<unknown>) {
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
  if (await run(() => $fetch('/api/staff/vendors', { method: 'POST', body: { name: newName.value } }))) newName.value = ''
}

// Rename (one row at a time)
const editingId = ref<string | null>(null)
const editName = ref('')
function startEdit(v: { id: string; name: string }) {
  editingId.value = v.id
  editName.value = v.name
}
async function saveEdit() {
  const id = editingId.value
  if (await run(() => $fetch(`/api/staff/vendors/${id}`, { method: 'PATCH', body: { name: editName.value } }))) editingId.value = null
}

// Deactivate / reactivate
const setActive = (id: string, active: boolean) => run(() => $fetch(`/api/staff/vendors/${id}`, { method: 'PATCH', body: { active } }))
</script>

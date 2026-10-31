<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

useHead({ title: 'Staff sign in' })

async function signIn() {
  error.value = ''
  loading.value = true
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
    if (authError) throw new Error('Wrong email or password.')
    try {
      await $fetch('/api/staff/me') // a valid login isn't enough — the email must be in the staff table
    } catch {
      await supabase.auth.signOut()
      throw new Error("This account doesn't have staff access.")
    }
    await navigateTo('/staff')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-sm space-y-6 p-4 pt-16">
    <h1 class="text-2xl font-semibold">Staff sign in</h1>
    <form class="space-y-4" @submit.prevent="signIn">
      <div>
        <label class="label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="input" required autocomplete="username" />
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input id="password" v-model="password" type="password" class="input" required autocomplete="current-password" />
      </div>
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  </main>
</template>

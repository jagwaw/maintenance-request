<template>
  <main class="mx-auto max-w-md space-y-4 p-4 pb-16">
    <NuxtLink to="/" class="tap-link"><Icon name="arrow-left" :size="18" /> Back to home</NuxtLink>
    <h1 class="text-2xl font-semibold">Staff sign in</h1>
    <form class="card space-y-4" @submit.prevent="signIn">
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
    <p class="text-center text-sm text-gray-600">Forgot your password? Ask the office.</p>
  </main>
</template>

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
    } catch (e: any) {
      await supabase.auth.signOut()
      // Only a 403 means "not staff"; anything else is a server problem worth retrying.
      throw new Error(e?.statusCode === 403 ? "This account doesn't have staff access." : "Couldn't check your access. Please try again.")
    }
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

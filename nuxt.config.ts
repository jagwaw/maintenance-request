export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    // Staff pages are protected by our own middleware; the tenant form is public.
    redirect: false,
    types: false,
  },
  app: {
    head: {
      title: 'Maintenance Request',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})

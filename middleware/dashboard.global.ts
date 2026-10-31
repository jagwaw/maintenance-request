/**
 * Sends signed-out visitors on /dashboard pages to the login page.
 * This is only for convenience — the real protection is requireStaff() on every /api/staff/** route.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/dashboard' && !to.path.startsWith('/dashboard/')) return
  if (!useSupabaseUser().value) return navigateTo('/login')
})

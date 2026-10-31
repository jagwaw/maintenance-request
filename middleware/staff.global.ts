/**
 * Sends signed-out visitors on /staff pages to the login page.
 * This is only for convenience — the real protection is requireStaff() on every /api/staff/** route.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/staff') || to.path === '/staff/login') return
  if (!useSupabaseUser().value) return navigateTo('/staff/login')
})

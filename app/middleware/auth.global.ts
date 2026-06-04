const PUBLIC_ROUTES = new Set(['/login'])

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  auth.hydrate()

  const isPublic = PUBLIC_ROUTES.has(to.path)

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (auth.isAuthenticated && isPublic) {
    return navigateTo('/dashboard')
  }
})

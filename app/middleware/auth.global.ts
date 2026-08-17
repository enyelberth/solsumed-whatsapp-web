const PUBLIC_ROUTES = ['/login', '/whatsapp']

function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.some(p => path === p || path.startsWith(`${p}/`))
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  auth.hydrate()

  const pub = isPublic(to.path)

  if (!auth.isAuthenticated && !pub) {
    const query: Record<string, string> = {}
    if (to.fullPath && to.fullPath !== '/' && to.fullPath !== '/dashboard') {
      query.redirect = to.fullPath
    }
    return navigateTo({ path: '/login', query })
  }

  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/dashboard')
  }
})

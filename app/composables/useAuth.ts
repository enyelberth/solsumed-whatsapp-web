import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const { session, user, token, isAuthenticated } = storeToRefs(store)
  return {
    store,
    session,
    user,
    token,
    isAuthenticated,
    hydrate: () => store.hydrate(),
    login: store.login.bind(store),
    logout: store.logout.bind(store),
  }
}

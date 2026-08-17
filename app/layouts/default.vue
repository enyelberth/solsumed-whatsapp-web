<script setup lang="ts">
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { user } = storeToRefs(auth)
const router = useRouter()

const navItems = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
  { label: 'WhatsApp', icon: 'i-lucide-message-circle', to: '/whatsapp' },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex bg-[var(--app-bg)]">
    <LayoutAppSidebar :items="navItems" />
    <div class="flex-1 flex flex-col">
      <LayoutAppHeader :user="user" @logout="handleLogout" />
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

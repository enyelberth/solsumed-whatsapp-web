<script setup lang="ts">
// This page uses the full-screen whatsapp layout.
// All logic (chats, messaging, auth) lives in app/layouts/whatsapp.vue.
definePageMeta({ layout: 'whatsapp' })
</script>

<template>
  <!-- Slot content is intentionally empty: the layout handles everything -->
  <div />
</template>

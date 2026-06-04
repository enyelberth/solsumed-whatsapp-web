import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@pinia/nuxt',
  ],

  devtools: { enabled: true },
  ssr: false,
  compatibilityDate: '2025-01-01',

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET || 'solsumed-dev-secret',
    public: {
      solsumedApiUrl: process.env.NUXT_PUBLIC_SOLSUMED_API_URL || 'http://localhost:3000',
      whatsappApiUrl: process.env.NUXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:6000',
      appName: 'Solsumed WhatsApp',
    },
  },

  app: {
    head: {
      title: 'Solsumed WhatsApp',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})

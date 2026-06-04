// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@pinia/nuxt',
  ],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  devtools: { enabled: true },
  ssr: false,
  compatibilityDate: '2025-01-01',

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET || 'solsumed-dev-secret',
    public: {
      solsumedApiUrl: process.env.NUXT_PUBLIC_SOLSUMED_API_URL || 'http://localhost:4000',
      whatsappApiUrl: process.env.NUXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:5000',
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

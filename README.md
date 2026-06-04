# Solsumed WhatsApp Web

Frontend Nuxt 4 (SPA) que consume:

- **Backend Solsumed** (NestJS) — autenticación, datos del sistema.
- **Backend WhatsApp API** — estado de sesión y envío de mensajes.

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- `@nuxt/ui` v4 (Tailwind v4 incluido)
- Pinia (`@pinia/nuxt`) — estado global por feature
- Vitest + ESLint (`@nuxt/eslint-config`)

## Setup

```bash
npm install
cp .env.example .env   # ajusta las URLs de los dos backends
npm run dev            # http://localhost:3000
```

Comandos:

```bash
npm run dev         # dev server
npm run build       # build producción
npm run preview     # preview producción
npm run lint        # eslint
npm run test        # vitest
npm run test:types  # vue-tsc --noEmit
```

## Variables de entorno

| Variable                          | Uso                                          |
| --------------------------------- | -------------------------------------------- |
| `AUTH_SECRET`                     | Secreto para firmar sesiones (server-side).  |
| `NUXT_PUBLIC_SOLSUMED_API_URL`    | Base URL del backend Solsumed.               |
| `NUXT_PUBLIC_WHATSAPP_API_URL`    | Base URL del backend WhatsApp API.           |

## Estructura

```
app/
  app.vue                      # raíz, envuelve UApp + NuxtLayout
  assets/css/main.css          # Tailwind + Nuxt UI
  layouts/
    default.vue                # sidebar + header (zona privada)
    auth.vue                   # layout centrado para login
  pages/
    index.vue                  # redirige login/dashboard
    login.vue
    dashboard.vue
    whatsapp/index.vue
  middleware/
    auth.global.ts             # guard de rutas
  stores/                      # Pinia, una store por feature
    auth.ts                    # sesión, login, logout
    whatsapp.ts                # estado y acciones de WhatsApp
  composables/
    useAuth.ts                 # wrapper de useAuthStore (storeToRefs)
    useApiClient.ts            # factory de $fetch con Bearer + 401 handler
    useSolsumedApi.ts          # cliente para backend Solsumed
    useWhatsappApi.ts          # cliente para backend WhatsApp
  services/                    # llamadas tipadas por dominio (usadas por stores)
    auth.service.ts
    whatsapp.service.ts
  components/
    layout/AppHeader.vue
    layout/AppSidebar.vue
    auth/LoginForm.vue
  types/                       # contratos compartidos
    auth.ts
    api.ts
    whatsapp.ts
  utils/
    storage.ts                 # persistencia de sesión en localStorage
```

## Cómo escalar

- **Nueva página**: agregar `app/pages/<ruta>.vue`. Si es pública, agregar la ruta a `PUBLIC_ROUTES` en `app/middleware/auth.global.ts`.
- **Nuevo dominio del backend Solsumed**: crear `app/services/<dominio>.service.ts` usando `useSolsumedApi()` y tipos en `app/types/<dominio>.ts`.
- **Nueva store**: `app/stores/<feature>.ts` con `defineStore('<feature>', { state, getters, actions })`. Llama a los servicios desde `actions`; los componentes solo leen estado con `storeToRefs`.
- **Nuevo backend**: crear `app/composables/use<Nombre>Api.ts` con `createApiClient({ baseURL })` y exponer la URL vía `runtimeConfig.public` en `nuxt.config.ts`.
- **Componentes**: agrupar por feature dentro de `app/components/<feature>/`. Nuxt los auto-importa con prefijo de carpeta (`AuthLoginForm`, `LayoutAppHeader`, etc.).

### Patrón de capas

```
Component → Store (Pinia) → Service → ApiClient ($fetch)
```

Mantén `setup()` delgado: solo llama acciones del store y consume refs vía `storeToRefs`. La lógica de red, validación y caché va en stores/services.

## Notas

- App en modo SPA (`ssr: false`) — la sesión vive en `localStorage` y se hidrata en cliente.
- Los archivos `src/`, `dist/` y `playground/` son del scaffold previo de Nuxt module; ya no se usan y pueden eliminarse si no se necesita el modo módulo.

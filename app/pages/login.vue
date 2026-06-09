<script setup lang="ts">
import type { LoginCredentials } from '~/types/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function handleLogin(credentials: LoginCredentials) {
  loading.value = true
  errorMessage.value = null
  try {
    await auth.login(credentials)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string }, message?: string }
    errorMessage.value = e?.data?.message || e?.message || 'Error al iniciar sesión'
  }
  finally {
    loading.value = false
  }
}

// Lógica del Carrusel Interactivo
const activeSlide = ref(0)
const slides = [
  {
    subtitle: 'ACCESO SOLSUMED',
    title: 'Distribución médica confiable',
    description: 'Conectamos insumos de alta calidad con profesionales y centros de salud en todo el país.',
    type: 'distribution'
  },
  {
    subtitle: 'LÍNEA ESPECIALIZADA',
    title: 'Productos de compresión',
    description: 'Diseño ergonómico y compresión graduada certificada para el cuidado vascular y bienestar diario.',
    type: 'compression'
  },
  {
    subtitle: 'SERVICIO SOLSUMED',
    title: 'Logística y soporte inmediato',
    description: 'Soporte personalizado y entregas rápidas a través de nuestra red nacional de distribución.',
    type: 'logistics'
  }
]

const currentSlide = computed(() => slides[activeSlide.value] || {
  subtitle: '',
  title: '',
  description: '',
  type: ''
})

let autoPlayTimer: ReturnType<typeof setInterval> | null = null
let idleHandle: number | null = null

function startAutoPlay() {
  stopAutoPlay()
  autoPlayTimer = setInterval(() => {
    nextSlide()
  }, 6000)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % slides.length
}

function prevSlide() {
  activeSlide.value = (activeSlide.value - 1 + slides.length) % slides.length
}

function setSlide(index: number) {
  activeSlide.value = index
  startAutoPlay()
}

onMounted(() => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
  if (typeof w.requestIdleCallback === 'function') {
    idleHandle = w.requestIdleCallback(() => startAutoPlay(), { timeout: 2000 })
  }
  else {
    idleHandle = window.setTimeout(() => startAutoPlay(), 1500)
  }
})

onUnmounted(() => {
  stopAutoPlay()
  if (idleHandle != null) {
    const w = window as Window & { cancelIdleCallback?: (h: number) => void }
    if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleHandle)
    else window.clearTimeout(idleHandle)
    idleHandle = null
  }
})
</script>

<template>
  <div class="w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-12 min-h-[640px] transition-all duration-300">
    <!-- Columna Izquierda: Área Visual y Carrusel Comercial -->
    <div class="hidden md:flex md:col-span-5 relative bg-gradient-to-b from-teal-600 via-teal-800 to-slate-950 p-8 flex-col justify-between overflow-hidden group select-none">
      <!-- Elemento de fondo decorativo de cuadrícula suave -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <!-- Superior: Logo Simplificado o Marca de agua -->
      <div class="z-10 flex items-center space-x-2 text-white/90">
        <span class="font-bold tracking-widest text-xs uppercase opacity-75">Solsumed Web</span>
      </div>

      <!-- Central: Contenedor de Gráficos e Ilustraciones del Carrusel -->
      <div class="z-10 relative flex-1 flex flex-col justify-center my-6">
        <div class="relative w-full aspect-square max-w-[280px] mx-auto mb-6 flex items-center justify-center">
          <!-- Slide 1 Graphic: Distribución / Red Médica -->
          <div
            v-if="activeSlide === 0"
            class="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
          >
            <svg class="w-full h-full text-teal-300 drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" />
              <!-- Globos y Conexiones -->
              <circle cx="100" cy="100" r="32" fill="url(#grad1)" />
              <circle cx="60" cy="60" r="14" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" />
              <circle cx="140" cy="60" r="18" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" />
              <circle cx="60" cy="140" r="16" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" />
              <circle cx="140" cy="140" r="12" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" />
              <!-- Conexiones -->
              <line x1="100" y1="100" x2="60" y2="60" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2" />
              <line x1="100" y1="100" x2="140" y2="60" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2" />
              <line x1="100" y1="100" x2="60" y2="140" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2" />
              <line x1="100" y1="100" x2="140" y2="140" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2" />
              <!-- Cruz médica central -->
              <path d="M93 100H107M100 93V107" stroke="white" stroke-width="4" stroke-linecap="round" />
              <!-- Definiciones de Degradados -->
              <defs>
                <linearGradient id="grad1" x1="68" y1="68" x2="132" y2="132" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0d9488" />
                  <stop offset="1" stop-color="#0f766e" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Slide 2 Graphic: Medias de Compresión e Insumos -->
          <div
            v-else-if="activeSlide === 1"
            class="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
          >
            <svg class="w-full h-full text-teal-300 drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="30" width="140" height="140" rx="24" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-width="1.5" />
              <!-- Pierna estilizada con medias de compresión (curvas anatómicas y ondas de compresión) -->
              <path d="M85 50C92 65 98 75 92 95C85 115 78 130 82 150H115C110 135 112 120 118 100C125 80 118 65 110 50H85Z" fill="url(#grad2)" fill-opacity="0.8" />
              <!-- Bandas de compresión que envuelven la pierna -->
              <path d="M88 70Q100 75 113 70" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <path d="M89 90Q102 96 116 90" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <path d="M86 110Q99 116 113 110" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <path d="M82 130Q97 136 114 130" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <defs>
                <linearGradient id="grad2" x1="85" y1="50" x2="118" y2="150" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0f766e" />
                  <stop offset="1" stop-color="#111827" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Slide 3 Graphic: Logística y Paquetes de Distribución -->
          <div
            v-else-if="activeSlide === 2"
            class="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
          >
            <svg class="w-full h-full text-teal-300 drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 100C20 55.8172 55.8172 20 100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180C55.8172 180 20 144.183 20 100Z" fill="currentColor" fill-opacity="0.05" />
              <!-- Caja 3D / Contenedor de Productos Médicos -->
              <path d="M100 55L145 75L100 95L55 75L100 55Z" fill="url(#grad3)" />
              <path d="M55 75V125L100 145V95L55 75Z" fill="#0d9488" fill-opacity="0.7" />
              <path d="M100 95V145L145 125V75L100 95Z" fill="#115e59" />
              <!-- Líneas de velocidad o entrega rápida -->
              <line x1="45" y1="110" x2="25" y2="110" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <line x1="38" y1="90" x2="28" y2="90" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <line x1="42" y1="130" x2="30" y2="130" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <defs>
                <linearGradient id="grad3" x1="55" y1="75" x2="145" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#2dd4bf" />
                  <stop offset="1" stop-color="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Textos del Carrusel con alineación izquierda y jerarquía clara -->
        <div class="text-left text-white px-2 min-h-[140px] flex flex-col justify-start">
          <span class="text-[10px] tracking-[0.2em] font-semibold text-teal-300 uppercase mb-2 block">
            {{ currentSlide.subtitle }}
          </span>
          <h2 class="text-2xl font-bold tracking-tight text-white mb-2 transition-all duration-300 leading-snug">
            {{ currentSlide.title }}
          </h2>
          <p class="text-xs text-teal-100/80 leading-relaxed font-light">
            {{ currentSlide.description }}
          </p>
        </div>
      </div>

      <!-- Inferior: Controles de navegación -->
      <div class="z-10 flex items-center justify-between mt-auto">
        <!-- Indicadores (Puntos) -->
        <div class="flex space-x-2">
          <button
            v-for="(slide, index) in slides"
            :key="index"
            class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
            :class="activeSlide === index ? 'w-6 bg-teal-300' : 'w-1.5 bg-white/40 hover:bg-white/60'"
            @click="setSlide(index)"
            :aria-label="`Ir a slide ${index + 1}`"
          ></button>
        </div>

        <!-- Flechas de navegación -->
        <div class="flex space-x-1">
          <button
            class="p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white transition-all cursor-pointer"
            @click="prevSlide"
            aria-label="Slide anterior"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            class="p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white transition-all cursor-pointer"
            @click="nextSlide"
            aria-label="Siguiente slide"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Columna Derecha: Área de Formulario -->
    <div class="col-span-1 md:col-span-7 bg-slate-50/50 dark:bg-slate-900 p-8 sm:p-12 md:p-16 flex flex-col justify-center">
      <div class="w-full max-w-md mx-auto space-y-8">
        <!-- Encabezado / Logo corporativo centrado -->
        <div class="text-center space-y-2.5">
          <div class="inline-flex items-center justify-center p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl text-teal-600 dark:text-teal-400 mb-2 shadow-sm border border-teal-100/40 dark:border-teal-900/30">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 10.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9.5M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            GRUPO SOLSUMED
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Ingresa los datos para entrar en tu cuenta
          </p>
        </div>

        <!-- Formulario principal -->
        <AuthLoginForm
          :loading="loading"
          :error-message="errorMessage"
          @submit="handleLogin"
        />
      </div>
    </div>
  </div>
</template>


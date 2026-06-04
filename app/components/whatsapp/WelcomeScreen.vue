<template>
  <!-- Identical to WhatsApp Web welcome/idle screen -->
  <div class="wa-font w-full h-full flex flex-col items-center justify-center wa-chat-bg border-l border-[#e9edef] dark:border-[#222d34] select-none">

    <!-- Laptop + phone icon -->
    <div class="mb-8">
      <svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <!-- Laptop body -->
        <rect x="40" y="30" width="200" height="130" rx="10" ry="10"
          fill="none" stroke="#ccd0d5" stroke-width="4"/>
        <!-- Laptop screen area -->
        <rect x="55" y="42" width="170" height="100" rx="4" ry="4"
          fill="#f0f2f5"/>
        <!-- WhatsApp logo on screen -->
        <circle cx="140" cy="92" r="28" fill="#25d366" opacity="0.9"/>
        <path d="M140 68a24 24 0 0 0-20.8 36.1l-3.2 9.9 10.2-3.1A24 24 0 1 0 140 68zm12.3 30.8c-.5 1.4-2.9 2.7-4 2.8-.9.1-2 .5-6.3-1.3-5.3-2.2-8.7-7.6-9-7.9-.3-.4-2.3-3.1-2.3-5.8s1.4-4.1 2-4.7c.5-.6 1.2-.8 1.6-.8s.8 0 1.1.01c.4.01.9-.14 1.4 1.08.5 1.27 1.8 4.4 2 4.7.2.3.3.7.06 1.1-.24.4-.36.67-.7 1.03-.36.36-.75.8-.36 1.4.39.6 1.7 2.8 3.65 4.5 2.51 2.2 4.6 2.9 5.25 3.2.65.3 1.03.26 1.4-.14.38-.4 1.6-1.87 2.03-2.5.42-.64.84-.53 1.42-.32.58.21 3.67 1.73 4.3 2.04.63.31 1.05.47 1.2.73.15.26.15 1.5-.35 2.9z"
          fill="white"/>
        <!-- Laptop base/keyboard -->
        <path d="M20 160 Q140 175 260 160" fill="none" stroke="#ccd0d5" stroke-width="4" stroke-linecap="round"/>
        <!-- Phone -->
        <rect x="215" y="70" width="55" height="95" rx="8" ry="8"
          fill="white" stroke="#ccd0d5" stroke-width="3"/>
        <rect x="220" y="82" width="45" height="70" rx="3" ry="3" fill="#f0f2f5"/>
        <circle cx="242" cy="162" r="4" fill="#ccd0d5"/>
        <!-- Connection dots -->
        <circle cx="175" cy="130" r="4" fill="#00a884" opacity="0.7"/>
        <circle cx="192" cy="122" r="3" fill="#00a884" opacity="0.5"/>
        <circle cx="207" cy="112" r="3" fill="#00a884" opacity="0.3"/>
      </svg>
    </div>

    <!-- Title -->
    <h2 class="text-[28px] font-[300] text-[#41525d] dark:text-[#e9edef] mb-3 tracking-[-0.2px]">
      Solsumed WhatsApp Web
    </h2>

    <!-- Description -->
    <p class="text-[14px] text-[#667781] dark:text-[#8696a0] text-center max-w-[380px] leading-[20px] mb-10">
      Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.<br>
      Usa Solsumed para gestionar comunicaciones con tus clientes.
    </p>

    <!-- Divider -->
    <div class="w-[420px] max-w-[90%] h-px bg-[#e9edef] dark:bg-[#222d34] mb-6" />

    <!-- Security badge -->
    <div class="flex items-center gap-2 text-[#667781] dark:text-[#8696a0]">
      <svg viewBox="0 0 12 12" width="14" height="14" fill="currentColor">
        <path d="M6 .25a.75.75 0 0 1 .5.19l3.75 3.06A.75.75 0 0 1 10.5 4v3.5a4 4 0 0 1-8 0V4a.75.75 0 0 1 .25-.56L6.25.44A.75.75 0 0 1 6 .25zm0 1.5L3 4.44V7.5a2.5 2.5 0 0 0 5 0V4.44z"/>
      </svg>
      <span class="text-[13px]">Cifrado de extremo a extremo</span>
    </div>

  </div>
</template>

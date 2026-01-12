<template>
  <div :class="containerClass" :style="containerStyle">
    <div class="aurora-container" :style="auroraStyle">
      <div :class="auroraClass" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface AuroraBackgroundProps {
  radialGradient?: boolean
  class?: string
}

const props = withDefaults(defineProps<AuroraBackgroundProps>(), {
  radialGradient: true,
})

const containerClass = computed(() => {
  return cn(
    'aurora-background',
    'relative flex min-h-screen flex-col items-center justify-center',
    props.class,
  )
})

const containerStyle = computed(() => {
  return {
    background: 'transparent',
    color: '#fff',
  }
})

const auroraStyle = computed(() => {
  return {
    '--aurora':
      'repeating-linear-gradient(100deg, #3b82f6 10%, #a5b4fc 15%, #93c5fd 20%, #ddd6fe 25%, #60a5fa 30%)',
    '--dark-gradient':
      'repeating-linear-gradient(100deg, #000 0%, #000 7%, transparent 10%, transparent 12%, #000 16%)',
    '--white-gradient':
      'repeating-linear-gradient(100deg, #fff 0%, #fff 7%, transparent 10%, transparent 12%, #fff 16%)',
  } as Record<string, string>
})

const auroraClass = computed(() => {
  return cn('aurora-effect', props.radialGradient && 'aurora-radial')
})
</script>

<style scoped>
.aurora-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.aurora-effect {
  position: absolute;
  inset: -10px;
  background-image: var(--white-gradient), var(--aurora);
  background-size: 300%, 200%;
  background-position:
    50% 50%,
    50% 50%;
  opacity: 0.5;
  filter: blur(10px) invert(1);
  will-change: transform;
  animation: aurora 60s linear infinite;
}

.aurora-effect::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--white-gradient), var(--aurora);
  background-size: 200%, 100%;
  background-attachment: fixed;
  mix-blend-mode: difference;
}

.aurora-radial {
  mask-image: radial-gradient(ellipse at 100% 0%, black 10%, transparent 70%);
}

@keyframes aurora {
  0% {
    background-position:
      50% 50%,
      50% 50%;
  }

  33% {
    background-position:
      100% 50%,
      100% 50%;
  }

  66% {
    background-position:
      50% 100%,
      50% 100%;
  }

  100% {
    background-position:
      50% 50%,
      50% 50%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .aurora-effect {
    background-image: var(--dark-gradient), var(--aurora);
    filter: blur(10px);
  }

  .aurora-effect::after {
    background-image: var(--dark-gradient), var(--aurora);
  }
}
</style>

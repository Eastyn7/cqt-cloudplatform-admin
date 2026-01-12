<template>
  <span
    ref="spanRef"
    class="inline-block tabular-nums tracking-wider font-semibold"
    :class="props.class"
  >
    {{ output }}
  </span>
</template>

<script setup lang="ts">
import { useElementVisibility, useTransition, TransitionPresets } from '@vueuse/core'
import { ref, watch, computed, nextTick } from 'vue'

interface Props {
  value: number
  duration?: number
  delay?: number
  decimalPlaces?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1800,
  delay: 100,
  decimalPlaces: 0,
})

const spanRef = ref<HTMLSpanElement>()

const finalValue = ref(0)
const displayValue = ref(0)

// useTransition 只负责从 displayValue → finalValue 的动画
const transitioned = useTransition(displayValue, {
  duration: props.duration,
  delay: props.delay,
  transition: TransitionPresets.easeOutExpo,
})

const output = computed(() => {
  const num = Number(transitioned.value.toFixed(props.decimalPlaces))
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces,
  }).format(num)
})

// 进入视口或 value 变化时 → 只触发一次动画
const isVisible = useElementVisibility(spanRef)
const hasPlayed = ref(false)

const startAnimation = () => {
  if (hasPlayed.value) return
  hasPlayed.value = true

  // 先瞬间归零
  displayValue.value = 0
  finalValue.value = props.value

  nextTick(() => {
    displayValue.value = finalValue.value
  })
}

// 初次进入视口
watch(
  isVisible,
  (visible) => {
    if (visible) startAnimation()
  },
  { immediate: true }
)

// 外部 value 变化（比如点“刷新数据”）也重新动画
watch(
  () => props.value,
  (newVal) => {
    if (!isVisible.value) {
      // 如果还没进视口，就直接更新最终值，等进入视口再动画
      finalValue.value = newVal
    } else {
      // 已经在视口内 → 重新归零再飞
      hasPlayed.value = false
      startAnimation()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>

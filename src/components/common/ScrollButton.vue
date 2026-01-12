<template>
  <button class="scroll-button" @click="handleClick">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
    <span>查看驾驶舱</span>
  </button>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.scroll-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(81, 81, 81, 0.95);
  backdrop-filter: blur(12px);
  color: #fff;
  border: 2px solid rgb(255, 255, 255);
  border-radius: 50px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(25, 137, 250, 0.3);
  transition: all 0.3s ease;
}

.scroll-button:hover {
  background: rgba(25, 137, 250, 1);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(25, 137, 250, 0.4);
}

.scroll-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3);
}

.scroll-button svg {
  width: 20px;
  height: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>


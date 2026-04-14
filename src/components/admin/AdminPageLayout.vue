<template>
  <div class="admin-page-layout">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">{{ title }}</span>
      </template>
    </el-page-header>

    <div :class="['content', props.contentClass]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    title: string
    backPath?: string
    contentClass?: string
  }>(),
  {
    backPath: '/admin/dashboard',
    contentClass: '',
  }
)

const router = useRouter()

const handleBack = () => {
  router.push(props.backPath)
}
</script>

<style scoped>
.admin-page-layout {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: auto;
  gap: 10px;
}
</style>
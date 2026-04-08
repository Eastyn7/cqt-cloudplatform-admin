<template>
  <el-menu-item v-if="!hasChildren" :index="node.index || node.key">
    <el-icon v-if="node.icon" class="menu-icon">
      <component :is="node.icon" />
    </el-icon>
    <span>{{ node.label }}</span>
  </el-menu-item>
  <el-sub-menu v-else :index="node.key">
    <template #title>
      <el-icon v-if="node.icon" class="menu-icon">
        <component :is="node.icon" />
      </el-icon>
      <span>{{ node.label }}</span>
    </template>
    <AdminMenuNode v-for="child in node.children" :key="child.key" :node="child" />
  </el-sub-menu>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

defineOptions({
  name: 'AdminMenuNode',
})

interface MenuNode {
  key: string
  label: string
  index?: string
  icon?: Component
  children?: MenuNode[]
}

const props = defineProps<{
  node: MenuNode
}>()

const hasChildren = computed(() => Array.isArray(props.node.children) && props.node.children.length > 0)
</script>

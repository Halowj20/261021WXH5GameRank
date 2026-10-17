<template>
  <el-container class="app-shell">
    <el-aside width="224px" class="sidebar">
      <div class="brand">榜<br /><span>榜单情报台</span></div>
      <el-menu :default-active="$route.path" router class="nav" background-color="transparent" text-color="#c9d4cf" active-text-color="#ffffff">
        <el-menu-item index="/"><el-icon><DataBoard /></el-icon>今日工作台</el-menu-item>
        <el-menu-item v-if="canWrite" index="/ingest"><el-icon><Box /></el-icon>投喂台</el-menu-item>
        <el-menu-item v-if="canWrite" index="/review"><el-icon><List /></el-icon>待核队列</el-menu-item>
        <el-menu-item index="/rankings"><el-icon><TrendCharts /></el-icon>榜单中心</el-menu-item>
        <el-menu-item index="/games"><el-icon><Grid /></el-icon>游戏库</el-menu-item>
        <el-menu-item :index="`/digest/${today}`"><el-icon><Document /></el-icon>日报编辑器</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings"><el-icon><Setting /></el-icon>设置</el-menu-item>
      </el-menu>
      <div class="user-box">
        <span>{{ session.user?.name }} · {{ roleLabel }}</span>
        <el-button link style="color:#c9d4cf" @click="onLogout">退出</el-button>
      </div>
    </el-aside>
    <el-main><router-view /></el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { DataBoard, Box, List, TrendCharts, Grid, Document, Setting } from '@element-plus/icons-vue'
import { session, logout } from '../stores/session'

const router = useRouter()
const today = dayjs().format('YYYY-MM-DD')
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const isAdmin = computed(() => session.user?.role === 'admin')
const roleLabel = computed(() => (({ operator: '运营', lead: '负责人', admin: '管理员' }) as Record<string, string>)[session.user?.role || 'operator'])

async function onLogout() {
  await logout()
  router.replace('/login')
}
</script>

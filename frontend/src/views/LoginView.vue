<template>
  <div class="login-page">
    <el-card class="login-card">
      <h1>榜单情报台</h1>
      <p class="sub">微小 / 抖小游戏榜单情报的每日工作台</p>
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="operator" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="operator123" />
        </el-form-item>
        <el-alert v-if="error" :title="error" type="error" :closable="false" style="margin-bottom:12px" />
        <el-button type="primary" class="full" :loading="loading" @click="submit">登录</el-button>
      </el-form>
      <p class="hint">演示账号：operator / operator123 · lead / lead123 · admin / admin123</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ensureCsrf, api } from '../api/client'
import { session } from '../stores/session'
import type { User } from '../types'

const router = useRouter()
const username = ref('operator')
const password = ref('operator123')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await ensureCsrf()
    session.user = await api<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.value, password: password.value }),
    })
    session.loaded = true
    await router.replace('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

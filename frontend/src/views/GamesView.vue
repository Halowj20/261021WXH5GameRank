<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>游戏库</h1>
        <p>按主品类路径、平台和在榜表现查找游戏，进入档案看履历与观点。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="q" placeholder="搜索游戏 / 别名 / 发行商" style="width: 280px" clearable @keyup.enter="load" @clear="load" />
      <el-select v-model="platform" clearable placeholder="平台" style="width: 150px" @change="load">
        <el-option label="微信小游戏" value="wechat_mini" />
        <el-option label="抖音小游戏" value="douyin_mini" />
      </el-select>
      <el-select v-model="categoryId" clearable placeholder="L1 品类" style="width: 160px" @change="load">
        <el-option v-for="category in l1Categories" :key="category.id" :label="category.name" :value="category.id" />
      </el-select>
      <el-button type="primary" @click="load">搜索</el-button>
      <span class="muted" style="font-size:12px">共 {{ games.length }} 款</span>
    </div>

    <section class="panel">
      <el-table :data="games" size="small" @row-click="openGame" style="cursor:pointer" empty-text="没有匹配的游戏">
        <el-table-column prop="name" label="游戏" min-width="160" />
        <el-table-column label="品类路径" min-width="190">
          <template #default="{ row }">{{ (row.category_path || []).join(' / ') || '未分类' }}</template>
        </el-table-column>
        <el-table-column label="平台" width="150">
          <template #default="{ row }">{{ (row.platforms || []).map(platformLabel).join(' / ') }}</template>
        </el-table-column>
        <el-table-column label="当前" width="80">
          <template #default="{ row }">{{ row.current_rank ? `第 ${row.current_rank}` : '—' }}</template>
        </el-table-column>
        <el-table-column label="最佳" width="80">
          <template #default="{ row }">{{ row.best_rank ? `第 ${row.best_rank}` : '—' }}</template>
        </el-table-column>
        <el-table-column prop="days_on_board" label="在榜天数" width="95" />
        <el-table-column label="数据质量" width="150">
          <template #default="{ row }">
            <span v-if="row.quality_flags?.length" class="pill warn">{{ row.quality_flags.join('、') }}</span>
            <span v-else class="pill">正常</span>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import type { Category, Game } from '../types'

const router = useRouter()
const games = ref<Game[]>([])
const categories = ref<Category[]>([])
const q = ref('')
const platform = ref('')
const categoryId = ref<number | undefined>()
const l1Categories = computed(() => categories.value.filter((category) => category.level === 1))

async function load() {
  const params = new URLSearchParams()
  if (q.value) params.set('q', q.value)
  if (platform.value) params.set('platform', platform.value)
  if (categoryId.value) params.set('category', String(categoryId.value))
  games.value = await api<Game[]>(`/api/games?${params.toString()}`)
}

function openGame(row: Game) {
  router.push(`/games/${row.id}`)
}
function platformLabel(value: string) {
  return value === 'wechat_mini' ? '微信' : '抖音'
}

onMounted(async () => {
  categories.value = await api<Category[]>('/api/categories')
  await load()
})
</script>

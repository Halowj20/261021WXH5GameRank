<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>待核队列</h1>
        <p>把不确定的游戏、品类和观点处理掉，再去看榜单和日报。</p>
      </div>
      <el-button @click="reloadAll">刷新</el-button>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="label">待映射</div><div class="value">{{ summary.mapping }}</div></div>
      <div class="stat-card"><div class="label">待补品类</div><div class="value">{{ summary.category }}</div></div>
      <div class="stat-card"><div class="label">待核观点</div><div class="value">{{ summary.claims }}</div></div>
      <div class="stat-card"><div class="label">解析异常</div><div class="value">{{ summary.errors }}</div></div>
    </div>

    <section class="panel">
      <el-tabs v-model="tab" @tab-change="loadTab">
        <el-tab-pane :label="`游戏映射 ${summary.mapping}`" name="mapping">
          <el-table :data="rows" size="small" empty-text="没有待映射的观测">
            <el-table-column prop="raw_game_name" label="原文名称" min-width="180" />
            <el-table-column label="平台/榜次" width="160">
              <template #default="{ row }">{{ platformLabel(row.platform) }} · {{ boardLabel(row.board_type) }} · 第 {{ row.rank }} 名</template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="130" />
            <el-table-column prop="confidence" label="置信度" width="90" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button type="primary" link @click="openMap(row)">映射</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`品类待补 ${summary.category}`" name="category">
          <el-table :data="rows" size="small" empty-text="没有待补品类的游戏">
            <el-table-column prop="name" label="游戏" min-width="180" />
            <el-table-column label="当前品类" min-width="160">
              <template #default="{ row }">{{ (row.category_path || []).join(' / ') || '未分类' }}</template>
            </el-table-column>
            <el-table-column label="平台" width="150"><template #default="{ row }">{{ (row.platforms || []).map(platformLabel).join(' / ') }}</template></el-table-column>
            <el-table-column label="质量标记" min-width="150"><template #default="{ row }">{{ (row.quality_flags || []).join('、') || '—' }}</template></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button type="primary" link @click="openCategory(row)">补品类</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`观点待核 ${summary.claims}`" name="claims">
          <el-empty v-if="!rows.length" description="没有待核观点" />
          <div v-for="row in rows" :key="row.id" class="panel" style="margin-bottom:12px">
            <div>{{ row.claim_text }}</div>
            <div class="quote">{{ row.quote }}</div>
            <div class="muted" style="font-size:12px;margin-bottom:10px">{{ row.source }} · 置信度 {{ row.confidence }}</div>
            <div class="actions">
              <el-button size="small" type="primary" @click="verifyClaim(row.id, 'confirmed')">确认观点</el-button>
              <el-button size="small" type="warning" @click="verifyClaim(row.id, 'disputed')">标记分歧</el-button>
              <el-button size="small" @click="$router.push(`/articles/${row.article_id}`)">查看原文</el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`解析异常 ${summary.errors}`" name="errors">
          <el-table :data="rows" size="small" empty-text="没有解析异常">
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column prop="source" label="来源" width="130" />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column prop="failure_reason" label="失败原因" min-width="220" />
            <el-table-column label="操作" width="170">
              <template #default="{ row }">
                <el-button link type="primary" @click="retry(row.id)">重试</el-button>
                <el-button link @click="$router.push({ path: '/ingest', query: { tab: 'fulltext', title: row.title } })">转全文</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="mapVisible" title="映射游戏" width="520px">
      <el-form label-position="top">
        <el-form-item label="原文名称"><el-input :model-value="current?.raw_game_name" disabled /></el-form-item>
        <el-radio-group v-model="mapMode" style="margin-bottom:14px">
          <el-radio value="existing">选择已有游戏</el-radio>
          <el-radio value="new">新建游戏</el-radio>
        </el-radio-group>
        <template v-if="mapMode === 'existing'">
          <el-form-item label="游戏">
            <el-select v-model="mapGameId" filterable placeholder="搜索游戏" style="width:100%">
              <el-option v-for="game in games" :key="game.id" :label="game.name" :value="game.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="新游戏主名"><el-input v-model="newGameName" /></el-form-item>
          <el-form-item label="品类（可选，L2/L3）">
            <el-select v-model="mapCategoryId" clearable filterable style="width:100%">
              <el-option v-for="category in leafCategories" :key="category.id" :label="categoryLabel(category)" :value="category.id" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="mapVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMap">保存映射</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryVisible" title="补全品类" width="480px">
      <el-form label-position="top">
        <el-form-item label="游戏"><el-input :model-value="current?.name" disabled /></el-form-item>
        <el-form-item label="品类（L2/L3）">
          <el-select v-model="categoryId" filterable style="width:100%">
            <el-option v-for="category in leafCategories" :key="category.id" :label="categoryLabel(category)" :value="category.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存品类</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import type { Category, Game } from '../types'

const summary = ref({ mapping: 0, category: 0, claims: 0, errors: 0, total: 0 })
const tab = ref<'mapping' | 'category' | 'claims' | 'errors'>('mapping')
const rows = ref<any[]>([])
const games = ref<Game[]>([])
const categories = ref<Category[]>([])
const current = ref<any>(null)
const mapVisible = ref(false)
const mapMode = ref<'existing' | 'new'>('existing')
const mapGameId = ref<number | undefined>()
const mapCategoryId = ref<number | undefined>()
const newGameName = ref('')
const categoryVisible = ref(false)
const categoryId = ref<number | undefined>()

const leafCategories = computed(() => categories.value.filter((category) => category.level >= 2))

async function loadSummary() {
  summary.value = await api('/api/review/summary')
}
async function loadTab() {
  rows.value = await api(`/api/review?tab=${tab.value}`)
}
async function loadGames() {
  games.value = await api<Game[]>('/api/games?limit=300')
}
async function loadCategories() {
  categories.value = await api<Category[]>('/api/categories')
}
async function reloadAll() {
  await Promise.all([loadSummary(), loadTab(), loadGames(), loadCategories()])
}

function openMap(row: any) {
  current.value = row
  mapMode.value = 'existing'
  mapGameId.value = undefined
  mapCategoryId.value = undefined
  newGameName.value = row.raw_game_name
  mapVisible.value = true
}
async function submitMap() {
  const payload: any = {}
  if (mapMode.value === 'existing') payload.game_id = mapGameId.value
  else {
    payload.new_game_name = newGameName.value
    payload.category_id = mapCategoryId.value
  }
  await api(`/api/review/observations/${current.value.id}/map`, { method: 'POST', body: JSON.stringify(payload) })
  ElMessage.success('映射已保存')
  mapVisible.value = false
  await reloadAll()
}

function openCategory(row: any) {
  current.value = row
  categoryId.value = undefined
  categoryVisible.value = true
}
async function submitCategory() {
  await api(`/api/review/games/${current.value.id}/category`, { method: 'POST', body: JSON.stringify({ category_id: categoryId.value }) })
  ElMessage.success('品类已保存')
  categoryVisible.value = false
  await reloadAll()
}

async function verifyClaim(id: number, status: 'confirmed' | 'disputed') {
  await api(`/api/review/claims/${id}/verify`, { method: 'POST', body: JSON.stringify({ status }) })
  ElMessage.success('观点状态已更新')
  await reloadAll()
}
async function retry(id: number) {
  await api(`/api/review/articles/${id}/retry`, { method: 'POST' })
  ElMessage.success('已提交重试')
  await reloadAll()
}

function categoryLabel(category: Category) {
  const parent = categories.value.find((item) => item.id === category.parent_id)
  return parent ? `${parent.name} / ${category.name}` : category.name
}
function platformLabel(value: string) {
  return value === 'wechat_mini' ? '微信' : '抖音'
}
function boardLabel(value: string) {
  return ({ hot: '热门榜', revenue: '畅销榜', new: '新游榜' } as Record<string, string>)[value] || value
}

onMounted(reloadAll)
</script>

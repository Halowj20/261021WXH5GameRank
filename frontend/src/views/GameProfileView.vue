<template>
  <div class="page" v-if="profile">
    <div class="page-head">
      <div>
        <el-button link @click="$router.back()">← 返回</el-button>
        <h1 style="margin-top:8px">{{ profile.game.name }}</h1>
        <p>{{ profile.game.category_path.join(' / ') || '未分类' }} · {{ profile.game.publisher || '发行商待补' }} · {{ profile.game.platforms.map(platformLabel).join(' / ') }}</p>
      </div>
      <el-button v-if="canWrite" type="primary" @click="openEdit">编辑档案</el-button>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="label">当前名次</div><div class="value">{{ profile.stats.current_rank ?? '—' }}</div></div>
      <div class="stat-card"><div class="label">历史最佳</div><div class="value">{{ profile.stats.best_rank ?? '—' }}</div></div>
      <div class="stat-card"><div class="label">在榜天数</div><div class="value">{{ profile.stats.days_on_board }}</div></div>
      <div class="stat-card"><div class="label">连续在榜</div><div class="value">{{ profile.stats.streak }}</div></div>
    </div>

    <section class="panel">
      <el-tabs>
        <el-tab-pane label="概览">
          <div class="split">
            <div>
              <h3 class="section-title">基础身份</h3>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="发行商">{{ profile.game.publisher || '—' }}</el-descriptions-item>
                <el-descriptions-item label="研发商">{{ profile.game.developer || '—' }}</el-descriptions-item>
                <el-descriptions-item label="上线日期">{{ profile.game.release_date || '—' }}</el-descriptions-item>
                <el-descriptions-item label="运营状态">{{ profile.game.online_status }}</el-descriptions-item>
                <el-descriptions-item label="ISBN">{{ profile.game.has_isbn ? '有' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="品类来源">{{ profile.game.category_source }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <div>
              <h3 class="section-title">别名与质量</h3>
              <div class="actions" style="margin-bottom:12px">
                <span v-for="alias in profile.aliases" :key="alias.alias" class="pill">{{ alias.alias }}</span>
                <span v-if="!profile.aliases.length" class="muted">暂无别名</span>
              </div>
              <div class="actions">
                <span v-for="flag in profile.quality_flags" :key="flag" class="pill warn">{{ flag }}</span>
                <span v-if="!profile.quality_flags.length" class="pill">数据质量正常</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="榜单履历">
          <el-table :data="profile.history" size="small" empty-text="暂无榜单履历">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column label="平台" width="100"><template #default="{ row }">{{ platformLabel(row.platform) }}</template></el-table-column>
            <el-table-column label="榜种" width="110"><template #default="{ row }">{{ boardLabel(row.board_type) }}</template></el-table-column>
            <el-table-column prop="rank" label="名次" width="80" />
            <el-table-column label="变化" width="100">
              <template #default="{ row }"><span :class="['pill', row.trend === 'new' ? 'warn' : '']">{{ trendLabel(row) }}</span></template>
            </el-table-column>
            <el-table-column label="快照状态" width="110"><template #default="{ row }">{{ row.status === 'confirmed' ? '已确认' : '暂定' }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="观点档案">
          <el-empty v-if="!profile.claims.length" description="暂无相关观点" />
          <div v-for="claim in profile.claims" :key="claim.id" class="panel" style="margin-bottom:12px">
            <div>{{ claim.text }}</div>
            <div class="quote">{{ claim.quote }}</div>
            <div class="muted" style="font-size:12px">{{ claim.source }} · {{ claim.stance }} · {{ claim.verify_status }}</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="素材溯源">
          <el-empty v-if="!profile.sources.length" description="暂无关联文章" />
          <el-table v-else :data="profile.sources" size="small">
            <el-table-column prop="name" label="来源" width="150" />
          </el-table>
          <el-button v-if="profile.sources.length" style="margin-top:12px" @click="$router.push('/rankings')">去榜单查看证据</el-button>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="editVisible" title="编辑游戏档案" width="560px">
      <el-form label-position="top">
        <el-form-item label="游戏主名"><el-input v-model="form.canonical_name" /></el-form-item>
        <el-form-item label="发行商"><el-input v-model="form.publisher" /></el-form-item>
        <el-form-item label="研发商"><el-input v-model="form.developer" /></el-form-item>
        <el-form-item label="品类（L2/L3）">
          <el-select v-model="form.category_id" filterable style="width:100%">
            <el-option v-for="category in leafCategories" :key="category.id" :label="categoryLabel(category)" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="别名（逗号分隔）"><el-input v-model="form.aliasesText" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
  <div v-else class="page"><el-empty description="加载中或游戏不存在" /></div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import { session } from '../stores/session'
import type { Category } from '../types'

const route = useRoute()
const profile = ref<any>(null)
const categories = ref<Category[]>([])
const editVisible = ref(false)
const form = ref<any>({ canonical_name: '', publisher: '', developer: '', category_id: undefined, aliasesText: '' })
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const leafCategories = computed(() => categories.value.filter((category) => category.level >= 2))

async function load() {
  profile.value = await api(`/api/games/${route.params.id}`)
}
function openEdit() {
  form.value = {
    canonical_name: profile.value.game.name,
    publisher: profile.value.game.publisher,
    developer: profile.value.game.developer,
    category_id: profile.value.game.category_id,
    aliasesText: profile.value.aliases.map((alias: any) => alias.alias).join(', '),
  }
  editVisible.value = true
}
async function saveEdit() {
  const aliases = form.value.aliasesText.split(',').map((value: string) => value.trim()).filter(Boolean)
  const payload: any = {
    canonical_name: form.value.canonical_name,
    publisher: form.value.publisher,
    developer: form.value.developer,
    aliases,
  }
  if (form.value.category_id) payload.category_id = form.value.category_id
  await api(`/api/games/${route.params.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
  ElMessage.success('档案已保存')
  editVisible.value = false
  await load()
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
function trendLabel(row: any) {
  if (row.trend === 'new') return '新进'
  if (row.trend === 'up') return `↑ ${row.delta ?? ''}`
  if (row.trend === 'down') return `↓ ${Math.abs(row.delta ?? 0)}`
  return '持平'
}

onMounted(async () => {
  categories.value = await api<Category[]>('/api/categories')
  await load()
})
</script>

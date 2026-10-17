<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>{{ greeting }}，主人</h1>
        <p>{{ todayLabel }} · 今天先把待核清掉，再看榜单异动</p>
      </div>
      <div class="actions">
        <el-button v-if="canWrite" type="primary" @click="$router.push('/ingest')">投喂新文章</el-button>
        <el-button @click="$router.push('/rankings')">查看榜单</el-button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">待核事项</div>
        <div class="value">{{ data?.pending.total ?? 0 }}</div>
        <div class="hint">映射 {{ data?.pending.mapping ?? 0 }} · 品类 {{ data?.pending.category ?? 0 }} · 观点 {{ data?.pending.claims ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">今日新进</div>
        <div class="value">{{ data?.new_entries ?? 0 }}</div>
        <div class="hint">来自已确认榜单</div>
      </div>
      <div class="stat-card">
        <div class="label">覆盖信源</div>
        <div class="value">{{ data?.source_coverage ?? 0 }}</div>
        <div class="hint">启用中的公众号</div>
      </div>
      <div class="stat-card">
        <div class="label">日报进度</div>
        <div class="value">{{ data?.digest ? `${data.digest.selected}/${data.digest.total}` : '—' }}</div>
        <div class="hint">{{ data?.digest ? (data.digest.status === 'draft' ? '草稿待定稿' : '已定稿') : '今日尚未生成' }}</div>
      </div>
    </div>

    <div class="split">
      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2 class="section-title">今日异动</h2>
          <el-button link @click="$router.push('/rankings')">全部榜单</el-button>
        </div>
        <el-table :data="data?.movements ?? []" size="small" empty-text="今天暂无已入库的榜单异动">
          <el-table-column label="游戏" min-width="150">
            <template #default="{ row }">
              <el-link type="primary" @click="$router.push(`/games/${row.game_id}`)">{{ row.game_name }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="榜单位置" width="130">
            <template #default="{ row }">{{ platformLabel(row.platform) }} · 第 {{ row.rank }} 名</template>
          </el-table-column>
          <el-table-column label="变化" width="120">
            <template #default="{ row }">
              <span :class="['pill', row.trend === 'new' ? 'warn' : '']">{{ trendLabel(row) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2 class="section-title">待核队列</h2>
          <el-button v-if="canWrite" link @click="$router.push('/review')">去处理</el-button>
        </div>
        <div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-bottom:0">
          <div class="stat-card">
            <div class="label">游戏映射</div>
            <div class="value">{{ data?.pending.mapping ?? 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="label">品类待补</div>
            <div class="value">{{ data?.pending.category ?? 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="label">观点待核</div>
            <div class="value">{{ data?.pending.claims ?? 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="label">解析异常</div>
            <div class="value">{{ data?.pending.errors ?? 0 }}</div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 class="section-title">最近投喂</h2>
        <el-button v-if="data?.digest" link @click="$router.push(`/digest/${data.digest.date}`)">打开今日日报</el-button>
      </div>
      <el-table :data="data?.recent_articles ?? []" size="small" empty-text="还没有已确认的文章">
        <el-table-column prop="title" label="标题" min-width="240" />
        <el-table-column prop="source" label="来源" width="130" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><span class="pill">{{ statusLabel(row.status) }}</span></template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.time) }}</template>
        </el-table-column>
        <el-table-column label="" width="80">
          <template #default="{ row }"><el-button link @click="$router.push(`/articles/${row.id}`)">查看</el-button></template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { api } from '../api/client'
import { session } from '../stores/session'

type Workbench = {
  date: string
  pending: { mapping: number; category: number; claims: number; errors: number; total: number }
  new_entries: number
  source_coverage: number
  movements: { game_id: number; game_name: string; platform: string; board_type: string; rank: number; trend: string; delta: number | null }[]
  digest: { status: string; selected: number; total: number; date: string } | null
  recent_articles: { id: number; title: string; source: string; status: string; time: string }[]
}

const data = ref<Workbench | null>(null)
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const todayLabel = dayjs().format('YYYY年M月D日 dddd')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9) return '早上好'
  if (hour >= 9 && hour < 12) return '上午好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  if (hour >= 18 && hour < 23) return '晚上好'
  return '夜深了'
})

async function load() {
  data.value = await api<Workbench>('/api/workbench')
}

function platformLabel(value: string) {
  return value === 'wechat_mini' ? '微信' : '抖音'
}
function trendLabel(row: { trend: string; delta: number | null; rank: number }) {
  if (row.trend === 'new') return '新进'
  if (row.trend === 'up') return `↑ ${row.delta ?? ''}`
  if (row.trend === 'down') return `↓ ${Math.abs(row.delta ?? 0)}`
  return '持平'
}
function statusLabel(value: string) {
  return ({ received: '已接收', fetched: '已抓取', parsed: '已解析', extracted: '已抽取', needs_review: '待核', failed: '失败', categorized: '已归类', published: '已发布' } as Record<string, string>)[value] || value
}
function formatTime(value: string) {
  return dayjs(value).format('MM-DD HH:mm')
}

onMounted(load)
</script>

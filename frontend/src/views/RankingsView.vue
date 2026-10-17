<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>榜单中心</h1>
        <p>官方原始榜单为基准，公众号转述用于校验；差异需要人工记录结论。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="platform" @change="load">
        <el-radio-button value="wechat_mini">微信小游戏</el-radio-button>
        <el-radio-button value="douyin_mini">抖音小游戏</el-radio-button>
      </el-radio-group>
      <el-select v-model="board" style="width: 140px" @change="load">
        <el-option label="热门榜" value="hot" />
        <el-option label="畅销榜" value="revenue" />
        <el-option label="新游榜" value="new" />
      </el-select>
      <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width: 160px" @change="load" />
      <span v-if="data" class="pill" :class="data.status === 'provisional' ? 'warn' : ''">{{ statusLabel(data.status) }}</span>
      <span v-if="data" class="muted" style="font-size:12px">差异 {{ data.conflicts.length }} 条</span>
    </div>

    <el-alert v-if="data?.status === 'provisional'" type="warning" :closable="false" title="暂定快照：今天还没有官方原始榜单，当前使用公众号转述生成，未经官方核对。" style="margin-bottom:16px" />

    <div v-if="data && data.status !== 'missing'" class="split">
      <section class="panel">
        <h2 class="section-title">{{ data.official?.source_label }}</h2>
        <el-table :data="data.official?.entries || []" size="small" max-height="620">
          <el-table-column prop="rank" label="#" width="50" />
          <el-table-column label="游戏" min-width="150">
            <template #default="{ row }">
              <el-link v-if="row.game_id" type="primary" @click="$router.push(`/games/${row.game_id}`)">{{ row.game_name }}</el-link>
              <span v-else>{{ row.raw_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="品类" width="130">
            <template #default="{ row }">{{ (row.category_path || []).slice(1).join(' / ') || '未分类' }}</template>
          </el-table-column>
          <el-table-column label="变化" width="90">
            <template #default="{ row }"><span :class="['pill', row.trend === 'new' ? 'warn' : '']">{{ trendLabel(row) }}</span></template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <h2 class="section-title">公众号转述</h2>
        <el-tabs v-if="data.citations.length" type="border-card">
          <el-tab-pane v-for="citation in data.citations" :key="citation.article_id" :label="citation.source_name">
            <el-table :data="citation.entries" size="small" max-height="560">
              <el-table-column prop="rank" label="#" width="50" />
              <el-table-column label="游戏" min-width="150">
                <template #default="{ row }">
                  <el-link v-if="row.game_id" type="primary" @click="$router.push(`/games/${row.game_id}`)">{{ row.game_name }}</el-link>
                  <span v-else>{{ row.raw_name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="与官方差" width="100">
                <template #default="{ row }">
                  <span v-if="row.diff !== null && row.diff !== 0" class="pill danger">{{ row.diff > 0 ? `低 ${row.diff}` : `高 ${Math.abs(row.diff)}` }}</span>
                  <span v-else class="muted">—</span>
                </template>
              </el-table-column>
              <el-table-column label="" width="80">
                <template #default="{ row }">
                  <el-button link @click="openEvidence(row.game_id)">证据</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button link style="margin-top:8px" @click="$router.push(`/articles/${citation.article_id}`)">查看原文</el-button>
          </el-tab-pane>
        </el-tabs>
        <el-empty v-else description="暂无公众号转述" />
      </section>
    </div>
    <el-empty v-else description="该日期暂无榜单数据" />

    <section v-if="data?.conflicts.length" class="panel">
      <h2 class="section-title">差异与结论</h2>
      <el-table :data="data.conflicts" size="small">
        <el-table-column label="游戏" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="openEvidence(row.game_id)">{{ row.game_name || `游戏 #${row.game_id}` }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="官方" width="80"><template #default="{ row }">第 {{ row.official_rank }} 名</template></el-table-column>
        <el-table-column label="转述" width="80"><template #default="{ row }">第 {{ row.citation_rank }} 名</template></el-table-column>
        <el-table-column prop="source_name" label="来源" width="130" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span :class="['pill', row.status === 'open' ? 'warn' : '']">{{ conflictLabel(row.status) }}</span></template>
        </el-table-column>
        <el-table-column prop="note" label="结论备注" min-width="160" />
        <el-table-column label="操作" width="190">
          <template #default="{ row }">
            <template v-if="row.status === 'open' && canWrite">
              <el-button link type="primary" @click="resolve(row, 'resolved')">标记已核实</el-button>
              <el-button link type="warning" @click="resolve(row, 'kept')">保留分歧</el-button>
            </template>
            <span v-else class="muted">已记录</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="evidenceVisible" title="差异证据" size="560px">
      <template v-if="evidence">
        <h3>{{ evidence.game.name }}</h3>
        <p class="muted">{{ (evidence.game.category_path || []).join(' / ') }}</p>
        <div class="panel">
          <h4>名次口径</h4>
          <el-table :data="evidence.observations" size="small">
            <el-table-column prop="source_name" label="来源" />
            <el-table-column prop="source_type" label="类型" width="140" />
            <el-table-column prop="rank" label="名次" width="80" />
            <el-table-column label="" width="70">
              <template #default="{ row }"><el-button v-if="row.article_id" link @click="$router.push(`/articles/${row.article_id}`)">原文</el-button></template>
            </el-table-column>
          </el-table>
        </div>
        <div class="panel">
          <h4>相关观点</h4>
          <div v-if="evidence.claims.length">
            <div v-for="claim in evidence.claims" :key="claim.id" style="margin-bottom:12px">
              <div>{{ claim.text }}</div>
              <div class="quote">{{ claim.quote }}</div>
              <div class="muted" style="font-size:12px">{{ claim.source }} · {{ claim.stance }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无相关观点" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import { session } from '../stores/session'
import type { RankingResponse } from '../types'

const platform = ref('wechat_mini')
const board = ref('hot')
const date = ref(dayjs().format('YYYY-MM-DD'))
const data = ref<RankingResponse | null>(null)
const evidence = ref<any>(null)
const evidenceVisible = ref(false)
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))

async function load() {
  data.value = await api<RankingResponse>(`/api/rankings?platform=${platform.value}&board=${board.value}&date=${date.value}`)
}

async function openEvidence(gameId: number | null) {
  if (!gameId) return
  evidence.value = await api(`/api/rankings/evidence?platform=${platform.value}&board=${board.value}&date=${date.value}&game_id=${gameId}`)
  evidenceVisible.value = true
}

async function resolve(row: { id: number }, status: 'resolved' | 'kept') {
  const title = status === 'resolved' ? '标记已核实' : '保留分歧'
  const { value } = await ElMessageBox.prompt('填写结论备注（可留空）', title, {
    inputType: 'textarea',
    inputPlaceholder: '例如：官方榜单延迟更新，采用转述口径',
    confirmButtonText: '保存',
    cancelButtonText: '取消',
  })
  await api(`/api/conflicts/${row.id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status, note: value || '' }),
  })
  ElMessage.success('结论已记录')
  await load()
}

function statusLabel(value: string) {
  return ({ confirmed: '官方已确认', provisional: '暂定', missing: '无数据' } as Record<string, string>)[value] || value
}
function conflictLabel(value: string) {
  return ({ open: '待处理', resolved: '已核实', kept: '保留分歧' } as Record<string, string>)[value] || value
}
function trendLabel(row: { trend: string; delta: number | null }) {
  if (row.trend === 'new') return '新进'
  if (row.trend === 'up') return `↑ ${row.delta ?? ''}`
  if (row.trend === 'down') return `↓ ${Math.abs(row.delta ?? 0)}`
  return '持平'
}

onMounted(load)
</script>

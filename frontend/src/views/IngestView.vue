<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>投喂台</h1>
        <p>链接、截图、全文三条通道统一进入解析管道；确认后才计入榜单事实。</p>
      </div>
      <el-button @click="$router.push('/')">返回工作台</el-button>
    </div>

    <section class="panel">
      <div class="toolbar">
        <span class="muted">来源公众号</span>
        <el-select v-model="sourceId" clearable placeholder="可选" style="width: 220px">
          <el-option v-for="source in sources" :key="source.id" :label="source.name" :value="source.id" />
        </el-select>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="链接投喂" name="link">
          <el-input v-model="linkText" type="textarea" :rows="8" placeholder="每行一个公众号文章链接，最多 20 条" />
          <div class="actions" style="margin-top:12px">
            <el-button type="primary" :loading="submitting" @click="submitLink">解析链接</el-button>
            <span class="muted" style="font-size:12px;align-self:center">真实抓取正文；无模型 Key 时使用本地固定抽取器打通链路。</span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="截图投喂" name="screenshot">
          <el-input v-model="screenshotTitle" placeholder="截图标题（可选）" style="max-width: 420px;margin-bottom:12px" />
          <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onFileChange">
            <el-button>选择截图</el-button>
          </el-upload>
          <div class="muted" style="font-size:12px;margin-top:8px" v-if="screenshotFile">已选择：{{ screenshotFile.name }}</div>
          <div class="actions" style="margin-top:12px">
            <el-button type="primary" :loading="submitting" :disabled="!screenshotFile" @click="submitScreenshot">识别截图</el-button>
            <span class="muted" style="font-size:12px;align-self:center">调用 RapidOCR 识别榜单文字。</span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="全文兜底" name="fulltext">
          <el-input v-model="fulltextTitle" placeholder="文章标题" style="max-width: 520px;margin-bottom:12px" />
          <el-input v-model="fulltextText" type="textarea" :rows="10" placeholder="粘贴公众号全文或榜单文字" />
          <div class="actions" style="margin-top:12px">
            <el-button type="primary" :loading="submitting" @click="submitFulltext">解析全文</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section class="panel" v-if="tasks.length">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 class="section-title">本次投喂结果</h2>
        <div class="actions">
          <el-button size="small" @click="refreshTasks">刷新状态</el-button>
          <el-button size="small" type="primary" @click="previewVisible = true">预览并确认</el-button>
        </div>
      </div>
      <el-table :data="tasks" size="small">
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column label="来源" width="130">
          <template #default="{ row }">{{ row.source?.name || '未指定' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="pill">{{ statusLabel(row.parse_status) }}</span></template>
        </el-table-column>
        <el-table-column prop="obs_count" label="观测" width="70" />
        <el-table-column prop="claim_count" label="观点" width="70" />
        <el-table-column label="重复" width="80">
          <template #default="{ row }"><span v-if="row.duplicate" class="pill warn">重复</span><span v-else class="muted">—</span></template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link @click="$router.push(`/articles/${row.id}`)">详情</el-button>
            <el-button v-if="row.parse_status === 'failed'" link type="warning" @click="retry(row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="previewVisible" title="解析预览" size="520px">
      <p class="muted">确认后文章才进入榜单事实；取消会删除本次草稿。正文/榜单候选修正暂未纳入本期。</p>
      <div v-for="item in tasks" :key="item.id" class="panel" style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;gap:10px">
          <strong>{{ item.title }}</strong>
          <span class="pill">{{ statusLabel(item.parse_status) }}</span>
        </div>
        <div class="muted" style="font-size:12px;margin-top:6px">
          来源：{{ item.source?.name || '未指定' }} · 观测 {{ item.obs_count ?? 0 }} · 观点 {{ item.claim_count ?? 0 }}
        </div>
        <div v-if="item.duplicate" class="pill warn" style="margin-top:8px">重复文章，不会重复入库</div>
      </div>
      <template #footer>
        <el-button @click="cancelTasks">取消本次</el-button>
        <el-button type="primary" :loading="confirming" @click="confirmTasks">确认入库</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { api } from '../api/client'
import type { Article, Source } from '../types'

const route = useRoute()
const activeTab = ref<'link' | 'fulltext' | 'screenshot'>((route.query.tab as string) === 'fulltext' ? 'fulltext' : 'link')
const sources = ref<Source[]>([])
const sourceId = ref<number | undefined>()
const linkText = ref('')
const screenshotTitle = ref('')
const screenshotFile = ref<File | null>(null)
const fulltextTitle = ref((route.query.title as string) || '')
const fulltextText = ref('')
const submitting = ref(false)
const confirming = ref(false)
const previewVisible = ref(false)
const tasks = ref<Article[]>([])
let timer: number | undefined

async function loadSources() {
  sources.value = await api<Source[]>('/api/sources')
}

function onFileChange(file: UploadFile) {
  screenshotFile.value = file.raw || null
}

function mergeTasks(items: Article[]) {
  for (const item of items) {
    const index = tasks.value.findIndex((task) => task.id === item.id)
    if (index >= 0) tasks.value[index] = { ...tasks.value[index], ...item, duplicate: tasks.value[index].duplicate || item.duplicate }
    else tasks.value.push(item)
  }
  startPolling()
}

function isTerminal(status: string) {
  return ['extracted', 'needs_review', 'failed'].includes(status)
}

function startPolling() {
  stopPolling()
  timer = window.setInterval(refreshTasks, 1500)
}

function stopPolling() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}

async function refreshTasks() {
  const ids = tasks.value.map((task) => task.id)
  if (!ids.length) return
  try {
    const fresh = await api<Article[]>(`/api/ingest/tasks?ids=${ids.join(',')}`)
    for (const item of fresh) {
      const index = tasks.value.findIndex((task) => task.id === item.id)
      if (index >= 0) tasks.value[index] = { ...tasks.value[index], ...item, duplicate: tasks.value[index].duplicate || item.duplicate }
    }
    if (tasks.value.every((task) => isTerminal(task.parse_status) || task.duplicate)) stopPolling()
  } catch {
    stopPolling()
  }
}

async function submitLink() {
  const urls = linkText.value.split(/\s+/).map((value) => value.trim()).filter(Boolean)
  if (!urls.length) return ElMessage.warning('请先填写链接')
  submitting.value = true
  try {
    const result = await api<{ articles: Article[] }>('/api/ingest/link', {
      method: 'POST',
      body: JSON.stringify({ urls, source_id: sourceId.value }),
    })
    mergeTasks(result.articles)
    ElMessage.success(`已提交 ${result.articles.length} 条链接`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

async function submitFulltext() {
  if (!fulltextText.value.trim()) return ElMessage.warning('请粘贴正文')
  submitting.value = true
  try {
    const result = await api<{ articles: Article[] }>('/api/ingest/fulltext', {
      method: 'POST',
      body: JSON.stringify({ title: fulltextTitle.value, text: fulltextText.value, source_id: sourceId.value }),
    })
    mergeTasks(result.articles)
    ElMessage.success('已提交全文')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

async function submitScreenshot() {
  if (!screenshotFile.value) return
  submitting.value = true
  try {
    const form = new FormData()
    form.append('file', screenshotFile.value)
    form.append('title', screenshotTitle.value || '截图投喂')
    if (sourceId.value) form.append('source_id', String(sourceId.value))
    const result = await api<{ articles: Article[] }>('/api/ingest/screenshot', { method: 'POST', body: form })
    mergeTasks(result.articles)
    ElMessage.success('截图已提交识别')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

async function confirmTasks() {
  const ids = tasks.value.filter((task) => !task.duplicate && task.is_draft).map((task) => task.id)
  if (!ids.length) {
    previewVisible.value = false
    return
  }
  confirming.value = true
  try {
    await api('/api/ingest/confirm', { method: 'POST', body: JSON.stringify({ ids }) })
    ElMessage.success('已确认入库')
    previewVisible.value = false
    tasks.value = []
    stopPolling()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '确认失败')
  } finally {
    confirming.value = false
  }
}

async function cancelTasks() {
  const ids = tasks.value.filter((task) => task.is_draft && !task.duplicate).map((task) => task.id)
  if (ids.length) {
    await api('/api/ingest/cancel', { method: 'POST', body: JSON.stringify({ ids }) })
  }
  tasks.value = []
  previewVisible.value = false
  stopPolling()
}

async function retry(task: Article) {
  await api(`/api/ingest/articles/${task.id}/retry`, { method: 'POST' })
  task.parse_status = 'received'
  startPolling()
}

function statusLabel(value: string) {
  return ({ received: '已接收', fetched: '已抓取', parsed: '已解析', extracted: '已抽取', needs_review: '待核', failed: '失败', categorized: '已归类', published: '已发布' } as Record<string, string>)[value] || value
}

onMounted(loadSources)
onBeforeUnmount(stopPolling)
</script>

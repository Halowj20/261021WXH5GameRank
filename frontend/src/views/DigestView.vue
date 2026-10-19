<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>日报编辑器</h1>
        <p>自动生成初稿，人工勾选、改写、排序后定稿；定稿后锁定，只保留导出。</p>
      </div>
      <div class="actions">
        <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width: 150px" @change="changeDate" />
        <el-button v-if="canWrite && digest?.status === 'draft'" :loading="generating" @click="generate">{{ digest ? '重新生成' : '生成初稿' }}</el-button>
        <el-button v-if="canWrite && digest?.status === 'draft'" type="primary" @click="finalize">定稿</el-button>
        <el-button v-if="digest" @click="exportMarkdown">导出 Markdown</el-button>
      </div>
    </div>

    <el-empty v-if="!digest" description="该日期尚未生成日报">
      <el-button v-if="canWrite" type="primary" :loading="generating" @click="generate">生成初稿</el-button>
    </el-empty>

    <template v-else>
      <div class="toolbar">
        <span class="pill" :class="digest.status === 'reviewed' ? '' : 'warn'">{{ digest.status === 'reviewed' ? '已定稿' : '草稿' }}</span>
        <span class="muted" style="font-size:12px">已选 {{ includedCount }} / {{ digest.items.length }} 条 · 生成于 {{ formatTime(digest.generated_at) }}</span>
        <el-alert v-if="digest.status === 'reviewed'" type="success" :closable="false" title="已定稿：内容锁定，仍可导出 Markdown。" style="flex:1;min-width:260px" />
      </div>

      <section v-for="section in sections" :key="section.key" class="panel">
        <h2 class="section-title">{{ section.title }}</h2>
        <el-empty v-if="!section.items.length" description="本节暂无内容" />
        <div v-for="item in section.items" :key="item.id" class="panel" style="margin-bottom:10px;padding:14px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <el-checkbox v-model="item.is_included" :disabled="!canWrite || digest.status !== 'draft'" @change="toggle(item)" />
            <div style="flex:1">
              <div style="line-height:1.7">{{ item.text }}</div>
              <div class="muted" style="font-size:12px;margin-top:4px">
                <el-button link size="small" style="font-size:12px" @click="openSource(item)">来源</el-button>
                <span class="muted" style="margin:0 6px">引用：{{ item.ref_type }} #{{ item.ref_id }}</span>
                <span v-if="item.text_override" class="pill">人工改写</span>
              </div>
            </div>
            <div v-if="canWrite && digest.status === 'draft'" class="actions">
              <el-button link @click="editItem(item)">编辑</el-button>
              <el-button link @click="move(item, -1)">上移</el-button>
              <el-button link @click="move(item, 1)">下移</el-button>
              <el-button link type="danger" @click="removeItem(item)">删除</el-button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <el-drawer v-model="sourceVisible" title="来源回溯" size="440px">
      <el-skeleton v-if="sourceLoading" :rows="3" animated />
      <template v-else-if="sourceData">
        <div class="panel" style="margin-bottom:10px">
          <strong>{{ sourceData.title || refLabel(sourceData.ref_type) }}</strong>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span v-for="meta in sourceData.meta" :key="meta" class="pill">{{ meta }}</span>
          </div>
        </div>
        <template v-if="sourceData.articles.length">
          <h3 class="section-title">关联文章</h3>
          <div v-for="article in sourceData.articles" :key="article.id" class="panel" style="margin-bottom:8px;padding:12px">
            <strong>{{ article.title }}</strong>
            <div class="muted" style="font-size:12px;margin:4px 0">{{ article.source || '未指定来源' }}</div>
            <div class="actions">
              <el-button link type="primary" @click="openArticle(article.id)">文章详情</el-button>
              <el-link v-if="article.url" type="primary" :href="article.url" target="_blank" rel="noopener">原文</el-link>
            </div>
          </div>
        </template>
        <el-empty v-else description="该条目直接来自官方榜单快照，无关联文章" />
        <el-button v-if="sourceData.hint" type="primary" plain style="margin-top:12px" @click="goReview">前往待核队列</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, downloadText } from '../api/client'
import { session } from '../stores/session'
import type { Digest, DigestItem } from '../types'

const route = useRoute()
const router = useRouter()
const date = ref((route.params.date as string) || dayjs().format('YYYY-MM-DD'))
const digest = ref<Digest | null>(null)
const generating = ref(false)
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const includedCount = computed(() => digest.value?.items.filter((item) => item.is_included).length || 0)
const sectionTitles: Record<string, string> = {
  overview: '今日概览',
  wechat: '微信小游戏榜',
  douyin: '抖音小游戏榜',
  category: '品类动态',
  claims: '值得关注的观点',
  pending: '待核实事项',
}
const sections = computed(() =>
  Object.entries(sectionTitles).map(([key, title]) => ({
    key,
    title,
    items: (digest.value?.items || []).filter((item) => item.section === key).sort((a, b) => a.order - b.order || a.id - b.id),
  })),
)

async function load() {
  try {
    digest.value = await api<Digest>(`/api/digests/${date.value}`)
  } catch {
    digest.value = null
  }
}
function changeDate(value: string) {
  if (value && value !== route.params.date) router.push(`/digest/${value}`)
}
async function generate() {
  generating.value = true
  try {
    digest.value = await api<Digest>('/api/digests/generate', {
      method: 'POST',
      body: JSON.stringify({ date: date.value }),
    })
    ElMessage.success('日报初稿已生成')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '生成失败')
  } finally {
    generating.value = false
  }
}
async function toggle(item: DigestItem) {
  await api(`/api/digest-items/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_included: item.is_included }),
  })
}
async function editItem(item: DigestItem) {
  const { value } = await ElMessageBox.prompt('改写这一条内容', '编辑日报条目', {
    inputType: 'textarea',
    inputValue: item.text,
    confirmButtonText: '保存',
    cancelButtonText: '取消',
  })
  await api(`/api/digest-items/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ text_override: value || '' }),
  })
  ElMessage.success('已保存')
  await load()
}
async function move(item: DigestItem, direction: number) {
  const sectionItems = sections.value.find((section) => section.key === item.section)?.items || []
  const index = sectionItems.findIndex((candidate) => candidate.id === item.id)
  const target = index + direction
  if (target < 0 || target >= sectionItems.length) return
  const reordered = [...sectionItems]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  await api(`/api/digests/${date.value}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ item_ids: reordered.map((candidate) => candidate.id) }),
  })
  await load()
}
async function removeItem(item: DigestItem) {
  await ElMessageBox.confirm('删除这一条日报内容？', '确认删除', { type: 'warning' })
  await api(`/api/digest-items/${item.id}/delete`, { method: 'DELETE' })
  ElMessage.success('已删除')
  await load()
}
async function finalize() {
  await ElMessageBox.confirm('定稿后内容锁定，不能再编辑。确认定稿？', '定稿确认', { type: 'warning' })
  try {
    digest.value = await api<Digest>(`/api/digests/${date.value}/finalize`, { method: 'POST' })
    ElMessage.success('日报已定稿')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '定稿失败')
  }
}
async function exportMarkdown() {
  await downloadText(`/api/digests/${date.value}/export`, `digest-${date.value}.md`)
}
function formatTime(value: string) {
  return dayjs(value).format('MM-DD HH:mm')
}

interface SourceArticle {
  id: number
  title: string
  source: string
  url: string
  ingest_method: string
}
interface SourceDetail {
  ref_type: string
  ref_id: string
  title: string
  meta: string[]
  articles: SourceArticle[]
  hint: string
}

const sourceVisible = ref(false)
const sourceLoading = ref(false)
const sourceData = ref<SourceDetail | null>(null)

async function openSource(item: DigestItem) {
  sourceVisible.value = true
  sourceLoading.value = true
  sourceData.value = null
  try {
    sourceData.value = await api<SourceDetail>(`/api/digest-items/${item.id}/source`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '来源加载失败')
  } finally {
    sourceLoading.value = false
  }
}
function refLabel(type: string) {
  return ({ snapshot: '榜单快照', claim: '观点来源', conflict: '榜单分歧', review: '待核汇总' } as Record<string, string>)[type] || type
}
function openArticle(id: number) {
  sourceVisible.value = false
  router.push(`/articles/${id}`)
}
function goReview() {
  sourceVisible.value = false
  router.push('/review')
}

watch(() => route.params.date, (value) => {
  date.value = value as string
  load()
})
onMounted(load)
</script>

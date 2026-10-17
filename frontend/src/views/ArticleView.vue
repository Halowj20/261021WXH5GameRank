<template>
  <div class="page" v-if="article">
    <div class="page-head">
      <div>
        <el-button link @click="$router.back()">← 返回</el-button>
        <h1 style="margin-top:8px">{{ article.title }}</h1>
        <p>{{ article.source?.name || '未指定来源' }} · {{ article.ingest_method }} · <span class="pill">{{ statusLabel(article.parse_status) }}</span></p>
      </div>
      <div class="actions">
        <el-button v-if="canWrite && article.parse_status === 'failed'" type="warning" @click="retry">重试解析</el-button>
        <el-button @click="$router.push('/rankings')">去榜单</el-button>
      </div>
    </div>

    <section class="panel">
      <h2 class="section-title">解析管道</h2>
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="接收" />
        <el-step title="抓取" />
        <el-step title="解析" />
        <el-step title="去重" />
        <el-step title="抽取" />
        <el-step title="待核" />
        <el-step title="发布" />
      </el-steps>
      <el-alert v-if="article.failure_reason" type="error" :title="article.failure_reason" :closable="false" style="margin-top:16px" />
    </section>

    <div class="split">
      <section class="panel">
        <h2 class="section-title">正文</h2>
        <div style="white-space:pre-wrap;line-height:1.8;font-size:14px">{{ article.raw_text || '暂无正文' }}</div>
      </section>
      <section class="panel">
        <h2 class="section-title">截图 / OCR</h2>
        <el-empty v-if="!article.assets?.length" description="暂无截图素材" />
        <div v-for="asset in article.assets" :key="asset.id" style="margin-bottom:14px">
          <el-image v-if="asset.url" :src="asset.url" fit="contain" style="max-height:260px;width:100%;border-radius:10px;background:#f4f6f3" />
          <div class="muted" style="font-size:12px;margin-top:6px">OCR 置信度：{{ asset.ocr_confidence ?? '—' }}</div>
          <div class="quote" style="white-space:pre-wrap">{{ asset.ocr_text || '未识别到文字' }}</div>
        </div>
      </section>
    </div>

    <section class="panel">
      <h2 class="section-title">观测</h2>
      <el-table :data="article.observations || []" size="small" empty-text="暂无观测">
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="board_type" label="榜种" width="100" />
        <el-table-column prop="observed_date" label="日期" width="120" />
        <el-table-column prop="rank" label="名次" width="80" />
        <el-table-column prop="raw_game_name" label="原文游戏名" min-width="160" />
        <el-table-column label="映射" width="140"><template #default="{ row }">{{ row.game?.name || '待映射' }}</template></el-table-column>
      </el-table>
    </section>

    <section class="panel">
      <h2 class="section-title">观点</h2>
      <el-empty v-if="!article.claims?.length" description="暂无观点" />
      <div v-for="claim in article.claims" :key="claim.id" class="panel" style="margin-bottom:12px">
        <div>{{ claim.claim_text }}</div>
        <div class="quote">{{ claim.quote }}</div>
        <span :class="['pill', claim.verify_status === 'pending' ? 'warn' : '']">{{ claim.verify_status }}</span>
      </div>
    </section>
  </div>
  <div v-else class="page"><el-empty description="加载中或文章不存在" /></div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import { session } from '../stores/session'
import type { Article } from '../types'

const route = useRoute()
const article = ref<Article | null>(null)
const canWrite = computed(() => ['operator', 'admin'].includes(session.user?.role || ''))
const activeStep = computed(() => {
  const map: Record<string, number> = { received: 0, fetched: 1, parsed: 2, deduped: 3, extracted: 4, categorized: 4, needs_review: 5, failed: 2, published: 6 }
  return map[article.value?.parse_status || 'received'] ?? 0
})

async function load() {
  article.value = await api<Article>(`/api/articles/${route.params.id}`)
}
async function retry() {
  await api(`/api/ingest/articles/${route.params.id}/retry`, { method: 'POST' })
  ElMessage.success('已提交重试')
  await load()
}
function statusLabel(value: string) {
  return ({ received: '已接收', fetched: '已抓取', parsed: '已解析', extracted: '已抽取', needs_review: '待核', failed: '失败', categorized: '已归类', published: '已发布' } as Record<string, string>)[value] || value
}

onMounted(load)
</script>

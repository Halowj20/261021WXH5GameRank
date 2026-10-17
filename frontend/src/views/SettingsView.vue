<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>设置</h1>
        <p>维护公众号、三级品类、标签、成员与模型配置。</p>
      </div>
    </div>

    <section class="panel">
      <el-tabs>
        <el-tab-pane label="公众号">
          <div class="actions" style="margin-bottom:12px">
            <el-button type="primary" @click="sourceDialog = true">新增公众号</el-button>
          </div>
          <el-table :data="sources" size="small">
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column label="平台" width="170"><template #default="{ row }">{{ (row.platforms || []).map(platformLabel).join(' / ') }}</template></el-table-column>
            <el-table-column prop="weight" label="权重" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><el-switch v-model="row.status" active-value="active" inactive-value="paused" @change="updateSource(row)" /></template>
            </el-table-column>
            <el-table-column prop="note" label="备注" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="品类树">
          <div class="actions" style="margin-bottom:12px">
            <el-button type="primary" @click="categoryDialog = true">新增品类</el-button>
          </div>
          <el-table :data="categories" size="small">
            <el-table-column label="层级" width="80"><template #default="{ row }">L{{ row.level }}</template></el-table-column>
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column label="上级" min-width="160"><template #default="{ row }">{{ parentName(row) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="标签">
          <div class="actions" style="margin-bottom:12px">
            <el-button type="primary" @click="tagDialog = true">新增标签</el-button>
          </div>
          <el-table :data="tags" size="small">
            <el-table-column prop="name" label="标签" min-width="160" />
            <el-table-column prop="dimension" label="维度" width="140" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="成员与角色">
          <div class="actions" style="margin-bottom:12px">
            <el-button type="primary" @click="memberDialog = true">新增成员</el-button>
          </div>
          <el-table :data="members" size="small">
            <el-table-column prop="username" label="用户名" width="140" />
            <el-table-column prop="name" label="姓名" width="140" />
            <el-table-column label="角色" width="140">
              <template #default="{ row }">
                <el-select v-model="row.role" size="small" @change="updateMember(row)">
                  <el-option label="运营" value="operator" />
                  <el-option label="负责人" value="lead" />
                  <el-option label="管理员" value="admin" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="职位" min-width="140" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="模型 / OCR">
          <el-form label-position="top" style="max-width:560px">
            <el-form-item label="Base URL"><el-input v-model="modelForm.base_url" placeholder="https://api.example.com/v1" /></el-form-item>
            <el-form-item label="模型"><el-input v-model="modelForm.model" placeholder="qwen-plus" /></el-form-item>
            <el-form-item label="API Key"><el-input v-model="modelForm.api_key" type="password" show-password placeholder="留空或保持掩码则不变" /></el-form-item>
            <el-form-item label="OCR 引擎"><el-input model-value="RapidOCR（本地）" disabled /></el-form-item>
            <div class="actions">
              <el-button type="primary" @click="saveModel">保存配置</el-button>
              <el-button @click="testModel">测试连接</el-button>
              <span v-if="modelTest" class="muted" style="align-self:center">{{ modelTest }}</span>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="sourceDialog" title="新增公众号" width="480px">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="sourceForm.name" /></el-form-item>
        <el-form-item label="平台">
          <el-checkbox-group v-model="sourceForm.platforms">
            <el-checkbox value="wechat_mini">微信小游戏</el-checkbox>
            <el-checkbox value="douyin_mini">抖音小游戏</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="权重"><el-input-number v-model="sourceForm.weight" :min="1" :max="6" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="sourceForm.note" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="sourceDialog = false">取消</el-button><el-button type="primary" @click="createSource">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="categoryDialog" title="新增品类" width="480px">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="categoryForm.name" /></el-form-item>
        <el-form-item label="上级品类（不选为 L1）">
          <el-select v-model="categoryForm.parent_id" clearable filterable style="width:100%">
            <el-option v-for="category in categories.filter((item) => item.level < 3)" :key="category.id" :label="`L${category.level} ${category.name}`" :value="category.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="categoryDialog = false">取消</el-button><el-button type="primary" @click="createCategory">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="tagDialog" title="新增标签" width="440px">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="tagForm.name" /></el-form-item>
        <el-form-item label="维度">
          <el-select v-model="tagForm.dimension" style="width:100%">
            <el-option label="玩法" value="gameplay" />
            <el-option label="题材" value="theme" />
            <el-option label="美术" value="art" />
            <el-option label="变现" value="monetization" />
            <el-option label="生命周期" value="lifecycle" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="tagDialog = false">取消</el-button><el-button type="primary" @click="createTag">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="memberDialog" title="新增成员" width="460px">
      <el-form label-position="top">
        <el-form-item label="用户名"><el-input v-model="memberForm.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="memberForm.password" type="password" show-password /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="memberForm.role" style="width:100%">
            <el-option label="运营" value="operator" />
            <el-option label="负责人" value="lead" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位"><el-input v-model="memberForm.title" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="memberDialog = false">取消</el-button><el-button type="primary" @click="createMember">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import type { Category, Source } from '../types'

type Tag = { id: number; name: string; dimension: string }
type Member = { id: number; username: string; name: string; role: string; title: string }

const sources = ref<Source[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const members = ref<Member[]>([])
const sourceDialog = ref(false)
const categoryDialog = ref(false)
const tagDialog = ref(false)
const memberDialog = ref(false)
const sourceForm = ref({ name: '', platforms: ['wechat_mini'], weight: 3, note: '' })
const categoryForm = ref<{ name: string; parent_id: number | undefined }>({ name: '', parent_id: undefined })
const tagForm = ref({ name: '', dimension: 'gameplay' })
const memberForm = ref({ username: '', password: '', role: 'operator', title: '' })
const modelForm = ref({ base_url: '', model: '', api_key: '' })
const modelTest = ref('')

async function loadAll() {
  sources.value = await api<Source[]>('/api/sources')
  categories.value = await api<Category[]>('/api/categories')
  tags.value = await api<Tag[]>('/api/tags')
  members.value = await api<Member[]>('/api/auth/members')
  const model = await api<any>('/api/settings/model')
  modelForm.value = { base_url: model.base_url || '', model: model.model || '', api_key: model.api_key || '' }
}

async function createSource() {
  await api('/api/sources/create', { method: 'POST', body: JSON.stringify(sourceForm.value) })
  sourceDialog.value = false
  sourceForm.value = { name: '', platforms: ['wechat_mini'], weight: 3, note: '' }
  ElMessage.success('公众号已新增')
  await loadAll()
}
async function updateSource(row: Source) {
  await api(`/api/sources/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: row.status, weight: row.weight, note: row.note }) })
  ElMessage.success('公众号状态已更新')
}
async function createCategory() {
  await api('/api/categories/create', { method: 'POST', body: JSON.stringify(categoryForm.value) })
  categoryDialog.value = false
  categoryForm.value = { name: '', parent_id: undefined }
  ElMessage.success('品类已新增')
  await loadAll()
}
async function createTag() {
  await api('/api/tags/create', { method: 'POST', body: JSON.stringify(tagForm.value) })
  tagDialog.value = false
  tagForm.value = { name: '', dimension: 'gameplay' }
  ElMessage.success('标签已新增')
  await loadAll()
}
async function createMember() {
  await api('/api/auth/members/create', { method: 'POST', body: JSON.stringify(memberForm.value) })
  memberDialog.value = false
  memberForm.value = { username: '', password: '', role: 'operator', title: '' }
  ElMessage.success('成员已新增')
  await loadAll()
}
async function updateMember(row: Member) {
  await api(`/api/auth/members/${row.id}`, { method: 'PATCH', body: JSON.stringify({ role: row.role }) })
  ElMessage.success('角色已更新')
}
async function saveModel() {
  await api('/api/settings/model/update', { method: 'PATCH', body: JSON.stringify(modelForm.value) })
  ElMessage.success('模型配置已保存')
  await loadAll()
}
async function testModel() {
  try {
    const result = await api<any>('/api/settings/model/test', { method: 'POST' })
    modelTest.value = `连接成功（${result.latency_ms} ms）`
  } catch (err) {
    modelTest.value = err instanceof Error ? err.message : '连接失败'
  }
}
function parentName(row: Category) {
  return categories.value.find((category) => category.id === row.parent_id)?.name || '—'
}
function platformLabel(value: string) {
  return value === 'wechat_mini' ? '微信' : '抖音'
}

onMounted(loadAll)
</script>

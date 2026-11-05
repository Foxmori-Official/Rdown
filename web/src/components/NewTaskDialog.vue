<template>
  <el-dialog align-center
    :model-value="modelValue"
    :title="t('dialog.title')"
    width="680px"
    :close-on-click-modal="false"
    @update:model-value="onVisibleChange"
    @closed="reset"
  >
    <!-- 链接输入 -->
    <div class="section">
      <div class="section-title">{{ t('dialog.urlsLabel') }}</div>
      <el-input
        v-model="urlsText"
        type="textarea"
        :rows="3"
        :placeholder="t('dialog.urlsPlaceholder')"
      />
      <div class="url-bar">
        <el-button @click="torrentInputRef.click()">{{ t('dialog.chooseTorrent') }}</el-button>
        <input
          ref="torrentInputRef"
          type="file"
          accept=".torrent"
          style="display: none"
          @change="onTorrentFile"
        />
        <span v-if="torrentFileName" class="torrent-name">
          <el-icon><Folder /></el-icon> {{ torrentFileName }}
          <el-icon class="clear-icon" @click="clearTorrent"><Close /></el-icon>
        </span>
        <el-button
          type="primary"
          plain
          :loading="resolving"
          :disabled="!singleUrl"
          style="margin-left: auto"
          @click="doResolve"
        >
          {{ t('dialog.resolve') }}
        </el-button>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="resolved" class="section resolve-result">
      <template v-if="resolved.type === 'file'">
        <el-alert type="success" :closable="false" show-icon>
          <template #title>
            {{ resolved.name || t('dialog.unknownFile') }}
            <span class="muted">（{{ resolved.totalLength ? formatBytes(resolved.totalLength) : t('dialog.unknownSize') }}）</span>
          </template>
        </el-alert>
      </template>

      <template v-else-if="resolved.type === 'torrent'">
        <div class="section-title">
          {{ t('dialog.torrentContent', { name: resolved.name || t('common.unknown') }) }}
          <span class="muted">{{ t('dialog.selectFilesHint') }}</span>
        </div>
        <el-table
          v-if="resolved.files && resolved.files.length"
          ref="torrentTableRef"
          class="torrent-table"
          :data="resolved.files"
          size="small"
          max-height="220"
          @selection-change="onTorrentSelection"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column prop="path" :label="t('dialog.colFile')" show-overflow-tooltip />
          <el-table-column :label="t('dialog.colSize')" width="100">
            <template #default="{ row }">{{ formatBytes(row.length) }}</template>
          </el-table-column>
        </el-table>
        <div v-else class="muted">{{ t('dialog.magnetNote') }}</div>
        <el-alert v-if="emptyTorrentSelection" type="warning" :closable="false" show-icon
          :title="t('dialog.selectAtLeastOneFile')" />
      </template>

      <template v-else-if="resolved.type === 'stream'">
        <div class="section-title">
          {{ t('dialog.streamTitle', { name: resolved.name || t('common.unknown') }) }}
          <el-tag size="small" type="warning">{{ (resolved.format || '').toUpperCase() }}</el-tag>
          <el-tag v-if="resolved.live" size="small" type="danger">{{ t('common.live') }}</el-tag>
        </div>
        <el-radio-group v-model="streamSelect" class="variant-list">
          <el-radio value="best">{{ t('dialog.best') }}</el-radio>
          <el-radio value="worst">{{ t('dialog.worst') }}</el-radio>
          <el-radio
            v-for="v in resolved.variants || []"
            :key="v.id"
            :value="variantValue(v)"
          >
            {{ variantLabel(v) }}
          </el-radio>
        </el-radio-group>
        <el-checkbox v-model="streamMux" class="mux-check">
          {{ t('dialog.muxMp4') }}
        </el-checkbox>
        <div class="stream-keys">
          <el-input
            v-model="streamKey"
            :placeholder="t('dialog.keyPlaceholder')"
            size="small"
            clearable
          />
          <el-input
            v-model="streamIv"
            :placeholder="t('dialog.ivPlaceholder')"
            size="small"
            clearable
          />
        </div>
      </template>
    </div>

    <!-- 高级选项 -->
    <el-collapse class="section">
      <el-collapse-item :title="t('dialog.advanced')" name="adv">
        <el-form label-width="110px" size="small">
          <el-form-item :label="t('dialog.saveDir')">
            <el-input v-model="adv.dir" :placeholder="t('dialog.saveDirPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('dialog.fileName')">
            <el-input v-model="adv.out" :placeholder="t('dialog.fileNamePlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('dialog.referer')">
            <el-input v-model="adv.referer" />
          </el-form-item>
          <el-form-item :label="t('dialog.userAgent')">
            <el-input v-model="adv.userAgent" />
          </el-form-item>
          <el-form-item :label="t('dialog.cookie')">
            <el-input v-model="adv.cookie" />
          </el-form-item>
          <el-form-item :label="t('dialog.split')">
            <el-input-number v-model="adv.split" :min="1" :max="64" />
          </el-form-item>
          <el-form-item :label="t('dialog.maxConn')">
            <el-input-number v-model="adv.maxConnectionPerServer" :min="1" :max="64" />
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <template #footer>
      <el-button @click="onVisibleChange(false)">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" size="large" :loading="submitting" :disabled="!canSubmit" @click="submit">
        {{ t('dialog.start') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElAlert, ElButton, ElCheckbox, ElCollapse, ElCollapseItem, ElDialog, ElForm, ElFormItem, ElIcon, ElInput, ElInputNumber, ElRadio, ElRadioGroup, ElTable, ElTableColumn, ElTag } from 'element-plus'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/collapse/style/css'
import 'element-plus/es/components/collapse-item/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/tag/style/css'

import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import { formatBytes } from '../utils/format'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const urlsText = ref('')
const resolving = ref(false)
const submitting = ref(false)
const resolved = ref(null)

const torrentInputRef = ref(null)
const torrentTableRef = ref(null)
const torrentFileName = ref('')
const torrentBase64 = ref('')
const torrentSelected = ref([])

const streamSelect = ref('best')
const streamMux = ref(true)
const streamKey = ref('')
const streamIv = ref('')

const adv = ref({
  dir: '',
  out: '',
  referer: '',
  userAgent: '',
  cookie: '',
  split: 16,
  maxConnectionPerServer: 16
})

const urlLines = computed(() =>
  urlsText.value.split('\n').map((s) => s.trim()).filter(Boolean)
)
const singleUrl = computed(() => urlLines.value.length === 1 ? urlLines.value[0] : '')
const emptyTorrentSelection = computed(() => !torrentBase64.value && urlLines.value.length === 1 &&
  resolved.value?.type === 'torrent' && resolved.value.files?.length > 0 && torrentSelected.value.length === 0)
const canSubmit = computed(() => Boolean((urlLines.value.length > 0 || torrentBase64.value) && !emptyTorrentSelection.value))
watch(singleUrl, () => {
  resolved.value = null
  torrentSelected.value = []
}, { flush: 'sync' })

function onVisibleChange(v) {
  emit('update:modelValue', v)
}

function reset() {
  urlsText.value = ''
  resolved.value = null
  torrentFileName.value = ''
  torrentBase64.value = ''
  torrentSelected.value = []
  streamSelect.value = 'best'
  streamMux.value = true
  streamKey.value = ''
  streamIv.value = ''
  adv.value = { dir: '', out: '', referer: '', userAgent: '', cookie: '', split: 16, maxConnectionPerServer: 16 }
}

function onTorrentFile(ev) {
  const file = ev.target.files && ev.target.files[0]
  ev.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result || '')
    torrentBase64.value = dataUrl.split(',')[1] || ''
    torrentFileName.value = file.name
    resolved.value = null
    ElMessage.success(t('dialog.torrentRead', { name: file.name }))
  }
  reader.onerror = () => ElMessage.error(t('dialog.torrentReadFailed'))
  reader.readAsDataURL(file)
}

function clearTorrent() {
  torrentFileName.value = ''
  torrentBase64.value = ''
}

async function doResolve() {
  const url = singleUrl.value
  if (!url) return
  resolving.value = true
  resolved.value = null
  try {
    const headers = buildHeaders()
    const data = await api.resolve(url, headers.length ? headers : undefined)
    if (singleUrl.value !== url || torrentBase64.value) return
    resolved.value = data
    if (data.type === 'stream') {
      streamSelect.value = 'best'
    } else if (data.type === 'torrent' && data.files && data.files.length) {
      await nextTick()
      // 默认全选
      data.files.forEach((row) => torrentTableRef.value && torrentTableRef.value.toggleRowSelection(row, true))
    }
  } catch (e) {
    if (singleUrl.value === url) ElMessage.error(t('dialog.resolveFailed', { msg: e.message }))
  } finally {
    resolving.value = false
  }
}

function buildHeaders() {
  const headers = []
  if (adv.value.referer) headers.push(`Referer: ${adv.value.referer}`)
  if (adv.value.userAgent) headers.push(`User-Agent: ${adv.value.userAgent}`)
  if (adv.value.cookie) headers.push(`Cookie: ${adv.value.cookie}`)
  return headers
}

function onTorrentSelection(rows) {
  torrentSelected.value = rows
}

// 把选中的文件序号（1-based）压缩成 "1,3-5" 形式
function compressSelectFile(indices) {
  const sorted = [...indices].sort((a, b) => a - b)
  const parts = []
  let start = -1
  let prev = -1
  for (const n of sorted) {
    if (start === -1) {
      start = prev = n
    } else if (n === prev + 1) {
      prev = n
    } else {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`)
      start = prev = n
    }
  }
  if (start !== -1) parts.push(start === prev ? `${start}` : `${start}-${prev}`)
  return parts.join(',')
}

function variantValue(v) {
  if (v.bandwidth) return String(v.bandwidth)
  if (v.resolution) {
    const m = String(v.resolution).match(/(\d+)\s*[pP]?$/)
    if (m) return m[1]
    const h = String(v.resolution).split('x')[1]
    if (h) return h
  }
  return String(v.id)
}

function variantLabel(v) {
  const bits = []
  if (v.resolution) bits.push(v.resolution)
  if (v.bandwidth) bits.push(`${Math.round(v.bandwidth / 1000)} kbps`)
  if (v.frameRate) bits.push(`${v.frameRate}fps`)
  if (v.codecs) bits.push(v.codecs)
  return bits.join(' · ') || t('dialog.variantFallback', { id: v.id })
}

function buildOptions() {
  const options = {}
  for (const [k, v] of Object.entries(adv.value)) {
    if (v !== '' && v !== null && v !== undefined) options[k] = v
  }
  const headers = buildHeaders()
  if (headers.length) options.headers = headers
  return options
}

async function submit() {
  if (emptyTorrentSelection.value) {
    ElMessage.warning(t('dialog.selectAtLeastOneFile'))
    return
  }
  submitting.value = true
  try {
    if (torrentBase64.value) {
      // 种子文件任务
      await api.createTask({ torrentBase64: torrentBase64.value, options: buildOptions() })
    } else if (urlLines.value.length > 1) {
      // 批量：逐条创建
      const options = buildOptions()
      let failed = 0
      for (const url of urlLines.value) {
        try {
          await api.createTask({ url, options })
        } catch {
          failed++
        }
      }
      if (failed) ElMessage.warning(t('dialog.batchResult', { ok: urlLines.value.length - failed, failed }))
    } else {
      const payload = { url: urlLines.value[0], options: buildOptions() }
      if (resolved.value && resolved.value.type === 'torrent' && torrentSelected.value.length
          && resolved.value.files && torrentSelected.value.length < resolved.value.files.length) {
        // resolve 的文件列表按 1-based 位置编号
        const indices = torrentSelected.value.map((row) => resolved.value.files.indexOf(row) + 1)
        payload.options.selectFile = compressSelectFile(indices)
      }
      if (resolved.value && resolved.value.type === 'stream') {
        payload.stream = { select: streamSelect.value, mux: streamMux.value }
        if (streamKey.value.trim()) payload.stream.key = streamKey.value.trim()
        if (streamIv.value.trim()) payload.stream.iv = streamIv.value.trim()
      }
      await api.createTask(payload)
    }
    ElMessage.success(t('dialog.created'))
    onVisibleChange(false)
  } catch (e) {
    ElMessage.error(t('dialog.createFailed', { msg: e.message }))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.section {
  margin-bottom: var(--kd-space-4);
}

.section-title {
  font-size: var(--kd-t3);
  font-weight: 600;
  color: var(--kd-text-secondary);
  margin-bottom: var(--kd-space-2);
}

.url-bar {
  display: flex;
  align-items: center;
  gap: var(--kd-space-2);
  margin-top: var(--kd-space-2);
}

.torrent-name {
  display: inline-flex;
  align-items: center;
  gap: var(--kd-space-1);
  font-size: var(--kd-caption);
  color: var(--el-color-success);
}

.clear-icon {
  cursor: pointer;
}

.muted {
  color: var(--kd-text-tertiary);
  font-size: var(--kd-caption);
  font-weight: normal;
}

/* 流媒体清晰度：卡片式选项 */
.variant-list {
  display: flex;
  flex-direction: column;
  gap: var(--kd-space-2);
  width: 100%;
}
.variant-list :deep(.el-radio) {
  width: 100%;
  height: auto;
  margin-right: 0;
  padding: 10px 12px;
  border: 1px solid var(--kd-border);
  border-radius: var(--kd-radius-ctrl);
  align-items: center;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.variant-list :deep(.el-radio:hover) {
  border-color: var(--kd-primary-border);
  background: var(--kd-hover-bg);
}
.variant-list :deep(.el-radio.is-checked) {
  border-color: var(--kd-primary);
  background: var(--kd-primary-soft);
}
.variant-list :deep(.el-radio__input) {
  align-self: center;
}
.variant-list :deep(.el-radio__label) {
  color: var(--kd-text-content);
}

.mux-check {
  margin-top: var(--kd-space-2);
}

/* 种子文件表格容器 */
.torrent-table {
  border: 1px solid var(--kd-border);
  border-radius: var(--kd-radius-ctrl);
  overflow: hidden;
}

/* 高级选项折叠区：去默认边框 + 组标题层级 */
.el-collapse {
  border-top: none;
  border-bottom: none;
}
.el-collapse :deep(.el-collapse-item__header) {
  font-size: var(--kd-t3);
  font-weight: 600;
  color: var(--kd-text-tertiary);
  border-bottom: none;
}
.el-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.stream-keys {
  display: flex;
  gap: var(--kd-space-2);
  margin-top: var(--kd-space-3);
  width: 100%;
}
.stream-keys .el-input {
  flex: 1;
}
</style>

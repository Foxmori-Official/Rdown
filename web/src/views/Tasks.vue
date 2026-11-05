<template>
  <div class="tasks-view">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="stats">
        <span class="stat">
          <el-icon class="stat-icon down"><Download /></el-icon>
          <span class="stat-value">{{ formatSpeed(store.stats.downloadSpeed) }}</span>
        </span>
        <span class="stat">
          <el-icon class="stat-icon up"><Upload /></el-icon>
          <span class="stat-value">{{ formatSpeed(store.stats.uploadSpeed) }}</span>
        </span>
        <span class="stat stat-count">
          {{ t('tasks.activeCount', { n: store.stats.numActive || 0 }) }}
        </span>
      </div>
      <div class="actions">
        <el-button type="primary" size="large" @click="newTaskVisible = true">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>{{ t('tasks.newTask') }}
        </el-button>
        <el-button @click="onPauseAll" :disabled="!store.activeTasks.length">{{ t('tasks.pauseAll') }}</el-button>
        <el-button @click="onResumeAll" :disabled="!store.tasks.some(t => t.status === 'paused')">{{ t('tasks.resumeAll') }}</el-button>
      </div>
    </div>

    <!-- 状态 Tab -->
    <el-tabs v-model="tab" class="task-tabs">
      <el-tab-pane v-for="t in tabs" :key="t.key" :name="t.key">
        <template #label>
          {{ t.label }}
          <el-badge
            v-if="t.count"
            :value="t.count"
            :max="999"
            type="info"
            class="tab-badge"
          />
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 任务列表 -->
    <div v-if="filteredTasks.length" class="task-list">
      <TaskRow v-for="task in filteredTasks" :key="task.engine + '-' + task.id" :task="task" />
    </div>
    <!-- 空态：行动引导（frontend-design：空态是行动的入口） -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <el-icon :size="28"><Download /></el-icon>
      </div>
      <p class="empty-title">{{ emptyText }}</p>
      <p class="empty-hint">{{ t('tasks.emptyHint') }}</p>
      <el-button type="primary" size="large" @click="newTaskVisible = true">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>{{ t('tasks.newTask') }}
      </el-button>
    </div>

    <NewTaskDialog v-if="newTaskVisible" v-model="newTaskVisible" />
  </div>
</template>

<script setup>
import { ElBadge, ElButton, ElIcon, ElTabPane, ElTabs } from 'element-plus'
import 'element-plus/es/components/badge/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'

import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useTasksStore } from '../stores/tasks'
import { formatSpeed } from '../utils/format'
const TaskRow = defineAsyncComponent(() => import('../components/TaskRow.vue'))
const NewTaskDialog = defineAsyncComponent(() => import('../components/NewTaskDialog.vue'))

const { t } = useI18n()
const store = useTasksStore()
const tab = ref('active')
const newTaskVisible = ref(false)

const tabs = computed(() => [
  { key: 'active', label: t('tasks.tabActive'), count: store.activeTasks.length },
  { key: 'complete', label: t('tasks.tabComplete'), count: store.completeTasks.length },
  { key: 'stopped', label: t('tasks.tabStopped'), count: store.stoppedTasks.length },
  { key: 'all', label: t('tasks.tabAll'), count: 0 }
])

const filteredTasks = computed(() => {
  switch (tab.value) {
    case 'active': return store.activeTasks
    case 'complete': return store.completeTasks
    case 'stopped': return store.stoppedTasks
    default: return store.tasks
  }
})

const emptyText = computed(() =>
  store.connected ? t('tasks.empty') : t('tasks.connectingBackend')
)

async function onPauseAll() {
  try {
    await store.pauseAll()
  } catch (e) {
    ElMessage.error(t('tasks.pauseAllFailed', { msg: e.message }))
  }
}

async function onResumeAll() {
  try {
    await store.resumeAll()
  } catch (e) {
    ElMessage.error(t('tasks.resumeAllFailed', { msg: e.message }))
  }
}
</script>

<style scoped>
.tasks-view {
  max-width: 1080px;
  margin: 0 auto;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
}

.stat-icon {
  color: var(--kd-text-tertiary);
}
.stat-icon.down { color: var(--kd-primary); }
.stat-icon.up { color: var(--kd-success); }

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--kd-text-primary);
}

.stat-count {
  font-size: 13px;
  color: var(--kd-text-tertiary);
  padding-left: 20px;
  border-left: 1px solid var(--kd-border);
}

.actions {
  display: flex;
  gap: 8px;
}

.task-tabs {
  margin-bottom: 12px;
}

.tab-badge {
  margin-left: 4px;
  vertical-align: 2px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 空态：行动引导 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--kd-primary-soft);
  color: var(--kd-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--kd-text-primary);
  margin: 0 0 6px;
}

.empty-hint {
  font-size: 13px;
  color: var(--kd-text-tertiary);
  margin: 0 0 24px;
}
</style>

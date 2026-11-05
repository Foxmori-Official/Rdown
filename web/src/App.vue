<template>
  <el-config-provider :locale="epLocale">
  <div class="app-layout">
    <!-- 左侧窄导航 -->
    <aside class="side-nav">
      <div class="nav-logo" title="Rdown">
        <img class="nav-logo-img" src="/logo.png" alt="Rdown" />
      </div>
      <nav class="nav-items">
        <button type="button"
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: view === item.key }"
          :title="item.label"
          :aria-current="view === item.key ? 'page' : undefined"
          @click="view = item.key"
        >
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
      <div class="nav-footer">
        <el-tooltip :content="isDark ? t('common.toLight') : t('common.toDark')" placement="right">
          <button type="button" class="nav-item" :aria-label="isDark ? t('common.toLight') : t('common.toDark')" @click="toggleTheme">
            <el-icon :size="22">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </el-icon>
          </button>
        </el-tooltip>
        <a class="nav-brand" href="https://foxmori.com" target="_blank" rel="noopener" title="Foxmori">Foxmori</a>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-area">
      <header class="main-header">
        <span class="app-title">{{ viewTitle }}</span>
        <span class="conn-status" :class="connClass">
          <span class="conn-dot"></span>
          {{ connText }}
        </span>
      </header>
      <section class="main-body">
        <form v-if="!settingsStore.loaded" class="connection-card" @submit.prevent="connectBackend">
          <h2>{{ t('common.connectionTitle') }}</h2>
          <p>{{ t('common.connectionHint') }}</p>
          <label for="connectionToken">{{ t('common.connectionToken') }}</label>
          <input id="connectionToken" v-model="connectionToken" type="password" autocomplete="off" :disabled="connecting" />
          <p v-if="connectionError" role="alert">{{ connectionError }}</p>
          <button type="submit" :disabled="connecting">{{ connecting ? t('common.connecting') : t('common.connectionRetry') }}</button>
        </form>
        <Tasks v-if="settingsStore.loaded" v-show="view === 'tasks'" />
        <Settings v-if="settingsStore.loaded && view === 'settings'" />
      </section>
    </main>
  </div>
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider, ElIcon, ElTooltip } from 'element-plus'
import 'element-plus/es/components/config-provider/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tooltip/style/css'

import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings'
import { useTasksStore } from './stores/tasks'
import Tasks from './views/Tasks.vue'
const Settings = defineAsyncComponent(() => import('./views/Settings.vue'))
import { getAuthToken, setAuthToken } from './api/client'
import { EP_LOCALES } from './i18n/element'

const { t, locale } = useI18n()

const navItems = computed(() => [
  { key: 'tasks', label: t('common.navTasks'), icon: 'Download' },
  { key: 'settings', label: t('common.navSettings'), icon: 'Setting' }
])

const view = ref('tasks')
const connectionToken = ref(getAuthToken())
const connectionError = ref('')
const connecting = ref(false)
const settingsStore = useSettingsStore()
const tasksStore = useTasksStore()

const viewTitle = computed(() => (view.value === 'tasks' ? 'Rdown' : t('common.navSettings')))
const isDark = computed(() => settingsStore.isDark)

const connClass = computed(() => (tasksStore.connected ? 'online' : 'offline'))
const connText = computed(() => (tasksStore.connected ? t('common.connected') : t('common.connecting')))

const epLocale = computed(() => EP_LOCALES[locale.value] || EP_LOCALES.en)

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  settingsStore.saveSettings({ theme: next }).catch(() => {})
}

async function connectBackend() {
  if (connecting.value) return
  connecting.value = true
  connectionError.value = ''
  setAuthToken(connectionToken.value.trim())
  try {
    await settingsStore.fetchSettings()
    tasksStore.connect(getAuthToken())
  } catch (error) {
    connectionError.value = t(error.status === 401 ? 'common.connectionUnauthorized' : 'common.connectionOffline')
  } finally { connecting.value = false }
}

onMounted(async () => {
  settingsStore.initThemeListener()
  settingsStore.initLocaleListener()
  await connectBackend()
})

// apiToken 变化时重建 WS 连接
watch(
  () => settingsStore.settings.apiToken,
  (token) => tasksStore.reconnectWithToken(token || '')
)
</script>

<style scoped>
.connection-card { max-width: 480px; margin: 48px auto; padding: 24px; border: 1px solid var(--kd-border-secondary); border-radius: 12px; display: grid; gap: 12px; }
.connection-card input, .connection-card button { font: inherit; padding: 10px; border: 1px solid var(--kd-border-secondary); border-radius: 6px; }
.connection-card [role="alert"] { color: var(--el-color-danger); }

.app-layout {
  display: flex;
  height: 100%;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.side-nav {
  width: 72px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--kd-nav-bg);
  border-right: 1px solid var(--kd-border-secondary);
  padding: 12px 0;
}

.nav-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
}

.nav-logo-img {
  width: 44px;
  height: 44px;
  display: block;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  border: 0;
  background: transparent;
  font: inherit;
  width: 56px;
  padding: 8px 0;
  border-radius: var(--kd-radius-icon);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  color: var(--kd-text-tertiary);
  position: relative;
  transition: background 0.15s, color 0.15s;
}

.nav-item:focus-visible {
  outline: 2px solid var(--kd-primary);
  outline-offset: 2px;
}

.nav-item:hover {
  background: var(--kd-hover-bg);
  color: var(--kd-text-primary);
}

/* 品牌激活态：浅底 + 主色文字 + 左侧 3px 色条 */
.nav-item.active {
  color: var(--kd-primary);
  background: var(--kd-primary-soft);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 2px;
  background: var(--kd-primary);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

.nav-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.nav-brand {
  font-size: 11px;
  color: var(--kd-text-muted);
  text-decoration: none;
  padding: 4px 0;
  letter-spacing: 0.3px;
}
.nav-brand:hover {
  color: var(--kd-primary);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--kd-space-6);
  border-bottom: 1px solid var(--kd-border-secondary);
}

.app-title {
  font-size: var(--kd-t1);
  font-weight: 600;
  color: var(--kd-text-primary);
  letter-spacing: -0.01em;
}

/* 连接状态 pill */
.conn-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  color: var(--kd-text-secondary);
}

.conn-status.online {
  background: var(--kd-success-soft, rgba(22, 163, 74, 0.1));
  color: var(--kd-success);
}

.conn-status.offline {
  background: var(--kd-danger-soft, rgba(239, 68, 68, 0.1));
  color: var(--kd-danger);
}

.conn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.conn-status.offline .conn-dot {
  animation: blink 1.2s infinite;
}

@keyframes blink {
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .conn-status.offline .conn-dot { animation: none; }
}

.main-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--kd-space-5) var(--kd-space-6);
}
</style>

// Rdown Connector - 首次安装引导（onboarding）：三步黄金漏斗
//   Step1 欢迎+核心设置（serverUrl/enabled/locale 即改即存 chrome.storage.sync，与 options 页同键）
//   Step2 固定工具栏图示；Step3 打开演示页初体验；完成写 chrome.storage.local.onboardingCompleted
// i18n() / loadI18nOverride() 由 i18n.js（<script> 先加载）提供；未加载时兜底原生 chrome.i18n
if (typeof globalThis.loadI18nOverride !== 'function') globalThis.loadI18nOverride = async () => {};
if (typeof globalThis.i18n !== 'function') globalThis.i18n = (k, s) => chrome.i18n.getMessage(k, s) || k;
const $ = id => document.getElementById(id);
const DEFAULT_SERVER = 'http://127.0.0.1:16801';

// ============================================================
// 文案应用（options.js applyI18nTexts 同款模式：重载覆盖层后原地重刷 data-i18n）
// ============================================================
async function applyI18nTexts() {
  try { await loadI18nOverride(); } catch (e) {}
  if (document.documentElement) document.documentElement.lang = globalThis.getI18nLocale?.() || 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const msg = i18n(el.getAttribute('data-i18n'));
    if (msg) el.textContent = msg;
  }
  document.title = i18n('obTitle');
}

// ============================================================
// 步骤导航（1 → 2 → 3 → done）
// ============================================================
let step = 1;
const TOTAL = 3;

function renderStep() {
  for (const sec of document.querySelectorAll('.step')) {
    sec.hidden = sec.dataset.step !== String(step);
  }
  for (const dot of document.querySelectorAll('[data-step-dot]')) {
    const n = Number(dot.dataset.stepDot);
    dot.classList.toggle('active', n === step);
    dot.classList.toggle('done', n < step);
  }
  $('backBtn').hidden = step === 1;
  $('nextBtn').hidden = step >= TOTAL;
  $('finishBtn').hidden = step !== TOTAL;
}

$('backBtn').addEventListener('click', () => { if (step > 1) { step--; renderStep(); } });
$('nextBtn').addEventListener('click', () => { if (step < TOTAL) { step++; renderStep(); } });

// 完成：写 onboardingCompleted 标记并显示完成态
$('finishBtn').addEventListener('click', async () => {
  try { await chrome.storage.local.set({ onboardingCompleted: true }); } catch (e) {}
  for (const sec of document.querySelectorAll('.step')) {
    sec.hidden = sec.dataset.step !== 'done';
  }
  for (const dot of document.querySelectorAll('[data-step-dot]')) {
    dot.classList.remove('active');
    dot.classList.add('done');
  }
  $('backBtn').hidden = true;
  $('nextBtn').hidden = true;
  $('finishBtn').hidden = true;
});

// ============================================================
// Step 1：核心设置（即改即存，与 options 页同键）
// ============================================================
function currentServerUrl() {
  return $('serverUrl').value.trim().replace(/\/+$/, '') || DEFAULT_SERVER;
}

// serverUrl：失焦/回车即存
$('serverUrl').addEventListener('change', async () => {
  const url = currentServerUrl();
  $('serverUrl').value = url;
  try { await chrome.storage.sync.set({ serverUrl: url }); } catch (e) {}
});

// 测试连接：GET <serverUrl>/api/v1/health，成功绿字显示 aria2 版本，失败红字提示启动后端
$('testBtn').addEventListener('click', async () => {
  const state = $('testState');
  const btn = $('testBtn');
  btn.disabled = true;
  state.className = 'test-state';
  state.textContent = i18n('statusTesting');
  try {
    const res = await fetch(currentServerUrl() + '/api/v1/health');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    state.className = 'test-state ok';
    state.textContent = i18n('obTestOk', String(j.aria2Version || i18n('versionUnknown')));
  } catch (e) {
    state.className = 'test-state err';
    state.textContent = i18n('obTestFail');
  } finally {
    btn.disabled = false;
  }
});

// enabled 接管开关（默认开）
$('enabled').addEventListener('change', async (e) => {
  try { await chrome.storage.sync.set({ enabled: e.target.checked }); } catch (err) {}
});

// locale 语言切换：即存 + 即时生效（重载覆盖层并原地重刷全部文案）
$('locale').addEventListener('change', async (e) => {
  const locale = e.target.value || 'auto';
  try { await chrome.storage.sync.set({ locale }); } catch (err) {}
  await applyI18nTexts();
});

// ============================================================
// Step 3：打开演示页
// ============================================================
$('demoBtn').addEventListener('click', () => {
  try { chrome.tabs.create({ url: 'http://127.0.0.1:16801/demo.html' }); } catch (e) {}
});

// ============================================================
// 启动引导：应用文案 → 载入已有设置（与 options 页同键）
// ============================================================
(async () => {
  await applyI18nTexts();
  try {
    const s = await chrome.storage.sync.get({
      serverUrl: DEFAULT_SERVER, enabled: true, locale: 'auto'
    });
    $('serverUrl').value = s.serverUrl || DEFAULT_SERVER;
    $('enabled').checked = !!s.enabled;
    $('locale').value = s.locale || 'auto';
  } catch (e) {}
  renderStep();
})();

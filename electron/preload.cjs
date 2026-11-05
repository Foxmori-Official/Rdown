// Rdown - preload: expose a minimal, safe API to the renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rdownDesktop', {
  /** @returns {Promise<{openAtLogin: boolean}>} */
  getLoginItem: () => ipcRenderer.invoke('get-login-item'),
  /** @param {boolean} openAtLogin */
  setLoginItem: (openAtLogin) => ipcRenderer.invoke('set-login-item', !!openAtLogin)
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setContentProtection: (enabled) => ipcRenderer.send('set-content-protection', enabled),
  offline: {
    download: (data) => ipcRenderer.invoke('offline:download', data),
    status: (data) => ipcRenderer.invoke('offline:status', data),
    list: () => ipcRenderer.invoke('offline:list'),
    delete: (data) => ipcRenderer.invoke('offline:delete', data),
    getStreamUrl: (videoId) => `dcs-video://${encodeURIComponent(videoId)}`,
    onProgress: (callback) => ipcRenderer.on('offline:progress', (_, data) => callback(data)),
    removeProgressListener: () => ipcRenderer.removeAllListeners('offline:progress'),
  },
});
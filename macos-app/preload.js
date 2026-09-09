const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ieltsApp', {
  loadAiSettings: () => ipcRenderer.invoke('ai:settings-load'),
  saveAiSettings: settings => ipcRenderer.invoke('ai:settings-save', settings),
  testAi: settings => ipcRenderer.invoke('ai:test', settings),
  fetchAiModels: settings => ipcRenderer.invoke('ai:models', settings),
  generateField: payload => ipcRenderer.invoke('ai:generate-field', payload),
  organizeImport: payload => ipcRenderer.invoke('ai:import-text', payload),
  generateQuote: payload => ipcRenderer.invoke('ai:quote', payload),
  completeCard: payload => ipcRenderer.invoke('ai:complete-card', payload)
});

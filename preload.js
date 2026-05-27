const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  saveTemplate: (template) => ipcRenderer.invoke('save-template', template),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
});

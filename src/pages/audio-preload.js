const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  playSound: (callback) => ipcRenderer.on('play-sound', callback)
})

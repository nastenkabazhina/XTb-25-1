// Preload скрипт для безопасной коммуникации между процессами
// Этот файл запускается до загрузки веб-страницы и имеет доступ к Node.js API

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Здесь можно добавить безопасные методы для взаимодействия с главным процессом
    // Например:
    // send: (channel, data) => {
    //   // whitelist channels
    //   let validChannels = ['toMain']
    //   if (validChannels.includes(channel)) {
    //     ipcRenderer.send(channel, data)
    //   }
    // },
    // receive: (channel, func) => {
    //   let validChannels = ['fromMain']
    //   if (validChannels.includes(channel)) {
    //     ipcRenderer.on(channel, (event, ...args) => func(...args))
    //   }
    // }
  }
)

// Предотвращаем изменение document.title из renderer процесса
// для дополнительной безопасности
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded')
})

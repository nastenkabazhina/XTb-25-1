const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  // Создаем окно браузера
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'build/icon.png'),
    title: 'Цифровой двойник МУПН',
    backgroundColor: '#080bc7',
    autoHideMenuBar: false
  })

  // Загружаем главную страницу приложения
  mainWindow.loadFile(path.join(__dirname, 'Главная страница', 'index.html'))

  // Открываем DevTools в режиме разработки (можно закомментировать для production)
  // mainWindow.webContents.openDevTools()

  // Создаем меню приложения
  createMenu()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createMenu() {
  const template = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Главная страница',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'Главная страница', 'index.html'))
          }
        },
        { type: 'separator' },
        {
          label: 'Обновить',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload()
          }
        },
        { type: 'separator' },
        {
          label: 'Выход',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Объекты',
      submenu: [
        {
          label: 'НГС-1 - Входной сепаратор',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'НГС-1', 'index.html'))
          }
        },
        {
          label: 'ГС-1 - Газовый сепаратор',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'ГС-1', 'index.html'))
          }
        },
        {
          label: 'НГСВ-1 - Трёхфазный сепаратор',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'НГСВ-1', 'index.html'))
          }
        },
        {
          label: 'П-1 - Печь-подогреватель',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'П-1', 'index.html'))
          }
        },
        {
          label: 'Н-1 - Насосные агрегаты',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'Н-1', 'index.html'))
          }
        },
        {
          label: 'ЕД-1 - Блок ёмкостей',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'ЕД-1', 'index.html'))
          }
        },
        {
          label: 'ГФУ - Факельная установка',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'ГФУ', 'index.html'))
          }
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Полноэкранный режим',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        },
        { type: 'separator' },
        {
          label: 'Инструменты разработчика',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: 'Помощь',
      submenu: [
        {
          label: 'О программе',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'О программе',
              message: 'Цифровой двойник МУПН',
              detail: 'Мобильная установка подготовки нефти\nВерсия 1.0.0\n\n© 2025',
              buttons: ['OK']
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Запускаем приложение когда Electron готов
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // На macOS обычно пересоздают окно когда
    // кликают на иконку в доке если других окон нет
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Выходим когда все окна закрыты (кроме macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// В этом файле можно добавить специфический код главного процесса
// Также можно разделить код на несколько файлов и подключать их здесь

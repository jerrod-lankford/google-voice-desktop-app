const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: 'images/logo_voice_2020q4_color_1x_web_32dp.png',
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.removeMenu();
  win.loadURL('https://voice.google.com', {userAgent: 'Chrome'})
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
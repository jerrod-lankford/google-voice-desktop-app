const { app, BrowserWindow } = require('electron')
const icon = 'images/1024px-Google_Voice_icon_(2020).png';
const REFRESH_RATE = 5000; // 5 seconds

let currentInterval;
let lastNotification = 0;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        icon,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.removeMenu();
    win.loadURL('https://voice.google.com', { userAgent: 'Chrome' });
    win.webContents.openDevTools();

    if (currentInterval) {
        clearInterval(currentInterval);
    }
    currentInterval = setInterval(updateNotifications.bind(this, app, win), REFRESH_RATE);

    return win;
}

app.dock && app.dock.setIcon(icon);
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    // I dont really like this behavior but if we let it kill the window then its just an empty worthless shell
    // if (process.platform !== 'darwin') {
        app.quit()
    // }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

function updateNotifications(app, window) {

    if (BrowserWindow.getAllWindows().length === 0) {
        clearInterval(currentInterval);
        currentInterval = 0;
        return;
    }

    let sum = 0;

    // Query the dom for the notification badges
    window.webContents.executeJavaScript(`Array.from(document.querySelectorAll('.gv_root .navListItem .navItemBadge')).map(n => n.textContent && n.textContent.trim());`).then(counts => {
        if (counts && counts.length > 0) {
            sum = counts.reduce((accum, count) => {
                try {
                    accum += parseInt(count, 10);
                } catch (e) { }
                return accum;
            }, 0);
        }

        sendCountsToDock(app, sum);
    });
}

// Keep our doc in sync with whats in the dom
function sendCountsToDock(app, sum) {
    if (app.dock) {
        if (sum > 0 && sum !== lastNotification) {
            app.dock.bounce();
        }
        app.dock.setBadge(`${sum || ''}`);
    }
    lastNotification = sum;
}
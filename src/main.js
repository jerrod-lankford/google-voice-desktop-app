const { app, nativeImage, BrowserWindow } = require('electron')
const BadgeGenerator = require('./badge_generator')
const REFRESH_RATE = 5000; // 5 seconds
const icon = nativeImage.createFromPath(
    app.getAppPath() + "/public/1024px-Google_Voice_icon_(2020).png"
);
let currentInterval;
let lastNotification = 0;
let badgeGenerator;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.removeMenu();
    win.loadURL('https://voice.google.com', { userAgent: 'Chrome' });
    // win.webContents.openDevTools();

    if (currentInterval) {
        clearInterval(currentInterval);
    }
    badgeGenerator = new BadgeGenerator(win)

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

        sendCountsToDock(app, window, sum);
    });
}

// Keep our doc in sync with whats in the dom
function sendCountsToDock(app, win, num) {
    if (process.platform === 'darwin') {
        sendCountsToDockMac(app, num);
    } else {
        sendCountsToDockWindows(win, num)
    }

}

function sendCountsToDockWindows(win, num) {
    if (num) {
        badgeGenerator.generate(num).then((base64) => {
            const image = nativeImage.createFromDataURL(base64);
            win.setOverlayIcon(image, 'Unread notifications');
        });
    } else {
        win.setOverlayIcon(null, '');
    }

}

function sendCountsToDockMac(app, num) {
    if (app.dock) {
        if (num > 0 && num !== lastNotification) {
            app.dock.bounce();
        }
        app.dock.setBadge(`${num || ''}`);
    }
    lastNotification = num;
}
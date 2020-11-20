const { app, nativeImage, BrowserWindow, Tray, Menu } = require('electron')
const BadgeGenerator = require('./badge_generator')
const REFRESH_RATE = 5000; // 5 seconds
const iconPNG = "1024px-Google_Voice_icon_(2020).png";
const icon = nativeImage.createFromPath(
    app.getAppPath() + "/public/" + iconPNG
);
let currentInterval;
let lastNotification = 0;
let badgeGenerator;
let tray = null;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.removeMenu();
    win.loadURL('https://voice.google.com', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:82.0) Gecko/20100101 Firefox/82.0' });
    // win.webContents.openDevTools();

    if (currentInterval) {
        clearInterval(currentInterval);
    }
    badgeGenerator = new BadgeGenerator(win)

    currentInterval = setInterval(updateNotifications.bind(this, app, win), REFRESH_RATE);

    // Add support for tray icon
    win.on('minimize', function (event) {
        event.preventDefault();
        win.hide();
        tray = createTray(win, app.getAppPath() + "/images/" + iconPNG, 'Google Voice Tray');
    });

    win.on('restore', function (event) {
        win.show();
        tray.destroy();
    });

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
    if (num !== lastNotification) {
        lastNotification = num;
        if (process.platform === 'darwin') {
            sendCountsToDockMac(app, num);
        } else {
            sendCountsToDockWindows(win, num)
        }
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
        app.dock.setBadge(`${num || ''}`);
        if (num > 0) {
            app.dock.bounce();
        }
    }
}

// Create the tray icon and menu options
function createTray(mainWin, iconPath, tipText) {
    let appIcon = new Tray(iconPath);

	appIcon.setToolTip(tipText);

    appIcon.on('double-click', function (event) {
        mainWin.show();
    });

    appIcon.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                mainWin.show();
            }
        },
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]));

    return appIcon;
}

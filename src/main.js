// Requires
const { app, nativeImage, BrowserWindow, Tray, Menu } = require('electron')
const BadgeGenerator = require('./badge_generator')
const path = require('path');
const { ipcMain } = require('electron')

// Constants
const REFRESH_RATE = 5000; // 5 seconds
const iconTray = `${app.getAppPath()}/images/tray-Google_Voice_icon_(2020).png`;
const iconTrayDirty = `${app.getAppPath()}/images/tray-dirty-Google_Voice_icon_(2020).png`;
const icon = nativeImage.createFromPath(
    `${app.getAppPath()}/public/1024px-Google_Voice_icon_(2020).png`
);

// Globals
let lastNotification = 0;
let badgeGenerator;
let tray;
let win;

// Setup notification shim to focus window
ipcMain.on('notification-clicked', () => {
    win && win.show();
  });


// Show window when clicking on macosx dock icon
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }

    // Unhide on mac if dock icon is clicked
    if (win && !win.isVisible()) {
        win.show();
    }
});

// Setup timer to keep dock notifications up to date
setInterval(updateNotifications.bind(this, app), REFRESH_RATE);

app.dock && app.dock.setIcon(icon);
app.whenReady().then(createWindow);

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true
        }
    })
    win.removeMenu();
    win.loadURL('https://voice.google.com', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:82.0) Gecko/20100101 Firefox/82.0' });
    //win.webContents.openDevTools();

    if (tray) {
        tray.destroy;
    }
    tray = createTray(iconTray, 'Google Voice Tray');

    badgeGenerator = new BadgeGenerator(win)

	win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
    });

    win.on('restore', function (event) {
        win.show();
    });

    return win;
}

function updateNotifications(app) {

    if (!win || BrowserWindow.getAllWindows().length === 0) {
        return;
    }

    let sum = 0;

    // Query the dom for the notification badges
    win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('.gv_root .navListItem .navItemBadge')).map(n => n.textContent && n.textContent.trim());`).then(counts => {
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
function sendCountsToDock(app, num) {
    if (num !== lastNotification) {
        lastNotification = num;
        if (process.platform === 'darwin') {
            sendCountsToDockMac(app, num);
        } else {
            sendCountsToDockWindows(num)
        }

        tray.destroy();
        if (num > 0) {
            tray = createTray(iconTrayDirty, 'Google Voice Tray - Unread');
        } else {
            tray = createTray(iconTray, 'Google Voice Tray');
        }
    }
}

function sendCountsToDockWindows(num) {
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
function createTray(iconPath, tipText) {
    let appIcon = new Tray(iconPath);

	appIcon.setToolTip(tipText);

    appIcon.on('double-click', function (event) {
        win && win.show();
    });

    appIcon.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                win && win.show();
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

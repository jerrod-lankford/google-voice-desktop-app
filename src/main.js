// Requires
const { app, nativeImage, BrowserWindow, Tray, Menu, ipcMain, BrowserView, shell } = require('electron');
const contextMenu = require('electron-context-menu');
const BadgeGenerator = require('./badge_generator');
const path = require('path');
const ThemeInjector = require('./utils/themeInjector');
const MenuInjector = require('./utils/menuInjector');
const Store = require('electron-store');

// Constants
const store = new Store();
const appPath = app.getAppPath();
const REFRESH_RATE = 1000; // 1 seconds

const icon = path.join(appPath, 'images', '64px-Google_Voice_icon_(2020).png');
const iconTray = path.join(appPath, 'images', 'tray-Google_Voice_icon_(2020).png');
const iconTrayDirty = path.join(appPath, 'images', 'tray-dirty-Google_Voice_icon_(2020).png');
const dockIcon = nativeImage.createFromPath(
    path.join(appPath, 'images', '1024px-Google_Voice_icon_(2020).png')
);
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;

// Globals
let lastNotification = 0;
let badgeGenerator;
let themeInjector;
let tray;
let win;

// Only one instance of the app should run
if (!app.requestSingleInstanceLock()) {
    app.isQuiting = true;
    app.quit();
}

app.on('second-instance', () => {
    win && win.show();
});

// Setup context menu
contextMenu({
    showSaveImage: true,
    showInspectElement: true
});

// Setup notification shim to focus window
ipcMain.on('notification-clicked', () => {
    win && win.show();
});

ipcMain.on('show-customize', () => {
    const prefs = store.get('prefs')  || {};
    const win = new BrowserWindow({ width: 800, height: 600});

    // Pass into customize menu
    win.prefs = prefs;

    const view = new BrowserView({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    win.setBrowserView(view);
    view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
    view.webContents.loadFile(path.join(appPath, 'src', 'pages', 'customize.html'));
    // view.webContents.openDevTools();
});

ipcMain.on('pref-change', (e, theme) => {
    themeInjector.inject(theme);
    const prefs = store.get('prefs') || {};
    prefs.theme = theme;
    store.set('prefs', prefs);
});

ipcMain.on('pref-change-zoom', (e, zoom) => {
    setZoom(zoom);
    const prefs = store.get('prefs') || {};
    prefs.zoom = zoom;
    store.set('prefs', prefs);
});

ipcMain.on('pref-change-start-minimized', (e, startMinimized) => {
    const prefs = store.get('prefs') || {};
    prefs.startMinimized = startMinimized;
    store.set('prefs', prefs);
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

app.dock && app.dock.setIcon(dockIcon);
app.whenReady().then(createWindow);

function createWindow() {
    const prefs = store.get('prefs') || {};
    win = new BrowserWindow({
        width: prefs.windowWidth || DEFAULT_WIDTH,
        height: prefs.windowHeight || DEFAULT_HEIGHT,
        icon,
        webPreferences: {
            spellcheck: true,
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.removeMenu();
    win.loadURL('https://voice.google.com', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:82.0) Gecko/20100101 Firefox/82.0' });
    // win.webContents.openDevTools();

    win.webContents.on('did-finish-load', () => {
        const theme = store.get('prefs.theme')  || 'default';
        themeInjector = new ThemeInjector(app, win);
        themeInjector.inject(theme);
        const zoom = store.get('prefs.zoom')  || 100;
        setZoom(zoom); 
        (new MenuInjector(app, win)).inject();
    });

    if (tray) {
        tray.destroy;
    }
    tray = createTray(iconTray, 'Google Voice Tray');

    badgeGenerator = new BadgeGenerator(win);

    win.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

	win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
    });

    win.on('restore', function (event) {
        win.show();
    });

    win.on('resize', saveWindowSize);

    // Hide if startMinimized is true in prefs
    if (prefs.startMinimized) {
        win.hide();
    }

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

        if (num > 0) {
            tray && tray.setImage(iconTrayDirty);
        } else {
            tray && tray.setImage(iconTray);
        }
    }
}

function sendCountsToDockWindows(num) {
    if (num) {
        badgeGenerator.generate(num).then((base64) => {
            const image = nativeImage.createFromDataURL(base64);
            win.setOverlayIcon(image, 'You have new messages and/or calls');
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

    appIcon.on('click', function (event) {
        win && win.show();
    });

    appIcon.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Open', click: function () {
                win && win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]));

    return appIcon;
}

function saveWindowSize() {
    const bounds = win.getBounds();
    const prefs = store.get('prefs')  || {};
    prefs.windowWidth = bounds.width;
    prefs.windowHeight = bounds.height;

    store.set('prefs', prefs);
}

function setZoom(zoom) {
    try {
        if (win) {
            //some reasonable settings (Chrome does the same)
            if (zoom >= 500)
            {
                zoom = 500; //big but not "that" big    
            }
            if (zoom > 25 && zoom <= 500) {
                win.webContents.setZoomFactor(zoom / 100);
            }
        }
    }
    catch (e)
    {
        console.log(e);
        console.error(`Could not set zoom to ${zoom}`);
    }
}
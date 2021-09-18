// Requires
const { app, nativeImage, BrowserWindow, Tray, Menu, ipcMain, ipcRenderer, BrowserView, shell, powerMonitor } = require('electron');
const constants = require("./constants");
const contextMenu = require('electron-context-menu');
const BadgeGenerator = require('./badge_generator');
const path = require('path');
const ThemeInjector = require('./utils/themeInjector');
const MenuInjector = require('./utils/menuInjector');
const Store = require('electron-store');
const Url = require('url');

// Constants
const store = new Store();
const appPath = app.getAppPath();
const REFRESH_RATE = 1000; // 1 seconds
const icon = path.join(appPath, 'images', constants.APPLICATION_ICON_Medium);
const iconTray = path.join(appPath, 'images', constants.APPLICATION_ICON_Small);
const iconTrayDirty = path.join(appPath, 'images', constants.APPLICATION_ICON_SmallWithIndicator);
const dockIcon = nativeImage.createFromPath(path.join(appPath, 'images', constants.APPLICATION_ICON_Large));
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

// If the computer is shutting down or restarting then close
powerMonitor.on('shutdown', () => {
    app.isQuiting = true;
    app.quit();
});

// Setup context menu
contextMenu({
    showSaveImage: true,
    showInspectElement: true
});

// If we're running on Windows, set our Application User Model ID to our application name.
// This will be displayed in all system Toasts that get generated to display notifications
// to the user.  If we don't do this, "electron.app.Electron" will be displayed instead.
if (process.platform === 'win32'){
    app.setAppUserModelId(constants.APPLICATION_NAME);
}

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
            contextIsolation: false
        }
    });
    win.setBrowserView(view);
    win.removeMenu();
    view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
    view.webContents.loadFile(path.join(appPath, 'src', 'pages', 'customize.html'));

    view.webContents.on('did-finish-load', () => {
        view.webContents.send('set-preferences', store.get('prefs') || {});

    });
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

// Set up an IPC handler that can be used by renderer processes to retrieve the execution path of this application.
ipcMain.handle('get-appPath', async (event, ...args) => {
    return app.getAppPath();
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
    loadGoogleVoiceInMainWindow();
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
        e.preventDefault(); // Cancel the request to open the target URL in a new window

        // If the target URL is a Google Voice URL, have our main window navigate to it instead of opening
        // it in a new window.  This supports the ability to add additional accounts and switch between
        // them on-demand.  Otherwise, for all other URLs, have the system open them using the default type
        // handler.  This is done to force URLs to open in the user's browser, where they are likely already
        // signed into services that need authentication (e.g. Spotify).  Note that if the user ever gets
        // stuck navigated somewhere that isn't the main Google Voice page, they can always use the "Reload"
        // item in the notification area icon context menu to get back to the Google Voice home page.
        const hostName = Url.parse(url).hostname;
        if ( hostName === 'voice.google.com' || hostName === 'accounts.google.com') {
            win && win.loadURL(url);
        }
        else {
            shell.openExternal(url);
        }
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

// Loads Google Voice in the main application window, identifying this application as Firefox running on
// a Mac.  During the load, Google Voice itself takes care of asking the user to log in when necessary.
function loadGoogleVoiceInMainWindow() {
    win && win.loadURL('https://voice.google.com');
}

// Invoked every "REFRESH_RATE" seconds.  Parses the current notification count from Google
// Voice's markup and then has this application display it to the user in an appropriate way.
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

        processNotificationCount(app, sum);
    });
}

// Displays a specified notification count to the user (if it isn't already
// being displayed), in a way that is appropriate for their Operating System.
function processNotificationCount(app, count) {
    if (count !== lastNotification) {
        // Update our record of what the new count is.  We update our record *before* proceeding to ensure we don't
        // enter a loop of continuously trying to update UI in the event that we experience some failure down below.
        let oldCount = lastNotification;
        lastNotification = count;

        // Perform OS-specific operations.
        if (process.platform === 'darwin') {
            processNotificationCount_MacOS(app, oldCount, count);
        }
        else if (process.platform === 'win32') {
            processNotificationCount_Windows(oldCount, count);
        }
        
        // Update our notification area icon based on the count.  If it's greater than 0,
        // display the icon with a red dot, otherwise display the icon without a red dot.
        if (count > 0) {
            tray && tray.setImage(iconTrayDirty);
        }
        else {
            tray && tray.setImage(iconTray);
        }
    }
}

// Updates this application's UI on Windows in a way that is appropriate for a specified notification count.
function processNotificationCount_Windows(oldCount, newCount) {
    if (win) {
        // If the specified new count is non-0, use our Badge Generator to dynamically generate an image representing it,
        // and then apply the image as an overlay icon on our main window's Taskbar button.  Note that if the user has
        // the "Use small Taskbar buttons" setting turned on, the overlay won't actually be rendered due to lack of space.
        if (newCount) {
            badgeGenerator.generate(newCount).then((base64) => {
                const image = nativeImage.createFromDataURL(base64);
                win.setOverlayIcon(image, 'You have new messages and/or calls');
            });
        } else {
            win.setOverlayIcon(null, '');
        }

        // If the notification count has gone up and our main window isn't currently
        // focused, also flash the window's Taskbar button to catch the user's attention.  
        if ((newCount > oldCount) && !win.isFocused()) {
            win.flashFrame(true);
        }
    }
}

// Updates this application's UI on Mac OS in a way that is appropriate for a specified notification count.
function processNotificationCount_MacOS(app, oldCount, newCount) {
    // Overlay the specified new count on our Dock icon.  If the count has
    // increased, also bouce the icon the catch the user's attention.
    if (app.dock) {
        app.dock.setBadge(`${newCount || ''}`);
        if (newCount > oldCount) {
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
            label: 'Refresh', click: function () {
                loadGoogleVoiceInMainWindow();
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
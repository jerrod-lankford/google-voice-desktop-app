// Requires
const { app, nativeImage, BrowserWindow, Tray, Menu, ipcMain, BrowserView, shell, powerMonitor, systemPreferences } = require('electron');
const constants = require('./constants');
const AutoLaunch = require('auto-launch')
const contextMenu = require('electron-context-menu');
const BadgeGenerator = require('./badge_generator');
const path = require('path');
const CSSInjector = require('./utils/cssInjector');
const Store = require('electron-store');
const Url = require('url');

// Constants
const store = new Store();
const appPath = app.getAppPath();
const REFRESH_RATE = 3000; // 3 seconds
const icon = path.join(appPath, 'images', constants.APPLICATION_ICON_MEDIUM);
const iconTray = path.join(appPath, 'images', constants.APPLICATION_ICON_SMALL);
const iconTrayDirty = path.join(appPath, 'images', constants.APPLICATION_ICON_SMALL_WITH_INDICATOR);
const dockIcon = nativeImage.createFromPath(path.join(appPath, 'images', constants.APPLICATION_ICON_LARGE));
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;

// Globals
let lastNotification = 0;
let badgeGenerator;
let cssInjector;
let tray;
let win;            // The main application window
let settingsWindow; // When not null, the "Settings" window, which is currently open

// Only one instance of the app should run
if (!app.requestSingleInstanceLock()) {
    exitApplication();
}

app.on('second-instance', () => {
    showMainWindow();
});

// If the computer is shutting down or restarting then close
powerMonitor.on('shutdown', () => {
    exitApplication();
});

// Setup context menu
contextMenu({
    showSaveImage: true,
    showInspectElement: true
});

// If we're running on Windows, set our Application User Model ID to our application name.
// This will be displayed in all system Toasts that get generated to display notifications
// to the user.  If we don't do this, "electron.app.Electron" will be displayed instead.
if (isWindows()){
    app.setAppUserModelId(constants.APPLICATION_NAME);
}

// Setup notification shim to focus window
ipcMain.on('notification-clicked', () => {
    showMainWindow();
});

// Ask for permission to use the microphone if the OS requires it
success = systemPreferences.askForMediaAccess("microphone");

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

// Creates and returns this application's main BrowserWindow, navigated to Google Voice.
function createWindow() {
    // Create the window, making it hidden initially.  If we have
    // it on record, re-apply the window size last set by the user.
    const prefs = store.get('prefs') || {};
    win = new BrowserWindow({
        width: prefs.windowWidth || DEFAULT_WIDTH,
        height: prefs.windowHeight || DEFAULT_HEIGHT,
        icon,
        show: false,
        webPreferences: {
            spellcheck: true,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    //win.webContents.openDevTools();

    // Create the window's menu bar.
    let menuBar = Menu.buildFromTemplate([
        {
            label: '&File',
            submenu: [
                {label: '&Reload',        click: () => {loadGoogleVoice();}},     // Reload Google Voice within our main window
                {label: 'Go to &website', click: () => {loadGoogleVoice(true);}}, // Open Google Voice externally in the user's browser
                {type:  'separator'},
                {label: '&Settings',      click: () => {showSettingsWindow()}},   // Open/display our Settings window
                {type:  'separator'},
                {label: '&Exit',          click: () => {exitApplication();}}      // Exit the application
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        },
        {
            label: '&View',
            submenu: [
                {role:  'zoomIn', visible: false},                                           // Zoom in (Ctrl+Shift++)
                {role:  'zoomIn', accelerator: 'CommandOrControl+='},                        // Zoom in (Ctrl+=)
                {role:  'zoomOut'},                                                          // Zoom out (Ctrl+-)
                {role:  'zoomOut', visible: false, accelerator: 'CommandOrControl+Shift+_'}, // Zoom out (Ctrl+Shift+_)
                {role:  'resetZoom'},                                                        // Reset zoom (Ctrl+0)
                {type:  'separator'},
                {role:  'toggleFullScreen'},                                                 // Toggle full screen (F11)
                {type:  'separator'},
                {label: '&Hide menu bar', visible: !isMac(), click: () => {win.setMenuBarVisibility(false);}} // Hide the menu bar (not supported for Mac)
            ]
        },
        {
            label: '&Help',
            submenu: [
                {label: 'Report a &bug',                 click: () => {shell.openExternal(constants.URL_GITHUB_REPORT_BUG);}},
                {label: 'Request a &feature',            click: () => {shell.openExternal(constants.URL_GITHUB_FEATURE_REQUEST);}},
                {label: 'Ask a &question',               click: () => {shell.openExternal(constants.URL_GITHUB_ASK_QUESTION);}},
                {label: 'View &issues',                  click: () => {shell.openExternal(constants.URL_GITHUB_VIEW_ISSUES);}},
                {type: 'separator'},
                {label: '&Security Policy',              click: () => {shell.openExternal(constants.URL_GITHUB_SECURITY_POLICY);}},
                {type: 'separator'},
                {label: 'View &releases',                click: () => {shell.openExternal(constants.URL_GITHUB_RELEASES);}},
                {label: `&About (v${app.getVersion()})`, click: () => {shell.openExternal(constants.URL_GITHUB_README);}}
            ]
        }
    ]);

    // Set the menu bar's visibility.
    if (isMac()) {
        Menu.setApplicationMenu(menuBar) // On Mac, we always show the menu bar
    }
    else {
        // On Windows/Linux, we give the user a setting for hiding the menu bar.  Add the menu bar to
        // the window (which ensures that its keyboard shortcuts will work regardless of the menu bar's
        // visibility), but make the menu bar visible only if the user hasn't asked us to hide it.
        win.setMenu(menuBar);
        if (((prefs.showMenuBar != undefined) && !prefs.showMenuBar) || !constants.DEFAULT_SETTING_SHOW_MENU_BAR) {
            win.setMenuBarVisibility(false);
        }
    }

    // Navigate the window to Google Voice.  When it finishes loading, modify Google's markup as needed
    // to support user customizations that we allow the user to make from within our application UI.
    loadGoogleVoice();
    win.webContents.on('did-finish-load', () => {
        // Re-apply the theme last selected by the user.
        const theme = store.get('prefs.theme') || constants.DEFAULT_SETTING_THEME;
        const hideDialerSidebar = store.get('prefs.hideDialerSidebar') || constants.DEFAULT_HIDE_DIALER_SIDEBAR;
        cssInjector = new CSSInjector(app, win);
        cssInjector.injectTheme(theme);
        cssInjector.showHideDialerSidebar(hideDialerSidebar);
    });

    // Create our system notification area icon.
    if (tray) {
        tray.destroy;
    }
    tray = createTray(iconTray, constants.APPLICATION_NAME);

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

    // Whenever a request is made for the window to be closed, determine whether we should allow the close to
    // happen and terminate the application, or just hide the window and keep running in the notification area.
    win.on('close', function (event) {
        // Proceed based on the reason why the window is being closed.
        if (app.isQuiting) {
            // The window is being closed as a result of us calling app.quit() due to the
            // user's invocation of one of our "Exit" menu items.  In this case, we'll
            // allow the close to happen.  This will lead to termination of the application.
        }
        else {
            // The window is being closed as a result of the user explicitly trying to close
            // it.  If the user has enabled the "exit on close" setting, allow the close and
            // subsequent termination of the application to proceed.  Otherwise, cancel the
            // close and hide the window instead; we'll keep running in the notification area.
            const exitOnClose = store.get('prefs.exitOnClose') || constants.DEFAULT_SETTING_EXIT_ON_CLOSE;
            if (!exitOnClose) {
                event.preventDefault();
                win.hide();
            }
        }
    });

    win.on('restore', function (event) {
        win.show();
    });

    win.on('resize', saveWindowSize);

    // Now that we've finished creating and initializing the window, show
    // it (unless the user has enabled the "start minimized" setting).
    if (!prefs.startMinimized) {
        win.show();
    }

    return win;
}

// Terminates this application.
function exitApplication() {
    app.isQuiting = true;
    app.quit();
}

// Loads Google Voice.  The "loadExternal" parameter specifies whether the load should
// take place inside this application's main browser window.  If set to false, Google
// Voice will be opened in the user's default external browser instead.  During the
// load, Google Voice itself takes care of asking the user to log in when necessary.
function loadGoogleVoice(loadExternal=false) {
    if (loadExternal) {shell.openExternal(constants.URL_GOOGLE_VOICE);}
    else              {win && win.loadURL(constants.URL_GOOGLE_VOICE);}
}

// Invoked every "REFRESH_RATE" seconds.  Parses the current notification count from Google
// Voice's markup and then has this application display it to the user in an appropriate way.
// Also implements a workaround for Electron's "blank white screen" bug that many users encounter.
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

    // The following is a workaround for the Electron bug where after an indeterminate
    // period of inactivity, the main application window turns into a blank white screen.
    // When this happens, inspection shows that the loaded page consists of the following
    // empty HTML markup:
    //
    //     <html><head></head><body></body></html>
    //
    // As such, we perform a simple check as to whether the <body/> of our loaded page
    // has become empty.  If it has, then we automatically reload Google Voice for the
    // user.  This seems to eliminate the problem entirely, without any adverse effects,
    // as once we detect an empty body, the application is already in a non-working state.
    win.webContents.executeJavaScript("document.querySelector('body').childNodes.length").then(
        (result) => {
            if (result === 0){
                loadGoogleVoice();
            }
        })
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
        if (isMac()) {
            processNotificationCount_MacOS(app, oldCount, count);
        }
        else if (isWindows()) {
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

// Creates this application's notification area icon.
function createTray(iconPath, tipText) {
    // Create the icon, assigning it our application icon and name.
    let appIcon = new Tray(iconPath);
	appIcon.setToolTip(tipText);

    // Construct the icon's context menu.  This is done using an array of MenuItem objects.
    appIcon.setContextMenu(Menu.buildFromTemplate([
        {label: '&Open',     click: () => {showMainWindow();}},
        {label: '&Reload',   click: () => {loadGoogleVoice();}},
        {type:  'separator'},
        {label: '&Settings', click: () => {showSettingsWindow();}},
        {type:  'separator'},
        {label: '&Exit',     click: () => {exitApplication();}}
    ]));

    appIcon.on('click', function (event) {
        showMainWindow();
    });

    return appIcon;
}

// Displays this application's main window to the user.
function showMainWindow() {
    win && win.show();
}

// Creates (if it doesn't already exist) this application's "Settings" window, and then displays it to the user.
function showSettingsWindow() {
    if (!settingsWindow) {
        // Create our Settings window, keeping a global reference to it.  This reference allows
        // us to know when the window is open, preventing the user from opening it a second time.
        settingsWindow = new BrowserWindow({
            width: 600,
            height: 600,
            title: 'Settings',
            parent: win,
            modal: true,
            resizable: false,
            minimizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }});
        settingsWindow.removeMenu();
        
        // Stash the user's settings store on the window so that it can be accessed by the window's renderer process.
        settingsWindow.prefs = store.get('prefs') || {};
            
        // Load our settings page into the window.
        settingsWindow.loadFile(path.join(appPath, 'src', 'pages', 'customize.html'));
        //settingsWindow.webContents.openDevTools();

        // When the window gets closed, release its global reference.
        settingsWindow.on('close', function() {
            settingsWindow = null;
        });
    }
    else {
        // Our Settings window is already open, just bring it back to the foreground.
        settingsWindow.show();
    }
}

function saveWindowSize() {
    const bounds = win.getBounds();
    const prefs = store.get('prefs')  || {};
    prefs.windowWidth = bounds.width;
    prefs.windowHeight = bounds.height;

    store.set('prefs', prefs);
}

// ====================================================================================================================
// Helper Functions
// ====================================================================================================================

function isMac()     {return (process.platform === 'darwin');}
function isWindows() {return (process.platform === 'win32');}

// ====================================================================================================================
// Invokable IPC Handlers
// ====================================================================================================================

// Returns the execution path of this application.
ipcMain.handle('get-appPath', () => {
    return app.getAppPath();
});

// Returns the platform that this application is running on.
ipcMain.handle('get-platform', () => {
    return process.platform;
});

// Returns an object representing the user's current settings store.
ipcMain.handle('get-user-prefs', () => {
    return store.get('prefs') || {};
});

// Returns a bool indicating whether this application is registered to start automatically at logon.
ipcMain.handle('get-start-automatically', async () => {
    let autoLaunch = new AutoLaunch({name: constants.APPLICATION_NAME, path: app.getPath('exe')})
    return await autoLaunch.isEnabled();
});

// Returns the current zoom level of this this application's main window.
ipcMain.handle('get-zoom-level', () => {
    return win.webContents.getZoomLevel();
});

// ====================================================================================================================
// Settings Window Event Handlers
// ====================================================================================================================

// Called when the theme has been changed.
ipcMain.on('pref-change-theme', (event, theme) => {
    console.log(`Theme changed to: ${theme}`);

    // Apply the selected them and then save the selection to the user's settings store.
    cssInjector.injectTheme(theme);
    const prefs = store.get('prefs') || {};
    prefs.theme = theme;
    store.set('prefs', prefs);
});

// Called when the zoom level has been changed.
ipcMain.on('pref-change-zoom', (event, zoomLevel) => {
    console.log(`Zoom level changed to: ${zoomLevel}`);
    
    // Apply the newly selected zoom level.  Note that there is no need to save this setting to
    // the user's settings store.  Electron handles remembering our main window's zoom level by
    // default, so it will automatically be restored the next time the application is launched.
    win.webContents.setZoomLevel(parseInt(zoomLevel));
});

// Called when the "show menu bar" checkbox has been checked/unchecked.
ipcMain.on('pref-change-show-menubar', (e, showMenuBar) => {
    console.log(`"Show menu bar changed to: ${showMenuBar}`);
    
    // Apply the new value and then save it to the user's settings store.
    win.setMenuBarVisibility(showMenuBar);
    const prefs = store.get('prefs') || {};
    prefs.showMenuBar = showMenuBar;
    store.set('prefs', prefs);
});

// Called when the "start automatically" checkbox has been checked/unchecked.
ipcMain.on('pref-change-start-automatically', (e, startAutomatically) => {
    console.log(`"Start Automatically" changed to: ${startAutomatically}`);

    // Register/unregister this application to be automatically started at logon.
    let autoLaunch = new AutoLaunch({name: constants.APPLICATION_NAME, path: app.getPath('exe')})
    if (startAutomatically) {
        autoLaunch.enable();
    }
    else {
        autoLaunch.disable();
    }
});

// Called when the "start minimized" checkbox has been checked/unchecked.
ipcMain.on('pref-change-start-minimized', (e, startMinimized) => {
    console.log(`"Start Minimized" changed to: ${startMinimized}`);
    
    // Apply the new value and then save it to the user's settings store.
    const prefs = store.get('prefs') || {};
    prefs.startMinimized = startMinimized;
    store.set('prefs', prefs);
});

// Called when the "exit on close" checkbox has been checked/unchecked.
ipcMain.on('pref-change-exit-on-close', (e, exitOnClose) => {
    console.log(`"Exit on close" changed to: ${exitOnClose}`);
    
    // Apply the new value and then save it to the user's settings store.
    const prefs = store.get('prefs') || {};
    prefs.exitOnClose = exitOnClose;
    store.set('prefs', prefs);
});

// Called when the "hide dialer sidebar" checkbox has been checked/unchecked.
ipcMain.on('pref-change-hide-dialer-sidebar', (e, hideDialerSidebar) => {
    console.log(`Hide dialer sidebar changed to: ${hideDialerSidebar}`);
    
    // Apply the new value and then save it to the user's settings store.
    const prefs = store.get('prefs') || {};
    prefs.hideDialerSidebar = hideDialerSidebar;

    cssInjector.showHideDialerSidebar(hideDialerSidebar);
    store.set('prefs', prefs);
});
/**********************************************************************************************************************
 * Preload script for the main application window.  Contains all code
 * that needs to execute before the window's web content begins loading.
 **********************************************************************************************************************/

(async() => {
    // Get this application's execution path.
    const {ipcRenderer} = require('electron');
    const appPath = await ipcRenderer.invoke('get-appPath');

    // Modify JavaScript's "Notification" class such that all notifications that get generated will have a
    // click handler attached to them which fires a "notification-clicked" event back at the main process.
    const {notificationShim} = require('./utils/notificationShim');
    notificationShim(appPath);
})();
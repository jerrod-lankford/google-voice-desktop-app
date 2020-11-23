const OldNotification = Notification;

const { ipcRenderer } = require('electron')

// Notification shim to send a click event to the main process so we can unhide the window (if hidden)
Notification = function (title, options) {
    const oldNotification = new OldNotification(title, options);
    
    oldNotification.addEventListener('click', () => {
        console.log('clicked');
        ipcRenderer.send('notification-clicked', {});
    });

    return oldNotification;
};

Notification.prototype = OldNotification.prototype;
Notification.permission = OldNotification.permission;
Notification.requestPermission = OldNotification.requestPermission;
const { remote } = require('electron')

if (process.platform == 'darwin') {
  const { systemPreferences } = remote

  const setOSTheme = () => {
    let theme = systemPreferences.isDarkMode() ? 'dark' : 'light'
    window.localStorage.os_theme = theme

    //
    // Defined in index.html, so undefined when launching the app.
    // Will be defined for `systemPreferences.subscribeNotification` callback.
    //
    if ('__setTheme' in window) {
      window.__setTheme()
    }
  }

  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setOSTheme,
  )

  setOSTheme()
}
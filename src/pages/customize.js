(async function() {
    const { ipcRenderer } = require('electron');
    const constants = require('../constants')

    // Allow the user to hit the Escape key to close the window.
    window.addEventListener('keyup', (event) => {
        if (event.code === 'Escape') {
            window.close();
        }
    }, true);
    
    // Retrieve the user's settings store from the main process.
    const prefs = await ipcRenderer.invoke('get-user-prefs');
    let sms_alert = (prefs.sms_alert || constants.DEFAULT_SETTING_SMS_ALERT);

    // Populate the "theme" dropdown with the user's currently selected theme.
    // Notify the main process whenever the user selects a different theme.
    const themePicker = document.getElementById('theme');
    themePicker.value = (prefs.theme || constants.DEFAULT_SETTING_THEME);
    themePicker.addEventListener('change', (e) => {
        const theme = e.target.value;
        ipcRenderer.send('pref-change-theme', theme);
    });

    // Populate the "sms-alert" dropdown with the user's currently selected sound.
    // Notify the main process whenever the user selects a different sound.
    const alertPicker = document.getElementById('sms-alert');
    alertPicker.value = (prefs.sms_alert || constants.DEFAULT_SETTING_SMS_ALERT);
    alertPicker.addEventListener('change', (e) => {
        sms_alert = e.target.value;
        ipcRenderer.send('pref-change-alert', sms_alert);
    });

    // Whenever the user clicks the "test" button, inform the main
    // window to relay the request to our audio window
    const alertTestButton = document.getElementById('test-alert');
    alertTestButton.addEventListener('click', (e) => {
        ipcRenderer.send('test-alert', sms_alert);
    });
    
    // Set the "zoom" slider to the main window's current zoom level.
    // Notify the main process whenever the user selects a new level.
    const zoomSlider = document.getElementById('zoom');
    zoomSlider.value = await ipcRenderer.invoke('get-zoom-level');
    zoomSlider.addEventListener('change', (e) => {
        const zoomLevel = e.target.value;
        ipcRenderer.send('pref-change-zoom', zoomLevel);
    });

    // Whenever the user clicks the "reset zoom" button, set the "zoom"
    // slider back to 0 and notify the main process of this new value.
    const zoomResetButton = document.getElementById('reset-zoom');
    zoomResetButton.addEventListener('click', (e) => {
        zoomSlider.value = 0;
        ipcRenderer.send('pref-change-zoom', 0);
    });
    
    // Set the "show menu bar" checkbox based on the user's currently selected preference.
    // Notify the main process whenever the user changes their preference.  If we're running
    // on Mac, just hide this setting instead since we don't support it for that platform.
    const menubarSettingDiv = document.getElementById('show-menubar-div');
    const isMac = (await ipcRenderer.invoke('get-platform')) === "darwin";
    if (isMac) {
        menubarSettingDiv.remove();
    }
    else {
        const menubarSetting = document.getElementById('show-menubar');
        menubarSetting.checked = (prefs.showMenuBar != undefined) ? prefs.showMenuBar : constants.DEFAULT_SETTING_SHOW_MENU_BAR;
        menubarSetting.addEventListener('change', (e) => {
            const checked = e.target.checked;
            ipcRenderer.send('pref-change-show-menubar', checked);
        });
    }

    // Set the "start automatically" checkbox based on the user's currently selected
    // preference.  Notify the main process whenever the preference changes.
    const startAutomatically = document.getElementById('start-automatically');
    startAutomatically.checked = await ipcRenderer.invoke('get-start-automatically');
    startAutomatically.addEventListener('change', (e) => {
        const checked = e.target.checked;
        ipcRenderer.send('pref-change-start-automatically', checked);
    });

    // Set the "start minimized" checkbox based on the user's currently selected
    // startup mode.  Notify the main process whenever the user changes the mode.
    const minimizedSetting = document.getElementById('start-minimized');
    minimizedSetting.checked = (prefs.startMinimized != undefined) ? prefs.startMinimized : constants.DEFAULT_SETTING_START_MINIMIZED;
    minimizedSetting.addEventListener('change', (e) => {
        const checked = e.target.checked;
        ipcRenderer.send('pref-change-start-minimized', checked);
    });

    // Set the "exit on close" checkbox based on the user's currently selected
    // preference.  Notify the main process whenever the preference changes.
    const exitOnCloseSetting = document.getElementById('exit-on-close');
    exitOnCloseSetting.checked = (prefs.exitOnClose != undefined) ? prefs.exitOnClose : constants.DEFAULT_SETTING_EXIT_ON_CLOSE;
    exitOnCloseSetting.addEventListener('change', (e) => {
        const checked = e.target.checked;
        ipcRenderer.send('pref-change-exit-on-close', checked);
    });

    // Set the "hide dialer sidebar" checkbox based on the user's currently selected
    // preference.  Notify the main process whenever the preference changes.
    const hideDialerSidebar = document.getElementById('hide-dialer-sidebar');
    hideDialerSidebar.checked = (prefs.hideDialerSidebar != undefined) ? prefs.hideDialerSidebar : constants.DEFAULT_HIDE_DIALER_SIDEBAR;
    hideDialerSidebar.addEventListener('change', (e) => {
        const checked = e.target.checked;
        ipcRenderer.send('pref-change-hide-dialer-sidebar', checked);
    });

    // Close the window if the user clicks the "Close" button.
    const closeButton = document.getElementById('close-button');
    closeButton.addEventListener('click', (e) => {
        window.close();
    });
})();

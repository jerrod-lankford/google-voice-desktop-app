
(function() {
    const { ipcRenderer, remote } = require('electron');
    
    console.log(remote);
    const currentWindow = remote.getCurrentWindow();
    const prefs = currentWindow.prefs || {};
    const currentTheme = prefs.theme || 'default';

    const themePicker = document.getElementById("theme");
    themePicker.addEventListener('change', (e) => {
        const theme = e.target.value;
        ipcRenderer.send('pref-change', theme);
    });
    themePicker.value = currentTheme;
    
    const currentZoom = prefs.zoom || 100;
    const zoomSetting = document.getElementById("zoom");
    zoomSetting.addEventListener('blur', (e) => {
         const zoom = e.target.value;
         ipcRenderer.send('pref-change-zoom', zoom);
    });
    zoomSetting.value = currentZoom;

    const currentStartMinimized = prefs.startMinimized || false;
    const minimizedSetting = document.getElementById("start-minimized");
    minimizedSetting.addEventListener('blur', (e) => {
         const val = e.target.value;
         ipcRenderer.send('pref-change-start-minimized', val == 'true');
    });
    minimizedSetting.value = currentStartMinimized;
        
})();
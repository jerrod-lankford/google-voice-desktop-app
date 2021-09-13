
(function() {
    const { ipcRenderer } = require('electron');
    
    // Change handlers
    const themePicker = document.getElementById("theme");
    themePicker.addEventListener('change', (e) => {
        const theme = e.target.value;
        ipcRenderer.send('pref-change', theme);
    });
    
    const zoomSetting = document.getElementById("zoom");
    zoomSetting.addEventListener('blur', (e) => {
         const zoom = e.target.value;
         ipcRenderer.send('pref-change-zoom', zoom);
    });

    const minimizedSetting = document.getElementById("start-minimized");
    minimizedSetting.addEventListener('change', (e) => {
         const val = e.target.checked;
         ipcRenderer.send('pref-change-start-minimized', val);
    });

    // Listeners for initial preference setting
    ipcRenderer.on('set-preferences', (e, prefs) => {
        const themePicker = document.getElementById("theme");
        const zoomSetting = document.getElementById("zoom");
        const minimizedSetting = document.getElementById("start-minimized");

        themePicker.value = prefs.theme || 'default';
        zoomSetting.value = prefs.zoom || 100;
        minimizedSetting.checked =  prefs.startMinimized || false;
    });
        
})();
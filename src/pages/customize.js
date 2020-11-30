
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
})();
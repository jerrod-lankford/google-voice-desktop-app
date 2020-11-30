const fs = require('fs');

module.exports = class Injector {
    constructor(win) {
       this.win = win;
       this.icon = fs.readFileSync('src/utils/iconSnippet.html');
    }

    inject() {
        // Inject menu
        this.win.webContents.executeJavaScript(`
            const div = document.createElement('div');
            div.innerHTML = \`${this.icon}\`;
            Array.from(document.querySelectorAll('[gv-test-id="sidenav-spam"]')).forEach(s => s.parentNode.appendChild(div))
        `);

        // Inject click handler for menu
        this.win.webContents.executeJavaScript(`
            const { ipcRenderer } = require('electron');

            function handleCustomize() {
                ipcRenderer.send('show-customize', {});
            }

            document.getElementById("customize").addEventListener("click", handleCustomize);
        `);
    }
}
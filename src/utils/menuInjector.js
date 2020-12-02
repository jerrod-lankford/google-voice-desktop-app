const fs = require('fs');
const path = require('path');

module.exports = class Injector {
    constructor(app, win) {
        this.win = win;
        this.icon = fs.readFileSync(path.join(app.getAppPath(), 'src', 'utils','iconSnippet.html'));
        this.retries = 5;
    }

    inject() {
        this.win.webContents.executeJavaScript(`document.querySelectorAll('[gv-test-id="sidenav-spam"]').length`).then(len => {
            console.log('Attemping to inject menu');
            if (len > 0) {
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
                // Reset retry
                this.retries = 5;
            } else {
                if (this.retries < 0) {
                    console.log('Injecting menu failed, retrying in 1 second');
                    setTimeout(this.inject.bind(this), 1000);
                    this.retries--;
                }
            }
        });
    }
}
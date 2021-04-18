const sass = require('sass');
const fs = require('fs');
const path = require('path');

const BASE = `base.scss`;
const MAPPINGS = `mappings.scss`;

module.exports = class Injector {
    constructor(app, win) {
        this.win = win;
        this.app = app;
    }

    inject(theme) {
        if (this.styleKey) {
            this.win.webContents.removeInsertedCSS(this.styleKey);
            this.styleKey = null;
        }

        if (theme !== 'default') {
            try {
                const file = fs.readFileSync(path.join(this.app.getAppPath(), 'src', 'themes', `${theme}.scss`), 'utf-8');
                const data = joinImports(this.app, file);
                const result = sass.renderSync({data});
                const styles = result.css.toString().replace(/;/g, ' !important;');
                if (this.win) {
                    this.win.webContents.insertCSS(styles).then(key => {
                        this.styleKey = key;
                    });
                }
            } catch (e) {
                console.log(e);
                console.error(`Could not find theme ${theme}`);
            }
        }
    }
}

/**
 * The way sass processes use functions just isn't good enough, we need variables that can scope across files and we also
 * need to be able to split our selectors and placeholder selectors into different files for neatness. Anyway this is just a
 * simple function to recombine multiple files and then let sass process that
 */
function joinImports(app, file) {
    const base = fs.readFileSync(path.join(app.getAppPath(), 'src', 'themes', BASE), 'utf-8');
    const mappings = fs.readFileSync(path.join(app.getAppPath(), 'src', 'themes', MAPPINGS), 'utf-8');
    let contents = file.replace("@use 'base';", base);
    contents = contents.replace("@use 'mappings';", mappings);

    return contents;
}
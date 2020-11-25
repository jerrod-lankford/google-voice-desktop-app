const fs = require('fs');
const CLASS_MAPPINGS = require('./classMappings');

/**
 * In order for people to write themes with sane naming conventions, and in order to keep all themes working if we need to change a css selector;
 * we map our sane css names to the hacky bullshit google voice classes. Of course its as difficult as possible to do this, so it heavily relys on
 * dom structure, and or class names that may change at any time and are subject to break without notice
 */

module.exports = class Injector {
    constructor(app, win, fileName) {
        this.win = win;
        this.app = app;
        this.file = fs.readFileSync(fileName, 'utf-8');
    }

    inject() {
        this.file = injectBaseStyles(this.app, this.file);
        this.file = injectImportant(this.file);
        this.win.webContents.executeJavaScript(`window.parseStyles = function ${this.parseStyles}; window.parseStyles(\`${this.file}\`, \`${JSON.stringify(CLASS_MAPPINGS)}\`);`).then(result => {
            if (result.error) {
                console.error(result.error);
            } else {
                console.log(result.styles);
                this.win.webContents.insertCSS(result.styles);
            }
        });
    }

    // Funciton executed in the context of webContents
    parseStyles(file, classMappings) {
        const transformRules = function(cssRules) {
            let styles = "";
            Array.from(cssRules).forEach(rule => {
                const selectors = rule.selectorText.split(',');
                const newSelectors = []
                selectors.forEach(selector => {
                    const firstClass = getFirstClass(selector);
                    if (firstClass) {
                        const mappings = classMappings[firstClass];
                        if (!mappings) throw new Error(`Missing mapping for class ${firstClass}`);
                        mappings.forEach(mapping => {
                            const newSelector = selector.replace(`${firstClass}__`, mapping);
                            newSelectors.push(newSelector);
                        });
                    }
                });
        
                rule.selectorText = newSelectors.join(', ');
                styles = `${styles}\n${rule.cssText}`;
            });
        
            return styles;
        }

        const getFirstClass = function(selector) {
            let re = /([\w-]*)__/;
            const match = re.exec(selector);
            return match && match[1];
        }

        try {
            classMappings = JSON.parse(classMappings);
            var doc = document.implementation.createHTMLDocument(""),
            styleElement = document.createElement("style");
            styleElement.textContent = file;

            // the style will only be parsed once it is added to a document
            doc.body.appendChild(styleElement);

            const styles = transformRules(styleElement.sheet.cssRules);
            return { styles };
        } catch (error) {
            return { error };
        }
    }
}

function injectBaseStyles(app, file) {
    // TODO be smarter about this instead of replacing just a base import
    const baseStyles = fs.readFileSync(`${app.getAppPath()}/src/themes/base.css`, 'utf-8');
    return file.replace("@include 'base.css';", baseStyles);
}

/**
 * Rather that dick around with css selector specificity we will just mark these all as !important. They are overrides after all
 * @param {String} file 
 */
function injectImportant(file) {
    return file.replaceAll(';', ' !important;');
}

/**
 * side-nav__ > div,
 * side-nav-item__ > svg
 */

//  nav1 > div, nav2 > div, item1 > svg, item2 > svg
let jsdom = require("jsdom");
let {JSDOM} = jsdom;
let {virtualDOM} = new JSDOM("");

module.exports = (html, wndw) => {
    let defaultStyles = {
        b: {bold: true},
        strong: {bold: true},
        u: {decoration: 'underline'},
        em: {italics: true},
        i: {italics: true},
        h1: {fontSize: 24, bold: true, marginBottom: 5},
        h2: {fontSize: 22, bold: true, marginBottom: 5},
        h3: {fontSize: 20, bold: true, marginBottom: 5},
        h4: {fontSize: 18, bold: true, marginBottom: 5},
        h5: {fontSize: 16, bold: true, marginBottom: 5},
        h6: {fontSize: 14, bold: true, marginBottom: 5},
        a: {color: 'blue', decoration: 'underline'},
        strike: {decoration: 'lineThrough'},
        p: {margin: [0, 5, 0, 10]},
        ul: {marginBottom: 5},
        li: {marginLeft: 5},
        table: {marginBottom: 5},
        th: {bold: true, fillColor: '#EEEEEE'}
    };

    let convertHtml = (html) => {
        wndw = (wndw) ? wndw : virtualDOM;
        const docDef = [];
        let parser = new wndw.DOMParser();
        let parsedHtml = parser.parseFromString(html, 'text/html');
        [].forEach.call(parsedHtml.body.childNodes, (child) => {
            let ret = parseElement(child);
            if (ret) {
                if (Array.isArray(ret) && ret.length === 1) {
                    ret = ret[0];
                }
                docDef.push(ret);
            }
        });
        return docDef;
    };

    let parseElement = (element, parentNode) => {
        let nodeName = element.nodeName.toLowerCase();
        let parentNodeName = (parentNode ? parentNode.nodeName.toLowerCase() : '');
        let ret, text, cssClass;

        if (element.nodeName === 1) {
            ret = [];
            [].forEach.call(element.childNodes, (child) => {
                child = parseElement(child, element);
                if (child) {
                    if (Array.isArray(child) && child.length === 1) {
                        child = child[0];
                    }
                    ret.push(child);
                }
            });
            if (ret.length === 0) {
                ret = "";
            }
            if (nodeName === 'br') {
                ret = '\n';
            }
            if (nodeName === 'br') {
                ret = '\n';
            }
            if (nodeName === 'ul') {
                ret = {"_": ret};
                ret[nodeName] = ret._;
                delete ret._;
                ret.style = ['html-' + nodeName];
                cssClass = element.getAttribute("class");
                if (cssClass) {
                    ret.style = ret.style.concat(cssClass.split(' '));
                }
                setComputedStyle(ret, element.getAttribute("style"));
            }
            if (nodeName === 'table') {
                ret = {"_": ret, table: {body: []}};
                ret._.forEach((re) => {
                    if (re.stack) {
                        let tr = [];
                        re.stack.forEach((r) => {
                            if (r.stack) {
                                ret.table.body.push(r.stack)
                            } else {
                                tr.push(r);
                            }
                        });
                        if (tr.length > 0) ret.table.body.push(tr);
                    }
                });
                delete ret._;
                setComputedStyle(ret, element.getAttribute("style"));
            }
            if (nodeName === 'img') {
                ret = {image: element.getAttribute("src")};
                ret.style = ['html-img'];
                cssClass = element.getAttribute("class");
                if (cssClass) {
                    ret.style = ret.style.concat(cssClass.split(' '));
                }
                if (element.getAttribute("width")) {
                    ret.width = parseFloat(element.getAttribute("width"))
                }
                if (element.getAttribute("height")) {
                    ret.height = parseFloat(element.getAttribute("height"))
                }
                setComputedStyle(ret, element.getAttribute("style"));
            }
            if (ret) {
                if (Array.isArray(ret)) {
                    if (ret.length === 1) {
                        ret = ret[0];
                        ret.style = (ret.style || []).concat(['html-' + nodeName]);
                    } else {
                        ret = (nodeName === 'p' ? {text: ret} : {stack: ret});
                        if (nodeName === 'p') {
                            applyDefaultStyle(ret, 'p');
                        }
                        ret.style = ['html-' + nodeName];
                    }
                } else if (ret.table || ret.ol || ret.ul) {
                    ret.style = ['html-' + nodeName];
                    cssClass = element.getAttribute("class");
                    if (cssClass) {
                        ret.style = ret.style.concat(cssClass.split(' '));
                    }
                    applyDefaultStyle(ret, 'table');
                }
            }
            return ret;
        }
        if (element.nodeName === 3) {
            if (element.textContent) {
                text = element.textContent.replace(/\n(\s+)?/g, "");
                ret = {'text': text};
                if (!parentNodeName) {
                    ret = text
                }
                if (parentNodeName !== 'p') {
                    applyDefaultStyle(ret, parentNodeName);
                }
                if (parentNodeName === "a") {
                    ret.link = parentNode.getAttribute("href");
                }
                cssClass = parentNode.getAttribute("class");
                if (cssClass) {
                    ret.style = cssClass.split(' ');
                }
                if (ret.text) {
                    setComputedStyle(ret, parentNode.getAttribute("style"));
                }
            }
            return ret;
        }
        return "";
    };

    let applyDefaultStyle = (ret, nodeName) => {
        if (defaultStyles[nodeName]) {
            for (let style in defaultStyles[nodeName]) {
                if (defaultStyles[nodeName].hasOwnProperty(style)) {
                    ret[style] = defaultStyles[nodeName][style];
                }
            }
        }
    };

    let computeStyle = (style) => {
        let styleDefs = style.split(';').map((style) => {
            return style.replace(/\s/g, '').toLowerCase().split(':')
        });
        const ret = [];
        styleDefs.forEach((styleDef) => {
            let key = styleDef[0];
            let value = styleDef[1];
            if (key === 'margin') {
                value = value.replace(/(\d+)([^\d]+)/g, "$1 ").trim().split(' ');
                if (value.length === 1) {
                    value = +value[0];
                }
                else if (value.length === 2) {
                    value = [+value[1], +value[0]];
                }
                else if (value.length === 3) {
                    value = [+value[1], +value[0], +value[1], +value[2]];
                }
                else if (value.length === 4) {
                    value = [+value[3], +value[0], +value[1], +value[2]];
                }
                ret.push({key: key, value: value});
            }
            else if (key === 'text-align' && value === 'bold') {
                ret.push({key: 'bold', value: true});
            }
            else if (key === 'font-weight' && value === 'bold') {
                ret.push({key: 'bold', value: true});
            }
            else if (key === 'text-decoration') {
                ret.push({key: 'decoration', value: toCamelCase(value)});
            }
            else if (key === 'font-style' && value === 'italic') {
                ret.push({key: 'italics', value: true});
            }
            else if (key === 'color') {
                ret.push({key: 'color', value: parseColor(value)});
            }
            else if (key === 'background-color') {
                ret.push({key: 'background', value: parseColor(value)});
            }
            else {
                if (key.indexOf("-") > -1) {
                    key = toCamelCase(key);
                }
                if (value) {
                    value = value.replace(/(\d+)([^\d]+)/g, "$1 ").trim();
                    if (!isNaN(value)) {
                        value = +value;
                    }
                    ret.push({key: key, value: value});
                }
            }
        });
        return ret;
    };

    let setComputedStyle = (ret, cssStyle) => {
        if (cssStyle) {
            cssStyle = computeStyle(cssStyle);
            cssStyle.forEach((style) => {
                ret[style.key] = style.value;
            })
        }
    };

    let toCamelCase = (str) => {
        return str.replace(/-([a-z])/g, (g) => {
            return g[1].toUpperCase()
        });
    };

    let parseColor = (color) => {
        let haxRegex = new RegExp('^#([0-9a-f]{3}|[0-9a-f]{6})$');
        let rgbRegex = new RegExp('^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$');
        let nameRegex = new RegExp('^[a-z]+$');

        if (haxRegex.test(color)) {
            return color;
        } else if (rgbRegex.test(color)) {
            let decimalColors = rgbRegex.exec(color).slice(1);
            for (let i = 0; i < 3; i++) {
                let decimalValue = +decimalColors[i];
                if (decimalValue > 255) {
                    decimalValue = 255;
                }
                let hexString = '0' + decimalValue.toString(16);
                hexString = hexString.slice(-2);
                decimalColors[i] = hexString;
            }
            return '#' + decimalColors.join('');
        } else if (nameRegex.test(color)) {
            return color;
        } else {
            console.error('Could not parse color "' + color + '"');
            return color;
        }
    };
    return convertHtml(html)
};

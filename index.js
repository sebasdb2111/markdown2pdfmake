const marked = require("marked");
const { JSDOM } = require("jsdom");

const DEFAULT_STYLES = {
    b: { bold: true },
    strong: { bold: true },
    u: { decoration: "underline" },
    em: { italics: true },
    i: { italics: true },
    h1: { fontSize: 24, bold: true, marginBottom: 5 },
    h2: { fontSize: 22, bold: true, marginBottom: 5 },
    h3: { fontSize: 20, bold: true, marginBottom: 5 },
    h4: { fontSize: 18, bold: true, marginBottom: 5 },
    h5: { fontSize: 16, bold: true, marginBottom: 5 },
    h6: { fontSize: 14, bold: true, marginBottom: 5 },
    a: { color: "blue", decoration: "underline" },
    strike: { decoration: "lineThrough" },
    p: { margin: [0, 5, 0, 10] },
    ul: { marginBottom: 5 },
    li: { marginLeft: 5 },
    table: { marginBottom: 5 },
    th: { bold: true, fillColor: "#EEEEEE" }
};

function markdownToHtml(markdownText) {
    if (typeof marked.parse === "function") {
        return marked.parse(markdownText);
    }
    return marked(markdownText);
}

function applyDefaultStyle(target, nodeName) {
    const defaultStyle = DEFAULT_STYLES[nodeName];
    if (!defaultStyle) {
        return;
    }
    Object.keys(defaultStyle).forEach(style => {
        target[style] = defaultStyle[style];
    });
}

function toCamelCase(value) {
    return value.replace(/-([a-z])/g, match => {
        return match[1].toUpperCase();
    });
}

function parseColor(color) {
    const hexRegex = new RegExp("^#([0-9a-f]{3}|[0-9a-f]{6})$");
    const rgbRegex = new RegExp("^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$");
    const nameRegex = new RegExp("^[a-z]+$");

    if (hexRegex.test(color)) {
        return color;
    }

    if (rgbRegex.test(color)) {
        const decimalColors = rgbRegex.exec(color).slice(1);
        for (let index = 0; index < 3; index += 1) {
            let decimalValue = +decimalColors[index];
            if (decimalValue > 255) {
                decimalValue = 255;
            }
            let hexString = "0" + decimalValue.toString(16);
            hexString = hexString.slice(-2);
            decimalColors[index] = hexString;
        }
        return "#" + decimalColors.join("");
    }

    if (nameRegex.test(color)) {
        return color;
    }

    console.error('Could not parse color "' + color + '"');
    return color;
}

function parseMargin(value) {
    const values = value
        .replace(/(\d+)([^\d]+)/g, "$1 ")
        .trim()
        .split(" ");

    if (values.length === 1) {
        return +values[0];
    }
    if (values.length === 2) {
        return [+values[1], +values[0]];
    }
    if (values.length === 3) {
        return [+values[1], +values[0], +values[1], +values[2]];
    }
    if (values.length === 4) {
        return [+values[3], +values[0], +values[1], +values[2]];
    }

    return value;
}

function computeStyle(style) {
    const styleDefs = style.split(";").map(item => {
        return item
            .replace(/\s/g, "")
            .toLowerCase()
            .split(":");
    });

    const ret = [];
    styleDefs.forEach(styleDef => {
        let key = styleDef[0];
        let value = styleDef[1];

        switch (key) {
            case "margin": {
                ret.push({ key: "margin", value: parseMargin(value) });
                break;
            }
            case "text-align": {
                ret.push({ key: "alignment", value: value });
                break;
            }
            case "font-weight": {
                if (value === "bold") {
                    ret.push({ key: "bold", value: true });
                }
                break;
            }
            case "text-decoration": {
                ret.push({ key: "decoration", value: toCamelCase(value) });
                break;
            }
            case "font-style": {
                if (value === "italic") {
                    ret.push({ key: "italics", value: true });
                }
                break;
            }
            case "color": {
                ret.push({ key: "color", value: parseColor(value) });
                break;
            }
            case "background-color": {
                ret.push({ key: "background", value: parseColor(value) });
                break;
            }
            default: {
                if (key.indexOf("-") > -1) {
                    key = toCamelCase(key);
                }
                if (value) {
                    value = value.replace(/(\d+)([^\d]+)/g, "$1 ").trim();
                    if (!isNaN(value)) {
                        value = +value;
                    }
                    ret.push({ key: key, value: value });
                }
            }
        }
    });

    return ret;
}

function setComputedStyle(target, cssStyle) {
    if (!cssStyle) {
        return;
    }

    computeStyle(cssStyle).forEach(style => {
        target[style.key] = style.value;
    });
}

function parseTextNode(element, parentNode) {
    if (!element.textContent) {
        return undefined;
    }

    const text = element.textContent.replace(/\n(\s+)?/g, "");
    if (!text || text.trim() === "") {
        return undefined;
    }

    const parentNodeName = parentNode ? parentNode.nodeName.toLowerCase() : "";
    if (!parentNodeName) {
        return text;
    }

    const ret = { text: text };
    if (parentNodeName !== "p") {
        applyDefaultStyle(ret, parentNodeName);
    }

    if (parentNodeName === "a") {
        ret.link = parentNode.getAttribute("href");
    }

    const cssClass = parentNode.getAttribute("class");
    if (cssClass) {
        ret.style = cssClass.split(" ");
    }

    setComputedStyle(ret, parentNode.getAttribute("style"));
    return ret;
}

function getChildrenResult(element, parseNode) {
    const ret = [];
    [].forEach.call(element.childNodes, child => {
        let parsedChild = parseNode(child, element);
        if (!parsedChild) {
            return;
        }
        if (Array.isArray(parsedChild) && parsedChild.length === 1) {
            parsedChild = parsedChild[0];
        }
        ret.push(parsedChild);
    });
    return ret.length > 0 ? ret : "";
}

function applyClassStyles(target, element, tagName) {
    target.style = ["html-" + tagName];
    const cssClass = element.getAttribute("class");
    if (cssClass) {
        target.style = target.style.concat(cssClass.split(" "));
    }
}

function normalizeTableCellContent(cellChildren) {
    if (cellChildren === "") {
        return "";
    }
    if (Array.isArray(cellChildren)) {
        if (cellChildren.length === 1) {
            return cellChildren[0];
        }
        return { stack: cellChildren };
    }
    return cellChildren;
}

function parseTable(element, parseNode) {
    const ret = { table: { body: [] } };
    const rows = element.querySelectorAll("tr");

    [].forEach.call(rows, row => {
        const tableRow = [];
        [].forEach.call(row.children, cell => {
            const nodeName = cell.nodeName.toLowerCase();
            if (nodeName !== "th" && nodeName !== "td") {
                return;
            }

            const cellChildren = getChildrenResult(cell, parseNode);
            let cellContent = normalizeTableCellContent(cellChildren);
            if (nodeName === "th") {
                if (cellContent && typeof cellContent === "object") {
                    applyDefaultStyle(cellContent, "th");
                } else {
                    cellContent = { text: cellContent, bold: true, fillColor: "#EEEEEE" };
                }
            }
            tableRow.push(cellContent);
        });

        if (tableRow.length > 0) {
            ret.table.body.push(tableRow);
        }
    });

    return ret;
}

function parseElementNode(element, parseNode) {
    const nodeName = element.nodeName.toLowerCase();
    let ret = getChildrenResult(element, parseNode);

    if (nodeName === "br") {
        return "\n";
    }

    if (nodeName === "ol" || nodeName === "ul") {
        const listRet = { _: ret };
        listRet[nodeName] = listRet._;
        delete listRet._;
        applyClassStyles(listRet, element, nodeName);
        setComputedStyle(listRet, element.getAttribute("style"));
        return listRet;
    }

    if (nodeName === "table") {
        ret = parseTable(element, parseNode);
        setComputedStyle(ret, element.getAttribute("style"));
        return ret;
    }

    if (nodeName === "img") {
        const imgRet = { image: element.getAttribute("src") };
        applyClassStyles(imgRet, element, "img");
        if (element.getAttribute("width")) {
            imgRet.width = parseFloat(element.getAttribute("width"));
        }
        if (element.getAttribute("height")) {
            imgRet.height = parseFloat(element.getAttribute("height"));
        }
        setComputedStyle(imgRet, element.getAttribute("style"));
        return imgRet;
    }

    if (Array.isArray(ret)) {
        if (ret.length === 1) {
            ret = ret[0];
            if (ret && typeof ret === "object") {
                ret.style = (ret.style || []).concat(["html-" + nodeName]);
            }
            return ret;
        }

        if (nodeName === "p") {
            ret = { stack: ret };
            applyDefaultStyle(ret, "p");
        }

        if (ret && typeof ret === "object") {
            ret.style = ["html-" + nodeName];
        }
        return ret;
    }

    if (ret && typeof ret === "object" && (ret.table || ret.ol || ret.ul)) {
        applyClassStyles(ret, element, nodeName);
        applyDefaultStyle(ret, "table");
    }

    return ret;
}

function convertMarkdown(markdownText, virtualDOM) {
    const parser = new virtualDOM.DOMParser();
    const parsedHtml = parser.parseFromString(markdownToHtml(markdownText), "text/html");
    const docDef = [];

    const parseNode = (element, parentNode) => {
        switch (element.nodeType) {
            case 1:
                return parseElementNode(element, parseNode);
            case 3:
                return parseTextNode(element, parentNode);
            default:
                return "";
        }
    };

    [].forEach.call(parsedHtml.body.childNodes, child => {
        let parsed = parseNode(child);
        if (!parsed) {
            return;
        }
        if (Array.isArray(parsed) && parsed.length === 1) {
            parsed = parsed[0];
        }
        docDef.push(parsed);
    });

    return docDef;
}

module.exports = (htmlText, wndw) => {
    const { window } = new JSDOM("");
    const virtualDOM = wndw || window;
    return convertMarkdown(htmlText, virtualDOM);
};

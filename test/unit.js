const assert = require("assert");
const convert = require("../index");

function test(name, run) {
    try {
        run();
        process.stdout.write(`✓ ${name}\n`);
    } catch (error) {
        process.stderr.write(`✗ ${name}\n`);
        process.stderr.write(`${error.stack}\n`);
        process.exitCode = 1;
    }
}

test("maps inline styles to pdfmake properties", () => {
    const input = "<p style=\"margin: 1px 2px 3px 4px; text-align: center; font-weight: bold; font-style: italic; color: rgb(255, 0, 15);\">Hello</p>";
    const output = convert(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].margin, [4, 1, 2, 3]);
    assert.strictEqual(output[0].alignment, "center");
    assert.strictEqual(output[0].bold, true);
    assert.strictEqual(output[0].italics, true);
    assert.strictEqual(output[0].color, "#ff000f");
});

test("converts paragraph and link elements", () => {
    const output = convert("[Copilot](https://github.com/features/copilot)");

    assert.strictEqual(output.length, 1);
    assert.strictEqual(output[0].text, "Copilot");
    assert.strictEqual(output[0].link, "https://github.com/features/copilot");
    assert.strictEqual(output[0].color, "blue");
    assert.strictEqual(output[0].decoration, "underline");
    assert.deepStrictEqual(output[0].style, ["html-a", "html-p"]);
});

test("converts ul and ol list elements", () => {
    const unordered = convert("- item 1\n- item 2");
    const ordered = convert("1. first\n2. second");

    assert.strictEqual(unordered[0].ul.length, 2);
    assert.strictEqual(unordered[0].ul[0].text, "item 1");
    assert.strictEqual(unordered[0].ul[0].marginLeft, 5);

    assert.strictEqual(ordered[0].ol.length, 2);
    assert.strictEqual(ordered[0].ol[1].text, "second");
});

test("converts table elements including th defaults", () => {
    const output = convert("<table><tr><th>H</th><td>A</td></tr></table>");

    assert.strictEqual(output.length, 1);
    assert.strictEqual(output[0].table.body.length, 1);
    assert.strictEqual(output[0].table.body[0].length, 2);
    assert.strictEqual(output[0].table.body[0][0].text, "H");
    assert.strictEqual(output[0].table.body[0][0].bold, true);
    assert.strictEqual(output[0].table.body[0][0].fillColor, "#EEEEEE");
    assert.strictEqual(output[0].table.body[0][1].text, "A");
});

test("converts image element attributes", () => {
    const output = convert("<img src=\"https://img.test/a.png\" width=\"123\" height=\"45\" style=\"margin: 5px;\" />");

    assert.strictEqual(output.length, 1);
    assert.strictEqual(output[0].image, "https://img.test/a.png");
    assert.strictEqual(output[0].width, 123);
    assert.strictEqual(output[0].height, 45);
    assert.strictEqual(output[0].margin, 5);
});

test("handles empty nodes without throwing", () => {
    const output = convert("<p>  \n  </p>");

    assert.deepStrictEqual(output, []);
});

test("keeps invalid colors and reports parse warning", () => {
    const errors = [];
    const originalError = console.error;
    console.error = message => errors.push(message);

    const output = convert("<p style=\"color: #12zz\">bad color</p>");

    console.error = originalError;

    assert.strictEqual(output[0].color, "#12zz");
    assert.strictEqual(errors.length, 1);
});

test("supports mixed nested tags", () => {
    const output = convert("<p><strong>bold <em>italic</em></strong></p>");

    assert.strictEqual(Array.isArray(output[0]), true);
    assert.strictEqual(output[0][0].text, "bold ");
    assert.strictEqual(output[0][0].bold, true);
    assert.strictEqual(output[0][1].text, "italic");
    assert.strictEqual(output[0][1].italics, true);
});

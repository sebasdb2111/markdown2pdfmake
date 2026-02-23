const fs = require("fs");
const path = require("path");
const markdown2pdfmake = require("../index");

const args = process.argv.slice(2);
const inputArg = args.find(arg => !arg.startsWith("--"));
const outArg = args.find(arg => arg.startsWith("--out="));

const defaultMarkdown = `
# Playground

This is a quick local test.

- one
- two

[Example](https://example.com)
`;

function readMarkdownInput() {
    if (!inputArg) {
        return defaultMarkdown;
    }

    const inputPath = path.resolve(process.cwd(), inputArg);
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    return fs.readFileSync(inputPath, "utf8");
}

function getOutputPath() {
    if (!outArg) {
        return null;
    }

    const outputPath = outArg.replace("--out=", "").trim();
    if (!outputPath) {
        throw new Error("Invalid --out value. Use --out=path/to/output.json");
    }

    return path.resolve(process.cwd(), outputPath);
}

function main() {
    const markdown = readMarkdownInput();
    const content = markdown2pdfmake(markdown);
    const jsonOutput = JSON.stringify(content, null, 2);

    const outputPath = getOutputPath();
    if (outputPath) {
        fs.writeFileSync(outputPath, jsonOutput + "\n", "utf8");
        process.stdout.write(`Output written to ${outputPath}\n`);
        return;
    }

    process.stdout.write(jsonOutput + "\n");
}

try {
    main();
} catch (error) {
    process.stderr.write(error.message + "\n");
    process.stderr.write("Usage: npm run try -- [input.md] [--out=output.json]\n");
    process.exit(1);
}

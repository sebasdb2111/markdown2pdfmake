# markdown2pdfmake

Converter from Markdown/HTML to a pdfmake document definition array.

## Installation

```bash
npm install markdown2pdfmake
```

## Basic usage

```js
const markdown2pdfmake = require("markdown2pdfmake");

const markdown = `
# Invoice

Please review the following items:

- Design work
- Development work

[Contact us](https://example.com)
`;

const content = markdown2pdfmake(markdown);

const docDefinition = {
	content
};
```

## Quick local testing

You can test the converter output directly from this project:

```bash
npm run try
```

Use a custom markdown file:

```bash
npm run try -- ./test/example.md
```

Write output to a JSON file:

```bash
npm run try -- ./test/example.md --out=./output.json
```

## Supported markdown/html features

- Headings (`h1` to `h6`)
- Paragraphs and line breaks
- Bold/italic/underline/strikethrough
- Links (`a`)
- Unordered and ordered lists (`ul`, `ol`, `li`)
- Tables (`table`, `tr`, `th`, `td`)
- Images (`img`), including `width` and `height`
- Inline styles in `style` attributes

## Style mapping behavior

Inline CSS properties are mapped to pdfmake fields when possible:

- `margin` → `margin`
- `text-align` → `alignment`
- `font-weight: bold` → `bold: true`
- `font-style: italic` → `italics: true`
- `text-decoration` → `decoration`
- `color` → `color` (supports hex, rgb, and color names)
- `background-color` → `background`

Default style behavior by tag:

- `b`, `strong` → `bold: true`
- `i`, `em` → `italics: true`
- `u` → underline decoration
- `a` → blue + underline
- `h1..h6` → increasing font sizes + bold
- `th` → `bold: true` and `fillColor: "#EEEEEE"`

## Complete input/output example

Input:

```md
# Quarterly Report

Team updates:

- Completed migration
- Improved tests

[Dashboard](https://example.com)

<table>
	<tr><th>Metric</th><th>Value</th></tr>
	<tr><td>Coverage</td><td>92%</td></tr>
</table>
```

Output (content excerpt):

```js
[
	{ text: "Quarterly Report", fontSize: 24, bold: true, marginBottom: 5, style: ["html-h1"] },
	{
		ul: [
			{ text: "Completed migration", marginLeft: 5, style: ["html-li"] },
			{ text: "Improved tests", marginLeft: 5, style: ["html-li"] }
		],
		style: ["html-ul"]
	},
	{
		text: "Dashboard",
		link: "https://example.com",
		color: "blue",
		decoration: "underline",
		style: ["html-a", "html-p"]
	},
	{
		table: {
			body: [
				[
					{ text: "Metric", bold: true, fillColor: "#EEEEEE" },
					{ text: "Value", bold: true, fillColor: "#EEEEEE" }
				],
				[{ text: "Coverage" }, { text: "92%" }]
			]
		}
	}
]
```

## Known limitations

- The package focuses on common markdown/html structures, not full CSS layout semantics.
- Nested/complex HTML may be flattened depending on pdfmake content model constraints.
- Unsupported CSS properties are passed through only when values are parseable.
- Invalid colors are kept as-is and logged with a warning.

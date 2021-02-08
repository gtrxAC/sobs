#!/usr/bin/env node

// sobs compiler
// This script generates an html file using a sobs program and a template.
// You will need node.js to run this script.

// Usage: node compiler.js game.sobs > game.html
// Generates a sobs html file from game.sobs and outputs it to game.html.

const linesplit	= /\r\n|\n|\r/;
let images = '';
const fs = require('fs');

// Load the input script.
let script = loadFile(process.argv[2]);

// Load the template as a line array.
const runtime = fs.readFileSync('runtime.html')
.toString()
.split(linesplit);


// Loads a file and parses it into an array.
function loadFile(file) {
	// Load the file as a string.
	return fs.readFileSync(file)
	.toString()

	// Parse load commands into <img> tags (this is parsed before comments
	// so you can use https://).
	.replace(/^\s*load (.*)$/gm, (_, path) => {
		images += `\t\t\t<img src="${path}"></img>\n`;
		return '';
	})

	// Remove comments.
	.replace(/\s*\/\/.*$/gm, '')
	.split(linesplit)
}


// Expand the include statements in the file.
let index = 0;
while (index < script.length) {
	const line = script[index].trim();
	if (line.startsWith('include ')) {
		// Insert the included file's content into the main file.
		const file = line.slice(8).replace('*', 'index');
		const included = loadFile(`${file}.sobs`);
		script.splice(index, 1, included);
		script = script.flat();
	} else index++;
}

// Convert the line array into a single string.
script = script.join('\n')

// // Internally sobs uses zero width spaces to escape quotes and parentheses,
// // allow using backslashes like most languages.
// .replace(/\\([()"])/g, `\\u200b$1`)

// Escape ` to \` , since lines are surrounded by ` in the output.
.replace(/`/g, '\\`')

// Convert the string back into a line array.
.split('\n')

// Remove empty lines.
.filter(l => l.trim().length);

// Find where the code and images should be inserted.
const codeline = runtime.findIndex(l => /^\s*\/\/ sobs-code-here$/.test(l));
const imgline = runtime.findIndex(l => /^\s*<!-- sobs-img-here -->$/.test(l));

// Convert the generated sobs code into a javascript array.
const data = `\t\t\tconst script = [\`${script.join('`,`')}\`];`;

// Paste the code and images to the output file.
runtime.splice(codeline, 1, data);
runtime.splice(imgline, 1, images);

// Log the output file to stdout, from there the user can redirect it to a file.
console.log(runtime.join('\n'));
const fs = require('fs');

// 1. REVERT INDEX.HTML
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js"></script>\n    <script src="app.js"></script>', '<script src="app.js"></script>');

const cursorHtmlRegex = /\s*<!-- Custom Cursor -->\s*<div class="cursor-dot" data-cursor-dot><\/div>\s*<div class="cursor-outline" data-cursor-outline><\/div>\s*<\/body>/;
html = html.replace(cursorHtmlRegex, '\n</body>');

fs.writeFileSync('index.html', html, 'utf8');

// 2. REVERT STYLE.CSS
let css = fs.readFileSync('style.css', 'utf8');

css = css.replace('html{scroll-behavior:smooth; cursor:none;}', 'html{scroll-behavior:smooth}');
css = css.replace('*,*::before,*::after{margin:0;padding:0;box-sizing:border-box} a, button, input, [onclick], .card, .stat-card, .kanban-item { cursor: none !important; }', '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}');

const uiCssRegex = /\/\* ==================== CUSTOM CURSOR ==================== \*\/[\s\S]*$/;
css = css.replace(uiCssRegex, '');

fs.writeFileSync('style.css', css, 'utf8');

// 3. REVERT APP.JS
let appJs = fs.readFileSync('app.js', 'utf8');

const cursorLogicRegex = /\/\/ ==================== CUSTOM CURSOR LOGIC ====================\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?\/\/ ==================== THEME MANAGEMENT ====================/;
appJs = appJs.replace(cursorLogicRegex, '// ==================== THEME MANAGEMENT ====================');

const tiltInitRegex = /targets\.forEach\(el => el\.classList\.add\('animate-in'\)\);\s*\/\/ Init 3D Tilt[\s\S]*?\}\);[\s\S]*?\}/;
appJs = appJs.replace(tiltInitRegex, "targets.forEach(el => el.classList.add('animate-in'));");

fs.writeFileSync('app.js', appJs, 'utf8');

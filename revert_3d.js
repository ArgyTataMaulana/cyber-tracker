const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Remove Button from HTML
html = html.replace('<button class="btn btn-secondary btn-sm" id="btn3DMode" onclick="toggle3DMode()" style="justify-content:flex-start"><span class="nav-emoji">🥽</span> 3D Room: Masuk</button>', '');

// 2. Remove Overlay from HTML
const overlayStart = html.indexOf('<!-- 3D ROOM OVERLAY -->');
if (overlayStart !== -1) {
    const overlayEnd = html.indexOf('</body>');
    html = html.substring(0, overlayStart) + '</body>' + html.substring(overlayEnd + 7);
}
fs.writeFileSync('index.html', html);

// 3. Revert CSS
const cssStart = css.indexOf('/* ==================== 3D ROOM INTERACTIVE MODE');
if (cssStart !== -1) {
    css = css.substring(0, cssStart);
    fs.writeFileSync('style.css', css);
}

// 4. Revert JS
const jsStart = appJs.indexOf('// ==================== 3D PARALLAX EFFECT ====================');
const jsAltStart = appJs.indexOf('// ==================== 3D ROOM MODE ====================');
const actualStart = jsStart !== -1 ? jsStart : jsAltStart;

if (actualStart !== -1) {
    const jsEnd = appJs.indexOf('function handleShortcuts(e) {');
    appJs = appJs.substring(0, actualStart) + appJs.substring(jsEnd);
    
    // revert escape key
    appJs = appJs.replace(
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); if(is3DMode) toggle3DMode(); return; }',
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); return; }'
    );
    fs.writeFileSync('app.js', appJs);
}

console.log('3D Mode Reverted!');

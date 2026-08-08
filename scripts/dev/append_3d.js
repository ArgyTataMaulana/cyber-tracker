const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

// Inject toggle3DMode function
const newLogic = `
function toggle3DMode(enabled) {
    window.is3DMode = enabled;
    const container = document.getElementById('canvas-3d-container');
    if (container) {
        if (enabled) {
            container.style.display = 'block';
            if (typeof update3DThemeColor === 'function') {
                update3DThemeColor(document.body.getAttribute('data-theme'));
            }
        } else {
            container.style.display = 'none';
        }
    }
}
`;
fs.appendFileSync('app.js', newLogic, 'utf8');

// Inject initialization in DOMContentLoaded
let updatedAppJs = fs.readFileSync('app.js', 'utf8');
updatedAppJs = updatedAppJs.replace(
    "applyTheme();",
    "applyTheme();\n    setTimeout(() => { const s = getState(); if(s.profile.is3DMode) toggle3DMode(true); }, 600);"
);

// Inject update3DThemeColor inside applyTheme
updatedAppJs = updatedAppJs.replace(
    "if (theme === 'sakura') {",
    "if (typeof update3DThemeColor === 'function') update3DThemeColor(theme);\n\n    if (theme === 'sakura') {"
);

fs.writeFileSync('app.js', updatedAppJs, 'utf8');

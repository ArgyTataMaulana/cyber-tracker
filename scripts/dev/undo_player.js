const fs = require('fs');

// 1. REVERT INDEX.HTML
let html = fs.readFileSync('index.html', 'utf8');
const newHTMLRegex = /<!-- Floating Lofi Player -->[\s\S]*?<\/div>\s*<\/div>/;
const oldAudio = '<audio id="lofiPlayer" src="https://stream.zeno.fm/f3wvbbqmdg8uv" loop preload="none"></audio>';
html = html.replace(newHTMLRegex, oldAudio);
fs.writeFileSync('index.html', html, 'utf8');

// 2. REVERT STYLE.CSS
let css = fs.readFileSync('style.css', 'utf8');
const floatingPlayerCssRegex = /\/\* ==================== FLOATING PLAYER ==================== \*\/[\s\S]*$/;
css = css.replace(floatingPlayerCssRegex, '');
fs.writeFileSync('style.css', css, 'utf8');

// 3. REVERT APP.JS
let appJs = fs.readFileSync('app.js', 'utf8');

const newToggleLofiRegex = /let lofiActive = false;\nfunction toggleLofi\(\) \{[\s\S]*?\}\);/m;
// But wait, the drag logic event listener was added as document.addEventListener('DOMContentLoaded', ...
// Let's use a regex that captures from 'let lofiActive = false;' all the way to the end of the added block.
// To be safe, I'll find exactly what was injected.
const oldToggleLofi = `function toggleLofi() {
    const lofi = document.getElementById('lofiPlayer');
    const btn = document.getElementById('btnLofi');
    if (!lofi || !btn) return;
    
    if (lofiPlaying) {
        lofi.pause();
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: OFF';
        btn.classList.remove('active');
        btn.style.color = '';
    } else {
        lofi.play().catch(e => console.log('Audio play failed:', e));
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: ON';
        btn.classList.add('active');
        btn.style.color = 'var(--cyan)';
    }
    lofiPlaying = !lofiPlaying;
}`;

// Since the injected app.js block started with `let lofiActive = false;` and ended with `});`, let's just do a string replace of the known injected text or use a robust regex.
const injectedBlockRegex = /let lofiActive = false;\nfunction toggleLofi\(\) \{[\s\S]*?\}\);/g;
appJs = appJs.replace(injectedBlockRegex, oldToggleLofi);
fs.writeFileSync('app.js', appJs, 'utf8');

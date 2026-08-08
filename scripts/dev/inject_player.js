const fs = require('fs');

// 1. UPDATE INDEX.HTML
let html = fs.readFileSync('index.html', 'utf8');

// Replace audio tag and add floating player structure
const oldAudio = '<audio id="lofiPlayer" src="https://stream.zeno.fm/f3wvbbqmdg8uv" loop preload="none"></audio>';
const newHTML = `
    <!-- Floating Lofi Player -->
    <div id="floatingPlayer" class="floating-player" style="display: none;">
        <div class="player-header" id="playerHeader">
            <span class="player-title">🎧 Lofi Girl Radio</span>
            <button class="player-close" onclick="toggleLofi()">×</button>
        </div>
        <div class="player-content" id="ytPlayerContainer">
            <!-- Iframe injected by JS -->
        </div>
    </div>
`;
html = html.replace(oldAudio, newHTML);
fs.writeFileSync('index.html', html, 'utf8');

// 2. UPDATE STYLE.CSS
let css = fs.readFileSync('style.css', 'utf8');
const newCSS = `
/* ==================== FLOATING PLAYER ==================== */
.floating-player {
    position: fixed;
    bottom: 90px;
    right: 24px;
    width: 320px;
    height: 220px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.player-header {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: grab;
    user-select: none;
}
.player-header:active {
    cursor: grabbing;
}
.player-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 1px;
}
.player-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
}
.player-close:hover {
    color: var(--red);
}
.player-content {
    flex: 1;
    background: #000;
}
`;
fs.appendFileSync('style.css', newCSS, 'utf8');

// 3. UPDATE APP.JS (Toggle logic and Drag logic)
let appJs = fs.readFileSync('app.js', 'utf8');

// Replace old toggleLofi
const oldToggleLofiRegex = /function toggleLofi\(\) \{[\s\S]*?\n\}/;
const newToggleLofi = `
let lofiActive = false;
function toggleLofi() {
    const player = document.getElementById('floatingPlayer');
    const btn = document.getElementById('btnLofi');
    const container = document.getElementById('ytPlayerContainer');
    
    lofiActive = !lofiActive;
    
    if (lofiActive) {
        player.style.display = 'flex';
        // Inject iframe only when opened to save resources
        if (!container.innerHTML.trim()) {
            container.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        }
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: ON';
        btn.classList.add('active');
        btn.style.color = 'var(--cyan)';
    } else {
        player.style.display = 'none';
        container.innerHTML = ''; // Stop video
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: OFF';
        btn.classList.remove('active');
        btn.style.color = '';
    }
}

// Drag logic
document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('floatingPlayer');
    const header = document.getElementById('playerHeader');
    
    if(player && header) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = player.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            // Convert right/bottom to left/top for dragging
            player.style.right = 'auto';
            player.style.bottom = 'auto';
            player.style.left = initialLeft + 'px';
            player.style.top = initialTop + 'px';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            player.style.left = (initialLeft + dx) + 'px';
            player.style.top = (initialTop + dy) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
});
`;
appJs = appJs.replace(oldToggleLofiRegex, newToggleLofi);
fs.writeFileSync('app.js', appJs, 'utf8');


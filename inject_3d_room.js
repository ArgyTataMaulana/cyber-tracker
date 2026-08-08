const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. HTML: Add 3D Mode Button
if (!html.includes('btn3DMode')) {
    html = html.replace(
        '<button class="btn btn-secondary btn-sm" id="btnAmbient" onclick="toggleAmbient()" style="justify-content:flex-start"><span class="nav-emoji">🌧️</span> Hujan: OFF</button>',
        '<button class="btn btn-secondary btn-sm" id="btnAmbient" onclick="toggleAmbient()" style="justify-content:flex-start"><span class="nav-emoji">🌧️</span> Hujan: OFF</button>\n                <button class="btn btn-secondary btn-sm" id="btn3DMode" onclick="toggle3DMode()" style="justify-content:flex-start"><span class="nav-emoji">🥽</span> 3D Room: Masuk</button>'
    );
}

// 2. HTML: Add 3D Overlay
if (!html.includes('room3d-overlay')) {
    html = html.replace('</body>', `
    <!-- 3D ROOM OVERLAY -->
    <div id="room3d-overlay" class="room3d-overlay" style="display:none">
        <button class="btn-exit-3d" onclick="toggle3DMode()">❌ Keluar 3D Mode (ESC)</button>
        
        <!-- Hotspots -->
        <div class="hotspot hotspot-laptop" onclick="navFrom3D('dashboard')" title="Buka Dashboard">
            <div class="hotspot-label">Dashboard</div>
        </div>
        
        <div class="hotspot hotspot-calendar" onclick="navFrom3D('schedule')" title="Buka Jadwal">
            <div class="hotspot-label">Jadwal Kuliah</div>
        </div>
        
        <div class="hotspot hotspot-books" onclick="navFrom3D('courses')" title="Buka Mata Kuliah">
            <div class="hotspot-label">Mata Kuliah</div>
        </div>
        
        <div class="hotspot hotspot-clock" onclick="navFrom3D('timer')" title="Buka Timer Pomodoro">
            <div class="hotspot-label">Pomodoro</div>
        </div>
    </div>
</body>`);
}
fs.writeFileSync('index.html', html);

// 3. CSS: Add 3D Mode styles
if (!css.includes('.room3d-overlay')) {
    css += `
/* ==================== 3D ROOM INTERACTIVE MODE ==================== */
.room3d-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    /* We don't need a background color because we want to see the body background image! */
    background: transparent;
    display: flex;
}

/* Hide standard layout when in 3D mode */
body.in-3d-mode .layout {
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 0.5s ease;
}

body.in-3d-mode #room3d-overlay {
    display: block !important;
    animation: fadeIn 0.5s ease;
}

.btn-exit-3d {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: 2px solid var(--red);
    border-radius: 30px;
    cursor: pointer;
    font-weight: bold;
    backdrop-filter: blur(5px);
    z-index: 10000;
    transition: all 0.2s;
}
.btn-exit-3d:hover { background: var(--red); transform: scale(1.05); }

/* HOTSPOTS */
.hotspot {
    position: absolute;
    border: 2px dashed rgba(255,255,255,0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.hotspot:hover {
    border: 3px solid var(--cyan);
    background: rgba(0, 206, 255, 0.15);
    box-shadow: 0 0 20px rgba(0, 206, 255, 0.4);
    transform: scale(1.02);
}

.hotspot-label {
    opacity: 0;
    color: #fff;
    font-weight: 800;
    font-size: 1.2rem;
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    transition: opacity 0.3s;
    background: rgba(0,0,0,0.5);
    padding: 4px 12px;
    border-radius: 20px;
    pointer-events: none;
}

.hotspot:hover .hotspot-label {
    opacity: 1;
}

/* ESTIMATED COORDINATES (Assuming standard lofi girl/cozy room proportions) */
.hotspot-laptop {
    /* Usually bottom center */
    bottom: 20%;
    left: 40%;
    width: 20%;
    height: 25%;
}

.hotspot-calendar {
    /* Usually on the wall left or right */
    top: 20%;
    right: 15%;
    width: 15%;
    height: 30%;
}

.hotspot-books {
    /* Usually shelves on the side */
    top: 15%;
    left: 10%;
    width: 15%;
    height: 40%;
}

.hotspot-clock {
    /* Usually top center / wall clock */
    top: 10%;
    left: 45%;
    width: 10%;
    height: 15%;
    border-radius: 50%; /* Circle */
}
`;
    fs.writeFileSync('style.css', css);
}

// 4. JS: Add logic
if (!appJs.includes('toggle3DMode')) {
    appJs = appJs.replace('function handleShortcuts(e) {', `
// ==================== 3D ROOM MODE ====================
let is3DMode = false;
function toggle3DMode() {
    const s = getState();
    // Only allow in cozy-room theme for maximum effect
    if (s.profile.theme !== 'cozy-room') {
        showToast('Ganti tema ke Lofi Cozy Room dulu di Settings!', 'error');
        return;
    }
    
    is3DMode = !is3DMode;
    const btn = document.getElementById('btn3DMode');
    
    if (is3DMode) {
        document.body.classList.add('in-3d-mode');
        if(btn) btn.innerHTML = '<span class="nav-emoji">🥽</span> 3D Room: Aktif';
        showToast('3D Interactive Mode Diaktifkan! 🎮', 'success');
    } else {
        document.body.classList.remove('in-3d-mode');
        if(btn) btn.innerHTML = '<span class="nav-emoji">🥽</span> 3D Room: Masuk';
    }
}

function navFrom3D(pageHash) {
    // Exit 3D mode
    if (is3DMode) toggle3DMode();
    // Navigate
    location.hash = pageHash;
}

function handleShortcuts(e) {`);

    // Add Escape key handler for 3D Mode
    appJs = appJs.replace(
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); return; }',
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); if(is3DMode) toggle3DMode(); return; }'
    );
    
    fs.writeFileSync('app.js', appJs);
}

console.log('3D UI logic injected!');

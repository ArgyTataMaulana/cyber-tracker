const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. HTML: Add 3D Mode Button & Overlay
if (!html.includes('btn3DMode')) {
    html = html.replace(
        '<button class="btn btn-secondary btn-sm" id="btnAmbient" onclick="toggleAmbient()" style="justify-content:flex-start"><span class="nav-emoji">🌧️</span> Hujan: OFF</button>',
        '<button class="btn btn-secondary btn-sm" id="btnAmbient" onclick="toggleAmbient()" style="justify-content:flex-start"><span class="nav-emoji">🌧️</span> Hujan: OFF</button>\n                <button class="btn btn-secondary btn-sm" id="btn3DMode" onclick="toggle3DMode()" style="justify-content:flex-start"><span class="nav-emoji">🥽</span> 3D Room: Masuk</button>'
    );
}

if (!html.includes('room3d-overlay')) {
    html = html.replace('</body>', `
    <!-- 3D ROOM OVERLAY (STATIC & SCROLLABLE) -->
    <div id="room3d-overlay" class="room3d-overlay" style="display:none">
        <button class="btn-exit-3d" onclick="toggle3DMode()">❌ Keluar 3D Mode (ESC)</button>
        
        <div class="room3d-scroll-area">
            <img src="lofi_cozy_room.png" class="room3d-bg-img" alt="Cozy Room">
            
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
    </div>
</body>`);
}
fs.writeFileSync('index.html', html);

// 2. CSS: Add Static 3D Mode styles
if (!css.includes('.room3d-overlay')) {
    css += `
/* ==================== 3D ROOM INTERACTIVE MODE (STATIC & SCROLLABLE) ==================== */
.room3d-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    background: #000;
    overflow: auto; /* MENGIZINKAN SCROLL */
}

/* Custom scrollbar for overlay */
.room3d-overlay::-webkit-scrollbar { width: 12px; height: 12px; }
.room3d-overlay::-webkit-scrollbar-track { background: #000; }
.room3d-overlay::-webkit-scrollbar-thumb { background: rgba(0,206,255,0.4); border-radius: 6px; }

/* The scrollable canvas */
.room3d-scroll-area {
    position: relative;
    width: 130vw; /* Lebih lebar dari layar agar bisa discroll */
    min-width: 1400px; /* Minimal resolusi agar gambar tidak terlalu kecil di layar sempit */
    height: auto;
}

.room3d-bg-img {
    width: 100%;
    height: auto;
    display: block;
}

/* Hide standard layout when in 3D mode */
body.in-3d-mode .layout {
    display: none !important; /* Completely hide to save performance */
}

body.in-3d-mode #room3d-overlay {
    display: block !important;
    animation: fadeInRoom 0.5s ease forwards;
}

@keyframes fadeInRoom {
    from { opacity: 0; }
    to { opacity: 1; }
}

.btn-exit-3d {
    position: fixed; /* Tetap di pojok kanan atas meski discroll */
    top: 30px;
    right: 30px;
    padding: 12px 24px;
    background: rgba(10, 10, 30, 0.9);
    color: #fff;
    border: 1px solid rgba(255, 71, 87, 0.5);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 1px;
    z-index: 10000;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
}
.btn-exit-3d:hover { 
    background: rgba(255, 71, 87, 1); 
    border-color: var(--red);
    transform: translateY(-2px);
}

/* HOTSPOTS - Futuristic HUD Style */
.hotspot {
    position: absolute;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s ease;
}

/* The HUD Pulsing Dot */
.hotspot::before {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    background: rgba(0, 206, 255, 0.3);
    border: 2px solid var(--cyan);
    border-radius: 50%;
    animation: hudPulse 2s infinite;
    transition: all 0.3s;
    box-shadow: 0 0 15px var(--cyan);
}

/* The Crosshair dot */
.hotspot::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 5px #fff;
    transition: all 0.3s;
}

@keyframes hudPulse {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
}

/* Hover State - Expanding into a targeted bounding box */
.hotspot:hover::before {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    background: rgba(0, 206, 255, 0.15);
    border: 2px solid var(--cyan);
    animation: none;
    box-shadow: inset 0 0 20px rgba(0, 206, 255, 0.3), 0 0 20px rgba(0, 206, 255, 0.5);
}

.hotspot:hover::after { opacity: 0; }

.hotspot-label {
    opacity: 0;
    color: var(--cyan);
    font-weight: 700;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(0,0,0,1);
    transition: all 0.3s;
    background: rgba(10,10,25,0.9);
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid rgba(0,206,255,0.4);
    pointer-events: none;
    transform: translateY(15px);
    position: absolute;
    bottom: -50px;
    white-space: nowrap;
}

.hotspot:hover .hotspot-label {
    opacity: 1;
    transform: translateY(0);
}

/* ESTIMATED COORDINATES (Percentages relative to the image size) */
.hotspot-laptop {
    bottom: 25%;
    left: 45%;
    width: 12%;
    height: 15%;
}

.hotspot-calendar {
    top: 25%;
    right: 20%;
    width: 8%;
    height: 20%;
}

.hotspot-books {
    top: 25%;
    left: 15%;
    width: 10%;
    height: 30%;
}

.hotspot-clock {
    top: 15%;
    left: 48%;
    width: 6%;
    height: 10%;
    border-radius: 50%;
}
`;
    fs.writeFileSync('style.css', css);
}

// 3. JS: Add logic (No dynamic mousemove)
if (!appJs.includes('toggle3DMode')) {
    appJs = appJs.replace('function handleShortcuts(e) {', `
// ==================== 3D ROOM MODE (STATIC) ====================
let is3DMode = false;
function toggle3DMode() {
    const s = getState();
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
        
        // Auto-scroll to center of the room initially
        setTimeout(() => {
            const overlay = document.getElementById('room3d-overlay');
            if (overlay) {
                overlay.scrollLeft = (overlay.scrollWidth - overlay.clientWidth) / 2;
                overlay.scrollTop = (overlay.scrollHeight - overlay.clientHeight) / 2;
            }
        }, 50);
        
    } else {
        document.body.classList.remove('in-3d-mode');
        if(btn) btn.innerHTML = '<span class="nav-emoji">🥽</span> 3D Room: Masuk';
    }
}

function navFrom3D(pageHash) {
    if (is3DMode) toggle3DMode();
    location.hash = pageHash;
}

function handleShortcuts(e) {`);

    // Add Escape key handler
    appJs = appJs.replace(
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); return; }',
        'if (e.key === \'Escape\') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); if(is3DMode) toggle3DMode(); return; }'
    );
    
    fs.writeFileSync('app.js', appJs);
}

console.log('Static 3D UI injected!');

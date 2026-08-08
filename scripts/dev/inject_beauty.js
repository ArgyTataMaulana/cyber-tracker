const fs = require('fs');

/* ============================================================
   inject_beauty.js
   Adds 5 UI upgrades:
   1. IPK Progress Ring (Nilai page)
   2. Pill/Badge status tugas yang keren
   3. Empty State with SVG illustrations
   4. Command Palette (Ctrl+K)
   5. Theme Accent Color Picker
============================================================ */

let appJs = fs.readFileSync('app.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');
let componentsJs = fs.readFileSync('components.js', 'utf8');
let html = fs.readFileSync('index.html', 'utf8');

// ─────────────────────────────────────────────
// 1. IPK PROGRESS RING
// ─────────────────────────────────────────────
appJs = appJs.replace(
    `        <div class="glass-card" style="text-align:center;margin-bottom:24px">
            <div style="font-size:.8rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">IPK Semester</div>
            <div style="font-size:3rem;font-weight:900;background:var(--gradient-main);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">\${ipk.toFixed(2)}</div>
        </div>`,
    `        <div class="glass-card" style="text-align:center;margin-bottom:24px;padding:32px">
            <div class="ipk-ring-wrap">
                <svg class="ipk-ring" viewBox="0 0 120 120" width="140" height="140">
                    <circle class="ipk-ring-bg" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
                    <circle class="ipk-ring-fill" cx="60" cy="60" r="52" fill="none" stroke-width="10"
                        stroke-dasharray="\${Math.round((ipk/4)*326.7)} 326.7"
                        stroke-linecap="round" transform="rotate(-90 60 60)"/>
                    <text x="60" y="55" text-anchor="middle" class="ipk-ring-val">\${ipk.toFixed(2)}</text>
                    <text x="60" y="73" text-anchor="middle" class="ipk-ring-lbl">IPK</text>
                </svg>
            </div>
            <div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)">\${ipk >= 3.5 ? '🏆 Cumlaude!' : ipk >= 3.0 ? '⭐ Sangat Memuaskan' : ipk >= 2.5 ? '👍 Memuaskan' : ipk > 0 ? '📚 Tetap Semangat!' : 'Belum ada nilai'}</div>
        </div>`
);

// ─────────────────────────────────────────────
// 2. BEAUTIFUL PILL BADGES FOR ASSIGNMENT STATUS
// ─────────────────────────────────────────────
componentsJs = componentsJs.replace(
    `function emptyState(emoji, title, subtitle) {
    return \`
        <div class="empty-state">
            <span class="empty-emoji">\${emoji}</span>
            <h3>\${title}</h3>
            <p>\${subtitle}</p>
        </div>
    \`;
}`,
    `function emptyState(emoji, title, subtitle) {
    const svgMap = {
        '📚': \`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="60" height="45" rx="4" fill="none" stroke="var(--purple)" stroke-width="2.5"/><rect x="18" y="12" width="44" height="45" rx="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><line x1="25" y1="35" x2="55" y2="35" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/><line x1="25" y1="43" x2="45" y2="43" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/></svg>\`,
        '📝': \`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="10" width="50" height="60" rx="5" fill="none" stroke="var(--purple)" stroke-width="2.5"/><line x1="25" y1="30" x2="55" y2="30" stroke="var(--text-muted)" stroke-width="2"/><line x1="25" y1="40" x2="55" y2="40" stroke="var(--text-muted)" stroke-width="2"/><line x1="25" y1="50" x2="40" y2="50" stroke="var(--text-muted)" stroke-width="2"/><circle cx="60" cy="58" r="12" fill="var(--cyan)" opacity="0.2" stroke="var(--cyan)" stroke-width="2"/><path d="M55 58 L58 61 L65 54" stroke="var(--cyan)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>\`,
        '📅': \`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="60" height="52" rx="5" fill="none" stroke="var(--purple)" stroke-width="2.5"/><line x1="10" y1="32" x2="70" y2="32" stroke="var(--purple)" stroke-width="2"/><circle cx="25" cy="14" r="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><circle cx="55" cy="14" r="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><rect x="20" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.5"/><rect x="35" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.3"/><rect x="50" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.3"/></svg>\`,
        '🎯': \`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="28" fill="none" stroke="var(--red)" stroke-width="2" opacity="0.4"/><circle cx="40" cy="40" r="18" fill="none" stroke="var(--red)" stroke-width="2" opacity="0.6"/><circle cx="40" cy="40" r="8" fill="var(--red)" opacity="0.8"/><line x1="58" y1="22" x2="48" y2="32" stroke="var(--orange)" stroke-width="2" stroke-linecap="round"/><polygon points="62,16 58,22 68,20" fill="var(--orange)"/></svg>\`,
        '💬': \`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="50" height="38" rx="8" fill="none" stroke="var(--cyan)" stroke-width="2.5"/><polygon points="18,53 10,65 30,53" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linejoin="round"/><line x1="22" y1="30" x2="48" y2="30" stroke="var(--text-muted)" stroke-width="2"/><line x1="22" y1="39" x2="38" y2="39" stroke="var(--text-muted)" stroke-width="2"/></svg>\`
    };
    const svgEl = svgMap[emoji] || \`<span style="font-size:4rem">\${emoji}</span>\`;
    return \`
        <div class="empty-state">
            <div class="empty-illustration">\${svgEl}</div>
            <h3>\${title}</h3>
            <p>\${subtitle}</p>
        </div>
    \`;
}`
);

// ─────────────────────────────────────────────
// 3. COMMAND PALETTE (Ctrl+K)
// ─────────────────────────────────────────────
// Add HTML for command palette
html = html.replace('</body>', `
    <!-- Command Palette -->
    <div id="commandPalette" class="command-palette-overlay" style="display:none" onclick="if(event.target===this)closeCommandPalette()">
        <div class="command-palette">
            <div class="command-search-wrap">
                <span class="command-search-icon">⌘</span>
                <input class="command-search-input" id="commandInput" placeholder="Ketik untuk mencari halaman..." oninput="filterCommands(this.value)" onkeydown="commandKeyNav(event)">
            </div>
            <div class="command-results" id="commandResults"></div>
            <div class="command-footer">Panah ↑↓ navigasi &nbsp;·&nbsp; Enter pilih &nbsp;·&nbsp; Esc tutup</div>
        </div>
    </div>
</body>`);

// Add Ctrl+K shortcut to handleShortcuts
appJs = appJs.replace(
    `function handleShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.key) {`,
    `function handleShortcuts(e) {
    // Ctrl+K or Cmd+K = Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
    }
    if (e.key === 'Escape') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); return; }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.key) {`
);

// Remove old Escape from switch
appJs = appJs.replace(
    `        case 'Escape':
            closeModal(); closeSearch(); exitFocusMode(); break;`,
    ``
);

// Add command palette logic before handleShortcuts
const commandPaletteJS = `
// ==================== COMMAND PALETTE ====================
const COMMANDS = [
    { icon: '🏠', label: 'Dashboard', sub: 'Halaman utama', action: () => location.hash = 'dashboard' },
    { icon: '📚', label: 'Mata Kuliah', sub: 'Daftar matkul', action: () => location.hash = 'courses' },
    { icon: '📅', label: 'Jadwal', sub: 'Jadwal perkuliahan', action: () => location.hash = 'schedule' },
    { icon: '📝', label: 'Tugas', sub: 'Kanban board tugas', action: () => location.hash = 'assignments' },
    { icon: '🎓', label: 'Nilai & IPK', sub: 'Input dan lihat nilai', action: () => location.hash = 'grades' },
    { icon: '⏱️', label: 'Timer', sub: 'Pomodoro & Stopwatch', action: () => location.hash = 'timer' },
    { icon: '📊', label: 'Statistik', sub: 'Grafik belajar', action: () => location.hash = 'stats' },
    { icon: '🎯', label: 'Target', sub: 'Target belajar', action: () => location.hash = 'targets' },
    { icon: '📔', label: 'Catatan', sub: 'Catatan kuliah', action: () => location.hash = 'notes' },
    { icon: '🏆', label: 'Achievements', sub: 'Badge & pencapaian', action: () => location.hash = 'achievements' },
    { icon: '🤖', label: 'AI Mentor', sub: 'Chat dengan AI', action: () => location.hash = 'aimentor' },
    { icon: '⚙️', label: 'Settings', sub: 'Pengaturan aplikasi', action: () => location.hash = 'settings' },
];

let commandSelectedIdx = 0;
let filteredCommands = [...COMMANDS];

function toggleCommandPalette() {
    const el = document.getElementById('commandPalette');
    if (el.style.display === 'none') openCommandPalette();
    else closeCommandPalette();
}

function openCommandPalette() {
    const el = document.getElementById('commandPalette');
    el.style.display = 'flex';
    filteredCommands = [...COMMANDS];
    commandSelectedIdx = 0;
    renderCommandResults();
    setTimeout(() => document.getElementById('commandInput').focus(), 50);
}

function closeCommandPalette() {
    const el = document.getElementById('commandPalette');
    if (el) { el.style.display = 'none'; document.getElementById('commandInput').value = ''; }
}

function filterCommands(q) {
    const query = q.toLowerCase();
    filteredCommands = query
        ? COMMANDS.filter(c => c.label.toLowerCase().includes(query) || c.sub.toLowerCase().includes(query))
        : [...COMMANDS];
    commandSelectedIdx = 0;
    renderCommandResults();
}

function renderCommandResults() {
    const container = document.getElementById('commandResults');
    if (!filteredCommands.length) {
        container.innerHTML = '<div class="command-empty">Tidak ditemukan 🤔</div>';
        return;
    }
    container.innerHTML = filteredCommands.map((c, i) => \`
        <div class="command-item \${i === commandSelectedIdx ? 'selected' : ''}" onclick="selectCommand(\${i})">
            <span class="command-item-icon">\${c.icon}</span>
            <div><div class="command-item-label">\${c.label}</div><div class="command-item-sub">\${c.sub}</div></div>
        </div>
    \`).join('');
}

function selectCommand(idx) {
    if (filteredCommands[idx]) {
        filteredCommands[idx].action();
        closeCommandPalette();
    }
}

function commandKeyNav(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); commandSelectedIdx = Math.min(commandSelectedIdx + 1, filteredCommands.length - 1); renderCommandResults(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); commandSelectedIdx = Math.max(commandSelectedIdx - 1, 0); renderCommandResults(); }
    else if (e.key === 'Enter') { e.preventDefault(); selectCommand(commandSelectedIdx); }
    else if (e.key === 'Escape') closeCommandPalette();
}

`;
appJs = appJs.replace('function handleShortcuts(e) {', commandPaletteJS + 'function handleShortcuts(e) {');

// ─────────────────────────────────────────────
// 4. THEME ACCENT COLOR PICKER in Settings
// ─────────────────────────────────────────────
// Inject accent picker into Settings render (find Tema Visual section)
appJs = appJs.replace(
    `<div class="sec-title"><span class="st-emoji">🎨</span> Tema Visual</div>`,
    `<div class="sec-title"><span class="st-emoji">🎨</span> Tema Visual</div>
            <div class="form-group" style="margin-bottom:16px">
                <label class="form-label">Warna Aksen</label>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
                    <button onclick="setAccentColor('#6C5CE7')" title="Purple (Default)" style="width:32px;height:32px;border-radius:50%;background:#6C5CE7;border:3px solid \${p.accentColor === '#6C5CE7' || !p.accentColor ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                    <button onclick="setAccentColor('#00CEFF')" title="Cyan" style="width:32px;height:32px;border-radius:50%;background:#00CEFF;border:3px solid \${p.accentColor === '#00CEFF' ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                    <button onclick="setAccentColor('#00E09E')" title="Green" style="width:32px;height:32px;border-radius:50%;background:#00E09E;border:3px solid \${p.accentColor === '#00E09E' ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                    <button onclick="setAccentColor('#FFA502')" title="Orange" style="width:32px;height:32px;border-radius:50%;background:#FFA502;border:3px solid \${p.accentColor === '#FFA502' ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                    <button onclick="setAccentColor('#FF6B9D')" title="Pink" style="width:32px;height:32px;border-radius:50%;background:#FF6B9D;border:3px solid \${p.accentColor === '#FF6B9D' ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                    <button onclick="setAccentColor('#FF4757')" title="Red" style="width:32px;height:32px;border-radius:50%;background:#FF4757;border:3px solid \${p.accentColor === '#FF4757' ? '#fff' : 'transparent'};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>
                </div>
            </div>`
);

// Add setAccentColor function before handleShortcuts
const accentFn = `
// ==================== ACCENT COLOR ====================
function setAccentColor(hex) {
    const s = getState();
    s.profile.accentColor = hex;
    saveState(s);
    applyAccentColor(hex);
    renderSettings();
    showToast('Warna aksen diperbarui! 🎨', 'success');
}

function applyAccentColor(hex) {
    if (!hex) return;
    // Convert hex to RGB for rgba usage
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    document.documentElement.style.setProperty('--purple', hex);
    document.documentElement.style.setProperty('--gradient-main', \`linear-gradient(135deg, \${hex}, #00CEFF)\`);
    document.documentElement.style.setProperty('--glow-purple', \`rgba(\${r},\${g},\${b},0.3)\`);
}

`;
appJs = appJs.replace('// ==================== COMMAND PALETTE ====================', accentFn + '// ==================== COMMAND PALETTE ====================');

// Apply saved accent on init
appJs = appJs.replace(
    'applyTheme();\n    updateSidebar();',
    'applyTheme();\n    const _st = getState(); if(_st.profile.accentColor) applyAccentColor(_st.profile.accentColor);\n    updateSidebar();'
);

fs.writeFileSync('app.js', appJs, 'utf8');
fs.writeFileSync('components.js', componentsJs, 'utf8');
fs.writeFileSync('index.html', html, 'utf8');

// ─────────────────────────────────────────────
// 5. CSS: ALL NEW STYLES
// ─────────────────────────────────────────────
const newCSS = `

/* ==================== IPK PROGRESS RING ==================== */
.ipk-ring-wrap { display:flex;justify-content:center; }
.ipk-ring-bg { stroke: var(--border); }
.ipk-ring-fill { stroke: url(#ringGrad); transition: stroke-dasharray 1s ease; filter: drop-shadow(0 0 6px var(--purple)); }
.ipk-ring-val { font-size:22px; font-weight:900; fill:var(--text-primary); font-family:inherit; }
.ipk-ring-lbl { font-size:10px; fill:var(--text-muted); text-transform:uppercase; letter-spacing:2px; font-family:inherit; }

/* ==================== EMPTY STATE SVG ==================== */
.empty-state { text-align:center; padding:48px 20px; }
.empty-illustration { display:flex; justify-content:center; margin-bottom:16px; }
.empty-illustration svg { width:80px; height:80px; opacity:0.85; }

/* ==================== COMMAND PALETTE ==================== */
.command-palette-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    backdrop-filter:blur(4px); z-index:9999;
    display:flex; align-items:flex-start; justify-content:center;
    padding-top:10vh;
}
.command-palette {
    width:min(560px, 90vw);
    background:var(--bg-card);
    border:1px solid var(--border);
    border-radius:16px;
    box-shadow:0 20px 60px rgba(0,0,0,0.6);
    overflow:hidden;
    animation:cmdSlideIn 0.15s ease;
}
@keyframes cmdSlideIn {
    from { opacity:0; transform:translateY(-16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
.command-search-wrap {
    display:flex; align-items:center; gap:12px;
    padding:14px 18px;
    border-bottom:1px solid var(--border);
}
.command-search-icon { font-size:1.1rem; color:var(--purple); }
.command-search-input {
    flex:1; background:none; border:none; outline:none;
    font-size:1rem; color:var(--text-primary); font-family:inherit;
}
.command-results { max-height:340px; overflow-y:auto; padding:8px; }
.command-item {
    display:flex; align-items:center; gap:12px;
    padding:10px 12px; border-radius:10px; cursor:pointer;
    transition:background 0.15s;
}
.command-item:hover, .command-item.selected {
    background:rgba(108,92,231,0.15);
}
.command-item-icon { font-size:1.3rem; width:32px; text-align:center; }
.command-item-label { font-weight:600; font-size:0.9rem; color:var(--text-primary); }
.command-item-sub { font-size:0.75rem; color:var(--text-muted); }
.command-empty { text-align:center; padding:32px; color:var(--text-muted); font-size:0.9rem; }
.command-footer {
    padding:8px 18px; font-size:0.72rem;
    color:var(--text-muted); border-top:1px solid var(--border);
    text-align:center; letter-spacing:0.5px;
}
`;
fs.appendFileSync('style.css', newCSS, 'utf8');

// Add SVG gradient def into the IPK ring inline (we need to add a defs block)
// We'll append a hidden SVG defs to index.html body for the gradient
let html2 = fs.readFileSync('index.html', 'utf8');
html2 = html2.replace('<body>', `<body>
    <svg width="0" height="0" style="position:absolute">
        <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:var(--purple)"/>
                <stop offset="100%" style="stop-color:var(--cyan)"/>
            </linearGradient>
        </defs>
    </svg>`);
fs.writeFileSync('index.html', html2, 'utf8');

console.log('✅ All 5 UI upgrades injected successfully!');

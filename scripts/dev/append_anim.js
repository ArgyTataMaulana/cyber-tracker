const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Update CSS for 3D room overlay
css = css.replace(
    'background: radial-gradient(circle at center, transparent 40%, rgba(0,0,15,0.8) 100%);',
    `/* Parallax sizing */\n    top: -5vh; left: -5vw; width: 110vw; height: 110vh;\n    background: radial-gradient(circle at center, transparent 40%, rgba(0,0,15,0.9) 100%), url('lofi_cozy_room.png') center/cover no-repeat;\n    /* Smooth panning */\n    transition: transform 0.1s ease-out;`
);
fs.writeFileSync('style.css', css);

// 2. Add mousemove listener in app.js
if (!appJs.includes('roomParallax')) {
    appJs = appJs.replace('function toggle3DMode() {', `
// ==================== 3D PARALLAX EFFECT ====================
document.addEventListener('mousemove', (e) => {
    if (!is3DMode) return;
    const overlay = document.getElementById('room3d-overlay');
    if (!overlay) return;
    
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    // Pan the room opposite to mouse movement (Free Fire lobby effect)
    // The overlay is 110% size, so we can pan up to 5% each way safely
    const panX = mouseX * -5;
    const panY = mouseY * -5;
    
    overlay.style.transform = \`translate(\${panX}%, \${panY}%)\`;
});

function toggle3DMode() {`);
    fs.writeFileSync('app.js', appJs);
}

console.log('Parallax animation added!');

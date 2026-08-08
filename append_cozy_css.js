const fs = require('fs');
const css = `
/* ==================== COZY ROOM THEME ==================== */
[data-theme='cozy-room'] {
    --bg-dark: url('lofi_cozy_room.png') no-repeat center center fixed;
    --bg-dark-size: cover;
    --bg-card: rgba(25, 25, 35, 0.65);
    --border: rgba(255, 255, 255, 0.1);
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    --text-muted: #aaaaaa;
    --purple: #ffb86c;
    --purple-hover: #ff9e2c;
    --gradient-main: linear-gradient(135deg, #ffb86c 0%, #ff9e2c 100%);
    --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
[data-theme='cozy-room'] body {
    background: var(--bg-dark);
    background-size: cover;
    backdrop-filter: blur(2px);
}
[data-theme='cozy-room'] .glass-card, [data-theme='cozy-room'] .sidebar, [data-theme='cozy-room'] .pet-container, [data-theme='cozy-room'] .bottom-nav {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(20, 20, 25, 0.5);
}

.dust-particle {
    position: fixed;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    animation: float-dust linear forwards;
    box-shadow: 0 0 4px rgba(255,255,255,0.8);
}
@keyframes float-dust {
    0% { transform: translateY(100vh) translateX(0); opacity: 0; }
    20% { opacity: 0.8; }
    80% { opacity: 0.8; }
    100% { transform: translateY(-10vh) translateX(20vw); opacity: 0; }
}
`;
fs.appendFileSync('style.css', css, 'utf8');

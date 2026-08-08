const fs = require('fs');
const css = `
/* ==================== PREMIUM THEMES ==================== */
[data-theme='sakura'] {
    --bg-dark: #fff0f5;
    --bg-card: #ffe4e1;
    --border: #ffb6c1;
    --text-primary: #8b008b;
    --text-secondary: #c71585;
    --text-muted: #db7093;
    --purple: #ff69b4;
    --purple-hover: #ff1493;
    --gradient-main: linear-gradient(135deg, #ffb6c1 0%, #ff69b4 100%);
}

[data-theme='cyberpunk'] {
    --bg-dark: #0f0f1b;
    --bg-card: #1a1a2e;
    --border: #fdee00;
    --text-primary: #00ffff;
    --text-secondary: #ff00ff;
    --text-muted: #888888;
    --purple: #ff00ff;
    --purple-hover: #ff00cc;
    --gradient-main: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
}

[data-theme='hacker'] {
    --bg-dark: #000000;
    --bg-card: #0a0a0a;
    --border: #00ff00;
    --text-primary: #00ff00;
    --text-secondary: #00cc00;
    --text-muted: #005500;
    --purple: #00ff00;
    --purple-hover: #00cc00;
    --gradient-main: linear-gradient(135deg, #003300 0%, #00ff00 100%);
    --font: 'Courier New', Courier, monospace;
}

/* ==================== VIRTUAL PET ==================== */
.pet-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow);
    z-index: 1;
}
.pet-avatar {
    font-size: 80px;
    display: inline-block;
    animation: petBounce 2s infinite ease-in-out;
    filter: drop-shadow(0 0 10px rgba(108, 92, 231, 0.3));
    cursor: pointer;
    transition: transform 0.3s;
    user-select: none;
}
.pet-avatar:hover {
    transform: scale(1.1);
}
.pet-info {
    margin-top: 16px;
}
.pet-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
}
.pet-exp-wrap {
    background: rgba(0,0,0,0.2);
    height: 12px;
    border-radius: 6px;
    width: 60%;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
}
.pet-exp-bar {
    background: var(--gradient-main);
    height: 100%;
    width: 0%;
    transition: width 0.5s ease;
}
.pet-exp-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 4px;
}
@keyframes petBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* ==================== THEME EFFECTS ==================== */
.sakura-petal {
    position: fixed;
    background: #ffb6c1;
    border-radius: 150% 0 150% 0;
    pointer-events: none;
    z-index: 9999;
    animation: fall linear forwards;
    opacity: 0.6;
}
@keyframes fall {
    0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.6; }
    100% { transform: translateY(110vh) translateX(20vw) rotate(360deg); opacity: 0; }
}
.matrix-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
    opacity: 0.15;
}
`;
fs.appendFileSync('style.css', css, 'utf8');

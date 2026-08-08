const fs = require('fs');

const css = `
/* ==================== ADDITIONAL BACKGROUNDS ==================== */
body[data-theme='sakura'] {
    background: url('sakura_bg.png') no-repeat center center fixed;
    background-size: cover;
}
body[data-theme='sakura'] .glass-card, body[data-theme='sakura'] .sidebar, body[data-theme='sakura'] .pet-container, body[data-theme='sakura'] .bottom-nav {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.4);
}

body[data-theme='cyberpunk'] {
    background: url('cyberpunk_bg.png') no-repeat center center fixed;
    background-size: cover;
}
body[data-theme='cyberpunk'] .glass-card, body[data-theme='cyberpunk'] .sidebar, body[data-theme='cyberpunk'] .pet-container, body[data-theme='cyberpunk'] .bottom-nav {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    background: rgba(10, 10, 20, 0.7);
    border: 1px solid rgba(0, 255, 255, 0.2);
}
`;

fs.appendFileSync('style.css', css, 'utf8');

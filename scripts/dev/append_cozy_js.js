const fs = require('fs');

const jsCode = `
function startCozyEffect() {
    if (window.cozyInterval) clearInterval(window.cozyInterval);
    window.cozyInterval = setInterval(() => {
        if (document.body.getAttribute('data-theme') !== 'cozy-room') {
            clearInterval(window.cozyInterval);
            return;
        }
        if (Math.random() > 0.3) {
            const dust = document.createElement('div');
            dust.className = 'dust-particle';
            dust.style.left = Math.random() * 100 + 'vw';
            const size = Math.random() * 3 + 1;
            dust.style.width = size + 'px';
            dust.style.height = size + 'px';
            dust.style.animationDuration = (Math.random() * 10 + 10) + 's';
            document.body.appendChild(dust);
            setTimeout(() => dust.remove(), 20000);
        }
    }, 500);
}
`;

fs.appendFileSync('app.js', jsCode, 'utf8');

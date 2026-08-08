const fs = require('fs');

const jsCode = `
/* ==================== THEMES & EFFECTS ==================== */
function applyTheme() {
    const s = getState();
    const theme = s.profile.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
    
    // Clear old effects
    document.querySelectorAll('.sakura-petal').forEach(e => e.remove());
    document.querySelectorAll('.matrix-canvas').forEach(e => e.remove());
    if (window.matrixInterval) clearInterval(window.matrixInterval);

    if (theme === 'sakura') {
        startSakuraEffect();
    } else if (theme === 'hacker') {
        startMatrixEffect();
    }
}

function startSakuraEffect() {
    setInterval(() => {
        if (document.body.getAttribute('data-theme') !== 'sakura') return;
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.width = (Math.random() * 10 + 10) + 'px';
        petal.style.height = (Math.random() * 10 + 10) + 'px';
        petal.style.animationDuration = (Math.random() * 3 + 5) + 's';
        document.body.appendChild(petal);
        setTimeout(() => petal.remove(), 8000);
    }, 300);
}

function startMatrixEffect() {
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'.split('');
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;
    
    window.matrixInterval = setInterval(() => {
        if (document.body.getAttribute('data-theme') !== 'hacker') {
            clearInterval(window.matrixInterval);
            return;
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }, 50);
}

/* ==================== VIRTUAL PET ==================== */
const PET_STAGES = [
    { emoji: '🥚', name: 'Telur Misterius', maxExp: 100 },
    { emoji: '🐣', name: 'Bayi Dino', maxExp: 300 },
    { emoji: '🦖', name: 'Dino Remaja', maxExp: 700 },
    { emoji: '🐲', name: 'Naga Cyber', maxExp: 1500 }
];

function getPetHTML() {
    const s = getState();
    const pet = s.pet || { stage: 0, exp: 0, name: 'CyberPet' };
    const stageData = PET_STAGES[Math.min(pet.stage, PET_STAGES.length - 1)];
    const pct = Math.min(100, Math.round((pet.exp / stageData.maxExp) * 100));
    
    return \`
        <div class="pet-container">
            <div class="pet-avatar" onclick="showToast('Rawr!', 'success')">\${stageData.emoji}</div>
            <div class="pet-info">
                <div class="pet-name">\${pet.name} (\${stageData.name})</div>
                <div class="pet-exp-wrap">
                    <div class="pet-exp-bar" style="width: \${pct}%"></div>
                </div>
                <div class="pet-exp-text">\${pet.exp} / \${stageData.maxExp} EXP</div>
            </div>
        </div>
    \`;
}

function gainPetExp(amount) {
    const s = getState();
    if (!s.pet) s.pet = { stage: 0, exp: 0, name: 'CyberPet' };
    
    s.pet.exp += amount;
    
    // Check evolution
    let stageData = PET_STAGES[Math.min(s.pet.stage, PET_STAGES.length - 1)];
    if (s.pet.exp >= stageData.maxExp && s.pet.stage < PET_STAGES.length - 1) {
        s.pet.stage++;
        showToast('🎉 Peliharaanmu berevolusi!', 'success');
        triggerConfetti();
    }
    
    saveState(s);
}
`;

fs.appendFileSync('app.js', jsCode, 'utf8');

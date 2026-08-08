const fs = require('fs');

// 1. UPDATE INDEX.HTML
let html = fs.readFileSync('index.html', 'utf8');

const scriptTag = `<script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js"></script>\n    <script src="app.js"></script>`;
html = html.replace('<script src="app.js"></script>', scriptTag);

const cursorHtml = `
    <!-- Custom Cursor -->
    <div class="cursor-dot" data-cursor-dot></div>
    <div class="cursor-outline" data-cursor-outline></div>
</body>`;
html = html.replace('</body>', cursorHtml);

fs.writeFileSync('index.html', html, 'utf8');

// 2. UPDATE STYLE.CSS
let css = fs.readFileSync('style.css', 'utf8');

// Hide default cursor globally
css = css.replace('html{scroll-behavior:smooth}', 'html{scroll-behavior:smooth; cursor:none;}');
// Allow pointer on hoverable elements so we can style the custom cursor to react
css = css.replace('*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}', '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box} a, button, input, [onclick], .card, .stat-card, .kanban-item { cursor: none !important; }');

// Append new CSS
const newCSS = `
/* ==================== CUSTOM CURSOR ==================== */
.cursor-dot, .cursor-outline {
    position: fixed;
    top: 0; left: 0;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    z-index: 9999;
    pointer-events: none;
}
.cursor-dot {
    width: 8px; height: 8px;
    background-color: var(--cyan);
}
.cursor-outline {
    width: 40px; height: 40px;
    border: 2px solid var(--purple);
    transition: width 0.2s, height 0.2s, background-color 0.2s;
}
/* Hover effect for custom cursor */
.cursor-hover .cursor-outline {
    width: 60px; height: 60px;
    background-color: rgba(108, 92, 231, 0.1);
    border-color: var(--cyan);
}
.cursor-hover .cursor-dot {
    background-color: var(--pink);
    transform: translate(-50%, -50%) scale(1.5);
}

/* ==================== NOISE TEXTURE (FROSTED GLASS) ==================== */
/* SVG Base64 Noise */
.glass-card, .sidebar, .topbar, .bottom-nav, .modal, .toast {
    position: relative;
}
.glass-card::before, .sidebar::before, .modal::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.15;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: -1;
    border-radius: inherit;
}

/* ==================== ANIMATED NEON BORDER ==================== */
@property --border-angle {
    syntax: "<angle>";
    inherits: true;
    initial-value: 0turn;
}
.animated-border {
    position: relative;
    border: 2px solid transparent !important;
    background-clip: padding-box !important;
}
.animated-border::after {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    background: conic-gradient(from var(--border-angle), transparent 25%, var(--purple), var(--cyan), transparent 50%);
    border-radius: inherit;
    animation: borderRotate 3s linear infinite;
}
@keyframes borderRotate {
    100% { --border-angle: 1turn; }
}

/* Fix 3D Glare for VanillaTilt */
.js-tilt-glare {
    border-radius: inherit;
}
`;
fs.appendFileSync('style.css', newCSS, 'utf8');

// 3. UPDATE APP.JS (Cursor tracking and VanillaTilt init)
let appJs = fs.readFileSync('app.js', 'utf8');

const cursorLogic = `
// ==================== CUSTOM CURSOR LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    
    if(!cursorDot || !cursorOutline) return;

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        cursorDot.style.left = \`\${posX}px\`;
        cursorDot.style.top = \`\${posY}px\`;
        
        // Add subtle delay to outline for trail effect
        cursorOutline.animate({
            left: \`\${posX}px\`,
            top: \`\${posY}px\`
        }, { duration: 500, fill: "forwards" });
    });
    
    // Add hover state
    const hoverElements = document.querySelectorAll('a, button, input, [onclick], .card, .stat-card, .kanban-item, .note-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
});
`;

appJs = appJs.replace('// ==================== THEME MANAGEMENT ====================', cursorLogic + '\n// ==================== THEME MANAGEMENT ====================');

// Inject VanillaTilt into route()
const targetInitStr = `targets.forEach(el => el.classList.add('animate-in'));`;
const tiltInitStr = `targets.forEach(el => el.classList.add('animate-in'));
        
        // Init 3D Tilt (only on desktop to save battery)
        if (window.innerWidth > 768 && typeof VanillaTilt !== 'undefined') {
            const tiltTargets = main.querySelectorAll('.stat-card, .card, .glass-card, .kanban-item');
            VanillaTilt.init(tiltTargets, {
                max: 10,
                speed: 400,
                glare: true,
                "max-glare": 0.2,
                scale: 1.02
            });
            // Re-bind hover logic for dynamically rendered elements
            const dynHover = main.querySelectorAll('a, button, [onclick], .card, .stat-card, .kanban-item, .note-card');
            dynHover.forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });
        }`;

appJs = appJs.replace(targetInitStr, tiltInitStr);

fs.writeFileSync('app.js', appJs, 'utf8');

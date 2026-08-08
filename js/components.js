/* ============================================================
   StudyHub v2 — Reusable UI Components
   Modal, Toast, Charts, Heatmap, Forms, Share Card
   ============================================================ */

// ==================== TOAST ====================
let toastTimeout = null;
function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ==================== MODAL ====================
function openModal(title, bodyHTML, footerHTML = '', options = {}) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    const modal = document.getElementById('appModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const footer = document.getElementById('modalFooter');
    if (footerHTML) {
        footer.innerHTML = footerHTML;
        footer.style.display = 'flex';
    } else {
        footer.style.display = 'none';
    }
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (options.wide) modal.classList.add('modal-wide');
    else modal.classList.remove('modal-wide');
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==================== CONFIRM DIALOG ====================
function showConfirm(message, onConfirm) {
    const body = `<p style="font-size:0.95rem;color:var(--text-secondary);line-height:1.7">${message}</p>`;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-danger" id="confirmBtn">Hapus</button>
    `;
    openModal('⚠️ Konfirmasi', body, footer);
    setTimeout(() => {
        const btn = document.getElementById('confirmBtn');
        if (btn) btn.onclick = () => { closeModal(); onConfirm(); };
    }, 50);
}

// ==================== FORM BUILDER ====================
function buildFormField(field) {
    const id = `form_${field.key}`;
    let input = '';

    switch (field.type) {
        case 'text':
        case 'number':
        case 'date':
        case 'time':
        case 'datetime-local':
            input = `<input type="${field.type}" id="${id}" class="form-input" value="${field.value || ''}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''}>`;
            break;
        case 'color': {
            const colorPalette = [
                '#6C5CE7', '#00CEFF', '#00E09E', '#FFA502',
                '#FF6B9D', '#FF4757', '#FECA57', '#A29BFE',
                '#fd79a8', '#55efc4', '#74b9ff', '#e17055'
            ];
            const selectedColor = field.value || '#6C5CE7';
            const swatches = colorPalette.map(c => {
                const isActive = c.toLowerCase() === selectedColor.toLowerCase();
                const shadow = isActive ? '0 0 0 3px #fff, 0 0 0 5px ' + c : 'none';
                return `<button type="button" class="color-swatch ${isActive ? 'active' : ''}" style="background:${c};box-shadow:${shadow}" onclick="selectColor('${id}','${c}',this)" title="${c}"></button>`;
            }).join('');
            input = `<input type="hidden" id="${id}" value="${selectedColor}">
                <div class="color-swatch-grid">${swatches}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                    <span id="${id}_preview" style="width:20px;height:20px;border-radius:50%;background:${selectedColor};display:inline-block;border:2px solid rgba(255,255,255,0.3)"></span>
                    <span id="${id}_label" style="font-size:0.8rem;color:var(--text-muted)">${selectedColor}</span>
                </div>`;
            break;
        }
        case 'textarea':
            input = `<textarea id="${id}" class="form-input form-textarea" placeholder="${field.placeholder || ''}" rows="${field.rows || 3}">${field.value || ''}</textarea>`;
            break;
        case 'select': {
            const opts = field.options.map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const label = typeof o === 'object' ? o.label : o;
                const sel = val === field.value ? 'selected' : '';
                return `<option value="${val}" ${sel}>${label}</option>`;
            }).join('');
            input = `<select id="${id}" class="form-input form-select">${opts}</select>`;
            break;
        }
        case 'emoji': {
            const emojis = ['📚', '🌐', '💻', '📱', '⚡', '🔌', '🏛️', '🌍', '📊', '📖', '🚀', '🎯', '🧪', '🔬', '📝', '🎨', '🎮', '💡', '🔥', '⭐'];
            const emojiOpts = emojis.map(e =>
                `<button type="button" class="emoji-btn ${e === field.value ? 'active' : ''}" onclick="selectEmoji('${id}','${e}',this)">${e}</button>`
            ).join('');
            input = `<input type="hidden" id="${id}" value="${field.value || '📚'}"><div class="emoji-grid">${emojiOpts}</div>`;
            break;
        }
    }

    return `
        <div class="form-group">
            <label class="form-label" for="${id}">${field.label}${field.required ? ' *' : ''}</label>
            ${input}
        </div>
    `;
}

function selectEmoji(inputId, emoji, btn) {
    document.getElementById(inputId).value = emoji;
    btn.parentElement.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function selectColor(inputId, color, btn) {
    document.getElementById(inputId).value = color;
    // Update all swatches
    btn.parentElement.querySelectorAll('.color-swatch').forEach(b => {
        b.classList.remove('active');
        b.style.boxShadow = 'none';
    });
    btn.classList.add('active');
    btn.style.boxShadow = `0 0 0 3px #fff, 0 0 0 5px ${color}`;
    // Update preview
    const preview = document.getElementById(inputId + '_preview');
    const label = document.getElementById(inputId + '_label');
    if (preview) preview.style.background = color;
    if (label) label.textContent = color;
}

function buildForm(fields) {
    return fields.map(f => {
        if (f.type === 'row') {
            return `<div class="form-row">${f.fields.map(buildFormField).join('')}</div>`;
        }
        return buildFormField(f);
    }).join('');
}

function getFormValues(fields) {
    const values = {};
    const flatFields = [];
    fields.forEach(f => {
        if (f.type === 'row') flatFields.push(...f.fields);
        else flatFields.push(f);
    });
    flatFields.forEach(f => {
        const el = document.getElementById(`form_${f.key}`);
        if (el) {
            if (f.type === 'number') values[f.key] = parseFloat(el.value) || 0;
            else values[f.key] = el.value;
        }
    });
    return values;
}

// ==================== BAR CHART (Canvas) ====================
function drawBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (options.height || 200) * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = (options.height || 200) + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = options.height || 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.min(40, (chartW / data.length) * 0.6);
    const gap = (chartW - barWidth * data.length) / (data.length + 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    // Bars
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, options.color || '#6C5CE7');
    gradient.addColorStop(1, options.colorEnd || '#00CEFF');

    data.forEach((d, i) => {
        const x = padding.left + gap + i * (barWidth + gap);
        const barH = (d.value / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        // Bar with rounded top
        ctx.fillStyle = gradient;
        const r = Math.min(barWidth / 2, 6);
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
        ctx.lineTo(x + barWidth, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.closePath();
        ctx.fill();

        // Value label
        if (d.value > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.value + (options.unit || ''), x + barWidth / 2, y - 6);
        }

        // X label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, h - padding.bottom + 18);
    });
}

// ==================== HEATMAP ====================
function drawHeatmap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = getHeatmapData();
    const today = new Date();
    const cellSize = 14;
    const gap = 3;
    const weeks = 20;
    const days = 7;

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayLabels = ['', 'Sen', '', 'Rab', '', 'Jum', ''];

    let html = '<div class="heatmap">';

    // Day labels
    html += '<div class="heatmap-day-labels">';
    dayLabels.forEach(d => {
        html += `<div class="heatmap-day-label" style="height:${cellSize + gap}px">${d}</div>`;
    });
    html += '</div>';

    html += '<div class="heatmap-grid-wrap">';

    // Month labels
    html += '<div class="heatmap-month-labels">';
    let lastMonth = -1;
    for (let w = weeks - 1; w >= 0; w--) {
        const d = new Date(today.getTime() - (w * 7 + today.getDay()) * 86400000);
        const month = d.getMonth();
        if (month !== lastMonth) {
            html += `<span style="left:${(weeks - 1 - w) * (cellSize + gap)}px">${monthLabels[month]}</span>`;
            lastMonth = month;
        }
    }
    html += '</div>';

    // Grid
    html += '<div class="heatmap-grid">';
    for (let w = weeks - 1; w >= 0; w--) {
        html += '<div class="heatmap-week">';
        for (let d = 0; d < days; d++) {
            const date = new Date(today.getTime() - (w * 7 + (today.getDay() - d + 7) % 7) * 86400000);
            const dateStr = date.toISOString().slice(0, 10);
            const dayData = data[dateStr];
            let level = 0;
            if (dayData) {
                const score = dayData.tasks * 2 + dayData.minutes / 30;
                if (score >= 8) level = 4;
                else if (score >= 5) level = 3;
                else if (score >= 2) level = 2;
                else if (score > 0) level = 1;
            }
            const future = date > today;
            html += `<div class="heatmap-cell level-${future ? 'empty' : level}" 
                data-date="${dateStr}" 
                title="${formatDate(dateStr)}${dayData ? `: ${dayData.tasks} tasks, ${dayData.minutes}m belajar` : ': Tidak ada aktivitas'}"
                style="width:${cellSize}px;height:${cellSize}px"></div>`;
        }
        html += '</div>';
    }
    html += '</div></div></div>';

    container.innerHTML = html;
}

// ==================== PROGRESS RING ====================
function createProgressRing(percent, size = 120, strokeWidth = 8) {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percent / 100) * circumference;
    return `
        <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${strokeWidth}"/>
            <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#ringGrad)" stroke-width="${strokeWidth}" 
                stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
                transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset 1s ease"/>
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#6C5CE7"/>
                    <stop offset="100%" style="stop-color:#00CEFF"/>
                </linearGradient>
            </defs>
            <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.35em" 
                fill="var(--text-primary)" font-size="${size * 0.22}" font-weight="800" font-family="Inter, sans-serif">${percent}%</text>
        </svg>
    `;
}

// ==================== SHARE CARD ====================
function generateShareCard() {
    const s = getState();
    const xpInfo = getXPProgress();
    const totalTasks = s.assignments.length + s.targets.reduce((sum, t) => sum + t.subtasks.length, 0);
    const doneTasks = s.assignments.filter(a => a.status === 'done').length + s.targets.reduce((sum, t) => sum + t.subtasks.filter(st => st.done).length, 0);
    const totalStudy = formatDuration(getTotalStudyTime('all'));
    const badges = s.achievements.length;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 600, 800);
    bg.addColorStop(0, '#0c0c24');
    bg.addColorStop(0.5, '#14143a');
    bg.addColorStop(1, '#0c0c24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 800);

    // Decorative circles
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#6C5CE7';
    ctx.beginPath(); ctx.arc(-50, -50, 250, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00CEFF';
    ctx.beginPath(); ctx.arc(650, 850, 250, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Border
    const borderGrad = ctx.createLinearGradient(0, 0, 600, 0);
    borderGrad.addColorStop(0, '#6C5CE7');
    borderGrad.addColorStop(1, '#00CEFF');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    roundRect(ctx, 20, 20, 560, 760, 24);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#f0f0ff';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📚 StudyHub Progress', 300, 80);

    // Name & Level
    ctx.font = '800 32px Inter, sans-serif';
    ctx.fillStyle = '#f0f0ff';
    ctx.fillText(`${s.profile.avatar || '🎓'} ${s.profile.name || 'Bro'}`, 300, 150);

    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillStyle = '#6C5CE7';
    ctx.fillText(`⭐ Level ${xpInfo.level.level} — ${xpInfo.level.name}`, 300, 185);

    ctx.fillStyle = '#FFA502';
    ctx.fillText(`🔥 ${s.streak || 0} hari streak`, 300, 215);

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, 80, 260, 440, 24, 12);
    ctx.fill();

    const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const barGrad = ctx.createLinearGradient(80, 0, 520, 0);
    barGrad.addColorStop(0, '#6C5CE7');
    barGrad.addColorStop(1, '#00CEFF');
    ctx.fillStyle = barGrad;
    roundRect(ctx, 80, 260, Math.max(24, 440 * (percent / 100)), 24, 12);
    ctx.fill();

    ctx.fillStyle = '#f0f0ff';
    ctx.font = '700 14px Inter, sans-serif';
    ctx.fillText(`${percent}%`, 300, 278);

    // Stats
    const stats = [
        { icon: '⏱️', label: 'Jam Belajar', value: totalStudy },
        { icon: '✅', label: 'Tasks Selesai', value: `${doneTasks}/${totalTasks}` },
        { icon: '🏆', label: 'Badges', value: `${badges} unlocked` },
        { icon: '⭐', label: 'Total XP', value: `${s.xp} XP` }
    ];

    stats.forEach((stat, i) => {
        const y = 340 + i * 80;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        roundRect(ctx, 80, y, 440, 60, 12);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.font = '400 24px sans-serif';
        ctx.fillStyle = '#f0f0ff';
        ctx.fillText(stat.icon, 100, y + 38);

        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillStyle = '#8888aa';
        ctx.fillText(stat.label, 140, y + 28);

        ctx.textAlign = 'right';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillStyle = '#f0f0ff';
        ctx.fillText(stat.value, 500, y + 40);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillStyle = '#555577';
    ctx.fillText('Semester Gasal 2025/2026', 300, 720);
    ctx.fillText('studyhub.app', 300, 745);

    // Download
    const link = document.createElement('a');
    link.download = `studyhub_progress_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('📸 Share card downloaded!', 'success');
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ==================== EMPTY STATE ====================
function emptyState(emoji, title, subtitle) {
    const svgMap = {
        '📚': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="60" height="45" rx="4" fill="none" stroke="var(--purple)" stroke-width="2.5"/><rect x="18" y="12" width="44" height="45" rx="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><line x1="25" y1="35" x2="55" y2="35" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/><line x1="25" y1="43" x2="45" y2="43" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/></svg>`,
        '📝': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="10" width="50" height="60" rx="5" fill="none" stroke="var(--purple)" stroke-width="2.5"/><line x1="25" y1="30" x2="55" y2="30" stroke="var(--text-muted)" stroke-width="2"/><line x1="25" y1="40" x2="55" y2="40" stroke="var(--text-muted)" stroke-width="2"/><line x1="25" y1="50" x2="40" y2="50" stroke="var(--text-muted)" stroke-width="2"/><circle cx="60" cy="58" r="12" fill="var(--cyan)" opacity="0.2" stroke="var(--cyan)" stroke-width="2"/><path d="M55 58 L58 61 L65 54" stroke="var(--cyan)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
        '📅': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="60" height="52" rx="5" fill="none" stroke="var(--purple)" stroke-width="2.5"/><line x1="10" y1="32" x2="70" y2="32" stroke="var(--purple)" stroke-width="2"/><circle cx="25" cy="14" r="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><circle cx="55" cy="14" r="4" fill="none" stroke="var(--cyan)" stroke-width="2"/><rect x="20" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.5"/><rect x="35" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.3"/><rect x="50" y="42" width="10" height="10" rx="2" fill="var(--purple)" opacity="0.3"/></svg>`,
        '🎯': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="28" fill="none" stroke="var(--red)" stroke-width="2" opacity="0.4"/><circle cx="40" cy="40" r="18" fill="none" stroke="var(--red)" stroke-width="2" opacity="0.6"/><circle cx="40" cy="40" r="8" fill="var(--red)" opacity="0.8"/><line x1="58" y1="22" x2="48" y2="32" stroke="var(--orange)" stroke-width="2" stroke-linecap="round"/><polygon points="62,16 58,22 68,20" fill="var(--orange)"/></svg>`,
        '💬': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="50" height="38" rx="8" fill="none" stroke="var(--cyan)" stroke-width="2.5"/><polygon points="18,53 10,65 30,53" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linejoin="round"/><line x1="22" y1="30" x2="48" y2="30" stroke="var(--text-muted)" stroke-width="2"/><line x1="22" y1="39" x2="38" y2="39" stroke="var(--text-muted)" stroke-width="2"/></svg>`
    };
    const svgEl = svgMap[emoji] || `<span style="font-size:4rem">${emoji}</span>`;
    return `
        <div class="empty-state">
            <div class="empty-illustration">${svgEl}</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
        </div>
    `;
}

// ==================== DEADLINE BADGE ====================
function deadlineBadge(deadline) {
    const status = getDeadlineStatus(deadline);
    const days = daysUntil(deadline);
    const labels = {
        overdue: `Terlambat ${Math.abs(days)} hari`,
        urgent: days === 0 ? 'Hari ini!' : 'Besok!',
        soon: `${days} hari lagi`,
        safe: `${days} hari lagi`
    };
    return `<span class="deadline-badge badge-${status}">${labels[status]}</span>`;
}

// ==================== PRIORITY BADGE ====================
function priorityBadge(priority) {
    const colors = { high: 'red', medium: 'orange', low: 'green' };
    const labels = { high: 'High', medium: 'Medium', low: 'Low' };
    return `<span class="priority-badge badge-${colors[priority]}">${labels[priority]}</span>`;
}

// ==================== STATUS BADGE ====================
function statusBadge(status) {
    const map = {
        todo: { color: 'purple', label: 'To Do' },
        progress: { color: 'cyan', label: 'In Progress' },
        done: { color: 'green', label: 'Done' }
    };
    const s = map[status] || map.todo;
    return `<span class="status-badge badge-${s.color}">${s.label}</span>`;
}

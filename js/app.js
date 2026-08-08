/* ============================================================
   StudyHub v2 — Main App
   Router, Page Renderers, Timer, Focus, Shortcuts
   ============================================================ */

// ==================== GLOBALS ====================
let currentPage = 'dashboard';
let timerInterval = null;
let timerRunning = false;
let timerSeconds = 0;
let timerMode = 'stopwatch'; // stopwatch | pomodoro
let pomodoroPhase = 'focus'; // focus | break | longbreak
let pomodoroRound = 0;
let focusModeActive = false;
let lofiPlaying = false;
let ambientPlaying = false;
let motivationInterval = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkAndUpdateStreak();
    applyTheme();
    const _st = getState(); if(_st.profile.accentColor) applyAccentColor(_st.profile.accentColor);
    updateSidebar();
    route();
    window.addEventListener('hashchange', route);
    document.addEventListener('keydown', handleShortcuts);
    
    // Refresh dashboard stats every 60s
    setInterval(() => { if (currentPage === 'dashboard') renderDashboard(); }, 60000);
    
    // Dynamic Motivational System (rotates every 15s)
    motivationInterval = setInterval(() => {
        if (currentPage === 'dashboard') rotateMotivation();
    }, 15000);

    // Check Supabase Cloud session & sync status
    setTimeout(async () => {
        if (typeof getCloudUser === 'function') {
            const user = await getCloudUser();
            if (user) {
                updateCloudBadgeStatus('synced');
                const cloudData = await fetchStateFromCloud();
                if (cloudData) {
                    saveState(cloudData);
                    updateSidebar();
                    if (currentPage === 'dashboard') renderDashboard();
                }
            }
        }
    }, 500);

    // Check first-time onboarding for brand new sessions
    setTimeout(() => {
        const s = getState();
        if (!s.onboarded && s.profile.name === 'Bro') {
            startOnboarding();
        }
    }, 1500);
});

// ==================== AUDIO CONTROLS ====================

function toggleLofi() {
    const lofi = document.getElementById('lofiPlayer');
    const btn = document.getElementById('btnLofi');
    if (!lofi || !btn) return;
    
    if (lofiPlaying) {
        lofi.pause();
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: OFF';
        btn.classList.remove('active');
        btn.style.color = '';
    } else {
        lofi.play().catch(e => console.log('Audio play failed:', e));
        btn.innerHTML = '<span class="nav-emoji">🎧</span> Lofi Radio: ON';
        btn.classList.add('active');
        btn.style.color = 'var(--cyan)';
    }
    lofiPlaying = !lofiPlaying;
}

function toggleAmbient() {
    const ambient = document.getElementById('ambientPlayer');
    const btn = document.getElementById('btnAmbient');
    if (!ambient || !btn) return;
    
    if (ambientPlaying) {
        ambient.pause();
        ambientPlaying = false;
        btn.innerHTML = '<span class="nav-emoji">🌧️</span> Hujan: OFF';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    } else {
        ambient.volume = 0.8;
        ambient.play().catch(e => showToast('Error playing Ambient: ' + e.message, 'error'));
        ambientPlaying = true;
        btn.innerHTML = '<span class="nav-emoji">🌧️</span> Hujan: ON';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
    }
}

// ==================== DYNAMIC MOTIVATION ====================
function rotateMotivation() {
    const roastCont = document.getElementById('roastContainer');
    const quoteCont = document.getElementById('quoteContainer');
    
    if (roastCont && quoteCont) {
        // Fade out
        roastCont.style.opacity = '0';
        quoteCont.style.opacity = '0';
        
        setTimeout(() => {
            const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            const roast = getRoastMessage(); // We can make getRoastMessage return random as well, but it relies on time/state. 
            // We'll just randomly decide to show a different motivational message if it's default
            
            document.getElementById('quoteText').textContent = `"${newQuote}"`;
            
            // To make roast dynamic without breaking state logic, we can add a random pool of motivation
            const rnd = Math.random();
            if (rnd > 0.5) {
                const extras = [
                    {m: 'Ayo semangat, jangan kasih kendor!', e: '🔥'},
                    {m: 'Sedikit lagi kelar nih!', e: '🚀'},
                    {m: 'Jangan lupa minum air putih!', e: '💧'},
                    {m: 'Fokus, fokus, fokus!', e: '👀'},
                    {m: 'Rebahan nanti aja, bereskan dulu!', e: '🛌'},
                    {m: 'Gas terus sampai lulus!', e: '🎓'}
                ];
                const x = extras[Math.floor(Math.random() * extras.length)];
                document.getElementById('roastEmoji').textContent = x.e;
                document.getElementById('roastText').textContent = x.m;
            } else {
                document.getElementById('roastEmoji').textContent = roast.emoji;
                document.getElementById('roastText').textContent = roast.message;
            }
            
            // Fade in
            roastCont.style.opacity = '1';
            quoteCont.style.opacity = '1';
        }, 500); // Wait for fade out
    }
}

// ==================== THEME ====================


// ==================== ROUTER ====================
function route() {
    const hash = location.hash.slice(1) || 'dashboard';
    currentPage = hash;
    updateNavActive(hash);
    const main = document.getElementById('mainContent');
    switch (hash) {
        case 'dashboard': renderDashboard(); break;
        case 'courses': renderCourses(); break;
        case 'schedule': renderSchedule(); break;
        case 'assignments': renderAssignments(); break;
        case 'grades': renderGrades(); break;
        case 'timer': renderTimer(); break;
        case 'stats': renderStats(); break;
        case 'targets': renderTargets(); break;
        case 'notes': renderNotes(); break;
        case 'achievements': renderAchievements(); break;
        case 'aimentor': renderAiMentor(); break;
        case 'settings': renderSettings(); break;
        default: renderDashboard();
    }
    window.scrollTo(0, 0);
    const newAch = checkAchievements();
    newAch.forEach(a => showToast(`🏆 Badge Unlocked: ${a.icon} ${a.name}!`, 'success'));
}

function updateNavActive(page) {
    document.querySelectorAll('.sidebar-nav a, .bottom-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });
}

function updateSidebar() {
    const xp = getXPProgress();
    const si = getStreakInfo();
    document.getElementById('sbLevelIcon').textContent = xp.level.icon;
    document.getElementById('sbLevelName').textContent = xp.level.name;
    document.getElementById('sbXPText').textContent = `${xp.progress} / ${xp.required} XP`;
    document.getElementById('sbLevelNum').textContent = `Lv. ${xp.level.level}`;
    document.getElementById('sbXPBar').style.width = xp.percent + '%';
    document.getElementById('sbStreak').textContent = si.streak;
}

// ==================== SIDEBAR TOGGLE ====================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

// ==================== FAB ====================
function handleFAB() {
    const s = getState();
    if (s.mode === 'semester' || currentPage === 'assignments') {
        showAddAssignmentModal();
    } else if (currentPage === 'courses') {
        showAddCourseModal();
    } else if (currentPage === 'targets') {
        showAddTargetModal();
    } else if (currentPage === 'notes') {
        showAddNoteModal();
    } else if (currentPage === 'schedule') {
        showAddScheduleModal();
    } else {
        showAddTargetModal();
    }
}

// ==================== SEARCH ====================
function openSearch() {
    document.getElementById('searchOverlay').classList.add('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearch() {
    document.getElementById('searchOverlay').classList.remove('active');
}

function handleSearch(query) {
    const results = globalSearch(query);
    const container = document.getElementById('searchResults');
    if (results.length === 0) {
        container.innerHTML = query.length >= 2 ? '<div style="padding:20px;text-align:center;color:var(--text-muted)">Tidak ditemukan</div>' : '';
        return;
    }
    container.innerHTML = results.map(r => `
        <div class="search-result-item" onclick="navigateToResult('${r.type}','${r.id}')">
            <span class="search-result-type">${r.type}</span>
            <span class="search-result-title">${r.title}</span>
            <span class="search-result-sub">${r.subtitle}</span>
        </div>
    `).join('');
}

function navigateToResult(type, id) {
    closeSearch();
    const map = { course: 'courses', assignment: 'assignments', target: 'targets', note: 'notes' };
    location.hash = map[type] || 'dashboard';
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    const s = getState();
    const greeting = getGreeting();
    const roast = getRoastMessage();
    const quote = getQuoteOfTheDay();
    const challenge = getDailyChallenge();
    const xp = getXPProgress();
    const totalStudy = getTotalStudyTime('all');
    const todayStudy = getTotalStudyTime('today');
    const overdue = getOverdueAssignments().length;
    const upcoming = getUpcomingAssignments(3);
    const weekData = getWeeklyStudyData();

    const totalTasks = s.assignments.length + s.targets.reduce((sum, t) => sum + t.subtasks.length, 0);
    const doneTasks = s.assignments.filter(a => a.status === 'done').length + s.targets.reduce((sum, t) => sum + t.subtasks.filter(st => st.done).length, 0);
    const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const semStart = s.profile.semesterStart;
    const daysToSem = daysUntil(semStart);
    const countdownHTML = daysToSem !== null && daysToSem > 0 ? `
        <div class="countdown">
            <div class="countdown-val">${daysToSem} hari</div>
            <div class="countdown-label">menuju awal semester</div>
        </div>` : daysToSem !== null && daysToSem <= 0 ? `<div class="countdown"><div class="countdown-label" style="color:var(--green)">✅ Semester sudah dimulai!</div></div>` : '';

    const todaySchedules = getTodaySchedules();
    const agendaHTML = todaySchedules.length > 0 ? todaySchedules.map(sc => {
        const course = getCourse(sc.courseId);
        return `<div class="agenda-item">
            <span class="agenda-time">${sc.startTime}</span>
            <span class="agenda-title">${course ? course.name : 'Unknown'}</span>
            <span class="agenda-course">${sc.room || ''}</span>
        </div>`;
    }).join('') : '<div style="padding:12px;color:var(--text-muted);font-size:.85rem">Tidak ada jadwal hari ini</div>';

    document.getElementById('mainContent').innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
            <div>
                <h2 style="font-size:1.5rem;font-weight:800">${greeting.emoji} ${greeting.text}</h2>
                <div class="roast-box" style="margin-top:12px;margin-bottom:0;transition:opacity 0.5s ease" id="roastContainer">
                    <span class="roast-emoji" id="roastEmoji">${roast.emoji}</span>
                    <span class="roast-text" id="roastText">${roast.message}</span>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="openSearch()" style="gap:8px">🔍 Search <kbd style="font-size:.6rem;opacity:.5;background:var(--bg-code);padding:2px 6px;border-radius:4px">/</kbd></button>
        </div>

        <div class="quote-box" id="quoteContainer" style="transition:opacity 0.5s ease">💭 <span id="quoteText">"${quote}"</span></div>

        ${getPetHTML()}

        <div class="stats-row">
            <div class="stat-card glow-purple">
                <div class="stat-icon-wrap si-purple">⭐</div>
                <div><span class="stat-val">${xp.level.icon} Lv.${xp.level.level}</span><span class="stat-lbl">${xp.currentXP} XP</span></div>
            </div>
            <div class="stat-card glow-orange">
                <div class="stat-icon-wrap si-orange">🔥</div>
                <div><span class="stat-val">${s.streak || 0}</span><span class="stat-lbl">Hari Streak</span></div>
            </div>
            <div class="stat-card glow-cyan">
                <div class="stat-icon-wrap si-cyan">⏱️</div>
                <div><span class="stat-val">${formatDuration(totalStudy)}</span><span class="stat-lbl">Total Belajar</span></div>
            </div>
            <div class="stat-card glow-green">
                <div class="stat-icon-wrap si-green">✅</div>
                <div><span class="stat-val">${doneTasks}/${totalTasks}</span><span class="stat-lbl">Tasks Selesai</span></div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
            <div class="glass-card" style="text-align:center;padding:24px">
                ${createProgressRing(percent)}
                <div style="margin-top:8px;font-size:.85rem;color:var(--text-secondary)">Overall Progress</div>
            </div>
            <div class="glass-card" style="padding:24px">
                ${countdownHTML}
                <div class="glass-card" style="margin-top:12px;padding:14px;margin-bottom:0;background:var(--bg-card-alt)">
                    <div style="font-size:.75rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📋 Daily Challenge</div>
                    <div style="font-size:.9rem;font-weight:500;margin-bottom:8px">${challenge.text}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="badge badge-purple">+${challenge.xp} XP</span>
                        ${challenge.completed ? '<span class="badge badge-green">✅ Selesai</span>' : `<button class="btn btn-sm btn-primary" onclick="completeDailyChallenge();route()">Selesai!</button>`}
                    </div>
                </div>
            </div>
        </div>

        ${overdue > 0 ? `<div class="roast-box" style="border-color:rgba(255,71,87,0.2)"><span class="roast-emoji">⚠️</span><span class="roast-text" style="color:var(--red)">${overdue} tugas terlambat! <a href="#assignments" style="color:var(--cyan)">Lihat →</a></span></div>` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="glass-card">
                <div class="sec-title"><span class="st-emoji">📅</span> Jadwal Hari Ini</div>
                ${agendaHTML}
            </div>
            <div class="glass-card">
                <div class="sec-title"><span class="st-emoji">📊</span> Belajar Minggu Ini</div>
                <canvas id="weekChart"></canvas>
            </div>
        </div>
    `;

    // Draw chart
    setTimeout(() => {
        drawBarChart('weekChart', weekData.map(d => ({ label: d.day, value: d.minutes })), { height: 160, unit: 'm' });
    }, 100);

    updateSidebar();
}

// ==================== COURSES PAGE ====================
function renderCourses() {
    const courses = getAllCourses();
    const main = document.getElementById('mainContent');

    main.innerHTML = `
        <div class="page-header">
            <h2>📚 Mata Kuliah</h2>
            <button class="btn btn-primary" onclick="showAddCourseModal()">+ Tambah Matkul</button>
        </div>
        ${courses.length === 0 ? emptyState('📚', 'Belum ada mata kuliah', 'Klik tombol + untuk menambah mata kuliah pertama!') :
        `<div class="card-grid">${courses.map(c => {
            const assignments = getAllAssignments({ courseId: c.id });
            const done = assignments.filter(a => a.status === 'done').length;
            const pct = assignments.length > 0 ? Math.round((done / assignments.length) * 100) : 0;
            return `<div class="card" style="--card-accent:${c.color}" onclick="showCourseDetail('${c.id}')">
                <span class="card-emoji">${c.emoji || '📚'}</span>
                <div class="card-title">${c.name}</div>
                <div class="card-subtitle">${c.code || ''} · ${c.sks} SKS · ${c.type}</div>
                <div class="card-progress"><div class="card-progress-fill" style="width:${pct}%;background:${c.color}"></div></div>
                <div class="card-footer"><span>${done}/${assignments.length} tugas</span><span>${pct}%</span></div>
            </div>`;
        }).join('')}</div>`}
    `;
}

function showAddCourseModal(editId) {
    const existing = editId ? getCourse(editId) : null;
    const title = existing ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah';
    const fields = [
        { key: 'name', label: 'Nama Matkul', type: 'text', required: true, value: existing?.name || '', placeholder: 'Pengembangan Aplikasi Web' },
        { type: 'row', fields: [
            { key: 'code', label: 'Kode', type: 'text', value: existing?.code || '', placeholder: 'IF401' },
            { key: 'sks', label: 'SKS', type: 'number', value: existing?.sks || 3, min: 1, max: 6 }
        ]},
        { key: 'type', label: 'Tipe', type: 'select', value: existing?.type || 'teori', options: [
            { value: 'teori', label: 'Teori' }, { value: 'praktikum', label: 'Praktikum' }, { value: 'umum', label: 'Umum' }
        ]},
        { key: 'color', label: 'Warna', type: 'color', value: existing?.color || '#6C5CE7' },
        { type: 'row', fields: [
            { key: 'dosen', label: 'Dosen', type: 'text', value: existing?.dosen || '', placeholder: 'Opsional' },
            { key: 'ruangan', label: 'Ruangan', type: 'text', value: existing?.ruangan || '', placeholder: 'Opsional' }
        ]},
        { key: 'emoji', label: 'Emoji', type: 'emoji', value: existing?.emoji || '📚' }
    ];

    const body = buildForm(fields);
    const footer = `
        ${editId ? `<button class="btn btn-danger" onclick="deleteCourse('${editId}');closeModal();renderCourses()">Hapus</button>` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveCourse('${editId || ''}')">Simpan</button>
    `;
    openModal(title, body, footer);
}

function saveCourse(editId) {
    const fields = [
        { key: 'name' }, { key: 'code' }, { key: 'sks', type: 'number' },
        { key: 'type' }, { key: 'color' }, { key: 'dosen' }, { key: 'ruangan' }, { key: 'emoji' }
    ];
    const vals = {};
    fields.forEach(f => {
        const el = document.getElementById(`form_${f.key}`);
        if (el) vals[f.key] = f.type === 'number' ? parseInt(el.value) || 3 : el.value;
    });

    if (!vals.name) { showToast('Nama matkul wajib diisi!', 'error'); return; }

    if (editId) { updateCourse(editId, vals); showToast('✅ Matkul diupdate!'); }
    else { addCourse(vals); showToast('✅ Matkul ditambahkan!', 'success'); }

    closeModal();
    renderCourses();
    updateSidebar();
}

function showCourseDetail(id) {
    const c = getCourse(id);
    if (!c) return;
    const assignments = getAllAssignments({ courseId: id });
    const notes = getNotesByCourse(id);
    const fg = calculateFinalGrade(id);
    const gl = fg !== null ? gradeToLetter(fg) : null;

    const body = `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
            <span class="badge badge-purple">${c.type}</span>
            <span class="badge badge-cyan">${c.sks} SKS</span>
            ${c.dosen ? `<span class="badge badge-orange">${c.dosen}</span>` : ''}
            ${gl ? `<span class="badge badge-green">${gl.letter} (${fg.toFixed(1)})</span>` : ''}
        </div>
        <h4 style="color:var(--cyan);margin:16px 0 8px">📝 Tugas (${assignments.length})</h4>
        ${assignments.length === 0 ? '<p style="color:var(--text-muted);font-size:.85rem">Belum ada tugas</p>' :
        assignments.map(a => `<div class="agenda-item" style="cursor:default">
            <input type="checkbox" ${a.status === 'done' ? 'checked' : ''} onchange="completeAssignment('${a.id}');showCourseDetail('${id}')">
            <span class="agenda-title" style="${a.status === 'done' ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${a.title}</span>
            ${a.deadline ? deadlineBadge(a.deadline) : ''}
        </div>`).join('')}
        <h4 style="color:var(--cyan);margin:16px 0 8px">📝 Catatan (${notes.length})</h4>
        ${notes.length === 0 ? '<p style="color:var(--text-muted);font-size:.85rem">Belum ada catatan</p>' :
        notes.map(n => `<div class="note-card" style="margin-bottom:8px"><div class="note-card-title">${n.title}</div><div class="note-card-preview">${n.content}</div></div>`).join('')}
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="showAddCourseModal('${id}')">✏️ Edit</button>
        <button class="btn btn-danger" onclick="showConfirm('Hapus mata kuliah ${c.name}?',()=>{deleteCourse('${id}');closeModal();renderCourses()})">🗑️ Hapus</button>
    `;
    openModal(`${c.emoji} ${c.name}`, body, footer, { wide: true });
}

// ==================== SCHEDULE PAGE ====================
function renderSchedule() {
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const todayDay = getDayName(new Date());

    let gridHTML = '<div class="schedule-header">Jam</div>';
    dayLabels.forEach((d, i) => {
        const isToday = days[i] === todayDay;
        gridHTML += `<div class="schedule-header" style="${isToday ? 'color:var(--cyan);font-weight:800' : ''}">${d}${isToday ? ' 📍' : ''}</div>`;
    });

    hours.forEach(hour => {
        gridHTML += `<div class="schedule-time">${hour}</div>`;
        days.forEach(day => {
            const schedules = getSchedulesByDay(day).filter(sc => sc.startTime <= hour && sc.endTime > hour);
            const content = schedules.map(sc => {
                const course = getCourse(sc.courseId);
                if (!course) return '';
                if (sc.startTime !== hour) return '';
                return `<div class="schedule-block" style="background:${course.color}22;color:${course.color};border-left:3px solid ${course.color}" onclick="showScheduleDetail('${sc.id}')">
                    ${course.emoji} ${course.name}<small>${sc.startTime}-${sc.endTime} · ${sc.room || ''}</small>
                </div>`;
            }).join('');
            gridHTML += `<div class="schedule-cell">${content}</div>`;
        });
    });

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header">
            <h2>📅 Jadwal Kuliah</h2>
            <button class="btn btn-primary" onclick="showAddScheduleModal()">+ Tambah Jadwal</button>
        </div>
        <div class="schedule-grid">${gridHTML}</div>
    `;
}

function showAddScheduleModal(editId) {
    const existing = editId ? getAllSchedules().find(s => s.id === editId) : null;
    const courses = getAllCourses();
    if (courses.length === 0) { showToast('Tambah mata kuliah dulu!', 'error'); return; }

    const fields = [
        { key: 'courseId', label: 'Mata Kuliah', type: 'select', value: existing?.courseId || '', options: courses.map(c => ({ value: c.id, label: `${c.emoji} ${c.name}` })) },
        { key: 'day', label: 'Hari', type: 'select', value: existing?.day || 'senin', options: [
            { value: 'senin', label: 'Senin' }, { value: 'selasa', label: 'Selasa' }, { value: 'rabu', label: 'Rabu' },
            { value: 'kamis', label: 'Kamis' }, { value: 'jumat', label: 'Jumat' }
        ]},
        { type: 'row', fields: [
            { key: 'startTime', label: 'Jam Mulai', type: 'time', value: existing?.startTime || '08:00' },
            { key: 'endTime', label: 'Jam Selesai', type: 'time', value: existing?.endTime || '10:00' }
        ]},
        { key: 'room', label: 'Ruangan', type: 'text', value: existing?.room || '', placeholder: 'Lab 3' },
        { key: 'type', label: 'Jenis', type: 'select', value: existing?.type || 'kuliah', options: [
            { value: 'kuliah', label: 'Kuliah' }, { value: 'praktikum', label: 'Praktikum' }, { value: 'kuis', label: 'Kuis' }
        ]}
    ];

    const footer = `
        ${editId ? `<button class="btn btn-danger" onclick="deleteSchedule('${editId}');closeModal();renderSchedule()">Hapus</button>` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveSchedule('${editId || ''}')">Simpan</button>
    `;
    openModal(existing ? 'Edit Jadwal' : 'Tambah Jadwal', buildForm(fields), footer);
}

function saveSchedule(editId) {
    const keys = ['courseId', 'day', 'startTime', 'endTime', 'room', 'type'];
    const vals = {};
    keys.forEach(k => { const el = document.getElementById(`form_${k}`); if (el) vals[k] = el.value; });
    if (editId) { updateSchedule(editId, vals); showToast('✅ Jadwal diupdate!'); }
    else { addSchedule(vals); showToast('✅ Jadwal ditambahkan!', 'success'); }
    closeModal(); renderSchedule();
}

function showScheduleDetail(id) {
    const sc = getAllSchedules().find(s => s.id === id);
    if (!sc) return;
    const course = getCourse(sc.courseId);
    const body = `
        <p><strong>Mata Kuliah:</strong> ${course ? `${course.emoji} ${course.name}` : 'Unknown'}</p>
        <p><strong>Hari:</strong> ${sc.day.charAt(0).toUpperCase() + sc.day.slice(1)}</p>
        <p><strong>Jam:</strong> ${sc.startTime} - ${sc.endTime}</p>
        <p><strong>Ruangan:</strong> ${sc.room || '-'}</p>
        <p><strong>Jenis:</strong> ${sc.type}</p>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal();showAddScheduleModal('${id}')">✏️ Edit</button>
        <button class="btn btn-danger" onclick="deleteSchedule('${id}');closeModal();renderSchedule()">🗑️ Hapus</button>
    `;
    openModal('📅 Detail Jadwal', body, footer);
}

// ==================== ASSIGNMENTS PAGE ====================
function renderAssignments() {
    const all = getAllAssignments();
    const todo = all.filter(a => a.status === 'todo');
    const progress = all.filter(a => a.status === 'progress');
    const done = all.filter(a => a.status === 'done');

    const renderItem = (a) => {
        const course = getCourse(a.courseId);
        return `<div class="kanban-item" onclick="showAssignmentDetail('${a.id}')">
            <div class="kanban-item-title">${a.title}</div>
            <div class="kanban-item-meta">
                ${course ? `<span style="font-size:.7rem;color:var(--text-muted)">${course.emoji} ${course.name}</span>` : ''}
                ${a.deadline ? deadlineBadge(a.deadline) : ''}
            </div>
            <div class="kanban-item-meta" style="margin-top:6px">
                ${priorityBadge(a.priority)}
                ${a.status !== 'done' ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();completeAssignment('${a.id}');updateSidebar();renderAssignments()">✅ Done</button>` : ''}
            </div>
        </div>`;
    };

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header">
            <h2>✅ Tugas & Deadline</h2>
            <button class="btn btn-primary" onclick="showAddAssignmentModal()">+ Tambah Tugas</button>
        </div>
        ${all.length === 0 ? emptyState('✅', 'Belum ada tugas', 'Klik + untuk menambah tugas pertama!') : `
        <div class="kanban">
            <div class="kanban-col">
                <div class="kanban-col-header">📋 To Do <span class="kanban-col-count">${todo.length}</span></div>
                ${todo.map(renderItem).join('')}
            </div>
            <div class="kanban-col">
                <div class="kanban-col-header">🔄 In Progress <span class="kanban-col-count">${progress.length}</span></div>
                ${progress.map(renderItem).join('')}
            </div>
            <div class="kanban-col">
                <div class="kanban-col-header">✅ Done <span class="kanban-col-count">${done.length}</span></div>
                ${done.map(renderItem).join('')}
            </div>
        </div>`}
    `;
}

function showAddAssignmentModal(editId) {
    const existing = editId ? getAllAssignments().find(a => a.id === editId) : null;
    const courses = getAllCourses();
    const courseOpts = [{ value: '', label: '— Tidak terkait —' }, ...courses.map(c => ({ value: c.id, label: `${c.emoji} ${c.name}` }))];

    const fields = [
        { key: 'title', label: 'Judul Tugas', type: 'text', required: true, value: existing?.title || '', placeholder: 'Tugas 1 - CRUD Laravel' },
        { key: 'courseId', label: 'Mata Kuliah', type: 'select', value: existing?.courseId || '', options: courseOpts },
        { key: 'description', label: 'Deskripsi', type: 'textarea', value: existing?.description || '', placeholder: 'Opsional' },
        { type: 'row', fields: [
            { key: 'deadline', label: 'Deadline', type: 'datetime-local', value: existing?.deadline || '' },
            { key: 'priority', label: 'Prioritas', type: 'select', value: existing?.priority || 'medium', options: [
                { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }
            ]}
        ]},
        { key: 'link', label: 'Link', type: 'text', value: existing?.link || '', placeholder: 'https://...' }
    ];
    if (existing) {
        fields.push({ key: 'status', label: 'Status', type: 'select', value: existing.status, options: [
            { value: 'todo', label: 'To Do' }, { value: 'progress', label: 'In Progress' }, { value: 'done', label: 'Done' }
        ]});
    }

    const footer = `
        ${editId ? `<button class="btn btn-danger" onclick="deleteAssignment('${editId}');closeModal();renderAssignments()">Hapus</button>` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveAssignment('${editId || ''}')">Simpan</button>
    `;
    openModal(existing ? 'Edit Tugas' : 'Tambah Tugas', buildForm(fields), footer);
}

function saveAssignment(editId) {
    const keys = ['title', 'courseId', 'description', 'deadline', 'priority', 'link', 'status'];
    const vals = {};
    keys.forEach(k => { const el = document.getElementById(`form_${k}`); if (el) vals[k] = el.value; });
    if (!vals.title) { showToast('Judul tugas wajib diisi!', 'error'); return; }
    if (editId) { updateAssignment(editId, vals); showToast('✅ Tugas diupdate!'); }
    else { addAssignment(vals); showToast('✅ Tugas ditambahkan!', 'success'); }
    closeModal(); renderAssignments(); updateSidebar();
}

function showAssignmentDetail(id) {
    const a = getAllAssignments().find(x => x.id === id);
    if (!a) return;
    const course = getCourse(a.courseId);
    const body = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            ${statusBadge(a.status)} ${priorityBadge(a.priority)}
            ${a.deadline ? deadlineBadge(a.deadline) : ''}
        </div>
        ${course ? `<p style="margin-bottom:8px"><strong>Matkul:</strong> ${course.emoji} ${course.name}</p>` : ''}
        ${a.description ? `<p style="color:var(--text-secondary);margin-bottom:8px">${a.description}</p>` : ''}
        ${a.deadline ? `<p><strong>Deadline:</strong> ${formatDateTime(a.deadline)}</p>` : ''}
        ${a.link ? `<p><strong>Link:</strong> <a href="${a.link}" target="_blank" style="color:var(--cyan)">${a.link}</a></p>` : ''}
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal();showAddAssignmentModal('${id}')">✏️ Edit</button>
        ${a.status !== 'done' ? `<button class="btn btn-success" onclick="completeAssignment('${id}');updateSidebar();closeModal();renderAssignments()">✅ Selesai</button>` : ''}
        <button class="btn btn-danger" onclick="deleteAssignment('${id}');closeModal();renderAssignments()">🗑️</button>
    `;
    openModal(`✅ ${a.title}`, body, footer);
}

// ==================== GRADES PAGE ====================
function renderGrades() {
    const courses = getAllCourses();
    const ipk = calculateIPK();

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h2>📊 Nilai & IPK</h2></div>
        <div class="glass-card" style="text-align:center;margin-bottom:24px;padding:32px">
            <div class="ipk-ring-wrap">
                <svg class="ipk-ring" viewBox="0 0 120 120" width="140" height="140">
                    <circle class="ipk-ring-bg" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
                    <circle class="ipk-ring-fill" cx="60" cy="60" r="52" fill="none" stroke-width="10"
                        stroke-dasharray="${Math.round((ipk/4)*326.7)} 326.7"
                        stroke-linecap="round" transform="rotate(-90 60 60)"/>
                    <text x="60" y="55" text-anchor="middle" class="ipk-ring-val">${ipk.toFixed(2)}</text>
                    <text x="60" y="73" text-anchor="middle" class="ipk-ring-lbl">IPK</text>
                </svg>
            </div>
            <div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)">${ipk >= 3.5 ? '🏆 Cumlaude!' : ipk >= 3.0 ? '⭐ Sangat Memuaskan' : ipk >= 2.5 ? '👍 Memuaskan' : ipk > 0 ? '📚 Tetap Semangat!' : 'Belum ada nilai'}</div>
        </div>
        ${courses.length === 0 ? emptyState('📊', 'Belum ada mata kuliah', 'Tambah mata kuliah dulu untuk input nilai') : `
        <div class="table-wrap"><table>
            <thead><tr><th>Matkul</th><th>SKS</th>${['Tugas', 'Kuis', 'UTS', 'UAS', 'Proyek'].map(h => `<th>${h}</th>`).join('')}<th>Akhir</th><th>Huruf</th></tr></thead>
            <tbody>${courses.map(c => {
                const fg = calculateFinalGrade(c.id);
                const gl = fg !== null ? gradeToLetter(fg) : { letter: '-', weight: 0 };
                const gradeKeys = Object.keys(c.gradeWeights || {});
                return `<tr>
                    <td>${c.emoji} ${c.name}</td><td>${c.sks}</td>
                    ${gradeKeys.map(k => `<td><input type="number" min="0" max="100" style="width:60px;padding:4px 8px;font-size:.8rem;background:var(--bg-code);border:1px solid var(--border);border-radius:4px;color:var(--text-primary);text-align:center" value="${c.grades?.[k] || ''}" placeholder="—" onchange="updateGrade('${c.id}','${k}',this.value);renderGrades()"></td>`).join('')}
                    <td><strong>${fg !== null ? fg.toFixed(1) : '-'}</strong></td>
                    <td><span class="badge badge-${gl.weight >= 3 ? 'green' : gl.weight >= 2 ? 'orange' : 'red'}">${gl.letter}</span></td>
                </tr>`;
            }).join('')}</tbody>
        </table></div>`}
    `;
}

// ==================== TIMER PAGE ====================
function renderTimer() {
    const courses = getAllCourses();
    const s = getState();

    document.getElementById('mainContent').innerHTML = `
        <div class="glass-card timer-section">
            <div class="timer-mode-toggle">
                <button class="tab ${timerMode === 'stopwatch' ? 'active' : ''}" onclick="timerMode='stopwatch';renderTimer()">⏱️ Stopwatch</button>
                <button class="tab ${timerMode === 'pomodoro' ? 'active' : ''}" onclick="timerMode='pomodoro';renderTimer()">🍅 Pomodoro</button>
            </div>
            <div class="timer-display" id="timerDisplay">${formatTimerDisplay(timerSeconds)}</div>
            <span class="timer-label" id="timerLabel">${timerMode === 'pomodoro' ? (pomodoroPhase === 'focus' ? '🍅 Focus Time' : '☕ Break Time') : 'Stopwatch'}</span>
            <div class="timer-course-select">
                <select class="form-input form-select" id="timerCourse">
                    <option value="">— Pilih Mata Kuliah —</option>
                    ${courses.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="timer-controls">
                <button class="btn btn-primary" id="timerPlayBtn" onclick="toggleTimer()">${timerRunning ? '⏸ Pause' : '▶ Start'}</button>
                <button class="btn btn-secondary" onclick="resetTimerFull()">↺ Reset</button>
                <button class="btn btn-secondary" onclick="enterFocusMode()">🔕 Focus</button>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">📜</span> Riwayat Hari Ini</div>
            ${getTimerLogsByDate(getTodayString()).length === 0 ? '<p style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Belum ada sesi hari ini</p>' :
            getTimerLogsByDate(getTodayString()).map(l => {
                const course = getCourse(l.courseId);
                return `<div class="agenda-item"><span class="agenda-time">${l.type === 'pomodoro' ? '🍅' : '⏱️'}</span><span class="agenda-title">${course ? course.name : 'General'}</span><span>${formatDuration(l.duration)}</span></div>`;
            }).join('')}
        </div>
    `;
}

function toggleTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        updateTimerUI();
    } else {
        timerRunning = true;
        if (timerMode === 'pomodoro' && timerSeconds === 0) {
            const s = getState();
            timerSeconds = (s.profile.pomodoroFocus || 25) * 60;
            pomodoroPhase = 'focus';
        }
        timerInterval = setInterval(() => {
            if (timerMode === 'stopwatch') {
                timerSeconds++;
            } else {
                timerSeconds--;
                if (timerSeconds <= 0) {
                    handlePomodoroEnd();
                    return;
                }
            }
            updateTimerDisplay();
        }, 1000);
        updateTimerUI();
    }
}

function handlePomodoroEnd() {
    clearInterval(timerInterval);
    timerRunning = false;
    const s = getState();

    if (pomodoroPhase === 'focus') {
        const courseId = document.getElementById('timerCourse')?.value || '';
        addTimerLog({ courseId, duration: (s.profile.pomodoroFocus || 25) * 60, type: 'pomodoro' });
        addXP(XP_REWARDS.COMPLETE_POMODORO, 'Pomodoro selesai!');
        gainPetExp(50);
        pomodoroRound++;
        showToast('🍅 Pomodoro selesai! Istirahat dulu.', 'success');

        if (pomodoroRound >= (s.profile.pomodoroRounds || 4)) {
            pomodoroPhase = 'longbreak';
            timerSeconds = (s.profile.pomodoroLongBreak || 15) * 60;
            pomodoroRound = 0;
        } else {
            pomodoroPhase = 'break';
            timerSeconds = (s.profile.pomodoroBreak || 5) * 60;
        }
    } else {
        pomodoroPhase = 'focus';
        timerSeconds = (s.profile.pomodoroFocus || 25) * 60;
        showToast('💪 Break selesai! Lanjut fokus!');
    }

    updateTimerDisplay();
    updateTimerUI();
    updateSidebar();
    checkAchievements();
}

function resetTimerFull() {
    clearInterval(timerInterval);
    timerRunning = false;
    if (timerMode === 'stopwatch' && timerSeconds > 30) {
        const courseId = document.getElementById('timerCourse')?.value || '';
        addTimerLog({ courseId, duration: timerSeconds, type: 'stopwatch' });
        const hrs = timerSeconds / 3600;
        if (hrs >= 1) addXP(Math.floor(hrs) * XP_REWARDS.STUDY_HOUR, `Belajar ${Math.floor(hrs)} jam`);
        gainPetExp(Math.floor(timerSeconds / 60)); // 1 exp per minute
        showToast(`⏱️ ${formatDuration(timerSeconds)} tercatat!`, 'success');
        updateSidebar();
    }
    timerSeconds = 0;
    pomodoroPhase = 'focus';
    pomodoroRound = 0;
    updateTimerDisplay();
    updateTimerUI();
}

function updateTimerDisplay() {
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = formatTimerDisplay(timerSeconds);
    const fl = document.getElementById('focusTimer');
    if (fl) fl.textContent = formatTimerDisplay(timerSeconds);
}

function updateTimerUI() {
    const btn = document.getElementById('timerPlayBtn');
    if (btn) btn.textContent = timerRunning ? '⏸ Pause' : '▶ Start';
    const fbtn = document.getElementById('focusPlayBtn');
    if (fbtn) fbtn.textContent = timerRunning ? '⏸ Pause' : '▶ Resume';
    const lbl = document.getElementById('timerLabel');
    if (lbl) lbl.textContent = timerMode === 'pomodoro' ? (pomodoroPhase === 'focus' ? '🍅 Focus Time' : '☕ Break Time') : 'Stopwatch';
    const flbl = document.getElementById('focusLabel');
    if (flbl) flbl.textContent = timerMode === 'pomodoro' ? (pomodoroPhase === 'focus' ? '🍅 Focus' : '☕ Break') : 'Focus Mode';
}

function enterFocusMode() {
    document.getElementById('focusOverlay').classList.add('active');
    focusModeActive = true;
    
    const fQuote = document.getElementById('focusQuote');
    if (fQuote) {
        fQuote.textContent = `"${QUOTES[Math.floor(Math.random() * QUOTES.length)]}"`;
    }
    
    if (!timerRunning) toggleTimer();
}

function exitFocusMode() {
    document.getElementById('focusOverlay').classList.remove('active');
    focusModeActive = false;
}

// ==================== STATS PAGE ====================
function renderStats() {
    const s = getState();
    const weekData = getWeeklyStudyData();

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h2>📈 Statistik</h2></div>
        <div class="stats-row">
            <div class="stat-card glow-purple"><div class="stat-icon-wrap si-purple">⏱️</div><div><span class="stat-val">${formatDuration(getTotalStudyTime('today'))}</span><span class="stat-lbl">Hari ini</span></div></div>
            <div class="stat-card glow-cyan"><div class="stat-icon-wrap si-cyan">📅</div><div><span class="stat-val">${formatDuration(getTotalStudyTime('week'))}</span><span class="stat-lbl">Minggu ini</span></div></div>
            <div class="stat-card glow-green"><div class="stat-icon-wrap si-green">📊</div><div><span class="stat-val">${formatDuration(getTotalStudyTime('month'))}</span><span class="stat-lbl">Bulan ini</span></div></div>
            <div class="stat-card glow-orange"><div class="stat-icon-wrap si-orange">🏆</div><div><span class="stat-val">${formatDuration(getTotalStudyTime('all'))}</span><span class="stat-lbl">Total</span></div></div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">📊</span> Jam Belajar Minggu Ini</div>
            <canvas id="weekStatsChart"></canvas>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">🟩</span> Activity Heatmap</div>
            <div id="heatmapContainer"></div>
        </div>
        <div style="text-align:center;margin-top:16px">
            <button class="btn btn-primary" onclick="generateShareCard()">📸 Download Share Card</button>
        </div>
    `;

    setTimeout(() => {
        drawBarChart('weekStatsChart', weekData.map(d => ({ label: d.day, value: d.minutes })), { height: 200, unit: 'm' });
        drawHeatmap('heatmapContainer');
    }, 100);
}

// ==================== TARGETS PAGE ====================
function renderTargets() {
    const targets = getAllTargets();

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header">
            <h2>🎯 Target Belajar</h2>
            <button class="btn btn-primary" onclick="showAddTargetModal()">+ Tambah Target</button>
        </div>
        ${targets.length === 0 ? emptyState('🎯', 'Belum ada target', 'Buat target belajar untuk curi start di liburan!') :
        `<div class="card-grid">${targets.map(t => {
            const done = t.subtasks.filter(st => st.done).length;
            const pct = t.subtasks.length > 0 ? Math.round((done / t.subtasks.length) * 100) : 0;
            return `<div class="card card-color-${getCategoryColor(t.category)}" onclick="showTargetDetail('${t.id}')">
                <div class="card-title">${t.title}</div>
                <div class="card-subtitle">${t.category} · ${t.priority} ${t.deadline ? `· ${formatDate(t.deadline)}` : ''}</div>
                <div class="card-progress"><div class="card-progress-fill" style="width:${pct}%;background:var(--green)"></div></div>
                <div class="card-footer"><span>${done}/${t.subtasks.length} subtasks</span><span>${pct}%</span></div>
            </div>`;
        }).join('')}</div>`}
    `;
}

function showAddTargetModal(editId) {
    const existing = editId ? getAllTargets().find(t => t.id === editId) : null;
    const fields = [
        { key: 'title', label: 'Judul Target', type: 'text', required: true, value: existing?.title || '', placeholder: 'Belajar React.js' },
        { key: 'description', label: 'Deskripsi', type: 'textarea', value: existing?.description || '', placeholder: 'Opsional' },
        { type: 'row', fields: [
            { key: 'category', label: 'Kategori', type: 'select', value: existing?.category || 'coding', options: [
                { value: 'coding', label: '💻 Coding' }, { value: 'baca', label: '📖 Baca' },
                { value: 'sertifikasi', label: '📜 Sertifikasi' }, { value: 'lainnya', label: '📌 Lainnya' }
            ]},
            { key: 'priority', label: 'Prioritas', type: 'select', value: existing?.priority || 'medium', options: [
                { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }
            ]}
        ]},
        { key: 'deadline', label: 'Deadline', type: 'date', value: existing?.deadline || '' }
    ];

    const footer = `
        ${editId ? `<button class="btn btn-danger" onclick="deleteTarget('${editId}');closeModal();renderTargets()">Hapus</button>` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveTarget('${editId || ''}')">Simpan</button>
    `;
    openModal(existing ? 'Edit Target' : 'Tambah Target', buildForm(fields), footer);
}

function saveTarget(editId) {
    const keys = ['title', 'description', 'category', 'priority', 'deadline'];
    const vals = {};
    keys.forEach(k => { const el = document.getElementById(`form_${k}`); if (el) vals[k] = el.value; });
    if (!vals.title) { showToast('Judul target wajib diisi!', 'error'); return; }
    if (editId) { updateTarget(editId, vals); showToast('✅ Target diupdate!'); }
    else { addTarget(vals); showToast('✅ Target ditambahkan!', 'success'); }
    closeModal(); renderTargets(); updateSidebar();
}

function showTargetDetail(id) {
    const t = getAllTargets().find(x => x.id === id);
    if (!t) return;
    const done = t.subtasks.filter(st => st.done).length;
    const pct = t.subtasks.length > 0 ? Math.round((done / t.subtasks.length) * 100) : 0;

    const body = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            <span class="badge badge-purple">${t.category}</span>
            ${priorityBadge(t.priority)}
            ${t.deadline ? `<span class="badge badge-cyan">${formatDate(t.deadline)}</span>` : ''}
        </div>
        ${t.description ? `<p style="color:var(--text-secondary);margin-bottom:16px">${t.description}</p>` : ''}
        <div class="progress-track" style="margin-bottom:8px"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-info"><span>${done}/${t.subtasks.length} subtasks</span><span>${pct}%</span></div>
        <div style="margin-top:16px">
            ${t.subtasks.map(st => `
                <label class="check-item">
                    <input type="checkbox" ${st.done ? 'checked' : ''} onchange="toggleSubtask('${id}','${st.id}');showTargetDetail('${id}')">
                    <span class="check-mark"></span>
                    <span class="check-text">${st.text}</span>
                    <button class="btn-icon" style="margin-left:auto;width:28px;height:28px" onclick="event.preventDefault();deleteSubtask('${id}','${st.id}');showTargetDetail('${id}')">✕</button>
                </label>
            `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
            <input type="text" class="form-input" id="newSubtask" placeholder="Tambah subtask..." onkeydown="if(event.key==='Enter'){addSubToTarget('${id}')}">
            <button class="btn btn-primary btn-sm" onclick="addSubToTarget('${id}')">+</button>
        </div>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal();showAddTargetModal('${id}')">✏️ Edit</button>
        <button class="btn btn-danger" onclick="deleteTarget('${id}');closeModal();renderTargets()">🗑️</button>
    `;
    openModal(`🎯 ${t.title}`, body, footer, { wide: true });
}

function addSubToTarget(targetId) {
    const input = document.getElementById('newSubtask');
    if (input && input.value.trim()) {
        addSubtask(targetId, input.value.trim());
        showTargetDetail(targetId);
    }
}

// ==================== NOTES PAGE ====================
function renderNotes() {
    const notes = getAllNotes();
    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h2>📝 Catatan</h2>
            <button class="btn btn-primary" onclick="showAddNoteModal()">+ Tambah Catatan</button>
        </div>
        ${notes.length === 0 ? emptyState('📝', 'Belum ada catatan', 'Klik + untuk membuat catatan pertama!') :
        `<div class="card-grid">${notes.map(n => {
            const course = n.courseId ? getCourse(n.courseId) : null;
            return `<div class="note-card" onclick="showNoteDetail('${n.id}')">
                <div class="note-card-title">${n.title}</div>
                <div class="note-card-preview">${n.content.substring(0, 100)}</div>
                <div class="note-card-date">${course ? `${course.emoji} ${course.name} · ` : ''}${formatDate(n.updatedAt)}</div>
            </div>`;
        }).join('')}</div>`}
    `;
}

function showAddNoteModal(editId) {
    const existing = editId ? getAllNotes().find(n => n.id === editId) : null;
    const courses = getAllCourses();
    const courseOpts = [{ value: '', label: '— Umum —' }, ...courses.map(c => ({ value: c.id, label: `${c.emoji} ${c.name}` }))];

    const fields = [
        { key: 'title', label: 'Judul', type: 'text', value: existing?.title || '', placeholder: 'Judul catatan' },
        { key: 'courseId', label: 'Mata Kuliah', type: 'select', value: existing?.courseId || '', options: courseOpts },
        { key: 'content', label: 'Isi Catatan', type: 'textarea', value: existing?.content || '', placeholder: 'Tulis catatan di sini...', rows: 8 }
    ];
    const footer = `
        ${editId ? `<button class="btn btn-danger" onclick="deleteNote('${editId}');closeModal();renderNotes()">Hapus</button>` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveNote('${editId || ''}')">Simpan</button>
    `;
    openModal(existing ? 'Edit Catatan' : 'Tambah Catatan', buildForm(fields), footer);
}

function saveNote(editId) {
    const keys = ['title', 'courseId', 'content'];
    const vals = {};
    keys.forEach(k => { const el = document.getElementById(`form_${k}`); if (el) vals[k] = el.value; });
    if (!vals.title) vals.title = 'Untitled';
    if (editId) { updateNote(editId, vals); showToast('✅ Catatan diupdate!'); }
    else { addNote(vals); showToast('✅ Catatan ditambahkan!', 'success'); }
    closeModal(); renderNotes();
}

function showNoteDetail(id) {
    const n = getAllNotes().find(x => x.id === id);
    if (!n) return;
    const course = n.courseId ? getCourse(n.courseId) : null;
    const body = `
        ${course ? `<span class="badge badge-purple" style="margin-bottom:12px">${course.emoji} ${course.name}</span>` : ''}
        <div style="white-space:pre-wrap;font-size:.9rem;line-height:1.8;color:var(--text-secondary)">${n.content || 'Belum ada isi'}</div>
        <div style="margin-top:16px;font-size:.75rem;color:var(--text-muted)">Terakhir diubah: ${formatDateTime(n.updatedAt)}</div>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal();showAddNoteModal('${id}')">✏️ Edit</button>
        <button class="btn btn-danger" onclick="deleteNote('${id}');closeModal();renderNotes()">🗑️</button>
    `;
    openModal(`📝 ${n.title}`, body, footer);
}

// ==================== ACHIEVEMENTS PAGE ====================
function renderAchievements() {
    const achs = getAchievements();
    const unlocked = achs.filter(a => a.unlocked).length;

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h2>🏆 Achievements</h2><span class="badge badge-green">${unlocked}/${achs.length} unlocked</span></div>
        <div class="badge-grid">
            ${achs.map(a => `
                <div class="badge-item ${a.unlocked ? 'unlocked' : 'locked'}">
                    <span class="bi-icon">${a.icon}</span>
                    <div class="bi-name">${a.name}</div>
                    <div class="bi-desc">${a.desc}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== SETTINGS PAGE ====================
function renderSettings() {
    const s = getState();
    const p = s.profile;

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h2>⚙️ Settings</h2></div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">👤</span> Profil</div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Nama Panggilan</label><input type="text" class="form-input" id="setName" value="${p.name}" onchange="updateProfile('name',this.value)"></div>
                <div class="form-group"><label class="form-label">Avatar</label><input type="text" class="form-input" id="setAvatar" value="${p.avatar}" onchange="updateProfile('avatar',this.value)" style="width:60px;text-align:center;font-size:1.5rem"></div>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">🎨</span> Tampilan</div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Theme</label>
                    <select class="form-input form-select" onchange="updateProfile('theme',this.value);applyTheme()">
                        <option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>🌙 Dark</option>
                        <option value="light" ${p.theme === 'light' ? 'selected' : ''}>☀️ Light</option>
                        <option value="amoled" ${p.theme === 'amoled' ? 'selected' : ''}>⬛ AMOLED</option>
                        <option value="sakura" ${p.theme === 'sakura' ? 'selected' : ''}>🌸 Sakura Anime</option>
                        <option value="cyberpunk" ${p.theme === 'cyberpunk' ? 'selected' : ''}>🌆 Cyberpunk</option>
                        <option value="hacker" ${p.theme === 'hacker' ? 'selected' : ''}>💻 Hacker Matrix</option>
                        <option value="cozy-room" ${p.theme === 'cozy-room' ? 'selected' : ''}>☕ Lofi Cozy Room</option>
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Accent Color</label><input type="color" class="form-input" value="${p.accentColor === 'purple' ? '#6C5CE7' : p.accentColor}" style="height:40px" onchange="updateProfile('accentColor',this.value)"></div>
            </div>
            <div class="form-row" style="margin-top:12px">
                <div class="form-group"><label class="form-label">Notification Sound (Meme)</label>
                    <select class="form-input form-select" onchange="updateProfile('memeSound',this.value); playMemeSound(this.value, true);">
                        <option value="default" ${p.memeSound === 'default' ? 'selected' : ''}>🔔 Default</option>
                        <option value="yey" ${p.memeSound === 'yey' ? 'selected' : ''}>👧 Yeyyy Kids</option>
                        <option value="wow" ${p.memeSound === 'wow' ? 'selected' : ''}>😲 Anime Wow</option>
                        <option value="jokowi" ${p.memeSound === 'jokowi' ? 'selected' : ''}>👔 Jokowi (Ndak tau)</option>
                        <option value="prabowo" ${p.memeSound === 'prabowo' ? 'selected' : ''}>🎖️ Prabowo (Omon-omon)</option>
                        <option value="bruh" ${p.memeSound === 'bruh' ? 'selected' : ''}>😑 Bruh</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">📅</span> Semester</div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Tanggal Mulai Semester</label><input type="date" class="form-input" value="${p.semesterStart}" onchange="updateProfile('semesterStart',this.value)"></div>
                <div class="form-group"><label class="form-label">Target Jam/Hari (menit)</label><input type="number" class="form-input" value="${p.dailyTarget}" onchange="updateProfile('dailyTarget',parseInt(this.value))"></div>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">🍅</span> Pomodoro</div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Focus (menit)</label><input type="number" class="form-input" value="${p.pomodoroFocus}" onchange="updateProfile('pomodoroFocus',parseInt(this.value))"></div>
                <div class="form-group"><label class="form-label">Break (menit)</label><input type="number" class="form-input" value="${p.pomodoroBreak}" onchange="updateProfile('pomodoroBreak',parseInt(this.value))"></div>
            </div>
            <div class="form-row" style="margin-top:12px">
                <div class="form-group"><label class="form-label">Long Break (menit)</label><input type="number" class="form-input" value="${p.pomodoroLongBreak}" onchange="updateProfile('pomodoroLongBreak',parseInt(this.value))"></div>
                <div class="form-group"><label class="form-label">Rounds</label><input type="number" class="form-input" value="${p.pomodoroRounds}" onchange="updateProfile('pomodoroRounds',parseInt(this.value))"></div>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">🤖</span> AI & Fitur</div>
            <div class="form-group" style="margin-bottom:16px">
                <label class="form-label">Groq API Key <a href="https://console.groq.com/keys" target="_blank" style="color:var(--cyan);font-size:0.8rem;text-transform:none">(Dapatkan GRATIS)</a></label>
                <input type="password" class="form-input" id="setGeminiKey" value="${p.geminiApiKey || ''}" placeholder="gsk_..." onchange="updateProfile('geminiApiKey',this.value)">
                <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block">✅ Gratis tanpa kartu kredit! Daftar di <b>console.groq.com</b> → API Keys → Create Key → paste di sini.</small>
            </div>
            <label class="check-item" style="cursor:pointer">
                <input type="checkbox" ${p.roastMode ? 'checked' : ''} onchange="updateProfile('roastMode',this.checked)">
                <span class="check-mark"></span>
                <span class="check-text">Roast Mode (pesan lucu/menyindir)</span>
            </label>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">☁️</span> Akun & Cloud Sync (Multi-Device)</div>
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px">Simpan data tugas, jadwal, dan IPK Anda secara otomatis di Cloud agar tersinkronisasi di HP & Laptop.</p>
            <div style="display:flex;gap:10px;align-items:center">
                <button class="btn btn-primary" onclick="openAccountModal()">☁️ Kelola Akun & Cloud Sync</button>
                <span class="cloud-sync-badge local" onclick="openAccountModal()">📱 Mode Lokal</span>
            </div>
        </div>
        <div class="glass-card">
            <div class="sec-title"><span class="st-emoji">💾</span> Data</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-primary" onclick="startOnboarding(true)">🚀 Ulang Tour Onboarding</button>
                <button class="btn btn-success" onclick="exportData();showToast('📤 Data exported!')">📤 Export JSON</button>
                <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📥 Import JSON</button>
                <input type="file" id="importFile" accept=".json" style="display:none" onchange="handleImport(event)">
                <button class="btn btn-danger" onclick="showConfirm('Yakin mau reset SEMUA data? Ini tidak bisa dibatalkan!',()=>{resetAllData();location.reload()})">🗑️ Reset Semua</button>
            </div>
        </div>
    `;
}

function updateProfile(key, value) {
    setState(s => { s.profile[key] = value; });
    showToast('✅ Disimpan!');
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (importData(e.target.result)) {
            showToast('📥 Data berhasil di-import!', 'success');
            route();
        } else {
            showToast('❌ File tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ==================== KEYBOARD SHORTCUTS ====================


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
    document.documentElement.style.setProperty('--gradient-main', `linear-gradient(135deg, ${hex}, #00CEFF)`);
    document.documentElement.style.setProperty('--glow-purple', `rgba(${r},${g},${b},0.3)`);
}

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
    container.innerHTML = filteredCommands.map((c, i) => `
        <div class="command-item ${i === commandSelectedIdx ? 'selected' : ''}" onclick="selectCommand(${i})">
            <span class="command-item-icon">${c.icon}</span>
            <div><div class="command-item-label">${c.label}</div><div class="command-item-sub">${c.sub}</div></div>
        </div>
    `).join('');
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


function handleShortcuts(e) {
    // Ctrl+K or Cmd+K = Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
    }
    if (e.key === 'Escape') { closeModal(); closeSearch(); exitFocusMode(); closeCommandPalette(); return; }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
        case '/': e.preventDefault(); openSearch(); break;
        case 'n': case 'N': e.preventDefault(); handleFAB(); break;
        case 't': case 'T': e.preventDefault(); location.hash = 'timer'; break;
        case 'f': case 'F': e.preventDefault(); enterFocusMode(); break;

        case '1': location.hash = 'dashboard'; break;
        case '2': location.hash = 'courses'; break;
        case '3': location.hash = 'schedule'; break;
        case '4': location.hash = 'assignments'; break;
        case '5': location.hash = 'grades'; break;
        case '6': location.hash = 'timer'; break;
        case '7': location.hash = 'stats'; break;
        case '8': location.hash = 'targets'; break;
    }
}

// ==================== HELPERS ====================
function getColorName(hex) {
    const map = { '#6C5CE7': 'purple', '#00CEFF': 'cyan', '#00E09E': 'green', '#FFA502': 'orange', '#FF6B9D': 'pink', '#FF4757': 'red' };
    return map[hex] || 'purple';
}

function getCategoryColor(cat) {
    const map = { coding: 'cyan', baca: 'purple', sertifikasi: 'orange', lainnya: 'pink' };
    return map[cat] || 'purple';
}
/* ==================== AI MENTOR ==================== */
function renderAiMentor() {
    const s = getState();
    if (!s.profile.geminiApiKey) {
        document.getElementById('mainContent').innerHTML = `<div class='empty-state' style='max-width:500px;margin:0 auto;text-align:center'><h2>🤖 AI Mentor Offline</h2><p style='margin-bottom:8px'>Masukkan <b>Groq API Key</b> untuk mengaktifkan fitur ini.</p><p style='font-size:0.85rem;color:var(--text-muted);margin-bottom:16px'>Gratis 100% tanpa kartu kredit! Daftar di <a href='https://console.groq.com/keys' target='_blank' style='color:var(--cyan)'>console.groq.com</a>, klik <b>Create API Key</b>, lalu paste di Settings.</p><button class='btn btn-primary' onclick='location.hash="settings"'>⚙️ Buka Settings</button></div>`;
        return;
    }
    const chatsHTML = (s.aiChats || []).map(c => `<div class='chat-bubble ${c.role === 'user' ? 'user' : 'ai'}'>${c.text}</div>`).join('');
    document.getElementById('mainContent').innerHTML = `<div class='page-header' style='display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px'><div><h2>🤖 AI Study Buddy</h2><p style='color:var(--text-muted);font-size:0.9rem'>Mentor virtual yang kenal banget sama progress belajarmu. (Sarkas Mode: ON)</p></div>${(s.aiChats||[]).length > 0 ? `<button class='btn btn-secondary btn-sm' onclick='clearAiChat()' style='flex-shrink:0'>🗑️ Reset Chat</button>` : ''}</div><div class='chat-container'><div class='chat-messages' id='chatMessages'>${chatsHTML}</div><div class='chat-input-area'><input type='text' class='chat-input' id='aiInput' placeholder='Curhat soal tugas atau minta di-roast...' onkeydown='if(event.key==="Enter") sendAiMessage()'><button class='chat-send-btn' onclick='sendAiMessage()'>➤</button></div></div>`;
    setTimeout(() => { const cm = document.getElementById('chatMessages'); if (cm) cm.scrollTop = cm.scrollHeight; }, 50);
}

function clearAiChat() {
    if (!confirm('Hapus semua riwayat chat dengan AI? Tidak bisa dikembalikan!')) return;
    const s = getState();
    s.aiChats = [];
    saveState(s);
    renderAiMentor();
    showToast('Chat direset! 🗑️', 'success');
}

async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const s = getState();
    if (!s.aiChats) s.aiChats = [];
    s.aiChats.push({ role: 'user', text });
    saveState(s);
    renderAiMentor();
    
    const cm = document.getElementById('chatMessages');
    if (cm) cm.innerHTML += `<div class='chat-bubble ai' id='aiTyping'><div class='typing-indicator'><div class='typing-dot'></div><div class='typing-dot'></div><div class='typing-dot'></div></div></div>`;
    if (cm) cm.scrollTop = cm.scrollHeight;
    
    const overdue = getOverdueAssignments().length;
    const pending = s.assignments.filter(a => a.status !== 'done').length;
    const systemPrompt = `Kamu AI Study Buddy sarkas tapi diam-diam motivasi. Jawab SINGKAT max 3 kalimat, gaya Gen Z gaul (emoji secukupnya). Data: ${s.profile.name}, Level ${s.level}, Streak ${s.streak}hr, Tugas telat: ${overdue}, belum selesai: ${pending}.`;
    
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s.profile.geminiApiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                max_tokens: 150
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const reply = data.choices[0].message.content;
        s.aiChats.push({ role: 'ai', text: reply });
        saveState(s);
        renderAiMentor();
    } catch (e) {
        document.getElementById('aiTyping')?.remove();
        showToast('API Error: ' + e.message, 'error');
    }
}

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
    } else if (theme === 'cozy-room') {
        startCozyEffect();
    }
}

function startSakuraEffect() {
    if (window.sakuraInterval) clearInterval(window.sakuraInterval);
    window.sakuraInterval = setInterval(() => {
        if (document.body.getAttribute('data-theme') !== 'sakura') {
            clearInterval(window.sakuraInterval);
            return;
        }
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
    
    return `
        <div class="pet-container">
            <div class="pet-avatar" onclick="showToast('Rawr!', 'success')">${stageData.emoji}</div>
            <div class="pet-info">
                <div class="pet-name">${pet.name} (${stageData.name})</div>
                <div class="pet-exp-wrap">
                    <div class="pet-exp-bar" style="width: ${pct}%"></div>
                </div>
                <div class="pet-exp-text">${pet.exp} / ${stageData.maxExp} EXP</div>
            </div>
        </div>
    `;
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

/* ==================== SOUNDBOARD MEMES ==================== */
const MEME_SOUNDS = {
    default: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
    yey: 'https://www.myinstants.com/media/sounds/yey.mp3',
    wow: 'https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3',
    jokowi: 'https://www.myinstants.com/media/sounds/jokowi-ngerap.mp3',
    prabowo: 'https://www.myinstants.com/media/sounds/anies-berlebihan-prabowo.mp3',
    bruh: 'https://www.myinstants.com/media/sounds/movie_1.mp3'
};

function playMemeSound(overrideSound = null, test = false) {
    const s = getState();
    // Only play if notifications are enabled OR if it's a direct test from settings
    if (!test && s.profile.notifications === false) return; 
    
    const soundKey = overrideSound || s.profile.memeSound || 'default';
    const url = MEME_SOUNDS[soundKey] || MEME_SOUNDS.default;
    
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Audio play blocked:", e));
}

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

/* ==================== ACCOUNT & CLOUD SYNC MODAL ==================== */
async function openAccountModal() {
    const user = typeof getCloudUser === 'function' ? await getCloudUser() : null;
    let modalBody = '';

    if (user) {
        modalBody = `
            <div class="account-modal-card">
                <img src="${user.user_metadata?.avatar_url || 'assets/icons/icon-192.png'}" class="account-avatar" alt="Avatar">
                <h3 style="margin-bottom:4px">${user.user_metadata?.full_name || 'Pengguna Cloud'}</h3>
                <p style="color:var(--text-muted);font-size:0.85rem">${user.email}</p>
                <div style="margin-top:14px" class="cloud-sync-badge synced">☁️ Tersinkronisasi ke Cloud</div>
            </div>
            <div style="display:flex;gap:10px;margin-top:16px">
                <button class="btn btn-secondary" style="flex:1" onclick="if(typeof syncStateToCloud==='function')syncStateToCloud(getState());showToast('🔄 Memulai sinkronisasi...','info')">🔄 Sync Sekarang</button>
                <button class="btn btn-danger" style="flex:1" onclick="logoutCloud()">🚪 Logout</button>
            </div>
        `;
    } else {
        modalBody = `
            <div class="account-modal-card">
                <div style="font-size:2.5rem;margin-bottom:8px">☁️</div>
                <h3>Hubungkan Akun Cloud</h3>
                <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">Simpan data tugas, nilai, dan IPK Anda secara otomatis ke Cloud agar bisa diakses dari HP & Laptop mana saja.</p>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px">
                <button class="account-btn-google" onclick="loginWithGoogle()">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/></svg>
                    Masuk dengan Google
                </button>

                <div style="text-align:center;color:var(--text-muted);font-size:0.75rem;margin:4px 0">- ATAU MAGIC LINK EMAIL -</div>

                <div style="display:flex;gap:8px">
                    <input type="email" id="cloudEmailInput" class="form-input" placeholder="nama@email.com" style="flex:1">
                    <button class="btn btn-primary" onclick="const e=document.getElementById('cloudEmailInput').value; if(e) loginWithEmail(e); else showToast('Isi alamat email dulu!','warning');">Kirim Link</button>
                </div>
            </div>
        `;
    }

    openModal('☁️ Akun & Cloud Sync', modalBody);
}

/* ==================== INTERACTIVE ONBOARDING WIZARD ==================== */
let obCurrentStep = 1;
let obState = {
    nickname: 'LofiScholar_24',
    avatar: '👾',
    avatarName: 'Pixel Alien',
    mode: 'semester',
    theme: 'cozy-room',
    rainAudio: true,
    lofiAudio: true
};

const OB_AVATARS = [
    { icon: '🪐', name: 'Cosmo Explorer' },
    { icon: '👾', name: 'Pixel Alien' },
    { icon: '🦉', name: 'Midnight Owl' },
    { icon: '🦊', name: 'Sly Scholar' },
    { icon: '☕', name: 'Coffee Cozy' },
    { icon: '🌙', name: 'Dream Weaver' }
];

function startOnboarding(force = false) {
    const s = getState();
    if (s.profile.name && s.profile.name !== 'Bro') {
        obState.nickname = s.profile.name;
    }
    if (s.profile.avatar) {
        obState.avatar = s.profile.avatar;
    }
    if (s.mode) obState.mode = s.mode;
    if (s.profile.theme) obState.theme = s.profile.theme;

    obCurrentStep = 1;
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.style.setProperty('display', 'flex', 'important');
        renderOnboardingStep();
        if (force) showToast('🚀 Onboarding Wizard dibuka!', 'info');
    } else {
        console.error('onboardingOverlay element not found!');
    }
}
window.startOnboarding = startOnboarding;

function renderOnboardingStep() {
    const container = document.getElementById('onboardingContainer');
    if (!container) return;

    let rightContent = '';

    // Step Stepper Pills (Matching Figma 100%)
    const stepperHTML = `
        <div class="onboarding-stepper-header">
            <div class="ob-step-pill ${obCurrentStep === 1 ? 'active' : (obCurrentStep > 1 ? 'done' : '')}">
                <span class="ob-step-num">1</span> Identity
            </div>
            <div class="ob-step-line ${obCurrentStep > 1 ? 'active' : ''}"></div>
            <div class="ob-step-pill ${obCurrentStep === 2 ? 'active' : (obCurrentStep > 2 ? 'done' : '')}">
                <span class="ob-step-num">2</span> Study Mode
            </div>
            <div class="ob-step-line ${obCurrentStep > 2 ? 'active' : ''}"></div>
            <div class="ob-step-pill ${obCurrentStep === 3 ? 'active' : (obCurrentStep > 3 ? 'done' : '')}">
                <span class="ob-step-num">3</span> Aesthetics
            </div>
            <div class="ob-step-line ${obCurrentStep > 3 ? 'active' : ''}"></div>
            <div class="ob-step-pill ${obCurrentStep === 4 ? 'active' : ''}">
                <span class="ob-step-num">4</span> Ready
            </div>
        </div>
    `;

    if (obCurrentStep === 1) {
        rightContent = `
            <div>
                ${stepperHTML}
                <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:8px">Create Your Scholar Profile</h2>
                <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:20px">Pick a custom gamified moniker and choose your starting pixel avatar.</p>

                <div class="form-group" style="margin-bottom:20px">
                    <label class="form-label" style="font-weight:700">Student Nickname <span style="color:var(--cyan);font-size:0.75rem;float:right">Required</span></label>
                    <input type="text" class="form-input" id="obNicknameInput" value="${obState.nickname}" placeholder="e.g. LofiScholar_24" oninput="obState.nickname = this.value" style="font-size:1rem;padding:12px 16px;border-color:rgba(0,206,255,0.4)">
                </div>

                <div class="form-group">
                    <label class="form-label" style="font-weight:700">Select Your Avatar</label>
                    <div class="ob-avatar-grid">
                        ${OB_AVATARS.map(a => `
                            <div class="ob-avatar-item ${obState.avatar === a.icon ? 'active' : ''}" onclick="selectObAvatar('${a.icon}', '${a.name}')">
                                <span class="ob-avatar-icon">${a.icon}</span>
                                <span class="ob-avatar-name">${a.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-top:24px">
                <button class="ob-btn-primary" onclick="nextObStep()">Next Step ➔</button>
            </div>
        `;
    } else if (obCurrentStep === 2) {
        rightContent = `
            <div>
                ${stepperHTML}
                <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:8px">Pick Your Mode</h2>
                <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:20px">Choose how StudyHub configures your dash. You can switch this at any time.</p>

                <div class="ob-mode-card ${obState.mode === 'semester' ? 'active' : ''}" onclick="selectObMode('semester')">
                    <div class="ob-mode-header">
                        <div class="ob-mode-title">📚 Semester Mode</div>
                        <div class="ob-mode-badge">Highly Recommended</div>
                    </div>
                    <ul style="color:var(--text-secondary);font-size:0.8rem;padding-left:18px;line-height:1.7">
                        <li>Track Courses & Live Attendance</li>
                        <li>Automated GPA Targets & Trackers</li>
                        <li>Syllabus & Assignment Countdown alerts</li>
                    </ul>
                </div>

                <div class="ob-mode-card ${obState.mode === 'liburan' ? 'active' : ''}" onclick="selectObMode('liburan')">
                    <div class="ob-mode-header">
                        <div class="ob-mode-title">🏖️ Vacation Mode</div>
                        <div class="ob-mode-badge" style="color:var(--text-muted)">Self-paced study</div>
                    </div>
                    <ul style="color:var(--text-secondary);font-size:0.8rem;padding-left:18px;line-height:1.7">
                        <li>Pre-study & independent study trackers</li>
                        <li>Custom personal learning milestones</li>
                        <li>Cozy daily planner & habit streak builder</li>
                    </ul>
                </div>
            </div>

            <div style="display:flex;gap:12px;margin-top:24px">
                <button class="btn btn-secondary" onclick="prevObStep()" style="padding:14px 20px">← Back</button>
                <button class="ob-btn-primary" style="flex:1" onclick="nextObStep()">Next Step ➔</button>
            </div>
        `;
    } else if (obCurrentStep === 3) {
        rightContent = `
            <div>
                ${stepperHTML}
                <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:8px">Customize Your Vibe</h2>
                <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:20px">Configure your aesthetic study workspace. These options adapt visual elements and sounds.</p>

                <div class="form-group" style="margin-bottom:20px">
                    <label class="form-label" style="font-weight:700">Aesthetic Themes</label>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px">
                        <button class="btn btn-sm ${obState.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" onclick="selectObTheme('dark')">🌙 Dark</button>
                        <button class="btn btn-sm ${obState.theme === 'cozy-room' ? 'btn-primary' : 'btn-secondary'}" onclick="selectObTheme('cozy-room')">☕ Cozy Room</button>
                        <button class="btn btn-sm ${obState.theme === 'sakura' ? 'btn-primary' : 'btn-secondary'}" onclick="selectObTheme('sakura')">🌸 Sakura</button>
                        <button class="btn btn-sm ${obState.theme === 'cyberpunk' ? 'btn-primary' : 'btn-secondary'}" onclick="selectObTheme('cyberpunk')">🌆 Cyberpunk</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" style="font-weight:700">Background Lofi Audio</label>
                    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
                        <label class="check-item" style="background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:12px;border:1px solid var(--border)">
                            <input type="checkbox" ${obState.rainAudio ? 'checked' : ''} onchange="obState.rainAudio = this.checked">
                            <span class="check-mark"></span>
                            <span class="check-text" style="font-weight:600">🌧️ Cozy Rain Ambient</span>
                        </label>
                        <label class="check-item" style="background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:12px;border:1px solid var(--border)">
                            <input type="checkbox" ${obState.lofiAudio ? 'checked' : ''} onchange="obState.lofiAudio = this.checked">
                            <span class="check-mark"></span>
                            <span class="check-text" style="font-weight:600">🎵 Lofi Radio Beats</span>
                        </label>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:12px;margin-top:24px">
                <button class="btn btn-secondary" onclick="prevObStep()" style="padding:14px 20px">← Back</button>
                <button class="ob-btn-primary" style="flex:1" onclick="nextObStep()">Next Step ➔</button>
            </div>
        `;
    } else if (obCurrentStep === 4) {
        rightContent = `
            <div>
                ${stepperHTML}
                <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:8px">You're All Set! 🎉</h2>
                <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:20px">Your aesthetic space is prepared. Here's a quick recap of your choices.</p>

                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:16px">
                    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
                        <span style="font-size:2.5rem">${obState.avatar}</span>
                        <div>
                            <h3 style="font-size:1.1rem;font-weight:900">${obState.nickname || 'LofiScholar_24'}</h3>
                            <span style="color:var(--cyan);font-size:0.75rem;font-weight:700">StudyHub Level 1</span>
                        </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:10px;font-size:0.85rem">
                        <div style="display:flex;justify-content:space-between">
                            <span style="color:var(--text-muted)">Active Track Mode</span>
                            <span style="font-weight:700;color:var(--text-primary)">${obState.mode === 'semester' ? 'Semester Mode' : 'Vacation Mode'}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between">
                            <span style="color:var(--text-muted)">Aesthetic Theme</span>
                            <span style="font-weight:700;color:var(--cyan)">${obState.theme.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div style="background:var(--purple-soft);border:1px solid rgba(108,92,231,0.4);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:20px">
                    <span style="font-size:1.5rem">🎗️</span>
                    <div>
                        <div style="font-weight:800;font-size:0.88rem;color:#ffb86c">XP Multiplier Active (1.5x)</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary)">Starting off, you'll earn 1.5x study XP and unlock your digital lofi bookshelves!</div>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:12px;margin-top:16px">
                <button class="btn btn-secondary" onclick="prevObStep()" style="padding:14px 20px">← Back</button>
                <button class="ob-btn-primary" style="flex:1" onclick="finishOnboarding()">🚀 Start Studying</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="onboarding-desktop-grid">
            <!-- LEFT PREVIEW PANEL -->
            <div class="onboarding-left-panel">
                <div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:1.3rem">📚</span>
                        <h2 style="font-size:1.2rem;font-weight:900;background:var(--gradient-main);-webkit-background-clip:text;-webkit-text-fill-color:transparent">StudyHub</h2>
                    </div>
                    
                    <div style="margin-top:16px">
                        <h3 style="font-size:1rem;font-weight:800">StudyHub Workspace Preview</h3>
                        <p style="font-size:0.75rem;color:var(--text-muted)">Your personalized aesthetic workspace. Earn XP to level up your scholar profile.</p>
                    </div>

                    <div class="onboarding-left-img-wrap">
                        <img src="assets/images/lofi_cozy_room.png" class="onboarding-left-img" alt="Lofi Room">
                        <div class="ob-chip-badge">🎗️ XP Multiplier Active (1.5x)</div>
                        <div class="ob-chip-badge purple">🌧️ Rain & Lofi Radio</div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:14px;padding:12px 14px;margin-top:12px">
                    <div style="font-size:0.65rem;color:var(--cyan);font-weight:800;letter-spacing:1px;text-transform:uppercase">NOW PLAYING</div>
                    <div style="font-weight:700;font-size:0.85rem;margin-top:2px">Cozy Moonlight Beats</div>
                </div>
            </div>

            <!-- RIGHT STEPPER PANEL -->
            <div class="onboarding-right-panel">
                ${rightContent}
            </div>
        </div>
    `;
}

function selectObAvatar(avatar, name) {
    obState.avatar = avatar;
    obState.avatarName = name;
    renderOnboardingStep();
}

function selectObMode(mode) {
    obState.mode = mode;
    renderOnboardingStep();
}

function selectObTheme(theme) {
    obState.theme = theme;
    document.body.setAttribute('data-theme', theme);
    renderOnboardingStep();
}

function nextObStep() {
    if (obCurrentStep === 1) {
        const input = document.getElementById('obNicknameInput');
        if (input && input.value.trim()) {
            obState.nickname = input.value.trim();
        }
    }
    if (obCurrentStep < 4) {
        obCurrentStep++;
        renderOnboardingStep();
    }
}

function prevObStep() {
    if (obCurrentStep > 1) {
        obCurrentStep--;
        renderOnboardingStep();
    }
}

function finishOnboarding() {
    const s = getState();
    s.onboarded = true;
    s.profile.name = obState.nickname || 'LofiScholar_24';
    s.profile.avatar = obState.avatar || '👾';
    s.profile.theme = obState.theme || 'cozy-room';
    s.mode = obState.mode || 'semester';

    saveState(s);
    applyTheme();
    updateSidebar();

    // Toggle Audio if selected
    if (obState.rainAudio && typeof toggleAmbient === 'function' && !ambientPlaying) {
        toggleAmbient();
    }
    if (obState.lofiAudio && typeof toggleLofi === 'function' && !lofiPlaying) {
        toggleLofi();
    }

    // Award +50 XP Welcome Bonus
    if (typeof addXP === 'function') {
        addXP(50, 'Selamat Datang Pengguna Baru!');
    }

    // Hide Overlay & Confetti
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';

    if (typeof triggerConfetti === 'function') triggerConfetti();
    showToast('🎉 Onboarding Selesai! +50 XP diklaim.', 'success');

    route();
}

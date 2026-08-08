/* ============================================================
   StudyHub v2 — Gamification System
   XP, Levels, Achievements, Streak, Daily Challenges, Roast
   ============================================================ */

// ==================== XP REWARDS ====================
const XP_REWARDS = {
    COMPLETE_SUBTASK: 5,
    COMPLETE_ASSIGNMENT: 30,
    COMPLETE_POMODORO: 15,
    STUDY_HOUR: 20,
    DAILY_LOGIN: 10,
    STREAK_7: 50,
    STREAK_14: 100,
    STREAK_30: 200,
    COMPLETE_COURSE: 100,
    DAILY_CHALLENGE: 25
};

// ==================== LEVELS ====================
const LEVELS = [
    { level: 1, name: 'Mahasiswa Baru', icon: '🐣', xpRequired: 0 },
    { level: 2, name: 'Kutu Buku Pemula', icon: '📖', xpRequired: 100 },
    { level: 3, name: 'Mulai Paham', icon: '🧠', xpRequired: 300 },
    { level: 4, name: 'Lumayan Pinter', icon: '💡', xpRequired: 600 },
    { level: 5, name: 'On Fire', icon: '🔥', xpRequired: 1000 },
    { level: 6, name: 'Unstoppable', icon: '⚡', xpRequired: 1500 },
    { level: 7, name: "Dean's List", icon: '🏆', xpRequired: 2200 },
    { level: 8, name: 'Cum Laude Material', icon: '🎓', xpRequired: 3000 },
    { level: 9, name: 'IPK 4.0 Energy', icon: '👑', xpRequired: 4000 },
    { level: 10, name: 'Legend', icon: '🌟', xpRequired: 5000 }
];

// ==================== ACHIEVEMENTS ====================
const ACHIEVEMENTS = [
    {
        id: 'first_blood', name: 'First Blood', icon: '🎯',
        desc: 'Selesaikan task pertama',
        check: (s) => {
            const doneAssignments = s.assignments.filter(a => a.status === 'done').length;
            const doneSubtasks = s.targets.reduce((sum, t) => sum + t.subtasks.filter(st => st.done).length, 0);
            return doneAssignments > 0 || doneSubtasks > 0;
        }
    },
    {
        id: 'on_fire', name: 'On Fire', icon: '🔥',
        desc: '7 hari streak',
        check: (s) => s.streak >= 7
    },
    {
        id: 'volcanic', name: 'Volcanic', icon: '🌋',
        desc: '30 hari streak',
        check: (s) => s.streak >= 30
    },
    {
        id: 'night_owl', name: 'Night Owl', icon: '🌙',
        desc: 'Belajar jam 12-4 pagi',
        check: () => { const h = new Date().getHours(); return h >= 0 && h < 4; }
    },
    {
        id: 'early_bird', name: 'Early Bird', icon: '🌅',
        desc: 'Belajar sebelum jam 7 pagi',
        check: () => { const h = new Date().getHours(); return h >= 5 && h < 7; }
    },
    {
        id: 'speedrunner', name: 'Speedrunner', icon: '⚡',
        desc: 'Selesai tugas 3 hari sebelum deadline',
        check: (s) => s.assignments.some(a => {
            if (a.status !== 'done' || !a.completedAt || !a.deadline) return false;
            const completed = new Date(a.completedAt);
            const deadline = new Date(a.deadline);
            return (deadline - completed) / 86400000 >= 3;
        })
    },
    {
        id: 'bookworm', name: 'Bookworm', icon: '📚',
        desc: 'Belajar > 5 jam dalam 1 hari',
        check: (s) => {
            const today = new Date().toISOString().slice(0, 10);
            const todayLogs = s.timerLogs.filter(l => l.date === today);
            const totalSec = todayLogs.reduce((sum, l) => sum + l.duration, 0);
            return totalSec >= 18000;
        }
    },
    {
        id: 'clean_slate', name: 'Clean Slate', icon: '🧹',
        desc: 'Semua tugas selesai (0 pending)',
        check: (s) => s.assignments.length > 0 && s.assignments.every(a => a.status === 'done')
    },
    {
        id: 'perfectionist', name: 'Perfectionist', icon: '💎',
        desc: 'Nilai A di 1 matkul',
        check: (s) => s.courses.some(c => {
            const fg = calculateFinalGrade(c.id);
            return fg !== null && fg >= 85;
        })
    },
    {
        id: 'semester_champion', name: 'Semester Champion', icon: '🏅',
        desc: 'Semua matkul complete',
        check: (s) => {
            if (s.courses.length === 0) return false;
            return s.courses.every(c => {
                const assignments = s.assignments.filter(a => a.courseId === c.id);
                return assignments.length > 0 && assignments.every(a => a.status === 'done');
            });
        }
    },
    {
        id: 'pomodoro_master', name: 'Pomodoro Master', icon: '🍅',
        desc: '50 sesi Pomodoro selesai',
        check: (s) => s.timerLogs.filter(l => l.type === 'pomodoro').length >= 50
    },
    {
        id: 'lofi_listener', name: 'Lofi Listener', icon: '🎵',
        desc: '10 jam belajar total',
        check: (s) => {
            const total = s.timerLogs.reduce((sum, l) => sum + l.duration, 0);
            return total >= 36000;
        }
    },
    {
        id: 'nerd_alert', name: 'Nerd Alert', icon: '🤓',
        desc: 'Level 10 tercapai',
        check: (s) => s.level >= 10
    }
];

// ==================== DAILY CHALLENGES ====================
const DAILY_CHALLENGES = [
    { text: 'Selesaikan 3 task hari ini', xp: 25 },
    { text: 'Belajar 1 jam tanpa jeda', xp: 30 },
    { text: 'Buat 2 catatan baru', xp: 15 },
    { text: 'Selesai 1 sesi Pomodoro', xp: 20 },
    { text: 'Selesaikan tugas paling lama pending', xp: 40 },
    { text: 'Belajar 30 menit sebelum jam 10', xp: 25 },
    { text: 'Review catatan 1 mata kuliah', xp: 20 },
    { text: 'Tambah 3 subtask baru ke target', xp: 15 },
    { text: 'Belajar 2 jam hari ini', xp: 35 },
    { text: 'Selesaikan 5 subtask', xp: 30 },
    { text: 'Buka app sebelum jam 9 pagi', xp: 15 },
    { text: 'Input nilai di 1 matkul', xp: 20 },
    { text: 'Buat rencana harian untuk besok', xp: 15 },
    { text: 'Selesai 2 sesi Pomodoro', xp: 35 }
];

// ==================== QUOTES ====================
const QUOTES = [
    'Orang sukses bukan yang nggak pernah gagal, tapi yang nggak berhenti mencoba.',
    'Jangan bandingkan chapter 1 kamu dengan chapter 20 orang lain.',
    'Discipline is doing what needs to be done, even when you don\'t feel like it.',
    'Your future self will thank you for the work you put in today.',
    'Belajar itu investasi terbaik untuk diri sendiri.',
    'Satu langkah kecil setiap hari lebih baik dari nol langkah.',
    'The expert in anything was once a beginner.',
    'Jangan tunggu motivated, just start.',
    'Progress is progress, no matter how small.',
    'Hard work beats talent when talent doesn\'t work hard.',
    'Nilai nggak menentukan masa depan, tapi usaha iya.',
    'Kamu lebih kuat dari yang kamu pikir.',
    'Bukan soal seberapa cepat, tapi seberapa konsisten.',
    'Deadline adalah motivasi terbaik. 😂',
    'Kalau nggak sekarang, kapan? Kalau bukan kamu, siapa?',
    'Gagal itu biasa, nyerah itu pilihan.',
    'Hustle in silence, let your IPK make the noise.',
    'Nggak ada shortcut untuk tempat yang worth it.',
    'Hari ini susah, besok lebih susah, lusa indah. 🌅',
    'Skill itu dibeli pakai waktu, bukan uang.'
];

// ==================== XP FUNCTIONS ====================
function addXP(amount, reason = '') {
    const s = getState();
    const oldLevel = s.level;
    s.xp += amount;
    const newLevelObj = getCurrentLevel(s.xp);
    s.level = newLevelObj.level;
    saveState(s);

    const leveled = s.level > oldLevel;
    if (leveled) {
        setTimeout(() => launchConfetti(), 100);
    }
    
    if (typeof playMemeSound === 'function' && amount > 0) {
        playMemeSound();
    }
    
    if (typeof updateSidebar === 'function') {
        updateSidebar();
    }
    
    return { leveled, oldLevel, newLevel: s.level, totalXP: s.xp, added: amount, reason };
}

function getCurrentLevel(xp) {
    let current = LEVELS[0];
    for (const lvl of LEVELS) {
        if (xp >= lvl.xpRequired) current = lvl;
    }
    return current;
}

function getXPProgress() {
    const s = getState();
    const current = getCurrentLevel(s.xp);
    const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
    const next = LEVELS[nextIdx] || null;
    const xpInLevel = s.xp - current.xpRequired;
    const xpNeeded = next ? (next.xpRequired - current.xpRequired) : 1;
    return {
        currentXP: s.xp,
        level: current,
        next: next,
        progress: xpInLevel,
        required: xpNeeded,
        percent: Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))
    };
}

// ==================== STREAK ====================
function checkAndUpdateStreak() {
    const s = getState();
    const today = new Date().toISOString().slice(0, 10);

    if (s.lastActiveDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (s.lastActiveDate === yesterday) {
        s.streak = (s.streak || 0) + 1;
        s.streakFreezeAvailable = true;
    } else if (s.lastActiveDate && s.lastActiveDate !== today) {
        const daysDiff = Math.floor((new Date(today) - new Date(s.lastActiveDate)) / 86400000);
        if (daysDiff === 2 && s.streakFreezeAvailable) {
            s.streak = (s.streak || 0) + 1;
            s.streakFreezeAvailable = false;
        } else {
            s.streak = 1;
            s.streakFreezeAvailable = true;
        }
    } else {
        s.streak = 1;
    }

    s.lastActiveDate = today;
    addXP(XP_REWARDS.DAILY_LOGIN, 'Daily login');

    // Streak milestones
    if (s.streak === 7 && !s.achievements.includes('streak_7_claimed')) {
        addXP(XP_REWARDS.STREAK_7, '7 hari streak!');
        s.achievements.push('streak_7_claimed');
    }
    if (s.streak === 14 && !s.achievements.includes('streak_14_claimed')) {
        addXP(XP_REWARDS.STREAK_14, '14 hari streak!');
        s.achievements.push('streak_14_claimed');
    }
    if (s.streak === 30 && !s.achievements.includes('streak_30_claimed')) {
        addXP(XP_REWARDS.STREAK_30, '30 hari streak!');
        s.achievements.push('streak_30_claimed');
    }

    saveState(s);
}

function useStreakFreeze() {
    const s = getState();
    if (s.streakFreezeAvailable) {
        s.streakFreezeAvailable = false;
        saveState(s);
        return true;
    }
    return false;
}

function getStreakInfo() {
    const s = getState();
    return { streak: s.streak || 0, freezeAvailable: s.streakFreezeAvailable, lastActive: s.lastActiveDate };
}

// ==================== ACHIEVEMENTS ====================
function checkAchievements() {
    const s = getState();
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!s.achievements.includes(ach.id)) {
            try {
                if (ach.check(s)) {
                    s.achievements.push(ach.id);
                    newlyUnlocked.push(ach);
                }
            } catch (e) { /* skip failed checks */ }
        }
    });
    if (newlyUnlocked.length > 0) saveState(s);
    return newlyUnlocked;
}

function getAchievements() {
    const s = getState();
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: s.achievements.includes(ach.id)
    }));
}

function triggerTimeBasedAchievements() {
    const h = new Date().getHours();
    const s = getState();
    const todayLogs = s.timerLogs.filter(l => l.date === new Date().toISOString().slice(0, 10));
    if (todayLogs.length > 0 || s.heatmapData[new Date().toISOString().slice(0, 10)]) {
        checkAchievements();
    }
}

// ==================== DAILY CHALLENGE ====================
function getDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const idx = seed % DAILY_CHALLENGES.length;
    const s = getState();
    return {
        ...DAILY_CHALLENGES[idx],
        completed: s.dailyChallengeDate === today && s.dailyChallengeCompleted
    };
}

function completeDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    const challenge = getDailyChallenge();
    setState(s => {
        s.dailyChallengeDate = today;
        s.dailyChallengeCompleted = true;
    });
    addXP(challenge.xp, 'Daily Challenge');
    return challenge.xp;
}

function isDailyChallengeCompleted() {
    const s = getState();
    const today = new Date().toISOString().slice(0, 10);
    return s.dailyChallengeDate === today && s.dailyChallengeCompleted;
}

// ==================== ROAST & MOTIVATION ====================
function getRoastMessage() {
    const s = getState();
    const h = new Date().getHours();
    const today = new Date().toISOString().slice(0, 10);
    const overdue = s.assignments.filter(a => a.status !== 'done' && new Date(a.deadline) < new Date()).length;
    const todayLogs = s.timerLogs.filter(l => l.date === today);
    const todayMinutes = todayLogs.reduce((sum, l) => sum + l.duration, 0) / 60;

    if (!s.profile.roastMode) {
        return { message: getGreeting().text, emoji: getGreeting().emoji, type: 'greeting' };
    }

    // Last active check
    if (s.lastActiveDate) {
        const daysSince = Math.floor((new Date(today) - new Date(s.lastActiveDate)) / 86400000);
        if (daysSince >= 3) {
            return { message: `Kirain kamu udah DO... ${daysSince} hari ngilang!`, emoji: '😂', type: 'roast' };
        }
    }

    // Time-based
    if (h >= 2 && h < 5) {
        return { message: 'Begadang lagi? Besok zombie di kelas...', emoji: '🧟', type: 'roast' };
    }

    // Overdue
    if (overdue > 0) {
        return { message: `Ada ${overdue} tugas telat. Dosen nggak nunggu, Bro!`, emoji: '⚠️', type: 'roast' };
    }

    // Study hours
    if (todayMinutes > 180) {
        return { message: 'Touch grass juga kali, Bro...', emoji: '🌿', type: 'roast' };
    }

    // Streak based
    if (s.streak >= 7) {
        return { message: `${s.streak} hari berturut! Kamu monster!`, emoji: '🔥', type: 'motivasi' };
    }

    if (s.streak === 0 && s.lastActiveDate) {
        return { message: 'Streak kamu putus. Mau jadi apa?', emoji: '💀', type: 'roast' };
    }

    // All tasks done
    const pending = s.assignments.filter(a => a.status !== 'done').length;
    if (s.assignments.length > 0 && pending === 0) {
        return { message: 'Semua beres! Kamu layak jadi dosen!', emoji: '🎓', type: 'motivasi' };
    }

    // Default
    return { message: 'Tumben rajin! Lanjutkan!', emoji: '💪', type: 'motivasi' };
}

function getGreeting() {
    const h = new Date().getHours();
    const name = getState().profile.name || 'Bro';
    if (h >= 5 && h < 9) return { text: `Selamat Pagi, ${name}!`, emoji: '☀️' };
    if (h >= 9 && h < 15) return { text: `Selamat Siang, ${name}!`, emoji: '🌤️' };
    if (h >= 15 && h < 18) return { text: `Selamat Sore, ${name}!`, emoji: '🌅' };
    if (h >= 18) return { text: `Selamat Malam, ${name}!`, emoji: '🌙' };
    return { text: `Masih melek, ${name}?`, emoji: '🦉' };
}

function getQuoteOfTheDay() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return QUOTES[seed % QUOTES.length];
}

// ==================== CONFETTI ====================
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const colors = ['#6C5CE7', '#00CEFF', '#00E09E', '#FFA502', '#FF6B9D', '#FECA57', '#FF4757'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 4,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 4 + 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.y < canvas.height + 50) {
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08;
                p.rotation += p.rotSpeed;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / 120);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });
        frame++;
        if (alive && frame < 150) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }
    animate();
}

/* ============================================================
   StudyHub v2 — Data Layer
   CRUD operations, localStorage, validation, utilities
   ============================================================ */

// ==================== DEFAULT STATE ====================
const DEFAULT_STATE = {
    profile: {
        name: 'Bro',
        avatar: '🎓',
        semesterStart: '2025-09-01',
        dailyTarget: 120,
        pomodoroFocus: 25,
        pomodoroBreak: 5,
        pomodoroLongBreak: 15,
        pomodoroRounds: 4,
        roastMode: true,
        notifications: false,
        theme: 'dark',
        accentColor: 'purple',
        defaultMode: 'liburan',
        defaultAmbient: 'silent',
        geminiApiKey: '',
        memeSound: 'default'
    },
    mode: 'liburan',
    aiChats: [],
    courses: [],
    schedules: [],
    assignments: [],
    targets: [],
    dailyPlans: {},
    preStudy: [],
    notes: [],
    timerLogs: [],
    xp: 0,
    level: 1,
    streak: 0,
    streakFreezeAvailable: true,
    lastActiveDate: null,
    achievements: [],
    dailyChallengeDate: null,
    dailyChallengeCompleted: false,
    heatmapData: {},
    pet: { stage: 0, exp: 0, name: 'CyberPet', status: 'happy' }
};

const STORAGE_KEY = 'studyhub_data';
let _state = null;

// ==================== UUID ====================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ==================== STATE MANAGEMENT ====================
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            _state = Object.assign({}, DEFAULT_STATE, parsed);
            _state.profile = Object.assign({}, DEFAULT_STATE.profile, parsed.profile || {});
            _state.pet = Object.assign({}, DEFAULT_STATE.pet, parsed.pet || {});
        } else {
            _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    } catch (e) {
        console.error('Failed to load state:', e);
        _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    return _state;
}

function saveState(s) {
    if (s) _state = s;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

function getState() {
    if (!_state) loadState();
    return _state;
}

function setState(updater) {
    const s = getState();
    updater(s);
    saveState(s);
    return s;
}

// ==================== COURSES CRUD ====================
function addCourse({ name, code = '', sks = 3, type = 'teori', dosen = '', ruangan = '', color = '#6C5CE7', emoji = '📚', gradeWeights = null }) {
    const weights = gradeWeights || { tugas: 20, kuis: 10, uts: 30, uas: 30, proyek: 10 };
    const course = {
        id: generateId(),
        name, code, sks, type, dosen, ruangan, color, emoji,
        gradeWeights: weights,
        grades: {},
        createdAt: new Date().toISOString()
    };
    setState(s => s.courses.push(course));
    return course;
}

function updateCourse(id, updates) {
    setState(s => {
        const idx = s.courses.findIndex(c => c.id === id);
        if (idx !== -1) Object.assign(s.courses[idx], updates);
    });
}

function deleteCourse(id) {
    setState(s => {
        s.courses = s.courses.filter(c => c.id !== id);
        s.schedules = s.schedules.filter(sc => sc.courseId !== id);
        s.assignments = s.assignments.filter(a => a.courseId !== id);
        s.notes = s.notes.filter(n => n.courseId !== id);
        s.timerLogs = s.timerLogs.filter(t => t.courseId !== id);
    });
}

function getCourse(id) {
    return getState().courses.find(c => c.id === id) || null;
}

function getAllCourses(filter) {
    const courses = getState().courses;
    if (!filter) return courses;
    return courses.filter(c => c.type === filter);
}

// ==================== SCHEDULES CRUD ====================
function addSchedule({ courseId, day, startTime, endTime, room = '', type = 'kuliah' }) {
    const schedule = { id: generateId(), courseId, day, startTime, endTime, room, type };
    setState(s => s.schedules.push(schedule));
    return schedule;
}

function updateSchedule(id, updates) {
    setState(s => {
        const idx = s.schedules.findIndex(sc => sc.id === id);
        if (idx !== -1) Object.assign(s.schedules[idx], updates);
    });
}

function deleteSchedule(id) {
    setState(s => { s.schedules = s.schedules.filter(sc => sc.id !== id); });
}

function getSchedulesByDay(day) {
    return getState().schedules
        .filter(sc => sc.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getTodaySchedules() {
    const dayName = getDayName(new Date());
    return getSchedulesByDay(dayName);
}

function getAllSchedules() {
    return getState().schedules;
}

// ==================== ASSIGNMENTS CRUD ====================
function addAssignment({ title, courseId = '', description = '', deadline, priority = 'medium', link = '' }) {
    const assignment = {
        id: generateId(), title, courseId, description, deadline, priority, link,
        status: 'todo',
        xpReward: priority === 'high' ? 40 : priority === 'medium' ? 30 : 20,
        completedAt: null,
        createdAt: new Date().toISOString()
    };
    setState(s => s.assignments.push(assignment));
    return assignment;
}

function updateAssignment(id, updates) {
    setState(s => {
        const idx = s.assignments.findIndex(a => a.id === id);
        if (idx !== -1) Object.assign(s.assignments[idx], updates);
    });
}

function deleteAssignment(id) {
    setState(s => { s.assignments = s.assignments.filter(a => a.id !== id); });
}

function completeAssignment(id) {
    let xpReward = 0;
    setState(s => {
        const a = s.assignments.find(x => x.id === id);
        if (a && a.status !== 'done') {
            a.status = 'done';
            a.completedAt = new Date().toISOString();
            xpReward = a.xpReward || 30;
        }
    });
    if (xpReward > 0 && typeof addXP === 'function') {
        addXP(xpReward, 'Menyelesaikan tugas');
    }
    recordActivity(1, 0);
    return xpReward;
}

function getAllAssignments(filters = {}) {
    let list = getState().assignments;
    if (filters.courseId) list = list.filter(a => a.courseId === filters.courseId);
    if (filters.status) list = list.filter(a => a.status === filters.status);
    if (filters.priority) list = list.filter(a => a.priority === filters.priority);
    return list;
}

function getOverdueAssignments() {
    const now = new Date();
    return getState().assignments.filter(a => a.status !== 'done' && new Date(a.deadline) < now);
}

function getUpcomingAssignments(days = 3) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 86400000);
    return getState().assignments.filter(a => {
        if (a.status === 'done') return false;
        const d = new Date(a.deadline);
        return d >= now && d <= future;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

// ==================== TARGETS CRUD (Liburan) ====================
function addTarget({ title, description = '', category = 'coding', priority = 'medium', deadline = '', subtasks = [] }) {
    const target = {
        id: generateId(), title, description, category, priority, deadline,
        subtasks: subtasks.map(t => typeof t === 'string' ? { id: generateId(), text: t, done: false } : t),
        xpReward: 50,
        createdAt: new Date().toISOString()
    };
    setState(s => s.targets.push(target));
    return target;
}

function updateTarget(id, updates) {
    setState(s => {
        const idx = s.targets.findIndex(t => t.id === id);
        if (idx !== -1) Object.assign(s.targets[idx], updates);
    });
}

function deleteTarget(id) {
    setState(s => { s.targets = s.targets.filter(t => t.id !== id); });
}

function toggleSubtask(targetId, subtaskId) {
    let wasDone = false;
    setState(s => {
        const t = s.targets.find(x => x.id === targetId);
        if (t) {
            const st = t.subtasks.find(x => x.id === subtaskId);
            if (st) {
                st.done = !st.done;
                wasDone = st.done;
            }
        }
    });
    if (wasDone) {
        if (typeof addXP === 'function') addXP(5, 'Subtask selesai');
        recordActivity(1, 0);
    }
}

function addSubtask(targetId, text) {
    const sub = { id: generateId(), text, done: false };
    setState(s => {
        const t = s.targets.find(x => x.id === targetId);
        if (t) t.subtasks.push(sub);
    });
    return sub;
}

function deleteSubtask(targetId, subtaskId) {
    setState(s => {
        const t = s.targets.find(x => x.id === targetId);
        if (t) t.subtasks = t.subtasks.filter(st => st.id !== subtaskId);
    });
}

function getAllTargets() { return getState().targets; }

// ==================== DAILY PLANS (Liburan) ====================
function getDailyPlan(date) {
    return getState().dailyPlans[date] || [];
}

function addActivity(date, { title, startTime, endTime, category = 'belajar' }) {
    const act = { id: generateId(), title, startTime, endTime, category, done: false };
    setState(s => {
        if (!s.dailyPlans[date]) s.dailyPlans[date] = [];
        s.dailyPlans[date].push(act);
    });
    return act;
}

function updateActivity(date, activityId, updates) {
    setState(s => {
        const plan = s.dailyPlans[date];
        if (plan) {
            const idx = plan.findIndex(a => a.id === activityId);
            if (idx !== -1) Object.assign(plan[idx], updates);
        }
    });
}

function deleteActivity(date, activityId) {
    setState(s => {
        if (s.dailyPlans[date]) {
            s.dailyPlans[date] = s.dailyPlans[date].filter(a => a.id !== activityId);
        }
    });
}

function toggleActivity(date, activityId) {
    setState(s => {
        const plan = s.dailyPlans[date];
        if (plan) {
            const a = plan.find(x => x.id === activityId);
            if (a) a.done = !a.done;
        }
    });
}

// ==================== PRE-STUDY (Liburan) ====================
function addPreStudyItem({ courseTitle, items = [], links = [] }) {
    const ps = {
        id: generateId(), courseTitle,
        items: items.map(i => typeof i === 'string' ? { text: i, done: false } : i),
        links,
        createdAt: new Date().toISOString()
    };
    setState(s => s.preStudy.push(ps));
    return ps;
}

function updatePreStudyItem(id, updates) {
    setState(s => {
        const idx = s.preStudy.findIndex(p => p.id === id);
        if (idx !== -1) Object.assign(s.preStudy[idx], updates);
    });
}

function deletePreStudyItem(id) {
    setState(s => { s.preStudy = s.preStudy.filter(p => p.id !== id); });
}

function togglePreStudyCheckItem(preStudyId, itemIndex) {
    setState(s => {
        const ps = s.preStudy.find(p => p.id === preStudyId);
        if (ps && ps.items[itemIndex] !== undefined) {
            ps.items[itemIndex].done = !ps.items[itemIndex].done;
        }
    });
}

// ==================== NOTES ====================
function addNote({ title = 'Untitled', content = '', courseId = '' }) {
    const note = {
        id: generateId(), title, content, courseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    setState(s => s.notes.push(note));
    return note;
}

function updateNote(id, updates) {
    setState(s => {
        const idx = s.notes.findIndex(n => n.id === id);
        if (idx !== -1) {
            Object.assign(s.notes[idx], updates);
            s.notes[idx].updatedAt = new Date().toISOString();
        }
    });
}

function deleteNote(id) {
    setState(s => { s.notes = s.notes.filter(n => n.id !== id); });
}

function getNotesByCourse(courseId) {
    return getState().notes.filter(n => n.courseId === courseId);
}

function getAllNotes() { return getState().notes; }

function searchNotes(query) {
    const q = query.toLowerCase();
    return getState().notes.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
}

// ==================== GRADES & IPK ====================
function updateGrade(courseId, gradeKey, value) {
    setState(s => {
        const c = s.courses.find(x => x.id === courseId);
        if (c) {
            if (!c.grades) c.grades = {};
            c.grades[gradeKey] = parseFloat(value) || 0;
        }
    });
}

function calculateFinalGrade(courseId) {
    const c = getCourse(courseId);
    if (!c || !c.grades || !c.gradeWeights) return null;
    let total = 0, weightSum = 0;
    for (const [key, weight] of Object.entries(c.gradeWeights)) {
        if (c.grades[key] !== undefined && c.grades[key] !== null) {
            total += c.grades[key] * (weight / 100);
            weightSum += weight;
        }
    }
    return weightSum > 0 ? (total / weightSum) * 100 : null;
}

function gradeToLetter(score) {
    if (score === null || score === undefined) return { letter: '-', weight: 0 };
    if (score >= 85) return { letter: 'A', weight: 4.0 };
    if (score >= 80) return { letter: 'AB', weight: 3.5 };
    if (score >= 70) return { letter: 'B', weight: 3.0 };
    if (score >= 65) return { letter: 'BC', weight: 2.5 };
    if (score >= 55) return { letter: 'C', weight: 2.0 };
    if (score >= 45) return { letter: 'D', weight: 1.0 };
    return { letter: 'E', weight: 0 };
}

function calculateIPK() {
    const courses = getState().courses;
    let totalWeight = 0, totalSKS = 0;
    courses.forEach(c => {
        const fg = calculateFinalGrade(c.id);
        if (fg !== null) {
            const { weight } = gradeToLetter(fg);
            totalWeight += weight * c.sks;
            totalSKS += c.sks;
        }
    });
    return totalSKS > 0 ? (totalWeight / totalSKS) : 0;
}

function simulateIPK(courseId, gradeKey, value) {
    const s = getState();
    const courses = JSON.parse(JSON.stringify(s.courses));
    const c = courses.find(x => x.id === courseId);
    if (c) {
        if (!c.grades) c.grades = {};
        c.grades[gradeKey] = parseFloat(value) || 0;
    }
    let totalWeight = 0, totalSKS = 0;
    courses.forEach(course => {
        let total = 0, weightSum = 0;
        if (course.grades && course.gradeWeights) {
            for (const [k, w] of Object.entries(course.gradeWeights)) {
                if (course.grades[k] !== undefined && course.grades[k] !== null) {
                    total += course.grades[k] * (w / 100);
                    weightSum += w;
                }
            }
        }
        if (weightSum > 0) {
            const fg = (total / weightSum) * 100;
            const { weight } = gradeToLetter(fg);
            totalWeight += weight * course.sks;
            totalSKS += course.sks;
        }
    });
    return totalSKS > 0 ? (totalWeight / totalSKS) : 0;
}

// ==================== TIMER LOGS ====================
function addTimerLog({ courseId = '', targetId = '', duration, type = 'stopwatch', date = null }) {
    const log = {
        id: generateId(), courseId, targetId, duration, type,
        date: date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
    };
    setState(s => s.timerLogs.push(log));
    recordActivity(0, Math.floor(duration / 60));
    return log;
}

function getTimerLogsByDate(date) {
    return getState().timerLogs.filter(l => l.date === date);
}

function getTimerLogsByCourse(courseId) {
    return getState().timerLogs.filter(l => l.courseId === courseId);
}

function getTotalStudyTime(period = 'all') {
    const logs = getState().timerLogs;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    let filtered = logs;
    if (period === 'today') {
        filtered = logs.filter(l => l.date === today);
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
        filtered = logs.filter(l => l.date >= weekAgo);
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
        filtered = logs.filter(l => l.date >= monthAgo);
    }
    return filtered.reduce((sum, l) => sum + l.duration, 0);
}

function getStudyTimePerCourse() {
    const result = {};
    getState().timerLogs.forEach(l => {
        if (l.courseId) {
            result[l.courseId] = (result[l.courseId] || 0) + l.duration;
        }
    });
    return result;
}

function getWeeklyStudyData() {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLogs = getState().timerLogs.filter(l => l.date === dateStr);
        const totalMin = dayLogs.reduce((s, l) => s + l.duration, 0) / 60;
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        data.push({ date: dateStr, day: dayNames[d.getDay()], minutes: Math.round(totalMin) });
    }
    return data;
}

// ==================== HEATMAP ====================
function recordActivity(tasksCompleted = 0, minutesStudied = 0) {
    const today = new Date().toISOString().slice(0, 10);
    setState(s => {
        if (!s.heatmapData) s.heatmapData = {};
        if (!s.heatmapData[today]) s.heatmapData[today] = { tasks: 0, minutes: 0 };
        s.heatmapData[today].tasks += tasksCompleted;
        s.heatmapData[today].minutes += minutesStudied;
    });
}

function getHeatmapData() {
    return getState().heatmapData || {};
}

// ==================== EXPORT / IMPORT / RESET ====================
function exportData() {
    const data = JSON.stringify(getState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyhub_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        _state = Object.assign({}, DEFAULT_STATE, parsed);
        _state.profile = Object.assign({}, DEFAULT_STATE.profile, parsed.profile || {});
        saveState();
        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
}

function resetAllData() {
    _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
}

// ==================== GLOBAL SEARCH ====================
function globalSearch(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];
    const s = getState();

    s.courses.forEach(c => {
        if (c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))) {
            results.push({ type: 'course', id: c.id, title: c.name, subtitle: c.code || c.type });
        }
    });
    s.assignments.forEach(a => {
        if (a.title.toLowerCase().includes(q)) {
            const course = s.courses.find(c => c.id === a.courseId);
            results.push({ type: 'assignment', id: a.id, title: a.title, subtitle: course ? course.name : 'Tugas' });
        }
    });
    s.targets.forEach(t => {
        if (t.title.toLowerCase().includes(q)) {
            results.push({ type: 'target', id: t.id, title: t.title, subtitle: t.category });
        }
    });
    s.notes.forEach(n => {
        if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
            results.push({ type: 'note', id: n.id, title: n.title, subtitle: 'Catatan' });
        }
    });
    return results;
}

// ==================== UTILITIES ====================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return m + 'm';
    return h + 'h ' + m + 'm';
}

function formatTimerDisplay(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / 86400000);
}

function isToday(dateStr) {
    return dateStr === new Date().toISOString().slice(0, 10);
}

function getDayName(date) {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return days[(date instanceof Date ? date : new Date(date)).getDay()];
}

function getDayNameCapitalized(date) {
    const d = getDayName(date);
    return d.charAt(0).toUpperCase() + d.slice(1);
}

function getDeadlineStatus(deadline) {
    if (!deadline) return 'safe';
    const days = daysUntil(deadline);
    if (days < 0) return 'overdue';
    if (days <= 1) return 'urgent';
    if (days <= 3) return 'soon';
    return 'safe';
}

function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

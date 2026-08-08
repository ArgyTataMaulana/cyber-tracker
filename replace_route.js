const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const oldRoute = `function route() {
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
}`;

const newRoute = `function route() {
    const hash = location.hash.slice(1) || 'dashboard';
    currentPage = hash;
    updateNavActive(hash);
    const main = document.getElementById('mainContent');
    
    main.style.opacity = '0';
    main.style.transform = 'translateY(10px)';
    main.style.transition = 'opacity 0.2s, transform 0.2s';
    
    setTimeout(() => {
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
        
        // Inject staggered animations
        const targets = main.querySelectorAll('.stat-card, .glass-card, .card, .kanban-col, .note-card, .table-wrap, .timer-section, .pet-container');
        targets.forEach(el => el.classList.add('animate-in'));
        
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
}`;

appJs = appJs.replace(oldRoute, newRoute);

fs.writeFileSync('app.js', appJs, 'utf8');

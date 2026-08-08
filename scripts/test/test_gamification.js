const fs = require('fs');
const vm = require('vm');

const dom = {
    localStorage: { store: {}, getItem(k) { return this.store[k] || null; }, setItem(k, v) { this.store[k] = v; } },
    console: console,
    Date: Date,
    Math: Math,
    Object: Object,
    JSON: JSON,
    parseFloat: parseFloat,
    parseInt: parseInt,
    String: String,
    document: { getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }) },
    setTimeout: setTimeout,
    window: { innerWidth: 1024, innerHeight: 768 }
};

const context = vm.createContext(dom);

const path = require('path');

const dataCode = fs.readFileSync(path.join(__dirname, '../../js/data.js'), 'utf8');
const gamificationCode = fs.readFileSync(path.join(__dirname, '../../js/gamification.js'), 'utf8');

vm.runInContext(dataCode, context);
vm.runInContext('function showToast(msg){} function updateSidebar(){}', context); // Mock UI functions
vm.runInContext(gamificationCode, context);

function runTests() {
    let passed = 0; let failed = 0;
    function assert(condition, message) { if (condition) { console.log('✅ ' + message); passed++; } else { console.error('❌ ' + message); failed++; } }

    try {
        context.loadState();
        
        // Test 1: addXP and level up
        const xpRes1 = context.addXP(50, 'Test 1');
        assert(xpRes1.leveled === false && context.getState().xp === 50, 'addXP adds xp correctly');
        
        const xpRes2 = context.addXP(60, 'Test 2');
        assert(xpRes2.leveled === true && xpRes2.newLevel === 2 && context.getState().level === 2, 'addXP triggers level up correctly (100xp req)');
        
        // Test 2: streak
        context.getState().lastActiveDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10); // Yesterday
        const streakInfo = context.checkAndUpdateStreak();
        assert(context.getState().streak === 1, 'checkAndUpdateStreak increments streak if active yesterday');
        
        // Test 3: achievements
        const newAchs = context.checkAchievements();
        // Since we did First Blood (task?) we might unlock something, but let's just check length
        assert(Array.isArray(newAchs), 'checkAchievements returns array');
        
        console.log(`\nGamification Test Summary: ${passed} passed, ${failed} failed`);
    } catch (e) {
        console.error('Test Execution Error:', e);
    }
}
runTests();

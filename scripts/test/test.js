const fs = require('fs');
const vm = require('vm');

// Mock browser environment
const dom = {
    localStorage: {
        store: {},
        getItem(k) { return this.store[k] || null; },
        setItem(k, v) { this.store[k] = v; }
    },
    console: console,
    Date: Date,
    Math: Math,
    Object: Object,
    JSON: JSON,
    parseFloat: parseFloat,
    parseInt: parseInt,
    String: String,
    Blob: class Blob {},
    URL: { createObjectURL: () => 'mock-url', revokeObjectURL: () => {} },
    document: { createElement: () => ({ click: () => {} }) }
};

const context = vm.createContext(dom);

const path = require('path');

// Load data.js
const dataCode = fs.readFileSync(path.join(__dirname, '../../js/data.js'), 'utf8');
vm.runInContext(dataCode, context);

// Test Suite
function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log('✅ ' + message);
            passed++;
        } else {
            console.error('❌ ' + message);
            failed++;
        }
    }

    try {
        // Test 1: loadState
        const state = context.loadState();
        assert(state && state.profile.name === 'Bro', 'loadState initializes default state');

        // Test 2: addCourse
        const course = context.addCourse({ name: 'Web Dev', code: 'IF101', sks: 3 });
        assert(course && course.id, 'addCourse returns course with id');
        assert(context.getState().courses.length === 1, 'addCourse adds to state');

        // Test 3: updateCourse
        context.updateCourse(course.id, { name: 'Advanced Web Dev' });
        assert(context.getCourse(course.id).name === 'Advanced Web Dev', 'updateCourse modifies course');

        // Test 4: deleteCourse
        context.deleteCourse(course.id);
        assert(context.getState().courses.length === 0, 'deleteCourse removes course');

        // Test 5: addAssignment
        const c2 = context.addCourse({ name: 'Mobile Dev', sks: 3 });
        const a1 = context.addAssignment({ title: 'Tugas 1', courseId: c2.id, priority: 'high' });
        assert(a1 && a1.status === 'todo', 'addAssignment creates todo assignment');

        // Test 6: completeAssignment
        context.completeAssignment(a1.id);
        const updatedA1 = context.getAllAssignments().find(a => a.id === a1.id);
        assert(updatedA1.status === 'done', 'completeAssignment sets status to done');

        // Test 7: calculateFinalGrade
        context.updateGrade(c2.id, 'tugas', 90);
        context.updateGrade(c2.id, 'uts', 80);
        context.updateGrade(c2.id, 'uas', 85);
        context.updateGrade(c2.id, 'kuis', 100);
        context.updateGrade(c2.id, 'proyek', 90);
        const fg = context.calculateFinalGrade(c2.id);
        assert(fg === 86.5, 'calculateFinalGrade calculates correct weighted sum');

        // Test 8: calculateIPK
        const ipk = context.calculateIPK();
        assert(ipk === 4.0, 'calculateIPK calculates correct IPK (86.5 is A -> 4.0)');

        // Test 9: globalSearch
        const results = context.globalSearch('tugas');
        assert(results.length > 0 && results[0].type === 'assignment', 'globalSearch finds assignment');
        
        console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    } catch (e) {
        console.error('Test Execution Error:', e);
    }
}

runTests();

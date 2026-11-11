const db = require('../src/config/db');
const { getStudentAcademicFacts, processAdvisingIntent } = require('../src/services/advisingEngine');

async function runTests() {
  console.log('====================================================');
  console.log('    EduBot Automated Verification & Logic Tests     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Database connection and course count
    const [courses] = await db.query('SELECT COUNT(*) as count FROM courses');
    assert(courses[0].count >= 15, `Curriculum has 15+ courses (found: ${courses[0].count})`);

    // 2. Test Student 1 (Tanvir Hasan - student_id: 1)
    const factsStudent1 = await getStudentAcademicFacts(1);
    assert(factsStudent1 !== null, 'Student 1 profile loaded from database');
    assert(factsStudent1.cgpa === 3.82, `Student 1 CGPA is 3.82 (computed: ${factsStudent1.cgpa})`);
    assert(factsStudent1.completedCredits === 60.0, `Student 1 completed credits is 60.0 (computed: ${factsStudent1.completedCredits})`);
    assert(factsStudent1.remainingCredits === 80.0, `Student 1 remaining credits is 80.0 (computed: ${factsStudent1.remainingCredits})`);

    // Test Prerequisite for Student 1:
    // 1. CSE301 is currently in-progress
    const prereqCheck1 = await processAdvisingIntent('Can I take CSE301?', factsStudent1);
    assert(prereqCheck1.intent === 'PREREQUISITE_CHECK', 'Intent detected as PREREQUISITE_CHECK');
    assert(prereqCheck1.facts.canTake === false && factsStudent1.inProgressCourses.some(c => c.code === 'CSE301'), 'Student 1 is already currently taking CSE301');

    // 2. CSE303 prereq is CSE201. Student 1 passed CSE201 and has not taken CSE303
    const prereqCheck1b = await processAdvisingIntent('Can I take CSE303?', factsStudent1);
    assert(prereqCheck1b.facts.canTake === true, 'Student 1 is eligible to take CSE303 (passed prerequisite CSE201)');

    // 3. Test Student 3 (Rakibul Islam - student_id: 3)
    // Student 3 failed CSE104 with Grade F. CSE202 requires CSE104!
    const factsStudent3 = await getStudentAcademicFacts(3);
    assert(factsStudent3 !== null, 'Student 3 profile loaded from database');
    assert(factsStudent3.failedCourses.some(c => c.code === 'CSE104'), 'Student 3 record contains failed CSE104');

    const prereqCheck3 = await processAdvisingIntent('Can I take CSE202?', factsStudent3);
    assert(prereqCheck3.intent === 'PREREQUISITE_CHECK', 'Intent detected as PREREQUISITE_CHECK');
    assert(prereqCheck3.facts.canTake === false, 'Student 3 is NOT eligible to take CSE202 because CSE104 was failed');
    console.log(`         Deterministic Explanation: "${prereqCheck3.facts.reason}"`);

    // 4. Test Intent: Credits Query
    const creditQuery = await processAdvisingIntent('How many credits do I have remaining?', factsStudent1);
    assert(creditQuery.intent === 'CREDITS_QUERY', 'Intent detected as CREDITS_QUERY');
    assert(creditQuery.facts.remainingCredits === 80.0, 'Remaining credits correctly returned as 80.0');

    // 5. Test Intent: Escalation Request
    const escalationQuery = await processAdvisingIntent('I want to talk to a human advisor', factsStudent1);
    assert(escalationQuery.intent === 'ESCALATE', 'Intent detected as ESCALATE');
    assert(escalationQuery.isEscalation === true, 'Escalation flag is true');

    // 6. Test Intent: Book Advising Session
    const bookingQuery = await processAdvisingIntent('Book an advising session', factsStudent1);
    assert(bookingQuery.intent === 'BOOK_SESSION', 'Intent detected as BOOK_SESSION');
    assert(Array.isArray(bookingQuery.facts.availableSlots), 'Available slots returned as an array');

    console.log('\n====================================================');
    console.log(`  Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();

const db = require('../config/db');

const DEGREE_CREDIT_REQUIREMENT = 140.0;

/**
 * Fetch full academic facts for a student from MySQL database
 */
async function getStudentAcademicFacts(studentId) {
  // 1. Profile
  const [profiles] = await db.query(
    `SELECT sp.*, u.name, u.email
     FROM student_profiles sp
     JOIN users u ON sp.user_id = u.user_id
     WHERE sp.student_id = ?`,
    [studentId]
  );

  if (profiles.length === 0) {
    return null;
  }
  const profile = profiles[0];

  // 2. All enrollments
  const [enrollments] = await db.query(
    `SELECT er.grade, er.semester, c.course_id, c.code, c.title, c.credits, c.level, c.prerequisite_code, c.instructor_name, c.instructor_designation
     FROM enrollment_records er
     JOIN courses c ON er.course_id = c.course_id
     WHERE er.student_id = ?`,
    [studentId]
  );

  // Categorize courses
  const completedCourses = [];
  const inProgressCourses = [];
  const failedCourses = [];
  const passedCourseCodes = new Set();

  for (const record of enrollments) {
    if (record.grade === 'IP' || record.grade === 'In Progress') {
      inProgressCourses.push(record);
    } else if (record.grade === 'F') {
      failedCourses.push(record);
    } else {
      // Any passing grade (A+, A, A-, B+, B, B-, C+, C, D)
      completedCourses.push(record);
      passedCourseCodes.add(record.code.toUpperCase());
    }
  }

  // 3. All courses in curriculum
  const [allCourses] = await db.query('SELECT * FROM courses ORDER BY level ASC, code ASC');

  // 4. Compute eligible courses (prerequisite satisfied & not already passed)
  const eligibleCourses = [];
  for (const course of allCourses) {
    const code = course.code.toUpperCase();
    if (passedCourseCodes.has(code)) continue;

    // Prerequisite check
    if (!course.prerequisite_code || passedCourseCodes.has(course.prerequisite_code.toUpperCase())) {
      const isCurrentlyTaking = inProgressCourses.some(c => c.code.toUpperCase() === code);
      eligibleCourses.push({
        ...course,
        currentlyTaking: isCurrentlyTaking
      });
    }
  }

  const completedCredits = parseFloat(profile.completed_credits) || 0.0;
  const remainingCredits = Math.max(0, DEGREE_CREDIT_REQUIREMENT - completedCredits);

  return {
    studentId,
    name: profile.name,
    cgpa: parseFloat(profile.cgpa) || 0.0,
    semester: profile.semester,
    department: profile.department,
    studentRegNo: profile.student_reg_no,
    completedCredits,
    totalRequiredCredits: DEGREE_CREDIT_REQUIREMENT,
    remainingCredits,
    completedCourses,
    passedCourseCodes: Array.from(passedCourseCodes),
    inProgressCourses,
    failedCourses,
    allCourses,
    eligibleCourses
  };
}

/**
 * Determine user intent and compute deterministic facts
 */
async function processAdvisingIntent(message, studentAcademicFacts) {
  const msgLower = message.toLowerCase().trim();

  // Pattern for course codes like CSE301, CSE 301, cse-301
  const courseCodeMatch = msgLower.match(/\b([a-z]{3})\s*[-_]?\s*(\d{3})\b/i);
  const detectedCourseCode = courseCodeMatch
    ? `${courseCodeMatch[1].toUpperCase()}${courseCodeMatch[2]}`
    : null;

  // 1. Human Advisor Escalation Intent
  const escalationKeywords = [
    'talk to human', 'human advisor', 'speak to advisor', 'escalate',
    'talk to teacher', 'speak to human', 'need human', 'human agent',
    'advisor help', 'connect me to an advisor', 'connect to advisor'
  ];
  if (escalationKeywords.some(keyword => msgLower.includes(keyword))) {
    return {
      intent: 'ESCALATE',
      isEscalation: true,
      facts: {
        reason: 'Student explicitly requested to speak with a human advisor.',
        studentName: studentAcademicFacts.name,
        cgpa: studentAcademicFacts.cgpa,
        semester: studentAcademicFacts.semester
      }
    };
  }

  // 2. Book Advising Session Intent
  const bookingKeywords = [
    'book an advising session', 'book advising', 'schedule advising',
    'advising appointment', 'book slot', 'available slots', 'meet advisor',
    'book session'
  ];
  if (bookingKeywords.some(keyword => msgLower.includes(keyword))) {
    const [slots] = await db.query(
      `SELECT s.slot_id, s.advisor_id, s.start_time, s.end_time, u.name AS advisor_name, u.email AS advisor_email,
              CASE 
                WHEN u.email = 'admin@gstu.edu.bd' THEN 'Professor & Department Head'
                WHEN u.email = 'dr.rahman@gstu.edu.bd' THEN 'Associate Professor & Academic Advisor'
                WHEN u.email = 'prof.fatima@gstu.edu.bd' THEN 'Professor & Academic Advisor'
                ELSE 'Faculty Member'
              END AS advisor_designation
       FROM advisor_slots s
       JOIN users u ON s.advisor_id = u.user_id
       WHERE s.is_booked = 0 AND s.start_time > NOW()
       ORDER BY s.start_time ASC
       LIMIT 10`
    );

    return {
      intent: 'BOOK_SESSION',
      actionType: 'SLOTS_LIST',
      facts: {
        availableSlots: slots,
        message: slots.length > 0
          ? `Found ${slots.length} available advising slots.`
          : 'No available advisor slots found at the moment.'
      }
    };
  }

  // 3. Prerequisite Check Intent
  // e.g., "can I take CSE301?", "is CSE102 prerequisite for CSE104?", "check prerequisite for CSE202"
  const isPrereqQuery =
    (detectedCourseCode && (
      msgLower.includes('can i take') ||
      msgLower.includes('can i enroll') ||
      msgLower.includes('eligible for') ||
      msgLower.includes('prerequisite') ||
      msgLower.includes('prereq') ||
      msgLower.includes('requirement for')
    )) ||
    (detectedCourseCode && msgLower.includes('can i'));

  if (isPrereqQuery && detectedCourseCode) {
    const course = studentAcademicFacts.allCourses.find(c => c.code.toUpperCase() === detectedCourseCode);

    if (!course) {
      return {
        intent: 'PREREQUISITE_CHECK',
        facts: {
          found: false,
          courseCode: detectedCourseCode,
          explanation: `Course code ${detectedCourseCode} was not found in the GSTU CSE curriculum.`
        }
      };
    }

    const alreadyPassed = studentAcademicFacts.passedCourseCodes.includes(detectedCourseCode);
    const currentlyTaking = studentAcademicFacts.inProgressCourses.some(c => c.code.toUpperCase() === detectedCourseCode);
    const prereqCode = course.prerequisite_code ? course.prerequisite_code.toUpperCase() : null;
    const prereqPassed = !prereqCode || studentAcademicFacts.passedCourseCodes.includes(prereqCode);

    let canTake = false;
    let reason = '';

    if (alreadyPassed) {
      canTake = false;
      reason = `You have already completed and passed ${detectedCourseCode}. You do not need to take it again unless attempting a grade improvement.`;
    } else if (currentlyTaking) {
      canTake = false;
      reason = `You are currently enrolled in ${detectedCourseCode} this semester.`;
    } else if (!prereqCode) {
      canTake = true;
      reason = `${detectedCourseCode} (${course.title}) has NO prerequisite. You are fully eligible to take it!`;
    } else if (prereqPassed) {
      canTake = true;
      reason = `Yes! The prerequisite for ${detectedCourseCode} is ${prereqCode}, which you have successfully completed. You are eligible to register!`;
    } else {
      canTake = false;
      // Check if student failed it or hasn't taken it
      const failedPrereq = studentAcademicFacts.failedCourses.find(c => c.code.toUpperCase() === prereqCode);
      if (failedPrereq) {
        reason = `No, you cannot take ${detectedCourseCode} yet. Its prerequisite is ${prereqCode}, which you previously did not pass (Grade: F). You must retake and pass ${prereqCode} first.`;
      } else {
        reason = `No, you cannot take ${detectedCourseCode} yet because you have not completed its prerequisite course ${prereqCode}. You must complete ${prereqCode} first.`;
      }
    }

    return {
      intent: 'PREREQUISITE_CHECK',
      facts: {
        found: true,
        courseCode: detectedCourseCode,
        courseTitle: course.title,
        credits: course.credits,
        prerequisiteCode: prereqCode,
        canTake,
        reason
      }
    };
  }

  // 4. CGPA Query Intent
  const cgpaKeywords = ['cgpa', 'my gpa', 'current gpa', 'what is my score', 'grade point'];
  if (cgpaKeywords.some(keyword => msgLower.includes(keyword)) && !msgLower.includes('how to improve')) {
    return {
      intent: 'CGPA_QUERY',
      facts: {
        cgpa: studentAcademicFacts.cgpa,
        semester: studentAcademicFacts.semester,
        completedCredits: studentAcademicFacts.completedCredits,
        studentName: studentAcademicFacts.name,
        evaluation: studentAcademicFacts.cgpa >= 3.75 ? 'First Class with Distinction' :
                    studentAcademicFacts.cgpa >= 3.0 ? 'Good Standing' : 'Needs Academic Attention'
      }
    };
  }

  // 5. Remaining / Completed Credits Intent
  const creditKeywords = ['remaining credit', 'credits left', 'how many credits', 'completed credit', 'degree completion'];
  if (creditKeywords.some(keyword => msgLower.includes(keyword))) {
    return {
      intent: 'CREDITS_QUERY',
      facts: {
        completedCredits: studentAcademicFacts.completedCredits,
        totalRequiredCredits: studentAcademicFacts.totalRequiredCredits,
        remainingCredits: studentAcademicFacts.remainingCredits,
        progressPercentage: ((studentAcademicFacts.completedCredits / studentAcademicFacts.totalRequiredCredits) * 100).toFixed(1)
      }
    };
  }

  // 6. Next Semester Course Recommendation Intent
  const recommendKeywords = [
    'recommend course', 'next semester', 'what courses should i take',
    'suggest courses', 'what should i enroll', 'course suggestions',
    'eligible courses', 'which course to take'
  ];
  if (recommendKeywords.some(keyword => msgLower.includes(keyword))) {
    // Recommend top 4-5 eligible courses aligned with student's upcoming semester/level
    const upcomingLevel = Math.min(4, Math.ceil((studentAcademicFacts.semester + 1) / 2));
    const recommendations = studentAcademicFacts.eligibleCourses
      .filter(c => !c.currentlyTaking)
      .sort((a, b) => {
        // Prioritize courses matching or close to upcoming level
        const diffA = Math.abs(a.level - upcomingLevel);
        const diffB = Math.abs(b.level - upcomingLevel);
        return diffA - diffB;
      })
      .slice(0, 5);

    return {
      intent: 'COURSE_RECOMMENDATION',
      facts: {
        studentSemester: studentAcademicFacts.semester,
        upcomingLevel,
        recommendedCourses: recommendations.map(c => ({
          code: c.code,
          title: c.title,
          credits: c.credits,
          level: c.level,
          prerequisite: c.prerequisite_code || 'None'
        })),
        inProgressCourses: studentAcademicFacts.inProgressCourses.map(c => c.code)
      }
    };
  }

  // 7. Student Overall Academic Progress Query
  const progressKeywords = ['my progress', 'how is my progress', 'academic status', 'academic standing'];
  if (progressKeywords.some(keyword => msgLower.includes(keyword))) {
    return {
      intent: 'PROGRESS_QUERY',
      facts: {
        cgpa: studentAcademicFacts.cgpa,
        semester: studentAcademicFacts.semester,
        completedCredits: studentAcademicFacts.completedCredits,
        remainingCredits: studentAcademicFacts.remainingCredits,
        progressPercentage: ((studentAcademicFacts.completedCredits / studentAcademicFacts.totalRequiredCredits) * 100).toFixed(1),
        inProgressCount: studentAcademicFacts.inProgressCourses.length,
        progressUrl: '/dashboard/student/progress'
      }
    };
  }

  // Default: General Advising / Knowledge retrieval
  return {
    intent: 'GENERAL_OR_KNOWLEDGE',
    facts: {
      detectedCourseCode,
      hasCourseContext: Boolean(detectedCourseCode)
    }
  };
}

module.exports = {
  getStudentAcademicFacts,
  processAdvisingIntent,
  DEGREE_CREDIT_REQUIREMENT
};

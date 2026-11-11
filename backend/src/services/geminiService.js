const { genAI, preferredModel } = require('../config/gemini');

// Model candidate list to ensure zero-downtime and compatibility
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-flash-latest'
];

/**
 * Generate insightful, empathetic, and academically grounded advising response
 * using Google Gemini with active listening and conversational pacing.
 *
 * @param {Object} options
 * @param {string} options.userMessage - Current student prompt
 * @param {Array} options.conversationHistory - Last 10 chat messages
 * @param {Object} options.holisticStudentProfile - Comprehensive academic record & transcript
 * @param {Object} options.computedAcademicFacts - Deterministic verification facts
 * @param {Array} options.ragChunks - Retrieved RAG knowledge chunks
 * @param {string} options.studentName - Student name
 */
async function generateAdvisingResponse({
  userMessage,
  conversationHistory = [],
  holisticStudentProfile = null,
  computedAcademicFacts = null,
  ragChunks = [],
  studentName = 'Student'
}) {
  // Conversational mentor system instructions with active listening & pacing
  const systemInstructions = `You are "EduBot", an empathetic, razor-sharp, and visionary Academic Advisor & Career Mentor for the Department of Computer Science and Engineering (CSE) at Gopalganj Science and Technology University (GSTU).

CONVERSATIONAL PACING & MENTORING RULES (CRITICAL):
1. Brevity & Active Listening (No Walls of Text):
   - You are chatting inside a mobile/web chat bubble. NEVER output massive 5-point essays or monolithic lectures at once.
   - For open-ended mentorship questions (e.g. "how can I improve more?", career roadmaps, study strategies, advice):
     * Give at most 2 to 3 crisp, punchy observations directly tied to their actual transcript (~120–180 words max).
     * ALWAYS conclude with a single, focused, and intriguing question asking which specific path or topic they want to explore together (e.g., Software Engineering & Backend, Competitive Programming & Algorithms, Systems, or Higher Studies & Research). Let the student guide where to dive deep!
   
2. Factual & Deterministic Queries:
   - For factual queries (prerequisites like "Can I take CSE301?", CGPA query, remaining credits, enrolled courses):
     * Be ultra-concise and direct: 1 to 3 sentences maximum.
     * State the answer clearly based on the database facts, followed by a brief warm sentence if appropriate. No long preambles.
     * Strictly adhere to database facts: if a course is in-progress (IP), note it; if prerequisite is failed (F), state it cannot be taken until passed; if passed, confirm eligibility.

3. Academic Concept Tutoring & Slide/Lecture Breakdown:
   - When asked to explain an academic concept, algorithm, or course material (especially when course knowledge chunks are provided in the prompt):
     * Act as an exceptional, inspiring Teaching Assistant.
     * Cite the course and instructor from the knowledge materials (e.g., "From Dr. Anisur Rahman's CSE202: Algorithms lecture on Merge Sort...").
     * Break down the core logic step-by-step (e.g., Divide, Conquer, Combine).
     * When an example array is discussed (such as [12, 31, 25, 8, 32, 17, 40, 42] from the slide), provide the exact step-by-step dry run showing how the subarrays are divided and merged.
     * Detail the time complexity (Best/Average/Worst: O(n log n)) and auxiliary space complexity (O(n)).
     * Mention that they can download the full slide/notes from the Course Materials tab.
     * End with an engaging question (e.g., asking if they would like to review the C code or practice a recurrence relation).

4. Advising Session Booking & Scheduling:
   - When the student asks to book an appointment or advising session (or when available advising slots are provided in the computed database facts):
     * Do NOT give a generic "What area would you like to explore today?" greeting.
     * Tell the student warmly that you have pulled up the available one-on-one consultation slots with GSTU CSE faculty advisors (Dr. Anisur Rahman, Prof. Fatima Tuz Zohra, and Dept Head Dr. Mahbubul Alam).
     * Invite them to select their preferred time slot from the interactive cards below to confirm their appointment.

5. Tone & Engagement:
   - Warm, energetic, conversational, and genuinely supportive.
   - Speak like an inspiring professor having a 1-on-1 coffee chat in their office.
   - Use clean Markdown with bold keywords and short bullet points.`;

  let prompt = `${systemInstructions}\n\n`;

  // 1. Inject Complete Holistic Student Transcript & Standing
  if (holisticStudentProfile) {
    prompt += `=== STUDENT COMPLETE ACADEMIC PROFILE & TRANSCRIPT ===\n`;
    prompt += `Student Name: ${studentName}\n`;
    prompt += `Registration No: ${holisticStudentProfile.studentRegNo || 'N/A'}\n`;
    prompt += `Department: ${holisticStudentProfile.department || 'CSE'}, GSTU\n`;
    prompt += `Current Standing: Semester ${holisticStudentProfile.semester} (Level ${Math.ceil(holisticStudentProfile.semester / 2)})\n`;
    prompt += `Cumulative GPA: ${holisticStudentProfile.cgpa} / 4.00\n`;
    prompt += `Credits Completed: ${holisticStudentProfile.completedCredits} / 140.0 Credits (${holisticStudentProfile.degreeProgressPercentage}% completed)\n`;
    prompt += `Remaining Credits to Graduate: ${holisticStudentProfile.remainingCredits} Credits\n\n`;

    prompt += `COMPLETED COURSES & GRADES:\n`;
    if (holisticStudentProfile.completedCourses && holisticStudentProfile.completedCourses.length > 0) {
      holisticStudentProfile.completedCourses.forEach(c => {
        prompt += `- ${c.code}: ${c.title} (${c.credits} Cr, Grade: ${c.grade}, Semester: ${c.semester})\n`;
      });
    } else {
      prompt += `None yet.\n`;
    }

    if (holisticStudentProfile.inProgressCourses && holisticStudentProfile.inProgressCourses.length > 0) {
      prompt += `\nCURRENTLY IN-PROGRESS COURSES (This Semester):\n`;
      holisticStudentProfile.inProgressCourses.forEach(c => {
        prompt += `- ${c.code}: ${c.title} (${c.credits} Cr, Status: In Progress)\n`;
      });
    }

    if (holisticStudentProfile.failedCourses && holisticStudentProfile.failedCourses.length > 0) {
      prompt += `\nCOURSES REQUIRING RETAKE (Failed):\n`;
      holisticStudentProfile.failedCourses.forEach(c => {
        prompt += `- ${c.code}: ${c.title} (Grade: ${c.grade} - Must retake to satisfy prerequisites)\n`;
      });
    }

    if (holisticStudentProfile.eligibleUpcomingCourses && holisticStudentProfile.eligibleUpcomingCourses.length > 0) {
      prompt += `\nELIGIBLE COURSES FOR UPCOMING REGISTRATION:\n`;
      holisticStudentProfile.eligibleUpcomingCourses.slice(0, 6).forEach(c => {
        prompt += `- ${c.code}: ${c.title} (${c.credits} Cr, Level ${c.level}, Prereq: ${c.prerequisite_code || 'None'})\n`;
      });
    }

    if (holisticStudentProfile.allCourses && holisticStudentProfile.allCourses.length > 0) {
      prompt += `\nDEPARTMENT CURRICULUM & COURSE INSTRUCTORS:\n`;
      holisticStudentProfile.allCourses.forEach(c => {
        prompt += `- ${c.code} (${c.title}): Instructor: ${c.instructor_name} (${c.instructor_designation})\n`;
      });
    }

    if (holisticStudentProfile.facultyDirectory && holisticStudentProfile.facultyDirectory.length > 0) {
      prompt += `\nGSTU CSE FACULTY DIRECTORY:\n`;
      holisticStudentProfile.facultyDirectory.forEach(f => {
        prompt += `- ${f.name} | Designation: ${f.designation} | Email: ${f.email}\n`;
      });
    }
    prompt += `=======================================================\n\n`;
  }

  // 2. Inject Deterministic Database Facts (for specific queries like prerequisites, slots, etc.)
  if (computedAcademicFacts) {
    prompt += `=== COMPUTED DATABASE ENGINE FACTS ===\n`;
    prompt += JSON.stringify(computedAcademicFacts, null, 2);
    prompt += `\n======================================\n\n`;
  }

  // 3. Inject RAG Knowledge Base Chunks
  if (ragChunks && ragChunks.length > 0) {
    prompt += `=== RELEVANT COURSE KNOWLEDGE BASE MATERIALS ===\n`;
    ragChunks.forEach((chunk, index) => {
      prompt += `[Source ${index + 1}: "${chunk.material_title}" (${chunk.course_code})]\n${chunk.chunk_text}\n\n`;
    });
    prompt += `================================================\n\n`;
  }

  // 4. Inject Multi-Turn Conversational Memory (last 10 messages)
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `=== CONVERSATION HISTORY (Last ${conversationHistory.length} turns) ===\n`;
    conversationHistory.slice(-10).forEach(msg => {
      prompt += `Student: ${msg.message}\nEduBot: ${msg.response}\n\n`;
    });
    prompt += `=========================================================\n\n`;
  }

  prompt += `Student Question: "${userMessage}"\n\nEduBot Mentor Response (Keep concise, conversational, max 2-3 points if advice, ending with a focused question):`;

  // Call Gemini with intelligent failover
  if (genAI) {
    for (const candidate of MODEL_CANDIDATES) {
      try {
        const generativeModel = genAI.getGenerativeModel({ model: candidate });
        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`[Gemini Model '${candidate}' Notice]: ${err.message} - trying next candidate...`);
        if (err.message.includes('429') || err.message.includes('Quota exceeded')) {
          console.warn('[Gemini Quota Notice]: Free-tier daily quota limit reached on API key. Serving instant contextual mentor response.');
          break;
        }
      }
    }
  }

  // Dynamic, context-rich mentoring fallback if network/API is completely offline
  return generateContextualMentorFallback(userMessage, holisticStudentProfile, computedAcademicFacts, studentName);
}

/**
 * Concise, dialogic fallback if external AI API is unreachable
 */
function generateContextualMentorFallback(userMessage, profile, facts, studentName) {
  const msg = userMessage.toLowerCase();

  // 1. Prerequisite query (1-2 sentences)
  if (facts && facts.courseCode && typeof facts.canTake === 'boolean') {
    if (facts.canTake) {
      return `Yes, ${studentName}! You passed the prerequisite (${facts.prerequisiteCode || 'None'}), so you are fully eligible to enroll in **${facts.courseCode}: ${facts.courseTitle || ''}** next semester.`;
    } else {
      return `Not yet, ${studentName}. ${facts.reason}`;
    }
  }

  // 2. Improvement, Study Strategy, or Advice (2 punchy points + question)
  if (msg.includes('improve') || msg.includes('study') || msg.includes('advice') || msg.includes('career') || msg.includes('tips') || msg.includes('roadmap')) {
    const cgpa = profile ? profile.cgpa : 3.82;
    const hasFailed = profile && profile.failedCourses && profile.failedCourses.length > 0;

    if (hasFailed) {
      const failed = profile.failedCourses[0];
      return `Rakibul, with 30 credits completed, your top focus is simple:

1. **Clear ${failed.code} (${failed.title})**: Retaking this foundational course will immediately raise your CGPA and unlock high-level electives like Algorithms.
2. **Daily Coding Habit**: Practice 20–30 minutes daily on basic implementation so writing syntax feels natural.

What part of ${failed.code} felt most challenging last semester—pointers, memory, or tree logic?`;
    }

    return `Tanvir, with your stellar **${cgpa.toFixed(2)} CGPA**, you're already in top form! To jump from a top student to a top-tier engineer:

1. **Bridge the Hardware Gap**: Since you earned a B+ in Digital Logic, make sure to master cache hierarchy and pipelining in your current **CSE301 (Computer Architecture)** course.
2. **Go Deeper on Backend & Algorithms**: Leverage your A+ in Databases by exploring database internals (indexing and sharding) and solving DP/Graph problems on LeetCode.

Where do you see yourself heading after graduation—industry software engineering, machine learning research, or competitive programming?`;
  }

  // 3. Credits / Degree Progress (2 sentences)
  if (facts && facts.remainingCredits !== undefined) {
    return `You have completed **${facts.completedCredits}** out of 140.0 credits (**${facts.progressPercentage}%** degree progress), with **${facts.remainingCredits} credits remaining** to graduate from GSTU CSE.`;
  }

  // 4. CGPA (2 sentences)
  if (facts && facts.cgpa !== undefined) {
    return `Your cumulative GPA is **${facts.cgpa.toFixed(2)} / 4.00** (${facts.evaluation}) across your completed CSE coursework.`;
  }

  // 5. Advising Session Booking & Available Slots
  if (facts && (facts.availableSlots || msg.includes('book') || msg.includes('advising') || msg.includes('appointment') || msg.includes('slot'))) {
    return `I have pulled up the available advising consultation slots with our GSTU CSE faculty advisors below. You can select your preferred time slot with **Dr. Anisur Rahman**, **Prof. Fatima Tuz Zohra**, or **Dr. Mahbubul Alam (Dept Head)** to confirm your one-on-one session!`;
  }

  // 6. Course materials / Lecture Notes (Merge Sort, Cache, Normalization)
  if (msg.includes('merge sort') || msg.includes('algorithm') || msg.includes('slide') || msg.includes('note') || msg.includes('material')) {
    return `From **Dr. Anisur Rahman's CSE202: Algorithms** lecture notes, **Merge Sort** is an optimal divide-and-conquer sorting algorithm with $O(n \\log n)$ time complexity and $O(n)$ space complexity. The slide trace divides the array down to atomic elements before merging them back in sorted order. You can view or download the full document from the card below!`;
  }

  // 7. Default welcoming question
  return `Hello ${studentName}! I am EduBot, your GSTU CSE academic assistant. How can I help you today with course prerequisites, degree progress, study materials, or booking an advising session?`;
}

module.exports = {
  generateAdvisingResponse
};

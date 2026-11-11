const db = require('../config/db');
const { getStudentAcademicFacts, processAdvisingIntent } = require('../services/advisingEngine');
const { retrieveRelevantChunks, searchMaterials } = require('../services/ragService');
const { generateAdvisingResponse } = require('../services/geminiService');

/**
 * Handle incoming chat message from student with full holistic academic context
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, course_id } = req.body;
    const studentId = req.user.student_id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only registered students can chat with EduBot advising.' });
    }

    // 1. Fetch complete student academic facts from MySQL
    const academicFacts = await getStudentAcademicFacts(studentId);
    if (!academicFacts) {
      return res.status(404).json({ success: false, message: 'Student academic profile not found.' });
    }

    // 1b. Fetch Department Faculty Directory
    const [facultyList] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role,
              CASE 
                WHEN u.email = 'admin@gstu.edu.bd' THEN 'Professor & Department Head'
                WHEN u.email = 'dr.rahman@gstu.edu.bd' THEN 'Associate Professor & Academic Advisor'
                WHEN u.email = 'prof.fatima@gstu.edu.bd' THEN 'Professor & Academic Advisor'
                ELSE 'Faculty Member'
              END AS designation
       FROM users u 
       WHERE u.role IN ('teacher', 'admin')`
    );

    // 2. Build Holistic Academic Profile
    const holisticStudentProfile = {
      studentId: academicFacts.studentId,
      name: academicFacts.name,
      cgpa: academicFacts.cgpa,
      semester: academicFacts.semester,
      department: academicFacts.department,
      studentRegNo: academicFacts.studentRegNo,
      completedCredits: academicFacts.completedCredits,
      remainingCredits: academicFacts.remainingCredits,
      totalRequiredCredits: academicFacts.totalRequiredCredits,
      degreeProgressPercentage: ((academicFacts.completedCredits / academicFacts.totalRequiredCredits) * 100).toFixed(1),
      completedCourses: academicFacts.completedCourses,
      inProgressCourses: academicFacts.inProgressCourses,
      failedCourses: academicFacts.failedCourses,
      eligibleUpcomingCourses: academicFacts.eligibleCourses,
      allCourses: academicFacts.allCourses.map(c => ({
        code: c.code,
        title: c.title,
        credits: c.credits,
        instructor_name: c.instructor_name || 'Dr. Anisur Rahman',
        instructor_designation: c.instructor_designation || 'Associate Professor'
      })),
      facultyDirectory: facultyList
    };

    // 3. Compute intent and deterministic facts
    const intentResult = await processAdvisingIntent(message, academicFacts);

    // 4. Fetch last 10 messages for multi-turn conversational context
    const [recentChats] = await db.query(
      `SELECT chat_id, message, response, timestamp, escalated 
       FROM chat_logs 
       WHERE student_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 10`,
      [studentId]
    );
    const conversationHistory = recentChats.reverse(); // Chronological order

    // 5. Retrieve RAG chunks and material cards for academic topics & course questions
    let ragChunks = [];
    let materialCards = [];

    const msgLower = message.toLowerCase();
    const isAcademicOrStudy =
      intentResult.intent === 'GENERAL_OR_KNOWLEDGE' ||
      msgLower.includes('note') ||
      msgLower.includes('slide') ||
      msgLower.includes('book') ||
      msgLower.includes('material') ||
      msgLower.includes('chapter') ||
      msgLower.includes('syllabus') ||
      msgLower.includes('merge') ||
      msgLower.includes('sort') ||
      msgLower.includes('algorithm') ||
      msgLower.includes('cache') ||
      msgLower.includes('pipeline') ||
      msgLower.includes('normaliz') ||
      msgLower.includes('explain') ||
      msgLower.includes('complexity') ||
      msgLower.includes('array') ||
      msgLower.includes('how to') ||
      msgLower.includes('what is');

    if (isAcademicOrStudy) {
      ragChunks = await retrieveRelevantChunks(message, course_id, 4);

      // Collect materials from retrieved chunks
      if (ragChunks.length > 0) {
        const materialIds = [...new Set(ragChunks.map(c => c.material_id).filter(Boolean))];
        if (materialIds.length > 0) {
          const [matchedMaterials] = await db.query(
            `SELECT m.material_id, m.title, m.type, m.file_path, m.link_url, m.uploaded_at,
                    c.code AS course_code, c.title AS course_title, u.name AS teacher_name
             FROM materials m
             JOIN courses c ON m.course_id = c.course_id
             JOIN users u ON m.teacher_id = u.user_id
             WHERE m.material_id IN (?)`,
            [materialIds]
          );
          materialCards = matchedMaterials || [];
        }
      }

      // Also search by course code or topic if student asked for notes/slides/files
      const extraSearch = await searchMaterials(
        intentResult.facts?.detectedCourseCode || message.replace(/[^\w\s]/gi, '').trim(),
        intentResult.facts?.detectedCourseCode || null
      );
      if (extraSearch && extraSearch.length > 0) {
        extraSearch.forEach(m => {
          if (!materialCards.some(existing => existing.material_id === m.material_id)) {
            materialCards.push(m);
          }
        });
      }
    }

    // 6. Smart Escalation Detection
    let isEscalation = intentResult.intent === 'ESCALATE' || intentResult.isEscalation;
    let escalationReason = intentResult.facts?.reason || 'Student requested faculty advising assistance';

    if (!isEscalation && conversationHistory.length >= 3) {
      const lastThree = conversationHistory.slice(-3);
      const confusedCount = lastThree.filter(c =>
        c.message.toLowerCase().includes('not helpful') ||
        c.message.toLowerCase().includes('wrong') ||
        c.message.toLowerCase().includes('don\'t understand') ||
        c.message.toLowerCase().includes('dont understand') ||
        c.message.toLowerCase().includes('still confused')
      ).length;

      if (confusedCount >= 2) {
        isEscalation = true;
        escalationReason = 'Bot unable to satisfactorily resolve student query after multiple attempts';
      }
    }

    // 7. Generate mentor response with Google Gemini
    const botResponse = await generateAdvisingResponse({
      userMessage: message,
      conversationHistory,
      holisticStudentProfile,
      computedAcademicFacts: intentResult.facts,
      ragChunks,
      studentName: academicFacts.name
    });

    // 8. Store chat log in database
    const [chatInsert] = await db.query(
      'INSERT INTO chat_logs (student_id, message, response, escalated) VALUES (?, ?, ?, ?)',
      [studentId, message, botResponse, isEscalation ? 1 : 0]
    );
    const chatId = chatInsert.insertId;

    // 9. If escalated, create ticket in escalations table
    let escalationTicket = null;
    if (isEscalation) {
      const [advisors] = await db.query(
        "SELECT user_id FROM users WHERE role = 'teacher' AND verified = 1 LIMIT 1"
      );
      const advisorId = advisors.length > 0 ? advisors[0].user_id : null;

      const [escResult] = await db.query(
        'INSERT INTO escalations (chat_id, advisor_id, status, resolution_notes) VALUES (?, ?, ?, ?)',
        [chatId, advisorId, 'open', `Reason: ${escalationReason}`]
      );
      escalationTicket = {
        escalation_id: escResult.insertId,
        status: 'open',
        advisor_id: advisorId
      };
    }

    // Return comprehensive response
    res.json({
      success: true,
      chat_id: chatId,
      message,
      response: botResponse,
      intent: intentResult.intent,
      facts: intentResult.facts,
      material_cards: materialCards,
      rag_sources: ragChunks.map(c => ({
        chunk_id: c.chunk_id,
        title: c.material_title,
        course_code: c.course_code
      })),
      slots: intentResult.facts?.availableSlots || [],
      escalated: isEscalation,
      escalation_ticket: escalationTicket,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get chat history for current student
 */
const getChatHistory = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Student ID required.' });
    }

    const [logs] = await db.query(
      `SELECT chat_id, message, response, timestamp, escalated 
       FROM chat_logs 
       WHERE student_id = ? 
       ORDER BY timestamp ASC`,
      [studentId]
    );

    res.json({
      success: true,
      count: logs.length,
      history: logs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear chat history for current student
 */
const clearChatHistory = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Student ID required.' });
    }

    await db.query('DELETE FROM chat_logs WHERE student_id = ?', [studentId]);

    res.json({
      success: true,
      message: 'Chat history cleared successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory
};

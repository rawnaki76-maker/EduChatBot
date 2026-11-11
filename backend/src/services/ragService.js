const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/db');

/**
 * Extract plain text from an uploaded file (PDF, DOCX, etc.)
 */
async function extractTextFromFile(filePath, mimeType, originalName) {
  try {
    const ext = originalName.split('.').pop().toLowerCase();

    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(dataBuffer);
      return parsed.text || '';
    } else if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else if (ext === 'txt') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  } catch (err) {
    console.error(`[RAG Extract Error] Failed to extract text from ${filePath}:`, err.message);
    return '';
  }
}

/**
 * Split text into overlapping chunks (~800 characters with ~100 characters overlap)
 */
function chunkText(text, chunkSize = 800, overlap = 100) {
  if (!text) return [];

  // Normalize whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < cleanText.length) {
      // Find the nearest word boundary so we don't cut words in half
      const lastSpace = cleanText.lastIndexOf(' ', endIndex);
      if (lastSpace > startIndex) {
        endIndex = lastSpace;
      }
    } else {
      endIndex = cleanText.length;
    }

    const chunk = cleanText.substring(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    if (endIndex >= cleanText.length) break;
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

/**
 * Store text chunks in the material_chunks table
 */
async function storeChunks(materialId, courseId, chunks) {
  if (!chunks || chunks.length === 0) return 0;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const query = 'INSERT INTO material_chunks (material_id, course_id, chunk_text, chunk_index) VALUES ?';
    const values = chunks.map((chunk, idx) => [materialId, courseId, chunk, idx]);

    await connection.query(query, [values]);
    await connection.commit();
    return chunks.length;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Retrieve relevant chunks for a question using MySQL FULLTEXT search with robust LIKE fallback
 */
async function retrieveRelevantChunks(question, courseId = null, limit = 5) {
  try {
    if (!question || question.trim() === '') return [];

    const cleanQuery = question.replace(/[^\w\s]/gi, ' ').trim();
    let results = [];

    // 1. Try MySQL FULLTEXT search
    try {
      let ftSql = `
        SELECT mc.chunk_id, mc.material_id, mc.chunk_text, mc.chunk_index,
               m.title AS material_title, m.type AS material_type, m.file_path,
               c.code AS course_code, c.title AS course_title,
               u.name AS teacher_name,
               MATCH(mc.chunk_text) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
        FROM material_chunks mc
        JOIN materials m ON mc.material_id = m.material_id
        JOIN courses c ON mc.course_id = c.course_id
        JOIN users u ON m.teacher_id = u.user_id
        WHERE MATCH(mc.chunk_text) AGAINST(? IN NATURAL LANGUAGE MODE)
      `;
      const ftParams = [cleanQuery, cleanQuery];

      if (courseId) {
        ftSql += ' AND mc.course_id = ?';
        ftParams.push(courseId);
      }

      ftSql += ' ORDER BY relevance DESC LIMIT ?';
      ftParams.push(limit);

      const [ftRows] = await db.query(ftSql, ftParams);
      if (ftRows && ftRows.length > 0) {
        results = ftRows;
      }
    } catch (ftErr) {
      console.warn('[RAG] FULLTEXT search failed, falling back to keyword search:', ftErr.message);
    }

    // 2. Keyword-based fallback search (matches algorithm names, arrays, topics)
    if (results.length === 0) {
      // Extract keywords (words >= 3 letters or numbers)
      const words = question
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !['what', 'when', 'where', 'which', 'explain', 'show', 'tell', 'about', 'from', 'with', 'according', 'slide', 'notes'].includes(w))
        .slice(0, 5);

      if (words.length > 0) {
        let likeSql = `
          SELECT mc.chunk_id, mc.material_id, mc.chunk_text, mc.chunk_index,
                 m.title AS material_title, m.type AS material_type, m.file_path,
                 c.code AS course_code, c.title AS course_title,
                 u.name AS teacher_name
          FROM material_chunks mc
          JOIN materials m ON mc.material_id = m.material_id
          JOIN courses c ON mc.course_id = c.course_id
          JOIN users u ON m.teacher_id = u.user_id
          WHERE (${words.map(() => 'LOWER(mc.chunk_text) LIKE ?').join(' OR ')})
        `;
        const likeParams = words.map(w => `%${w}%`);

        if (courseId) {
          likeSql += ' AND mc.course_id = ?';
          likeParams.push(courseId);
        }

        likeSql += ' LIMIT ?';
        likeParams.push(limit);

        const [likeRows] = await db.query(likeSql, likeParams);
        results = likeRows || [];
      }
    }

    return results;
  } catch (err) {
    console.error('[RAG Search Error]:', err.message);
    return [];
  }
}

/**
 * Search course materials directly (for returning clickable download/view cards in chat)
 */
async function searchMaterials(searchTerm, courseCode = null) {
  try {
    let sql = `
      SELECT m.material_id, m.title, m.type, m.file_path, m.link_url, m.uploaded_at,
             c.code AS course_code, c.title AS course_title, u.name AS teacher_name
      FROM materials m
      JOIN courses c ON m.course_id = c.course_id
      JOIN users u ON m.teacher_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (courseCode) {
      sql += ' AND c.code = ?';
      params.push(courseCode.toUpperCase());
    }

    if (searchTerm) {
      sql += ' AND (m.title LIKE ? OR c.code LIKE ? OR c.title LIKE ?)';
      const term = `%${searchTerm}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY m.uploaded_at DESC LIMIT 5';

    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error('[Search Materials Error]:', err.message);
    return [];
  }
}

module.exports = {
  extractTextFromFile,
  chunkText,
  storeChunks,
  retrieveRelevantChunks,
  searchMaterials
};

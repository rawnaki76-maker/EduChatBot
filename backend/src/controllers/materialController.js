const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { extractTextFromFile, chunkText, storeChunks } = require('../services/ragService');

// Configure Multer storage
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are supported.'));
    }
  }
});

/**
 * Teacher uploads course material (PDF, DOCX, or external link)
 */
const uploadMaterial = async (req, res, next) => {
  try {
    const teacherId = req.user.user_id;
    const { course_id, title, type = 'pdf', link_url } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ success: false, message: 'course_id and title are required.' });
    }

    let filePath = null;
    let extractedText = '';

    if (req.file) {
      filePath = req.file.filename;
      extractedText = await extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);
    } else if (link_url) {
      extractedText = `Reference link for ${title}: ${link_url}`;
    }

    // Insert material record
    const [result] = await db.query(
      'INSERT INTO materials (course_id, teacher_id, title, type, file_path, link_url, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [course_id, teacherId, title, type, filePath, link_url || null, extractedText]
    );

    const materialId = result.insertId;

    // Chunk text and store in material_chunks for RAG
    let chunksStored = 0;
    if (extractedText && extractedText.trim().length > 0) {
      const chunks = chunkText(extractedText, 800, 100);
      chunksStored = await storeChunks(materialId, course_id, chunks);
    }

    res.status(201).json({
      success: true,
      message: 'Course material uploaded and indexed for AI knowledge retrieval.',
      material: {
        material_id: materialId,
        course_id,
        title,
        type,
        file_path: filePath,
        link_url,
        extracted_text_length: extractedText.length,
        chunks_indexed: chunksStored
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get materials by course
 */
const getMaterialsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const [materials] = await db.query(
      `SELECT m.*, u.name as teacher_name, c.code as course_code, c.title as course_title
       FROM materials m
       JOIN users u ON m.teacher_id = u.user_id
       JOIN courses c ON m.course_id = c.course_id
       WHERE m.course_id = ?
       ORDER BY m.uploaded_at DESC`,
      [courseId]
    );

    res.json({
      success: true,
      count: materials.length,
      materials
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all materials across courses with optional filtering
 */
const getAllMaterials = async (req, res, next) => {
  try {
    const { search, course_id, course_code } = req.query;

    let sql = `
      SELECT m.*, u.name as teacher_name, c.code as course_code, c.title as course_title, c.credits, c.department
      FROM materials m
      JOIN users u ON m.teacher_id = u.user_id
      JOIN courses c ON m.course_id = c.course_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      sql += ' AND m.course_id = ?';
      params.push(course_id);
    }

    if (course_code) {
      sql += ' AND c.code = ?';
      params.push(course_code.toUpperCase());
    }

    if (search) {
      sql += ' AND (m.title LIKE ? OR c.code LIKE ? OR c.title LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY m.uploaded_at DESC';

    const [materials] = await db.query(sql, params);

    res.json({
      success: true,
      count: materials.length,
      materials
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Download or view a material file
 */
const downloadMaterial = (req, res, next) => {
  try {
    const { filename } = req.params;
    const { inline } = req.query;
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const fullPath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    if (inline === '1' || inline === 'true') {
      const ext = path.extname(safeFilename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.txt') contentType = 'text/plain';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      return res.sendFile(fullPath);
    }

    res.download(fullPath);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  uploadMaterial,
  getMaterialsByCourse,
  getAllMaterials,
  downloadMaterial
};

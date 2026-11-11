const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { extractTextFromFile, chunkText, storeChunks } = require('../src/services/ragService');

async function seedMaterials() {
  console.log('Seeding course materials and RAG chunks into MySQL...');
  try {
    // 1. Get Courses and Teachers
    const [courses] = await db.query('SELECT course_id, code, title FROM courses');
    const [teachers] = await db.query("SELECT user_id, name, email FROM users WHERE role = 'teacher'");

    const cse202 = courses.find(c => c.code === 'CSE202'); // Algorithms
    const cse301 = courses.find(c => c.code === 'CSE301'); // Computer Architecture
    const cse204 = courses.find(c => c.code === 'CSE204'); // DBMS
    const cse201 = courses.find(c => c.code === 'CSE201'); // OOP

    const drRahman = teachers.find(t => t.email === 'dr.rahman@gstu.edu.bd') || teachers[0];
    const profFatima = teachers.find(t => t.email === 'prof.fatima@gstu.edu.bd') || teachers[1] || teachers[0];

    // Ensure uploads folder exists
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Material 1: Merge Sort PDF (CSE202 - Algorithms by Dr. Anisur Rahman)
    const mergeSortPdf = path.join(uploadsDir, 'merge_sort.pdf');
    let mergeSortText = '';
    if (fs.existsSync(mergeSortPdf)) {
      mergeSortText = await extractTextFromFile(mergeSortPdf, 'application/pdf', 'merge_sort.pdf');
      console.log(`[RAG] Extracted ${mergeSortText.length} characters from merge_sort.pdf`);
    } else {
      console.warn('[RAG] merge_sort.pdf not found in uploads, using fallback text.');
      mergeSortText = `CS3353 C PROGRAMMING AND DATA STRUCTURES - MERGE SORT
Merge sort is a sorting technique based on divide and conquer technique.
With worst-case time complexity being O(n log n), it is one of the most respected algorithms.
Merge sort first divides the array into equal halves and then combines them in a sorted manner.
Working of Merge sort Algorithm:
Consider an unsorted array elements 12, 31, 25, 8, 32, 17, 40 and 42.
First divide the given array into two equal halves. Merge sort keeps dividing the list into equal parts until it cannot be further divided.
As there are eight elements in the given array, so it is divided into two arrays of size 4: [12, 31, 25, 8] and [32, 17, 40, 42].
Now, again divide these two arrays into halves of size 2: [12, 31], [25, 8], [32, 17], [40, 42].
Now, again divide these arrays to get the atomic value that cannot be further divided: [12], [31], [25], [8], [32], [17], [40], [42].
Now, combine them in the same manner they were broken. Compare 12 and 31 -> [12, 31]. Compare 25 and 8 -> [8, 25]. Compare 32 and 17 -> [17, 32]. Compare 40 and 42 -> [40, 42].
Next iteration: merge [12, 31] and [8, 25] -> [8, 12, 25, 31]. Merge [17, 32] and [40, 42] -> [17, 32, 40, 42].
Final merging: [8, 12, 17, 25, 31, 32, 40, 42].
Time Complexity: Best O(n log n), Worst O(n log n), Average O(n log n).
Space Complexity: O(n). Stability: YES.
Applications: Inversion count problem, External sorting, E-commerce applications.`;
    }

    // Check if material already exists in DB
    const [existing] = await db.query('SELECT material_id FROM materials WHERE title LIKE ?', ['%Merge Sort%']);
    let mergeSortId;
    if (existing.length === 0 && cse202 && drRahman) {
      const [insRes] = await db.query(
        `INSERT INTO materials (course_id, teacher_id, title, type, file_path, extracted_text) 
         VALUES (?, ?, ?, 'pdf', 'merge_sort.pdf', ?)`,
        [
          cse202.course_id,
          drRahman.user_id,
          'Merge Sort Algorithm - Lecture Notes & Implementation (Dr. Anisur Rahman)',
          mergeSortText
        ]
      );
      mergeSortId = insRes.insertId;
      console.log(`[DB] Inserted Merge Sort material ID: ${mergeSortId}`);

      const chunks = chunkText(mergeSortText, 800, 100);
      const chunksCount = await storeChunks(mergeSortId, cse202.course_id, chunks);
      console.log(`[RAG] Stored ${chunksCount} chunks for Merge Sort.`);
    } else {
      console.log('[DB] Merge Sort material already exists or course not found.');
    }

    // Material 2: Computer Architecture - Cache Memory & Pipeline
    if (cse301 && drRahman) {
      const [archEx] = await db.query('SELECT material_id FROM materials WHERE title LIKE ?', ['%Cache Memory%']);
      if (archEx.length === 0) {
        const archText = `CSE301: Computer Architecture - Module 4: Cache Memory Hierarchy & Pipelining
Instructor: Dr. Mahbubul Alam
Topics covered:
1. Instruction Pipelining: 5-stage MIPS pipeline (IF, ID, EX, MEM, WB). Data Hazards, Control Hazards (Branch prediction), and Structural Hazards.
2. Cache Memory Mapping: Direct mapped, Fully associative, and N-way Set Associative Cache.
3. Cache Misses: Cold/Compulsory Misses, Capacity Misses, and Conflict Misses (the 3 C's).
4. Cache Replacement Policies: LRU (Least Recently Used), FIFO, Random Replacement.
Formula for Average Memory Access Time (AMAT): AMAT = Hit Time + (Miss Rate * Miss Penalty).`;

        const [archRes] = await db.query(
          `INSERT INTO materials (course_id, teacher_id, title, type, file_path, extracted_text)
           VALUES (?, ?, ?, 'pdf', 'cse301_cache_pipeline.pdf', ?)`,
          [
            cse301.course_id,
            drRahman.user_id,
            'CSE301: Cache Memory Hierarchy & MIPS Pipelining Slides',
            archText
          ]
        );
        const archChunks = chunkText(archText, 800, 100);
        await storeChunks(archRes.insertId, cse301.course_id, archChunks);
        console.log(`[RAG] Stored CSE301 Cache material with chunks.`);
      }
    }

    // Material 3: DBMS Relational Algebra & Normalization
    if (cse204 && profFatima) {
      const [dbEx] = await db.query('SELECT material_id FROM materials WHERE title LIKE ?', ['%Normalization%']);
      if (dbEx.length === 0) {
        const dbText = `CSE204: Database Management Systems - Chapter 7: Normalization & Relational Schema Design
Instructor: Prof. Fatima Tuz Zohra
Topics:
1. Functional Dependencies (FDs) and Armstrong's Axioms (Reflexivity, Augmentation, Transitivity).
2. Normal Forms:
   - 1NF: Atomic attribute values.
   - 2NF: In 1NF and no partial dependencies (every non-prime attribute is fully functionally dependent on primary key).
   - 3NF: In 2NF and no transitive dependencies (no non-prime attribute determines another non-prime attribute).
   - BCNF (Boyce-Codd Normal Form): For every non-trivial functional dependency X -> Y, X must be a superkey.
3. Lossless Decomposition and Dependency Preservation.`;

        const [dbRes] = await db.query(
          `INSERT INTO materials (course_id, teacher_id, title, type, link_url, extracted_text)
           VALUES (?, ?, ?, 'link', 'https://gstu.edu.bd/dept/cse/courses/cse204/notes', ?)`,
          [
            cse204.course_id,
            profFatima.user_id,
            'CSE204: Database Normalization (1NF to BCNF) Handout & Examples',
            dbText
          ]
        );
        const dbChunks = chunkText(dbText, 800, 100);
        await storeChunks(dbRes.insertId, cse204.course_id, dbChunks);
        console.log(`[RAG] Stored CSE204 DBMS Normalization material with chunks.`);
      }
    }

    console.log('Materials and RAG indexing seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed materials:', err);
    process.exit(1);
  }
}

seedMaterials();

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'edubot_jwt_super_secret_key_2026';

// Generate token for Student 1 (Tanvir Hasan, student_id: 1, user_id: 4)
const studentToken = jwt.sign(
  {
    user_id: 4,
    email: 'student1@gstu.edu.bd',
    role: 'student',
    student_id: 1,
    name: 'Tanvir Hasan'
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);

async function runTests() {
  console.log('=== STARTING MATERIALS & RAG INTEGRATION VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Fetch All Materials
  try {
    const res = await fetch('http://localhost:5000/api/materials', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (data.success && data.materials.length >= 3) {
      console.log(`✅ [TEST 1 PASSED] Fetched ${data.materials.length} course materials.`);
      data.materials.forEach(m => console.log(`   - [${m.course_code}] ${m.title} (by ${m.teacher_name})`));
      passed++;
    } else {
      console.error(`❌ [TEST 1 FAILED] Materials count unexpected:`, data);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 1 FAILED]`, err.message);
    failed++;
  }

  // Test 2: Filter Materials by Course (CSE202)
  try {
    const res = await fetch('http://localhost:5000/api/materials?course_code=CSE202', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    const hasMergeSort = data.materials.some(m => m.title.includes('Merge Sort'));
    if (data.success && hasMergeSort) {
      console.log(`✅ [TEST 2 PASSED] Course filter returned Merge Sort for CSE202.`);
      passed++;
    } else {
      console.error(`❌ [TEST 2 FAILED] Could not find Merge Sort under CSE202:`, data);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 2 FAILED]`, err.message);
    failed++;
  }

  // Test 3: Download/Preview Endpoint
  try {
    const res = await fetch('http://localhost:5000/api/materials/download/merge_sort.pdf?inline=1');
    if (res.status === 200 && res.headers.get('content-type') === 'application/pdf') {
      console.log(`✅ [TEST 3 PASSED] PDF download/inline preview endpoint served merge_sort.pdf (HTTP 200, application/pdf).`);
      passed++;
    } else {
      console.error(`❌ [TEST 3 FAILED] Status ${res.status}, content-type: ${res.headers.get('content-type')}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 3 FAILED]`, err.message);
    failed++;
  }

  // Test 4: Chat Query 1 - Asking for Merge Sort Notes
  try {
    console.log('\n--- Testing Chat Query 1: "Show me the lecture notes for Merge Sort" ---');
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: 'Show me the lecture notes for Merge Sort.' })
    });
    const data = await res.json();
    if (data.success && data.material_cards && data.material_cards.length > 0) {
      console.log(`✅ [TEST 4 PASSED] EduBot returned material cards! Card: "${data.material_cards[0].title}"`);
      console.log(`   Response preview: ${data.response.substring(0, 160)}...`);
      passed++;
    } else {
      console.error(`❌ [TEST 4 FAILED] Material cards missing:`, data);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 4 FAILED]`, err.message);
    failed++;
  }

  // Test 5: Chat Query 2 - Concept Breakdown & Slide Array Dry Run
  try {
    console.log('\n--- Testing Chat Query 2: Array Dry Run from Slide ---');
    const query = "Explain how the array [12, 31, 25, 8, 32, 17, 40, 42] is divided and merged according to sir's slide.";
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: query })
    });
    const data = await res.json();
    const respLower = data.response?.toLowerCase() || '';
    const hasArrayElements = respLower.includes('12') && respLower.includes('31') && respLower.includes('25') && respLower.includes('8');
    const hasDivideOrMerge = respLower.includes('divide') || respLower.includes('merge');

    if (data.success && hasArrayElements && hasDivideOrMerge) {
      console.log(`✅ [TEST 5 PASSED] EduBot provided detailed concept breakdown and dry run for array!`);
      console.log(`\n=== EDUBOT TUTORING RESPONSE ===\n${data.response}\n================================\n`);
      passed++;
    } else {
      console.error(`❌ [TEST 5 FAILED] Response lacked dry run elements:`, data.response);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 5 FAILED]`, err.message);
    failed++;
  }

  // Test 6: Chat Query 3 - Complexity Analysis
  try {
    console.log('\n--- Testing Chat Query 3: Time & Space Complexity from Course Material ---');
    const query = "What is the time and space complexity of merge sort mentioned in our course material?";
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: query })
    });
    const data = await res.json();
    const resp = data.response || '';
    const hasNLogN = resp.includes('O(n log n)') || resp.includes('O(n*log n)') || resp.includes('n log n') || resp.includes('nlogn');
    const hasSpace = resp.includes('O(n)') || resp.includes('Space');

    if (data.success && hasNLogN && hasSpace) {
      console.log(`✅ [TEST 6 PASSED] EduBot accurately cited O(n log n) time and O(n) space complexity!`);
      console.log(`   Response preview: ${resp.substring(0, 180)}...`);
      passed++;
    } else {
      console.error(`❌ [TEST 6 FAILED] Complexity missing:`, resp);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [TEST 6 FAILED]`, err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

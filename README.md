# EduBot - AI Academic Assistant for GSTU CSE Department

EduBot is an enterprise-grade AI-powered academic advising and study assistant platform built specifically for the Department of Computer Science and Engineering at Gopalganj Science and Technology University (GSTU).

The system ensures **100% deterministic accuracy** for degree requirements, prerequisite verification, CGPA queries, and credit calculations by computing facts directly from the MySQL database before passing them to Google Gemini 2.0 Flash for natural phrasing.

---

## 🚀 Key Features

1. **Deterministic Core Advising Engine**:
   - Prerequisite checks (e.g. *"Can I take CSE301?"*) verify MySQL enrollment records and prerequisite trees.
   - Next-semester course recommendations based on completed prerequisites and curriculum levels.
   - Exact remaining degree credits (140.0 credit baseline) and CGPA calculations.
   - Multi-turn conversational memory (tracks the last 10 messages).

2. **Study Assistant with RAG (Retrieval-Augmented Generation)**:
   - Faculty upload panel for course notes, syllabi, and slides (PDF, DOCX, links).
   - Automated text extraction (`pdf-parse`, `mammoth`) and chunking (~800 chars, 100 overlap).
   - MySQL FULLTEXT and keyword retrieval.
   - Answers strictly grounded in course materials with explicit citations.
   - Interactive download cards returned in chat for course notes and slides.

3. **Faculty Scheduling & Smart Escalation**:
   - Faculty create available advising slots.
   - In-chat interactive slot browsing and one-click booking with instant appointment ticket generation.
   - Advisor dashboard with session queue, student profile inspection, and session note recording.
   - Smart escalation triggered when students are confused or explicitly request human faculty help.
   - Official advising summary report export as formatted text/print.

4. **Progress Analytics & Department Admin Console**:
   - Interactive Recharts visualizations: Semester-by-semester CGPA trend line chart, coursework submission status bar chart, and curriculum level progress bars.
   - Admin management of users, teacher verification, curriculum course registry, and real-time chatbot resolution analytics.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js (REST API, Helmet, CORS, Rate Limiting)
- **Database**: MySQL 8.0 (`mysql2/promise` with connection pooling)
- **AI**: Google Gemini API (`@google/generative-ai`, model `gemini-2.0-flash`)
- **File Parsing**: `pdf-parse`, `mammoth`, `multer`
- **Security**: JWT tokens, bcryptjs password hashing, parameterized SQL queries

---

## 📦 Quick Setup Instructions

### 1. Database Setup
Ensure MySQL is running on `localhost:3306`.
Execute the schema and seed scripts:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
# Verify or edit .env if needed
npm start
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 👥 Demo User Accounts (Pre-seeded)

| Role | Name | Email | Password | Academic Note |
|---|---|---|---|---|
| **Student 1** | Tanvir Hasan | `student1@gstu.edu.bd` | `Password123!` | Semester 5, CGPA 3.82, Completed 60 Cr (Eligible for CSE301) |
| **Student 2** | Nusrat Jahan | `student2@gstu.edu.bd` | `Password123!` | Semester 4, CGPA 3.65, Completed 45 Cr |
| **Student 3** | Rakibul Islam | `student3@gstu.edu.bd` | `Password123!` | Semester 3, CGPA 2.85, **Failed CSE104** (Cannot take CSE202!) |
| **Student 4** | Sabrina Akter | `student4@gstu.edu.bd` | `Password123!` | Semester 8, CGPA 3.94, Completed 110 Cr (Ready for Thesis) |
| **Student 5** | Farhan Ahmed | `student5@gstu.edu.bd` | `Password123!` | Semester 2, CGPA 3.20, Freshman |
| **Teacher / Advisor** | Dr. Anisur Rahman | `dr.rahman@gstu.edu.bd` | `Password123!` | Faculty Advisor & Associate Professor |
| **Teacher / Advisor** | Prof. Fatima Tuz Zohra | `prof.fatima@gstu.edu.bd` | `Password123!` | Faculty Advisor & Professor |
| **Department Admin** | Dr. Mahbubul Alam | `admin@gstu.edu.bd` | `Password123!` | CSE Department Head & System Admin |

---

## 🧪 5-Step Demo Script

1. **Step 1: Test Deterministic Prerequisite Verification**:
   - Log in as **Student 1** (`student1@gstu.edu.bd`).
   - Go to AI Advising Chat (`/dashboard/student/chat`).
   - Ask: *"Can I take CSE301?"* -> Bot computes that Tanvir passed `CSE203` (prerequisite) and confirms eligibility.
   - Log in as **Student 3** (`student3@gstu.edu.bd`).
   - Ask: *"Can I take CSE202?"* -> Bot computes that Rakibul failed `CSE104` with Grade F and explains he must retake `CSE104` first.

2. **Step 2: Check Degree Credits & CGPA**:
   - Ask: *"How many credits do I have left?"* -> Bot retrieves the exact completed credits and remaining credits out of 140.
   - Ask: *"What is my CGPA?"* -> Bot states the exact CGPA and academic standing.

3. **Step 3: Book an Advising Session in Chat**:
   - Ask: *"Book an advising session"* -> Bot queries open advisor slots and renders interactive buttons.
   - Click a slot -> Instant confirmation ticket generated and session recorded.

4. **Step 4: Smart Faculty Escalation**:
   - Ask: *"I need to talk to a human advisor"* -> Bot automatically triggers escalation and queues the full transcript in the advisor's inbox.
   - Log in as **Dr. Anisur Rahman** (`dr.rahman@gstu.edu.bd`) at `/dashboard/teacher` to view and resolve the escalation.

5. **Step 5: View Analytics & Admin Console**:
   - As student, visit `/dashboard/student/progress` to view Recharts CGPA trends and assignment submission breakdown.
   - Log in as **Admin** (`admin@gstu.edu.bd`) at `/dashboard/admin` to review system-wide chat resolution analytics, verify advisors, and register new courses.

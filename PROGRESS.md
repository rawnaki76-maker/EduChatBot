# EduBot Project Progress

## Methodology: Iterative & Incremental Development
- University: Gopalganj Science and Technology University (GSTU)
- Department: Computer Science & Engineering (CSE)
- Core: Deterministic AI Academic Advising & Study Assistant Assistant

---

### Increments Status

- [x] **Increment 1: Foundation**
  - [x] Initial workspace architecture & setup
  - [x] MySQL `schema.sql` (12 tables with foreign keys and FULLTEXT index)
  - [x] MySQL `seed.sql` (1 Admin, 2 Teachers/Advisors, 5 Students, 17 CSE courses with prerequisites, enrollment history, advisor slots, assignments)
  - [x] Database executed and verified in MySQL (`edubot_db`)
  - [x] Backend Express API structure (Auth JWT, RBAC middleware, student profile, course catalog)
  - [x] Frontend Next.js 14 App Router with Tailwind CSS (Login, Register, Course catalog with filters)

- [x] **Increment 2: Core Advising Chatbot**
  - [x] Chat UI with message bubbles, typing indicators, and session history
  - [x] `POST /api/chat` endpoint with Google Gemini 2.0 Flash integration
  - [x] Deterministic Advising Engine (`advisingEngine.js`):
    - Prerequisite checking (`CSE301` vs `CSE203`, `CSE202` vs `CSE104`)
    - Next-semester course recommendation based on satisfied prerequisites
    - Remaining degree credits calculation (140.0 credit baseline)
    - Real-time CGPA query and academic standing
  - [x] Multi-turn memory sending the last 10 messages of the conversation

- [x] **Increment 3: Study Assistant (Knowledge Base + RAG) & Student Resource Library**
  - [x] Teacher upload panel for course materials (PDF, DOCX, links)
  - [x] Dedicated Student Course Materials Hub (`/dashboard/student/materials`):
    - Real-time search across course codes, titles, and faculty instructors
    - Quick-filter chips for CSE courses (`CSE202`, `CSE301`, `CSE204`, etc.) and file types
    - Inline PDF preview and direct file downloads
    - "Ask EduBot About This" one-click tutoring launcher
  - [x] Course Catalog integration (`/courses`) displaying instructors and attached resource counts
  - [x] Navbar navigation item "Course Materials" for students
  - [x] File extraction with `pdf-parse` and `mammoth`
  - [x] Chunking engine (~800 characters with 100 character overlap)
  - [x] MySQL FULLTEXT and keyword retrieval engine (`ragService.js`)
  - [x] Seeded and indexed `merge_sort.pdf` for `CSE202: Algorithms` by Dr. Anisur Rahman
  - [x] Grounded Gemini Teaching Assistant tutoring mode:
    - Step-by-step concept breakdown (Divide, Conquer, Combine)
    - Array dry-run tracing (`[12, 31, 25, 8, 32, 17, 40, 42]`)
    - Complexity citation ($O(n \log n)$ time, $O(n)$ space)
    - Interactive material cards in chat with download/view links
  - [x] Automated test suite: 24 tests passing (18 logic/advising + 6 materials & RAG)

- [x] **Increment 4: Scheduling + Escalation**
  - [x] Advisor slots table and management API (`advisor_slots`)
  - [x] In-chat slot browsing and one-click interactive appointment booking
  - [x] Faculty advising portal (`/dashboard/teacher`) with session queue, notes, and approval
  - [x] Smart escalation engine (auto-escalation after repeated confusion or student request)
  - [x] Official academic advising summary report exporter (`.txt` formatted report)

- [x] **Increment 5: Progress + Analytics**
  - [x] Student progress visualization with Recharts (`/dashboard/student/progress`):
    - Semester GPA trajectory line chart
    - Coursework & assignment status bar chart
    - Degree level (Year 1 - Year 4) completion progress bars
  - [x] Chat query *"How is my progress?"* with instant stats and deep-link
  - [x] Department Admin Console (`/dashboard/admin`):
    - User management & faculty advisor verification toggle
    - Curriculum course registry
    - Chatbot interaction and resolution rate analytics

- [x] **Increment 6: Polish & Verification**
  - [x] Security middleware: Helmet, CORS, Express rate limiting, parameterized queries
  - [x] Automated logic test suite (`backend/scripts/testLogic.js`)
  - [x] Full `README.md` with system overview, demo credentials, and 5-step test script

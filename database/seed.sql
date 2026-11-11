-- EduBot Seed Data for GSTU CSE Department
USE edubot_db;

-- Clear previous data in correct order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE escalations;
TRUNCATE TABLE chat_logs;
TRUNCATE TABLE submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE material_chunks;
TRUNCATE TABLE materials;
TRUNCATE TABLE advising_sessions;
TRUNCATE TABLE advisor_slots;
TRUNCATE TABLE enrollment_records;
TRUNCATE TABLE courses;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users (Password is 'Password123!' hashed with bcrypt: $2a$10$wT6/3hY2s5N3H/vQvjU3s.uWkX2O0oB1L8nZ3B.xZ9gOqRz7JkCaa)
-- We will also update these via seed.js to ensure bcrypt compatibility
INSERT INTO users (user_id, name, email, password, role, verified) VALUES
(1, 'Dr. Mahbubul Alam (Dept Head)', 'admin@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'admin', 1),
(2, 'Dr. Anisur Rahman', 'dr.rahman@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'teacher', 1),
(3, 'Prof. Fatima Tuz Zohra', 'prof.fatima@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'teacher', 1),
(4, 'Tanvir Hasan', 'student1@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'student', 1),
(5, 'Nusrat Jahan', 'student2@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'student', 1),
(6, 'Rakibul Islam', 'student3@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'student', 1),
(7, 'Sabrina Akter', 'student4@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'student', 1),
(8, 'Farhan Ahmed', 'student5@gstu.edu.bd', '$2a$10$7vMkWb7f0eZ5c9i4E4uL6.w6T0I5Ld7jK.gGkYQpY5yU1oK3wzTye', 'student', 1);

-- 2. Insert Student Profiles
INSERT INTO student_profiles (student_id, user_id, cgpa, department, completed_credits, semester, student_reg_no) VALUES
(1, 4, 3.82, 'CSE', 60.0, 5, 'ASH2101001M'),
(2, 5, 3.65, 'CSE', 45.0, 4, 'ASH2101002F'),
(3, 6, 2.85, 'CSE', 30.0, 3, 'ASH2201015M'),
(4, 7, 3.94, 'CSE', 110.0, 8, 'ASH2001005F'),
(5, 8, 3.20, 'CSE', 15.0, 2, 'ASH2301030M');

-- 3. Insert Courses (17 Courses with Prerequisites)
INSERT INTO courses (course_id, code, title, credits, department, level, prerequisite_code, description) VALUES
(1, 'CSE101', 'Introduction to Computer Systems', 3.0, 'CSE', 1, NULL, 'Fundamental concepts of computer architecture, operating principles, and number systems.'),
(2, 'CSE102', 'Structured Programming Language', 3.0, 'CSE', 1, NULL, 'C programming fundamentals, pointers, memory allocation, structures, and file I/O.'),
(3, 'CSE103', 'Discrete Mathematics', 3.0, 'CSE', 1, NULL, 'Set theory, propositional logic, graph theory, combinatorics, and induction proofs.'),
(4, 'CSE104', 'Data Structures', 3.0, 'CSE', 1, 'CSE102', 'Arrays, linked lists, stacks, queues, trees, heaps, hash tables, and graphs.'),
(5, 'CSE201', 'Object Oriented Programming', 3.0, 'CSE', 2, 'CSE102', 'OOP concepts using Java/C++, encapsulation, inheritance, polymorphism, and design patterns.'),
(6, 'CSE202', 'Algorithms', 3.0, 'CSE', 2, 'CSE104', 'Divide and conquer, greedy methods, dynamic programming, shortest paths, and complexity analysis.'),
(7, 'CSE203', 'Digital Logic Design', 3.0, 'CSE', 2, 'CSE101', 'Boolean algebra, combinational circuits, sequential circuits, flip-flops, and counters.'),
(8, 'CSE204', 'Database Management Systems', 3.0, 'CSE', 2, 'CSE104', 'Relational data model, SQL, normalization, transactions, concurrency, and indexing.'),
(9, 'CSE301', 'Computer Architecture', 3.0, 'CSE', 3, 'CSE203', 'Instruction set architecture, pipelining, cache memory hierarchy, and multiprocessing.'),
(10, 'CSE302', 'Operating Systems', 3.0, 'CSE', 3, 'CSE202', 'Process scheduling, threads, synchronization, deadlock, virtual memory, and file systems.'),
(11, 'CSE303', 'Software Engineering', 3.0, 'CSE', 3, 'CSE201', 'SDLC models, agile development, software testing, requirement analysis, and UML.'),
(12, 'CSE304', 'Computer Networks', 3.0, 'CSE', 3, 'CSE302', 'OSI and TCP/IP stack, routing protocols, TCP congestion control, and network security.'),
(13, 'CSE401', 'Artificial Intelligence', 3.0, 'CSE', 4, 'CSE202', 'State-space search, heuristics, game playing, minimax, knowledge representation, and probabilistic reasoning.'),
(14, 'CSE402', 'Compiler Design', 3.0, 'CSE', 4, 'CSE202', 'Lexical analysis, syntax parsing, semantic analysis, intermediate representation, and optimization.'),
(15, 'CSE403', 'Machine Learning', 3.0, 'CSE', 4, 'CSE401', 'Supervised and unsupervised learning, regression, classification, neural networks, and deep learning.'),
(16, 'CSE404', 'Distributed Systems & Cloud Computing', 3.0, 'CSE', 4, 'CSE304', 'Consensus algorithms, MapReduce, microservices, containerization, and AWS/cloud platforms.'),
(17, 'CSE499', 'Senior Capstone Project / Thesis', 6.0, 'CSE', 4, 'CSE303', 'Year-long graduation research and capstone development project under faculty supervision.');

-- 4. Insert Enrollment Records
-- Student 1 (Tanvir Hasan - 5th semester, completed 60 credits: 20 courses or level 1 & 2)
INSERT INTO enrollment_records (student_id, course_id, grade, semester) VALUES
(1, 1, 'A+', 'Fall 2023'),
(1, 2, 'A',  'Fall 2023'),
(1, 3, 'A-', 'Fall 2023'),
(1, 4, 'A+', 'Spring 2024'),
(1, 5, 'A',  'Spring 2024'),
(1, 6, 'A',  'Fall 2024'),
(1, 7, 'B+', 'Fall 2024'),
(1, 8, 'A+', 'Spring 2025'),
(1, 9, 'IP', 'Fall 2025'), -- In progress CSE301
(1, 10, 'IP', 'Fall 2025'); -- In progress CSE302

-- Student 2 (Nusrat Jahan - 4th semester)
INSERT INTO enrollment_records (student_id, course_id, grade, semester) VALUES
(2, 1, 'A',  'Fall 2023'),
(2, 2, 'A-', 'Fall 2023'),
(2, 3, 'B+', 'Fall 2023'),
(2, 4, 'A',  'Spring 2024'),
(2, 5, 'B+', 'Spring 2024'),
(2, 6, 'IP', 'Fall 2024'),
(2, 7, 'B',  'Fall 2024');

-- Student 3 (Rakibul Islam - 3rd semester, struggles with CSE104)
INSERT INTO enrollment_records (student_id, course_id, grade, semester) VALUES
(3, 1, 'B',  'Fall 2023'),
(3, 2, 'C+', 'Fall 2023'),
(3, 3, 'B-', 'Fall 2023'),
(3, 4, 'F',  'Spring 2024'), -- Failed CSE104, cannot take CSE202 or CSE204 yet!
(3, 5, 'C',  'Spring 2024');

-- Student 4 (Sabrina Akter - 8th semester, almost done)
INSERT INTO enrollment_records (student_id, course_id, grade, semester) VALUES
(4, 1, 'A+', 'Fall 2021'),
(4, 2, 'A+', 'Fall 2021'),
(4, 3, 'A',  'Fall 2021'),
(4, 4, 'A+', 'Spring 2022'),
(4, 5, 'A+', 'Spring 2022'),
(4, 6, 'A+', 'Fall 2022'),
(4, 7, 'A',  'Fall 2022'),
(4, 8, 'A+', 'Spring 2023'),
(4, 9, 'A',  'Fall 2023'),
(4, 10, 'A+', 'Fall 2023'),
(4, 11, 'A+', 'Spring 2024'),
(4, 12, 'A',  'Spring 2024'),
(4, 13, 'A+', 'Fall 2024'),
(4, 14, 'A',  'Fall 2024'),
(4, 17, 'IP', 'Fall 2025');

-- Student 5 (Farhan Ahmed - 2nd semester)
INSERT INTO enrollment_records (student_id, course_id, grade, semester) VALUES
(5, 1, 'A-', 'Spring 2025'),
(5, 2, 'B+', 'Spring 2025'),
(5, 3, 'B',  'Spring 2025'),
(5, 4, 'IP', 'Fall 2025');

-- 5. Insert Advisor Slots
INSERT INTO advisor_slots (slot_id, advisor_id, start_time, end_time, is_booked) VALUES
(1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 30 MINUTE), 0),
(2, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 30 MINUTE), 0),
(3, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 30 MINUTE), 0),
(4, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 30 MINUTE), 0);

-- 6. Insert Assignments
INSERT INTO assignments (assignment_id, course_id, title, description, deadline, total_marks) VALUES
(1, 6, 'Algorithm Analysis - Dynamic Programming', 'Implement Longest Common Subsequence and 0/1 Knapsack in C++ or Python.', DATE_ADD(NOW(), INTERVAL 5 DAY), 100.0),
(2, 8, 'Database Design & SQL Normalization', 'Design 3NF Schema for a University Hospital System with complex queries.', DATE_ADD(NOW(), INTERVAL 7 DAY), 100.0),
(3, 10, 'OS Process Synchronization Simulation', 'Solve the Dining Philosophers Problem using semaphores and mutex locks.', DATE_ADD(NOW(), INTERVAL 10 DAY), 100.0),
(4, 11, 'Software Requirements Specification (SRS)', 'Produce an IEEE-830 standard SRS document for an EduTech web platform.', DATE_ADD(NOW(), INTERVAL 14 DAY), 100.0);

-- 7. Insert Submissions
INSERT INTO submissions (assignment_id, student_id, status, marks, feedback) VALUES
(1, 1, 'graded', 95.0, 'Excellent DP formulation and time complexity analysis.'),
(2, 1, 'submitted', NULL, NULL),
(1, 2, 'graded', 88.0, 'Good implementation, minor edge case missed in knapsack.'),
(2, 2, 'submitted', NULL, NULL),
(3, 4, 'graded', 98.0, 'Flawless deadlock-free semaphore implementation.');

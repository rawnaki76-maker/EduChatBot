-- EduBot Database Schema
-- GSTU CSE Department AI Academic Assistant

CREATE DATABASE IF NOT EXISTS edubot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edubot_db;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    cgpa DECIMAL(3, 2) DEFAULT 0.00,
    department VARCHAR(50) DEFAULT 'CSE',
    completed_credits DECIMAL(5, 1) DEFAULT 0.0,
    semester INT DEFAULT 1,
    student_reg_no VARCHAR(50) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    credits DECIMAL(3, 1) NOT NULL DEFAULT 3.0,
    department VARCHAR(50) NOT NULL DEFAULT 'CSE',
    level INT NOT NULL DEFAULT 1, -- 1=1st year, 2=2nd year, 3=3rd year, 4=4th year
    prerequisite_code VARCHAR(20) DEFAULT NULL,
    instructor_name VARCHAR(100) DEFAULT 'Dr. Anisur Rahman',
    instructor_designation VARCHAR(100) DEFAULT 'Associate Professor & Academic Advisor',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enrollment records table
CREATE TABLE IF NOT EXISTS enrollment_records (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    grade VARCHAR(5) DEFAULT NULL, -- 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'IP' (in progress)
    semester VARCHAR(20) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE RESTRICT
);

-- 5. Advisor available slots
CREATE TABLE IF NOT EXISTS advisor_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    advisor_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Advising sessions
CREATE TABLE IF NOT EXISTS advising_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    advisor_id INT NOT NULL,
    slot_id INT DEFAULT NULL,
    status ENUM('pending', 'approved', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES advisor_slots(slot_id) ON DELETE SET NULL
);

-- 7. Course materials table
CREATE TABLE IF NOT EXISTS materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type ENUM('pdf', 'docx', 'link', 'note') NOT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    link_url VARCHAR(500) DEFAULT NULL,
    extracted_text LONGTEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. Material chunks for RAG Knowledge Base
CREATE TABLE IF NOT EXISTS material_chunks (
    chunk_id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    course_id INT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_chunk_text (chunk_text),
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 9. Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline DATETIME NOT NULL,
    total_marks DECIMAL(5, 2) DEFAULT 100.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 10. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('submitted', 'pending', 'late', 'graded') NOT NULL DEFAULT 'submitted',
    marks DECIMAL(5, 2) DEFAULT NULL,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE
);

-- 11. Chat logs table
CREATE TABLE IF NOT EXISTS chat_logs (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE
);

-- 12. Escalations table
CREATE TABLE IF NOT EXISTS escalations (
    escalation_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    advisor_id INT DEFAULT NULL,
    status ENUM('open', 'in_progress', 'resolved') NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    FOREIGN KEY (chat_id) REFERENCES chat_logs(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

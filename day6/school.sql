-- ============================================================
-- Day 6 assignment: school.sql
-- Runs cleanly in an SQLite playground (e.g. sqliteonline.com)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Drop in dependency order so the script is re-runnable
-- ------------------------------------------------------------
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;

-- ------------------------------------------------------------
-- STUDENTS
-- ------------------------------------------------------------
CREATE TABLE students (
    student_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,     -- unique email rule
    date_of_birth DATE                          -- ISO 'YYYY-MM-DD'
);

-- ------------------------------------------------------------
-- COURSES
-- ------------------------------------------------------------
CREATE TABLE courses (
    course_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    credits      INTEGER NOT NULL CHECK (credits > 0)
);

-- ------------------------------------------------------------
-- ENROLMENTS (join table: student >--< course, holds the grade)
-- ------------------------------------------------------------
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER NOT NULL,
    course_id    INTEGER NOT NULL,
    grade        REAL,                          -- NULL until graded
    enrolled_on  DATE    NOT NULL DEFAULT (DATE('now')),

    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(course_id)
        ON DELETE CASCADE,

    -- rule: a student cannot enrol on the same course twice
    UNIQUE (student_id, course_id),

    CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
);

-- ------------------------------------------------------------
-- SAMPLE DATA
-- ------------------------------------------------------------
INSERT INTO students (name, email, date_of_birth) VALUES
    ('Alice Johnson',  'alice@example.com',   '2001-03-14'),
    ('Ben Carter',     'ben@example.com',     '2000-11-02'),
    ('Chloe Nguyen',   'chloe@example.com',   '2002-07-21'),
    ('Daniel Okafor',  'daniel@example.com',  '2001-09-30');   -- no enrolments

INSERT INTO courses (title, credits) VALUES
    ('Introduction to SQL',    10),
    ('Web Development',        15),
    ('Data Structures',        20);

-- 5 enrolments (Alice is on two courses; Ben on two; Chloe on one)
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 85.0),   -- Alice   → Intro to SQL
    (1, 2, 78.5),   -- Alice   → Web Dev
    (2, 1, 62.0),   -- Ben     → Intro to SQL
    (2, 3, NULL),   -- Ben     → Data Structures (not graded yet)
    (3, 2, 91.0);   -- Chloe   → Web Dev

-- ------------------------------------------------------------
-- QUERY 1: all courses for one student (by name)
-- ------------------------------------------------------------
SELECT s.name AS student, c.title AS course, e.grade
FROM   students   s
JOIN   enrolments e ON e.student_id = s.student_id
JOIN   courses    c ON c.course_id  = e.course_id
WHERE  s.name = 'Alice Johnson'
ORDER BY c.title;

-- ------------------------------------------------------------
-- QUERY 2: all students on one course
-- ------------------------------------------------------------
SELECT c.title AS course, s.name AS student, e.grade
FROM   courses    c
JOIN   enrolments e ON e.course_id  = c.course_id
JOIN   students   s ON s.student_id = e.student_id
WHERE  c.title = 'Introduction to SQL'
ORDER BY s.name;

-- ------------------------------------------------------------
-- QUERY 3: number of students per course
-- (LEFT JOIN so courses with zero enrolments still show 0)
-- ------------------------------------------------------------
SELECT c.title          AS course,
       COUNT(e.student_id) AS student_count
FROM   courses    c
LEFT JOIN enrolments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title
ORDER BY student_count DESC, c.title;

-- ------------------------------------------------------------
-- QUERY 4: students who have no enrolments
-- (LEFT JOIN + IS NULL — the standard anti-join in SQLite)
-- ------------------------------------------------------------
SELECT s.student_id, s.name, s.email
FROM   students   s
LEFT JOIN enrolments e ON e.student_id = s.student_id
WHERE  e.enrolment_id IS NULL;

-- ------------------------------------------------------------
-- QUERY 5: update one enrolment's grade
-- (Ben's Data Structures enrolment, enrolment_id = 4)
-- ------------------------------------------------------------
UPDATE enrolments
SET    grade = 74.0
WHERE  enrolment_id = 4
  AND  grade IS NULL;

-- Show the result so you can verify the update
SELECT e.enrolment_id, s.name AS student, c.title AS course, e.grade
FROM   enrolments e
JOIN   students   s ON s.student_id = e.student_id
JOIN   courses    c ON c.course_id  = e.course_id
ORDER BY e.enrolment_id;

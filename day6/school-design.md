# School Database — Design Notes

## Tables

**students**
One row per person enrolled at the school. `student_id` is the surrogate
primary key; `name` and `email` are `NOT NULL`, and `email` carries a
`UNIQUE` constraint so two students can never share an address.
`date_of_birth` is optional.

**courses**
One row per course offered. `course_id` is the primary key, `title` is
`NOT NULL`, and `credits` is `NOT NULL` with a `CHECK (credits > 0)` so a
course can never have zero or negative credit value.

**enrolments**
The join table. Each row records that a particular student is enrolled on
a particular course, and carries the `grade` (nullable until marked) and the
`enrolled_on` date. It has two foreign keys — `student_id → students` and
`course_id → courses`, both `ON DELETE CASCADE` — plus a composite
`UNIQUE (student_id, course_id)` that enforces the business rule *"a student
may not enrol on the same course twice."*

## Relationships

- **students 1 ──< enrolments** (one-to-many): one student has many
  enrolment rows, but each enrolment row belongs to exactly one student.
- **courses 1 ──< enrolments** (one-to-many): one course has many enrolment
  rows, but each enrolment row belongs to exactly one course.
- **students >──< courses** (many-to-many): a student takes many courses and
  a course has many students. A relational database cannot store a
  many-to-many relationship in a single column, so we need a **join table**
  (`enrolments`) whose rows are exactly the `(student_id, course_id)` pairs.
  The join table also gives us a natural place to hang per-enrolment
  attributes such as the grade and the enrolment date, which belong to the
  *relationship* rather than to either entity on its own.

## Index to add

```sql
CREATE INDEX idx_enrolments_course ON enrolments(course_id);


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

Reason: SQLite automatically creates an index on student_id for the
composite UNIQUE (student_id, course_id) (a UNIQUE on a multi-column key
creates an index whose leftmost column is student_id), so lookups by
student are already fast. There is no index whose leftmost column is
course_id, yet "all students on one course" (Query 2) and "students per
course" (Query 3) both filter/group by course_id. Adding this index turns
those into index scans instead of full table scans, and it scales
linearly better as the enrolments table grows.

SQL or NoSQL?
I would choose SQL for this system. The data is inherently relational
and highly structured: students, courses and the enrolments that link them
are a textbook many-to-many, and the five required reports are all
join-and-aggregate queries (JOIN, GROUP BY, LEFT JOIN anti-joins) that
a relational engine expresses in one line and optimises automatically. The
integrity rules matter here too — foreign keys stop orphaned enrolments,
UNIQUE(student_id, course_id) stops a double enrolment, and CHECK
constraints keep grades and credits sane. These are exactly the guarantees
a relational database gives for free and a document store would have to
re-implement in application code. The schema is stable and the volume is
modest, so there is no compelling scale or schema-flexibility argument for
NoSQL; a document store would mostly buy us hand-rolled referential
integrity and awkward many-to-many modelling in exchange for flexibility we
don't need.
# Library API — Books Resource

A RESTful design for a library's **books** resource.  
Base URL: `https://api.example-library.com/v1`

---

## Endpoints

### 1. List all books
- **Method:** `GET`
- **Path:** `/books`
- **Description:** Retrieve a list of all books in the library.
- **Example request body:** *None*
- **Success status:** `200 OK`

---

### 2. Get a single book
- **Method:** `GET`
- **Path:** `/books/{id}`
- **Description:** Retrieve the details of one specific book by its ID.
- **Example request body:** *None*
- **Success status:** `200 OK`

---

### 3. Create a new book
- **Method:** `POST`
- **Path:** `/books`
- **Description:** Add a new book to the library collection.
- **Example request body:**
  ```json
  {
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt",
    "isbn": "978-0201616224",
    "publishedYear": 1999,
    "genre": "Software Engineering"
  }
Success status: 201 Created

4. Update a book (full replacement)
Method: PUT

Path: /books/{id}

Description: Replace all fields of an existing book with the provided data.

Example request body:
{
  "title": "The Pragmatic Programmer (2nd Edition)",
  "author": "Andrew Hunt & David Thomas",
  "isbn": "978-0135957059",
  "publishedYear": 2019,
  "genre": "Software Engineering"
}
Success status: 200 OK

5. Delete a book
Method: DELETE

Path: /books/{id}

Description: Remove a book from the library collection permanently.

Example request body: None

Success status: 204 No Content

6. List books by a specific author
Method: GET

Path: /books?author={authorName}

Description: Retrieve all books written by the specified author (case-insensitive match).

Example request body: None

Success status: 200 OK

Error responses
400 Bad Request
Returned when the request is malformed or missing required fields (e.g., creating a book without a title or author).

Example scenario:
POST /books with body { "title": "Unknown" } (missing author and isbn).
Response:
{
  "error": "Bad Request",
  "message": "Missing required fields: author, isbn",
  "status": 400
}

404 Not Found
Returned when a requested resource (book ID or author) does not exist.

Example scenario:
GET /books/99999 — no book with ID 99999 exists in the library.
Response:
{
  "error": "Not Found",
  "message": "Book with ID 99999 does not exist",
  "status": 404
}
Another example:
GET /books?author=NonexistentAuthor — no books match the query.
Response:

json
{
  "error": "Not Found",
  "message": "No books found for author 'NonexistentAuthor'",
  "status": 404
}


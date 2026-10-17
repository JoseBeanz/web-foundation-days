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

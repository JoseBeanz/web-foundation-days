// script.js
// Starting notes array (exactly as provided)
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word) -> array of notes whose text contains word (case-insensitive)
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

// 2. longestNote() -> note object with most characters, or null if empty
function longestNote() {
  if (notes.length === 0) return null;
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory() -> object counting notes per category
function countByCategory() {
  const counts = {};
  for (let note of notes) {
    const cat = note.category;
    if (counts[cat]) {
      counts[cat] += 1;
    } else {
      counts[cat] = 1;
    }
  }
  return counts;
}

// 4. getSummary() -> sentence like "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const total = notes.length;
  const counts = countByCategory();
  const categories = Object.keys(counts); // order: personal, work, study (insertion order)
  const parts = categories.map(cat => `${counts[cat]} ${cat}`);
  const noteWord = total === 1 ? "note" : "notes";
  return `${total} ${noteWord}: ${parts.join(", ")}.`;
}

// 5. isDuplicate(text) -> true if same text exists (ignore case and extra spaces)
function isDuplicate(text) {
  const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');
  const target = normalize(text);
  return notes.some(note => normalize(note.text) === target);
}

// 6. addNote(text, category) -> adds note if valid (1-200 chars, not duplicate, valid category)
//    returns true if added, false otherwise (logs reason)
function addNote(text, category) {
  // Check length (after trimming? The spec says "1–200 characters" — we'll trim to be safe)
  const trimmedText = text.trim();
  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log(`addNote failed: text length must be 1-200 characters (got ${trimmedText.length})`);
    return false;
  }

  // Check duplicate
  if (isDuplicate(trimmedText)) {
    console.log(`addNote failed: duplicate note "${trimmedText}"`);
    return false;
  }

  // Check category
  const validCategories = ['personal', 'work', 'study'];
  if (!validCategories.includes(category)) {
    console.log(`addNote failed: category "${category}" is not one of personal, work, study`);
    return false;
  }

  // All good — add note
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmedText, category });
  console.log(`addNote added: "${trimmedText}" (${category})`);
  return true;
}

// ---------- TESTING EVERY FUNCTION WITH CONSOLE.LOG ----------
// Each console.log includes expected output in a comment.

console.log('--- searchNotes tests ---');
console.log(searchNotes('milk'));                 // [ { id: 1, text: 'Buy milk and bread', category: 'personal' } ]
console.log(searchNotes('GRACE'));               // [ { id: 3, text: 'Email the project report to Grace', category: 'work' } ]
console.log(searchNotes('xyz'));                 // []   (edge case: no results)

console.log('\n--- longestNote tests ---');
console.log(longestNote());                      // { id: 3, text: 'Email the project report to Grace', category: 'work' } (longest: 37 chars)
// Edge case: empty array (temporarily override notes)
const originalNotes = notes;
notes = [];
console.log(longestNote());                      // null
notes = originalNotes;                           // restore

console.log('\n--- countByCategory tests ---');
console.log(countByCategory());                  // { personal: 2, work: 1, study: 2 }
// Edge case: empty array
notes = [];
console.log(countByCategory());                  // {}   (empty object)
notes = originalNotes;                           // restore

console.log('\n--- getSummary tests ---');
console.log(getSummary());                       // "5 notes: 2 personal, 1 work, 2 study."
// Edge case: single note
notes = [{ id: 1, text: 'Solo note', category: 'personal' }];
console.log(getSummary());                       // "1 note: 1 personal."
notes = originalNotes;                           // restore

console.log('\n--- isDuplicate tests ---');
console.log(isDuplicate('Buy milk and bread'));  // true (exact match)
console.log(isDuplicate('  buy   MILK and bread  ')); // true (case + extra spaces ignored)
console.log(isDuplicate('Nonexistent note'));   // false
// Edge case: empty string (normalization gives empty string, no match)
console.log(isDuplicate(''));                    // false

console.log('\n--- addNote tests ---');
// Normal case: valid, unique, correct category
console.log(addNote('Read a book', 'personal')); // true (logged reason "added")
console.log('Notes after add:', notes.map(n => n.text)); // includes 'Read a book'
// Edge case 1: duplicate
console.log(addNote('  buy milk and bread ', 'personal')); // false (duplicate)
// Edge case 2: too long (>200 chars)
const longText = 'a'.repeat(201);
console.log(addNote(longText, 'work'));          // false (length)
// Edge case 3: invalid category
console.log(addNote('Valid text', 'other'));     // false (category)
// Edge case 4: empty text (length < 1)
console.log(addNote('   ', 'study'));            // false (length)

// Final note count (after successful addNote of 'Read a book')
console.log('\n--- Final state ---');
console.log('Total notes:', notes.length);        // 6 (5 original + 1 added)
console.log('Summary:', getSummary());            // "6 notes: 3 personal, 1 work, 2 study." (depends on add)
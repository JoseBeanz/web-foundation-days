// ----------------------------------------------
// 1. Select all elements
// ----------------------------------------------
const textarea = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// character limit constants
const WARNING_THRESHOLD = 180;
const OVER_THRESHOLD = 200;

// localStorage keys
const DRAFT_KEY = 'noteDraft';
const THEME_KEY = 'preferredTheme';

// ----------------------------------------------
// 2. updateCounts() — update both counters + warning classes
// ----------------------------------------------
function updateCounts() {
  const text = textarea.value;
  const charLength = text.length;

  // count words: split on whitespace, filter out empty strings
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  // character counter display: "N / 200 characters"
  charCount.textContent = `${charLength} / ${OVER_THRESHOLD} characters`;

  // word counter display: "N words"
  wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;

  // remove old warning/over classes
  charCount.classList.remove('warning', 'over');

  // apply classes based on thresholds
  if (charLength > OVER_THRESHOLD) {
    charCount.classList.add('over');
  } else if (charLength > WARNING_THRESHOLD) {
    charCount.classList.add('warning');
  }
}

// ----------------------------------------------
// 3. Save draft to localStorage
// ----------------------------------------------
function saveDraft() {
  const text = textarea.value;
  if (text.trim() === '') {
    // if empty, remove the draft to keep things clean
    localStorage.removeItem(DRAFT_KEY);
  } else {
    localStorage.setItem(DRAFT_KEY, text);
  }
}

// ----------------------------------------------
// 4. Clear everything: textarea, counters, draft
// ----------------------------------------------
function clearEverything() {
  textarea.value = '';
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();        // reset counters
  textarea.focus();      // optional but nice
}

// ----------------------------------------------
// 5. Theme toggle: toggle body.dark, update label, save choice
// ----------------------------------------------
function toggleTheme() {
  const isDark = body.classList.toggle('dark');
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

// ----------------------------------------------
// 6. Restore saved draft and theme on page load
// ----------------------------------------------
function restoreState() {
  // --- restore draft ---
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft !== null) {
    textarea.value = savedDraft;
  }

  // --- restore theme ---
  const savedTheme = localStorage.getItem(THEME_KEY); // 'dark' or 'light'
  if (savedTheme === 'dark') {
    body.classList.add('dark');
    themeToggle.textContent = 'Light mode';   // because dark is active
  } else {
    body.classList.remove('dark');
    themeToggle.textContent = 'Dark mode';
  }

  // always update counts after restoring text
  updateCounts();
}

// ----------------------------------------------
// 7. Event listeners
// ----------------------------------------------

// input event: update counts + save draft
textarea.addEventListener('input', () => {
  updateCounts();
  saveDraft();
});

// Clear button
clearBtn.addEventListener('click', clearEverything);

// Theme toggle button
themeToggle.addEventListener('click', toggleTheme);

// Escape key inside textarea clears everything
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();   // prevent any default behaviour (none typical, but safe)
    clearEverything();
  }
});

// ----------------------------------------------
// 8. Initialise on page load
// ----------------------------------------------
restoreState();
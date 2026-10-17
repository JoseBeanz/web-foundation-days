// users.js
// Async user directory with filtering, loading states and error handling.

const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusEl = document.getElementById('status');
const usersList = document.getElementById('users-list');

// Store loaded users (array)
let allUsers = [];

// Helper to set status message with a class
function setStatus(message, type = 'neutral') {
  statusEl.textContent = message;
  statusEl.className = ''; // reset
  if (type === 'loading') statusEl.classList.add('status-loading');
  else if (type === 'success') statusEl.classList.add('status-success');
  else if (type === 'error') statusEl.classList.add('status-error');
  else statusEl.classList.add('status-neutral');
}

// Render a list of user objects into the <ul>
function renderUsers(list) {
  usersList.innerHTML = ''; // clear

  if (!list || list.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-message';
    emptyItem.textContent = 'No users match your filter.';
    usersList.appendChild(emptyItem);
    return;
  }

  for (const user of list) {
    const card = document.createElement('li');
    card.className = 'user-card';

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'user-name';
    nameEl.textContent = user.name;
    card.appendChild(nameEl);

    // Email
    const emailEl = document.createElement('div');
    emailEl.className = 'user-email';
    emailEl.textContent = user.email;
    card.appendChild(emailEl);

    // City
    const cityEl = document.createElement('div');
    cityEl.className = 'user-city';
    // Safely access city from nested address
    const city = user.address?.city ?? '—';
    cityEl.textContent = `📍 ${city}`;
    card.appendChild(cityEl);

    // Company name
    const companyEl = document.createElement('div');
    companyEl.className = 'user-company';
    const company = user.company?.name ?? '—';
    companyEl.textContent = `🏢 ${company}`;
    card.appendChild(companyEl);

    usersList.appendChild(card);
  }
}

// Apply filter based on current input and stored users
function applyFilter() {
  const term = filterInput.value.trim().toLowerCase();
  if (!term) {
    // no filter → show all users
    renderUsers(allUsers);
    // update status if users are loaded (do not override error/loading)
    if (allUsers.length > 0) {
      setStatus(`Showing all ${allUsers.length} users.`, 'success');
    } else if (allUsers.length === 0) {
      // if never loaded, keep neutral or empty
      if (statusEl.textContent === '' || statusEl.classList.contains('status-neutral')) {
        // do nothing – status is already neutral
      }
    }
    return;
  }

  // filter by name (case-insensitive)
  const filtered = allUsers.filter(user =>
    user.name.toLowerCase().includes(term)
  );

  renderUsers(filtered);

  if (filtered.length === 0) {
    // renderUsers already shows "No users match your filter." inside the list
    setStatus(`No users match "${filterInput.value.trim()}".`, 'neutral');
  } else {
    setStatus(`Showing ${filtered.length} user${filtered.length > 1 ? 's' : ''} matching "${filterInput.value.trim()}".`, 'success');
  }
}

// Main async function to fetch and display users
async function loadUsers() {
  // Reset stored array and list while loading
  allUsers = [];
  usersList.innerHTML = '';
  loadBtn.disabled = true;
  setStatus('Loading users…', 'loading');

  try {
    // Use a valid URL — if you want to test error path, temporarily change to a broken URL
    const response = await fetch('https://jsonplaceholder.typicode.com/users');

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format: expected an array of users');
    }

    allUsers = data;

    // Render all users
    renderUsers(allUsers);

    // Apply filter if there is already text in the filter box
    const currentFilter = filterInput.value.trim();
    if (currentFilter) {
      applyFilter(); // this will also set a filtered status
    } else {
      setStatus(`✅ Loaded ${allUsers.length} users successfully.`, 'success');
    }

  } catch (error) {
    console.error('Failed to load users:', error);
    setStatus(`❌ Failed to load users: ${error.message}`, 'error');
    usersList.innerHTML = ''; // clear list on error
    const errorItem = document.createElement('li');
    errorItem.className = 'empty-message';
    errorItem.textContent = 'Could not load users. Please try again.';
    usersList.appendChild(errorItem);
  } finally {
    loadBtn.disabled = false;
  }
}

// Event listeners
loadBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', () => {
  // If no users loaded yet, we cannot filter — show gentle hint
  if (allUsers.length === 0 && !statusEl.classList.contains('status-error')) {
    const rawTerm = filterInput.value.trim();
    if (rawTerm !== '') {
      setStatus('No users loaded yet. Click "Load users" first.', 'neutral');
    } else {
      // empty input and no users
      setStatus('', 'neutral');
    }
    // Also update the empty list message if no users
    if (allUsers.length === 0) {
      usersList.innerHTML = '';
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-message';
      emptyItem.textContent = 'No users loaded.';
      usersList.appendChild(emptyItem);
    }
    return;
  }

  // If we have users, apply filter using stored array
  if (allUsers.length > 0) {
    applyFilter();
  } else {
    // no users loaded and not an error — keep neutral
    if (!statusEl.classList.contains('status-error')) {
      setStatus('No users loaded. Click "Load users".', 'neutral');
    }
  }
});

// Initialize list with a friendly empty message (no users loaded yet)
(function initializeEmptyList() {
  usersList.innerHTML = '';
  const emptyItem = document.createElement('li');
  emptyItem.className = 'empty-message';
  emptyItem.textContent = 'No users loaded. Click "Load users" to start.';
  usersList.appendChild(emptyItem);
  setStatus('Ready. Click "Load users".', 'neutral');
})();


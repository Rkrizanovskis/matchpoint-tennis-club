// Matchpoint Tennis Club — application logic (Firebase modular SDK v10).
// Single source of truth: Firestore. No localStorage fallback — if the server
// can't be reached we show a clear error and block writes rather than silently
// saving to a local-only copy that never syncs.
//
// The schedule shape (days, slots, coaches, default roster) lives in
// season-config.js — edit that file to change seasons.

import {
  db, firebaseReady,
  collection, doc,
  getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, where, orderBy, limit,
  runTransaction, writeBatch, serverTimestamp
} from './firebase-init.js';

import {
  TIME_SLOTS, DAYS, RENDER_DAYS, BOOKABLE_DAYS, MAX_CAPACITY,
  DEFAULT_PLAYERS, DEFAULT_TEMPLATE, slotNote
} from './season-config.js';

console.log('Tennis app (Firebase v10 modular) loading...');

// ---- App state -------------------------------------------------------------
let isAuthenticated = false;
let connectionOk = false;
let currentWeekOffset = 0;
let currentBookingSlot = null;
let currentEditingPlayer = null;

let unsubPlayers = null;
let unsubSchedule = null;
let unsubMessages = null;

// ---- Data ------------------------------------------------------------------
let players = DEFAULT_PLAYERS.map((p) => ({ ...p }));
let schedule = {};
resetScheduleSkeleton();

// Small helpers driven by the season config.
const dayOffset = (day) => DAYS[day].offset;
const instructorFor = (day) => DAYS[day].instructor;

// Rebuild the in-memory schedule for the current week to a known empty state.
function resetScheduleSkeleton() {
  schedule = {};
  RENDER_DAYS.forEach((day) => {
    schedule[day] = {};
    TIME_SLOTS.forEach((time) => {
      const note = slotNote(day, time);
      if (note) {
        schedule[day][time] = { players: [], maxCapacity: 0, note, unavailable: true };
      } else if (DAYS[day].available) {
        schedule[day][time] = { players: [], maxCapacity: MAX_CAPACITY, instructor: instructorFor(day) };
      } else {
        schedule[day][time] = { players: [], maxCapacity: MAX_CAPACITY, unavailable: true };
      }
    });
  });
}

// ---- Date helpers ----------------------------------------------------------
function getSessionId(date, day, time) { return `${date}-${day}-${time}`; }

function formatDateForId(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStartDate(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // adjust to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekEndDate(weekOffset = 0) {
  const monday = getWeekStartDate(weekOffset);
  const end = new Date(monday);
  end.setDate(monday.getDate() + 3); // through Thursday
  end.setHours(23, 59, 59, 999);
  return end;
}

function dateForDay(weekOffset, day) {
  const weekStart = getWeekStartDate(weekOffset);
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + dayOffset(day));
  return d;
}

function getInitialWeekOffset() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (day === 5 || day === 6 || day === 0) return 1;            // Fri/Sat/Sun -> next week
  if (day === 4 && (hour > 20 || (hour === 20 && minute >= 30))) return 1; // Thu late -> next week
  return 0;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateWeekDisplay() {
  const weekStart = getWeekStartDate(currentWeekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 3);
  const el = document.getElementById('currentWeek');
  if (el) el.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// ---- Connection / error handling ------------------------------------------
function showConnectionError() {
  connectionOk = false;
  const ls = document.getElementById('loadingScreen');
  if (ls) {
    ls.style.display = 'flex';
    ls.innerHTML = `
      <div class="loading-content">
        <div class="loading-logo">
          <div class="tennis-ball-bounce">🎾</div>
          <h1>Matchpoint Tennis Club</h1>
        </div>
        <div class="loading-message">
          <div class="loading-text" style="color:#ffb84d;font-weight:600">Can't reach the club server.</div>
          <div style="margin-top:8px;opacity:.85">Please check your internet connection. Your changes were not saved.</div>
          <button class="btn" style="margin-top:18px" onclick="location.reload()">Reload</button>
        </div>
      </div>`;
  }
  const main = document.getElementById('mainApp');
  if (main) main.style.display = 'none';
}

// ---- Real-time listeners ---------------------------------------------------
function setupPlayersListener() {
  if (unsubPlayers) unsubPlayers();
  unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
    players = [];
    snapshot.forEach((d) => players.push({ id: d.id, ...d.data() }));
    if (isAuthenticated) { loadPlayers(); renderSchedule(); }
  }, (error) => {
    console.error('Players listener error:', error);
    showConnectionError();
  });
}

function setupScheduleListener() {
  const weekStart = getWeekStartDate(currentWeekOffset);
  const weekEnd = getWeekEndDate(currentWeekOffset);

  if (unsubSchedule) unsubSchedule();

  // Immediately clear to a skeleton so we never flash the previous week's data
  // while the new week's snapshot is still in flight (fixes the render race).
  resetScheduleSkeleton();
  if (isAuthenticated) renderSchedule();

  const q = query(
    collection(db, 'schedules'),
    where('date', '>=', formatDateForId(weekStart)),
    where('date', '<=', formatDateForId(weekEnd))
  );

  unsubSchedule = onSnapshot(q, (snapshot) => {
    resetScheduleSkeleton();
    snapshot.forEach((d) => {
      const data = d.data();
      const { day, time } = data;
      if (BOOKABLE_DAYS.includes(day) && !slotNote(day, time) && schedule[day] && schedule[day][time]) {
        schedule[day][time] = {
          players: data.players || [],
          maxCapacity: data.maxCapacity || MAX_CAPACITY,
          instructor: instructorFor(day)
        };
      }
    });
    if (isAuthenticated) renderSchedule();
  }, (error) => {
    console.error('Schedule listener error:', error);
    showConnectionError();
  });
}

// ---- One-time seeding ------------------------------------------------------
async function initializeFirebaseData() {
  const playersSnapshot = await getDocs(collection(db, 'players'));
  if (playersSnapshot.empty) {
    console.log('🔧 Seeding default players...');
    const batch = writeBatch(db);
    DEFAULT_PLAYERS.forEach((player) => {
      batch.set(doc(db, 'players', player.id), {
        name: player.name,
        skillLevel: player.skillLevel,
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  }
  await initializeWeekSchedule(currentWeekOffset);
}

// ---- Season template -------------------------------------------------------
async function getSeasonTemplate() {
  const snap = await getDoc(doc(db, 'seasonTemplate', 'default'));
  return snap.exists() ? snap.data() : null;
}

async function saveSeasonTemplate(weekOffset = 0) {
  const template = {};
  for (const day of BOOKABLE_DAYS) {
    template[day] = {};
    for (const time of TIME_SLOTS) {
      if (slotNote(day, time)) continue; // skip informational slots
      const sessionId = getSessionId(formatDateForId(dateForDay(weekOffset, day)), day, time);
      const snap = await getDoc(doc(db, 'schedules', sessionId));
      template[day][time] = {
        players: snap.exists() ? (snap.data().players || []) : [],
        instructor: instructorFor(day)
      };
    }
  }
  await setDoc(doc(db, 'seasonTemplate', 'default'), {
    ...template,
    createdAt: serverTimestamp(),
    sourceWeek: formatDateForId(getWeekStartDate(weekOffset))
  });
  console.log('✅ Season template saved');
  return true;
}

async function initializeWeekSchedule(weekOffset) {
  const template = await getSeasonTemplate();
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const day of BOOKABLE_DAYS) {
    const dateStr = formatDateForId(dateForDay(weekOffset, day));
    for (const time of TIME_SLOTS) {
      if (slotNote(day, time)) continue; // no booking doc for note slots
      const sessionId = getSessionId(dateStr, day, time);
      const ref = doc(db, 'schedules', sessionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const defaultPlayers = template?.[day]?.[time]?.players || [];
        batch.set(ref, {
          date: dateStr, day, instructor: instructorFor(day), time,
          players: defaultPlayers, maxCapacity: MAX_CAPACITY, locked: false,
          lastUpdated: serverTimestamp()
        });
        hasWrites = true;
      }
    }
  }

  if (hasWrites) {
    await batch.commit();
    console.log('📅 Week schedule initialised');
  }
}

// ---- Auth / app boot -------------------------------------------------------
function login() {
  const password = document.getElementById('passwordInput').value;
  const errorDiv = document.getElementById('loginError');
  if (password === '30:Love' || password === '30:love') {
    isAuthenticated = true;
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'flex';
    initializeAppWithLoading();
  } else {
    errorDiv.textContent = 'Incorrect password. Please try again.';
  }
}

function logout() {
  isAuthenticated = false;
  if (unsubPlayers) { unsubPlayers(); unsubPlayers = null; }
  if (unsubSchedule) { unsubSchedule(); unsubSchedule = null; }
  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').textContent = '';
}

async function initializeAppWithLoading() {
  updateLoadingStep('firebase', 'active');
  updateLoadingText('🔥 Connecting to Firebase...');
  try {
    await firebaseReady;
    connectionOk = true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    showConnectionError();
    return;
  }
  updateLoadingStep('firebase', 'completed');

  setupPlayersListener();
  setupScheduleListener();

  updateLoadingStep('players', 'active');
  updateLoadingText('👥 Loading players...');
  try {
    await initializeFirebaseData();
  } catch (error) {
    console.error('Data init failed:', error);
    showConnectionError();
    return;
  }
  updateLoadingStep('players', 'completed');

  updateLoadingStep('schedule', 'active');
  updateLoadingText('📅 Setting up schedule...');
  updateWeekDisplay();
  renderSchedule();
  loadPlayers();
  updateLoadingStep('schedule', 'completed');

  updateLoadingStep('messages', 'active');
  updateLoadingText('💬 Loading club wall...');
  loadClubMessages();
  updateLoadingStep('messages', 'completed');

  updateLoadingText('✅ Welcome to Matchpoint Tennis Club!');
  await new Promise((r) => setTimeout(r, 600));
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  console.log('✅ App initialised');
}

// ---- Booking ---------------------------------------------------------------
async function confirmBooking() {
  if (!currentBookingSlot) return;
  const { day, time } = currentBookingSlot;

  const slotData = schedule[day]?.[time];
  if (!slotData || slotData.unavailable) {
    showBookingError('This time slot is not available');
    return;
  }

  const playerSelect = document.getElementById('playerSelect');
  if (!playerSelect) return;
  const selectedPlayerId = playerSelect.value;
  if (!selectedPlayerId) {
    showBookingError('Please select a player');
    return;
  }

  setBookingLoading(true);

  try {
    await runTransaction(db, async (transaction) => {
      const sessionId = getSessionId(formatDateForId(dateForDay(currentWeekOffset, day)), day, time);
      const ref = doc(db, 'schedules', sessionId);
      const snap = await transaction.get(ref);

      let currentPlayers = [];
      let maxCapacity = MAX_CAPACITY;
      if (snap.exists()) {
        const data = snap.data();
        currentPlayers = data.players || [];
        maxCapacity = data.maxCapacity || MAX_CAPACITY;
      }

      if (currentPlayers.includes(selectedPlayerId)) {
        throw new Error('This player is already booked for this slot');
      }
      if (currentPlayers.length >= maxCapacity) {
        throw new Error('This slot is full');
      }

      transaction.set(ref, {
        date: formatDateForId(dateForDay(currentWeekOffset, day)), day, time,
        players: [...currentPlayers, selectedPlayerId],
        maxCapacity, locked: false, lastUpdated: serverTimestamp()
      }, { merge: true });
    });

    showBookingSuccess();
    setTimeout(closeBookingModal, 1000);
  } catch (error) {
    console.error('Booking error:', error);
    const msg = /already booked|is full/.test(error.message)
      ? error.message
      : 'Could not reach the server — booking was not saved.';
    showBookingError(msg);
    setBookingLoading(false);
  }
}

async function removePlayer(day, time, playerId) {
  const slotData = schedule[day]?.[time];
  if (!slotData || slotData.unavailable) return;

  try {
    await runTransaction(db, async (transaction) => {
      const sessionId = getSessionId(formatDateForId(dateForDay(currentWeekOffset, day)), day, time);
      const ref = doc(db, 'schedules', sessionId);
      const snap = await transaction.get(ref);
      if (snap.exists()) {
        const updated = (snap.data().players || []).filter((id) => id !== playerId);
        transaction.update(ref, { players: updated, lastUpdated: serverTimestamp() });
      }
    });
  } catch (error) {
    console.error('Remove player error:', error);
    alert('Could not reach the server — change was not saved.');
  }
}

// ---- Player management -----------------------------------------------------
function showAddPlayer() {
  currentEditingPlayer = null;
  document.getElementById('playerModalTitle').textContent = 'Add Player';
  document.getElementById('playerName').value = '';
  document.getElementById('playerSkillLevel').value = '';
  document.getElementById('savePlayerBtn').textContent = 'Add Player';
  document.getElementById('playerModal').style.display = 'flex';
  setTimeout(() => document.getElementById('playerName').focus(), 100);
}

function editPlayer(playerId) {
  const player = players.find((p) => p.id === playerId);
  if (!player) return;
  currentEditingPlayer = playerId;
  document.getElementById('playerModalTitle').textContent = 'Edit Player';
  document.getElementById('playerName').value = player.name;
  document.getElementById('playerSkillLevel').value = player.skillLevel;
  document.getElementById('savePlayerBtn').textContent = 'Update Player';
  document.getElementById('playerModal').style.display = 'flex';
  setTimeout(() => document.getElementById('playerName').focus(), 100);
}

async function deletePlayer(playerId) {
  if (!confirm('Are you sure you want to delete this player?')) return;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'players', playerId));

    const schedSnap = await getDocs(
      query(collection(db, 'schedules'), where('players', 'array-contains', playerId))
    );
    schedSnap.forEach((d) => {
      const updated = (d.data().players || []).filter((id) => id !== playerId);
      batch.update(d.ref, { players: updated, lastUpdated: serverTimestamp() });
    });

    // Also scrub the season template, so deleted members can't be re-seeded into
    // future weeks (this was the root cause of the old "ghost players" bug).
    const tRef = doc(db, 'seasonTemplate', 'default');
    const tSnap = await getDoc(tRef);
    if (tSnap.exists()) {
      const t = tSnap.data();
      let changed = false;
      BOOKABLE_DAYS.forEach((day) => {
        TIME_SLOTS.forEach((time) => {
          const slot = t[day]?.[time];
          if (slot?.players?.includes(playerId)) {
            slot.players = slot.players.filter((id) => id !== playerId);
            changed = true;
          }
        });
      });
      if (changed) batch.set(tRef, t);
    }

    await batch.commit();
    console.log(`✅ Deleted player ${playerId} (incl. template cleanup)`);
  } catch (error) {
    console.error('Delete player error:', error);
    alert('Could not reach the server — player was not deleted.');
  }
}

async function savePlayer() {
  const name = document.getElementById('playerName').value.trim();
  const skillLevel = document.getElementById('playerSkillLevel').value;

  if (!name) { alert('Please enter a player name'); document.getElementById('playerName').focus(); return; }
  if (!skillLevel) { alert('Please select a skill level'); document.getElementById('playerSkillLevel').focus(); return; }

  const saveBtn = document.getElementById('savePlayerBtn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    if (currentEditingPlayer) {
      await updateDoc(doc(db, 'players', currentEditingPlayer), {
        name, skillLevel, lastUpdated: serverTimestamp()
      });
      const idx = players.findIndex((p) => p.id === currentEditingPlayer);
      if (idx !== -1) { players[idx].name = name; players[idx].skillLevel = skillLevel; loadPlayers(); renderSchedule(); }
    } else {
      const id = `${slugifyName(name)}_${Date.now()}`;
      if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A player with this name already exists!');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
      await setDoc(doc(db, 'players', id), { name, skillLevel, createdAt: serverTimestamp() });
    }
    closePlayerModal();
  } catch (error) {
    console.error('Save player error:', error);
    alert('Could not reach the server — player was not saved.');
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

function slugifyName(name) {
  return name.toLowerCase()
    .replace(/[āàáâãäå]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēèéêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìíîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņñ]/g, 'n').replace(/[ōòóôõö]/g, 'o')
    .replace(/[ŗ]/g, 'r').replace(/[š]/g, 's').replace(/[ūùúûü]/g, 'u')
    .replace(/[ž]/g, 'z').replace(/[^a-z0-9]/g, '');
}

// ---- Week navigation -------------------------------------------------------
function changeWeek(direction) {
  currentWeekOffset += direction;
  updateWeekDisplay();
  if (connectionOk) {
    setupScheduleListener();
    initializeWeekSchedule(currentWeekOffset).catch((e) => console.error('Week init failed:', e));
  }
}

// ---- Rendering -------------------------------------------------------------
function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  grid.innerHTML = '';
  RENDER_DAYS.forEach((day) => {
    const label = day.charAt(0).toUpperCase() + day.slice(1);
    grid.appendChild(createDayCard(day, label, dateForDay(currentWeekOffset, day)));
  });
}

function createDayCard(day, dayName, date) {
  const dayCard = document.createElement('div');
  dayCard.className = 'day-card';
  dayCard.setAttribute('data-day', day);

  const instructor = instructorFor(day);

  dayCard.innerHTML = `
    <div class="day-header">
      <div class="day-title-row">
        <div class="day-name">
          <span class="day-title">${dayName}</span>
          ${instructor ? `<span class="instructor-inline">Led by ${esc(instructor)}</span>` : '<span class="unavailable-text">No tennis today</span>'}
        </div>
        <div class="day-date">${formatDate(date)}</div>
      </div>
      <div class="skill-legend">
        <div class="skill-indicator"><div class="skill-dot beginner"></div><span>Beginner</span></div>
        <div class="skill-indicator"><div class="skill-dot regular"></div><span>Regular</span></div>
      </div>
    </div>
    <div class="time-slots">
      ${TIME_SLOTS.map((time) => createTimeSlotHTML(day, time, date)).join('')}
    </div>`;
  return dayCard;
}

function createTimeSlotHTML(day, time, date) {
  const slotData = schedule[day]?.[time] || { players: [], maxCapacity: MAX_CAPACITY };

  // Informational (note) slot — render the note, no booking.
  if (slotData.note) {
    return `
      <div class="time-slot note-slot">
        <div class="slot-header"><div class="slot-time">${time}</div></div>
        <div class="slot-note">${esc(slotData.note)}</div>
      </div>`;
  }

  const isUnavailable = slotData.unavailable || false;
  const isAvailable = !isUnavailable && slotData.players.length < slotData.maxCapacity;
  const isPast = isSlotInPast(date, time);

  let statusClass = 'unavailable';
  if (!isUnavailable) statusClass = isPast ? 'past' : (isAvailable ? 'available' : 'full');

  if (isUnavailable) {
    return `
      <div class="time-slot unavailable">
        <div class="slot-header"><div class="slot-time">${time}</div></div>
        <div class="slot-capacity">No tennis today</div>
      </div>`;
  }

  const playersHtml = slotData.players.map((playerId) => {
    const player = players.find((p) => p.id === playerId);
    const removeX = isPast ? '' : '<span class="remove-x">×</span>';
    const clickAction = isPast ? '' : `onclick="removePlayer('${esc(day)}', '${esc(time)}', '${esc(playerId)}'); event.stopPropagation();" title="Click to remove player"`;
    return player
      ? `<span class="player-tag ${esc(player.skillLevel)}" ${clickAction}>${esc(player.name)}${removeX}</span>`
      : `<span class="player-tag unknown" ${clickAction}>⚠️ Unknown: ${esc(playerId.substring(0, 15))}...${removeX}</span>`;
  }).join('');

  return `
    <div class="time-slot ${statusClass}" ${isAvailable && !isPast ? `onclick="openBookingModal('${esc(day)}', '${esc(time)}')"` : ''}>
      <div class="slot-header"><div class="slot-time">${time}</div></div>
      <div class="slot-capacity">${slotData.players.length}/${slotData.maxCapacity} players</div>
      <div class="players-list">${playersHtml}</div>
      ${isAvailable && !isPast ? '<button class="add-player-btn">+ Add Player</button>' : ''}
    </div>`;
}

// A slot counts as "past" only once it has FINISHED — i.e. after its END time,
// so the current session stays bookable/cancellable while it's running.
function isSlotInPast(date, time) {
  const endHour = parseInt(time.split('-')[1].split(':')[0], 10);
  const slotEnd = new Date(date);
  slotEnd.setHours(endHour, 0, 0, 0);
  return slotEnd < new Date();
}

// ---- Booking modal ---------------------------------------------------------
function openBookingModal(day, time) {
  const slotData = schedule[day]?.[time];
  if (!slotData || slotData.unavailable) return;
  currentBookingSlot = { day, time };

  const modal = document.getElementById('bookingModal');
  const slotDetails = document.getElementById('slotDetails');
  const playerSelect = document.getElementById('playerSelect');
  const currentPlayers = document.getElementById('currentPlayers');
  if (!modal || !slotDetails || !playerSelect || !currentPlayers) return;

  slotDetails.innerHTML = `<h4>Booking for ${esc(day.charAt(0).toUpperCase() + day.slice(1))} ${esc(time)}</h4>`;

  playerSelect.innerHTML = '<option value="">Choose a player...</option>';
  players.forEach((player) => {
    playerSelect.innerHTML += `<option value="${esc(player.id)}">${esc(player.name)}</option>`;
  });

  currentPlayers.innerHTML = `
    <h5>Current Players:</h5>
    <div class="current-players-list">
      ${slotData.players.map((playerId) => {
        const player = players.find((p) => p.id === playerId);
        return player ? `<span class="player-tag ${esc(player.skillLevel)}">${esc(player.name)}</span>` : '';
      }).join('')}
    </div>`;

  modal.style.display = 'flex';
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.style.display = 'none';
  setBookingLoading(false);
  document.querySelector('.booking-error')?.remove();
  document.querySelector('.booking-success')?.remove();
  currentBookingSlot = null;
}

function closePlayerModal() {
  document.getElementById('playerModal').style.display = 'none';
  currentEditingPlayer = null;
  document.getElementById('playerName').value = '';
  document.getElementById('playerSkillLevel').value = '';
  document.getElementById('playerModalTitle').textContent = 'Add Player';
  document.getElementById('savePlayerBtn').textContent = 'Add Player';
}

// ---- Players sidebar -------------------------------------------------------
function loadPlayers() {
  const grid = document.getElementById('playersGrid');
  if (!grid) return;
  grid.innerHTML = players.map((player) => `
    <div class="player-card ${esc(player.skillLevel)}">
      <div class="player-name">${esc(player.name)}</div>
      <div class="player-actions">
        <button onclick="editPlayer('${esc(player.id)}')" title="Edit">✏️</button>
        <button onclick="deletePlayer('${esc(player.id)}')" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

// ---- Sidebar / announcement ------------------------------------------------
function toggleSidebar() {
  const panel = document.getElementById('sidebarPanel');
  const toggle = document.getElementById('sidebarToggle');
  if (!panel || !toggle) return;
  panel.classList.toggle('open');
  toggle.classList.toggle('active');
}

function closeAnnouncement() {
  const banner = document.getElementById('announcementBanner');
  if (banner) {
    banner.classList.add('closing');
    setTimeout(() => { banner.style.display = 'none'; }, 400);
  }
}

// ---- Club wall -------------------------------------------------------------
function showAddMessage() {
  const modal = createMessageModal();
  document.body.appendChild(modal);
  modal.style.display = 'block';
  setTimeout(() => modal.querySelector('#messageInput')?.focus(), 100);
}

function createMessageModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'messageModal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>📢 Post to Club Wall</h3>
        <button class="close" onclick="closeMessageModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="authorInput">Your Name:</label>
          <input type="text" id="authorInput" placeholder="Enter your name" maxlength="30">
        </div>
        <div class="form-group">
          <label for="messageInput">Message:</label>
          <textarea id="messageInput" placeholder="Share something with the club..." maxlength="500" rows="4"></textarea>
        </div>
        <div class="char-count"><span id="charCount">0/500</span></div>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" onclick="closeMessageModal()">Cancel</button>
        <button class="btn" onclick="postClubMessage()">📢 Post Message</button>
      </div>
    </div>`;
  const messageInput = modal.querySelector('#messageInput');
  const charCount = modal.querySelector('#charCount');
  messageInput.addEventListener('input', function () { charCount.textContent = `${this.value.length}/500`; });
  return modal;
}

function closeMessageModal() {
  document.getElementById('messageModal')?.remove();
}

async function postClubMessage() {
  const authorInput = document.getElementById('authorInput');
  const messageInput = document.getElementById('messageInput');
  if (!authorInput || !messageInput) return;
  const author = authorInput.value.trim();
  const message = messageInput.value.trim();
  if (!author) { alert('Please enter your name'); authorInput.focus(); return; }
  if (!message) { alert('Please enter a message'); messageInput.focus(); return; }

  const postBtn = document.querySelector('#messageModal .btn:not(.secondary)');
  postBtn.innerHTML = '⏳ Posting...';
  postBtn.disabled = true;

  try {
    await addDoc(collection(db, 'clubMessages'), {
      author, message, timestamp: serverTimestamp(), id: Date.now().toString()
    });
    if (window.confetti) window.confetti({ particleCount: 50, spread: 45, origin: { y: 0.8 } });
    closeMessageModal();
  } catch (error) {
    console.error('Error posting message:', error);
    alert('Could not reach the server — message was not posted.');
    if (postBtn) { postBtn.innerHTML = '📢 Post Message'; postBtn.disabled = false; }
  }
}

function loadClubMessages() {
  if (unsubMessages) return; // set up only once
  const q = query(collection(db, 'clubMessages'), orderBy('timestamp', 'desc'), limit(10));
  unsubMessages = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((d) => messages.push({ id: d.id, ...d.data() }));
    renderClubMessages(messages);
  }, (error) => {
    console.error('Error loading club messages:', error);
    renderClubMessages([]);
  });
}

function renderClubMessages(messages) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="no-messages">
        <div class="no-messages-icon">💬</div>
        <div class="no-messages-text">No messages yet</div>
        <div class="no-messages-subtitle">Be the first to share something with the club!</div>
      </div>`;
    return;
  }
  container.innerHTML = messages.map((message) => {
    const timestamp = message.timestamp ? formatMessageTime(message.timestamp.toDate()) : 'Just now';
    return `
      <div class="club-message">
        <div class="message-header">
          <div class="message-author">👤 ${esc(message.author)}</div>
          <div class="message-time">${esc(timestamp)}</div>
        </div>
        <div class="message-content">${esc(message.message)}</div>
      </div>`;
  }).join('');
}

function formatMessageTime(date) {
  const diff = new Date() - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ---- Booking loading / feedback UI ----------------------------------------
function setBookingLoading(loading) {
  const confirmBtn = document.querySelector('.modal-footer .btn:not(.secondary)');
  const modalBody = document.querySelector('.modal-body');
  if (loading) {
    if (confirmBtn) { confirmBtn.classList.add('loading'); confirmBtn.textContent = 'Booking...'; }
    if (modalBody) modalBody.classList.add('form-disabled');
    showModalLoadingOverlay();
  } else {
    if (confirmBtn) { confirmBtn.classList.remove('loading'); confirmBtn.textContent = 'Confirm Booking'; }
    if (modalBody) modalBody.classList.remove('form-disabled');
    hideModalLoadingOverlay();
  }
}

function showModalLoadingOverlay() {
  const modal = document.querySelector('.modal-content');
  if (!modal) return;
  modal.querySelector('.modal-loading-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <span class="tennis-ball-spinner">🎾</span>
      <div class="loading-text">Booking player...</div>
      <div class="loading-subtext">Syncing with other members</div>
    </div>`;
  modal.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 50);
}

function hideModalLoadingOverlay() {
  const overlay = document.querySelector('.modal-loading-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  }
}

function showBookingSuccess() {
  const modal = document.querySelector('.modal-content');
  if (!modal) return;
  hideModalLoadingOverlay();
  const success = document.createElement('div');
  success.className = 'booking-success';
  success.innerHTML = '✅ Player booked successfully!';
  modal.appendChild(success);
  setTimeout(() => success.classList.add('show'), 50);
  setTimeout(() => success.remove(), 1500);
}

function showBookingError(message) {
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  modalBody.querySelector('.booking-error')?.remove();
  const error = document.createElement('div');
  error.className = 'booking-error show';
  error.textContent = message;
  modalBody.appendChild(error);
  setTimeout(() => {
    error.classList.remove('show');
    setTimeout(() => error.remove(), 300);
  }, 4000);
}

// ---- Loading-screen helpers ------------------------------------------------
function updateLoadingStep(stepId, status) {
  const step = document.getElementById(`step-${stepId}`);
  if (step) step.className = `step ${status}`;
}

function updateLoadingText(text) {
  const loadingText = document.getElementById('loadingText');
  if (loadingText) loadingText.textContent = text;
}

// ---- Wire up global handlers (HTML uses inline onclick=) -------------------
Object.assign(window, {
  login, logout, toggleSidebar, changeWeek,
  openBookingModal, closeBookingModal, confirmBooking, removePlayer,
  showAddPlayer, editPlayer, deletePlayer, savePlayer, closePlayerModal,
  closeAnnouncement, showAddMessage, closeMessageModal, postClubMessage,
  saveSeasonTemplate, getSeasonTemplate
});

// ---- DOM ready -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  currentWeekOffset = getInitialWeekOffset();

  const passwordInput = document.getElementById('passwordInput');
  passwordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

  document.addEventListener('click', function (e) {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal && e.target === bookingModal) closeBookingModal();
    const playerModal = document.getElementById('playerModal');
    if (playerModal && e.target === playerModal) closePlayerModal();
  });

  const playerForm = document.getElementById('playerForm');
  if (playerForm) {
    playerForm.addEventListener('submit', (e) => { e.preventDefault(); savePlayer(); });
    document.getElementById('playerName')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('playerSkillLevel').focus(); }
    });
    document.getElementById('playerSkillLevel')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); savePlayer(); }
    });
  }
  console.log('✅ Tennis app ready');
});

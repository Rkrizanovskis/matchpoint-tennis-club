// Global functions for HTML onclick handlers
window.login = login;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.changeWeek = changeWeek;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.confirmBooking = confirmBooking;
window.removePlayer = removePlayer;
window.showAddPlayer = showAddPlayer;
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.closeAnnouncement = closeAnnouncement;
window.showAddMessage = showAddMessage;

// App State
let isAuthenticated = false;
let currentWeekOffset = 0;
let currentBookingSlot = null;
let firebaseEnabled = false;
let database = null;

// Simple player data
let players = [
    { id: 'richards', name: 'Ričards', skillLevel: 'regular' },
    { id: 'diana', name: 'Diāna', skillLevel: 'regular' },
    { id: 'elza', name: 'Elza', skillLevel: 'regular' },
    { id: 'agnese', name: 'Agnese', skillLevel: 'regular' },
    { id: 'arta', name: 'Arta', skillLevel: 'regular' },
    { id: 'ilvija', name: 'Ilvija', skillLevel: 'beginner' }
];

// Simple schedule data
let schedule = {
    'monday': {
        '18:00-19:00': { players: [], maxCapacity: 5 },
        '19:00-20:00': { players: [], maxCapacity: 5 },
        '20:00-21:00': { players: ['richards', 'diana'], maxCapacity: 5 }
    },
    'tuesday': {
        '18:00-19:00': { players: [], maxCapacity: 5 },
        '19:00-20:00': { players: [], maxCapacity: 5 },
        '20:00-21:00': { players: [], maxCapacity: 5 }
    },
    'wednesday': {
        '18:00-19:00': { players: [], maxCapacity: 5 },
        '19:00-20:00': { players: [], maxCapacity: 5 },
        '20:00-21:00': { players: [], maxCapacity: 5 }
    },
    'thursday': {
        '18:00-19:00': { players: [], maxCapacity: 5 },
        '19:00-20:00': { players: [], maxCapacity: 5 },
        '20:00-21:00': { players: [], maxCapacity: 5 }
    }
};

// Initialize Firebase if available
try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        database = firebase.firestore();
        firebaseEnabled = true;
        console.log('Firebase enabled');
        
        // Sign in anonymously
        firebase.auth().signInAnonymously()
            .then(() => {
                console.log('Signed in anonymously');
            })
            .catch((error) => {
                console.error('Error signing in:', error);
                firebaseEnabled = false;
            });
    } else {
        console.log('Firebase not available, using localStorage');
        firebaseEnabled = false;
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    firebaseEnabled = false;
}// Login function
function login() {
    console.log('Login function called');
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    console.log('Password:', password);
    
    if (password === '30:Love') {
        console.log('Password correct - logging in');
        isAuthenticated = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        initializeApp();
    } else {
        console.log('Incorrect password');
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}

// Logout function
function logout() {
    isAuthenticated = false;
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').textContent = '';
}

// Initialize the app
function initializeApp() {
    console.log('Initializing app...');
    
    // Show announcement banner
    setTimeout(() => {
        const banner = document.getElementById('announcementBanner');
        if (banner) {
            banner.style.display = 'block';
        }
    }, 500);
    
    // Initialize components
    updateWeekDisplay();
    renderSchedule();
    loadPlayers();
    
    console.log('App initialized successfully');
}// Week navigation functions
function getInitialWeekOffset() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (day === 5 || day === 6 || day === 0) {
        return 1; // Next week
    }
    
    if (day === 4 && (hour > 20 || (hour === 20 && minute >= 30))) {
        return 1; // Next week
    }
    
    return 0; // Current week
}

function getWeekStartDate(weekOffset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function changeWeek(direction) {
    currentWeekOffset += direction;
    updateWeekDisplay();
    renderSchedule();
}

function updateWeekDisplay() {
    const weekStart = getWeekStartDate(currentWeekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 3);
    
    const currentWeekElement = document.getElementById('currentWeek');
    if (currentWeekElement) {
        currentWeekElement.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }
}

// Schedule rendering
function renderSchedule() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const weekStart = getWeekStartDate(currentWeekOffset);
    
    scheduleGrid.innerHTML = '';
    
    days.forEach((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        
        const dayCard = createDayCard(day, dayNames[index], dayDate);
        scheduleGrid.appendChild(dayCard);
    });
}function createDayCard(day, dayName, date) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    
    const timeSlots = ['18:00-19:00', '19:00-20:00', '20:00-21:00'];
    
    dayCard.innerHTML = `
        <div class="day-header">
            <div class="day-title-row">
                <div class="day-name">${dayName}</div>
                <div class="day-date">${formatDate(date)}</div>
            </div>
            <div class="skill-legend">
                <div class="skill-indicator">
                    <div class="skill-dot beginner"></div>
                    <span>Beginner</span>
                </div>
                <div class="skill-indicator">
                    <div class="skill-dot regular"></div>
                    <span>Regular</span>
                </div>
            </div>
        </div>
        <div class="time-slots">
            ${timeSlots.map(time => createTimeSlotHTML(day, time, date)).join('')}
        </div>
    `;
    
    return dayCard;
}

function createTimeSlotHTML(day, time, date) {
    const slotData = schedule[day]?.[time] || { players: [], maxCapacity: 5 };
    const isAvailable = slotData.players.length < slotData.maxCapacity;
    const isPast = isSlotInPast(date, time);
    
    const statusClass = isPast ? 'past' : (isAvailable ? 'available' : 'full');
    
    return `
        <div class="time-slot ${statusClass}" ${isAvailable && !isPast ? `onclick="openBookingModal('${day}', '${time}')"` : ''}>
            <div class="slot-header">
                <div class="slot-time">${time}</div>
            </div>
            <div class="slot-capacity">${slotData.players.length}/${slotData.maxCapacity} players</div>
            <div class="players-list">
                ${slotData.players.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return player ? `<span class="player-tag ${player.skillLevel}" onclick="removePlayer('${day}', '${time}', '${playerId}'); event.stopPropagation();">${player.name}</span>` : '';
                }).join('')}
            </div>
            ${isAvailable && !isPast ? '<button class="add-player-btn">+ Add Player</button>' : ''}
        </div>
    `;
}

function isSlotInPast(date, time) {
    const now = new Date();
    const slotDateTime = new Date(date);
    const [hours] = time.split(':');
    slotDateTime.setHours(parseInt(hours), 0, 0, 0);
    
    return slotDateTime < now;
}// Booking modal functions
function openBookingModal(day, time) {
    currentBookingSlot = { day, time };
    
    const modal = document.getElementById('bookingModal');
    const slotDetails = document.getElementById('slotDetails');
    const playerSelect = document.getElementById('playerSelect');
    const currentPlayers = document.getElementById('currentPlayers');
    
    if (!modal || !slotDetails || !playerSelect || !currentPlayers) return;
    
    // Update slot details
    slotDetails.innerHTML = `
        <h4>Booking for ${day.charAt(0).toUpperCase() + day.slice(1)} ${time}</h4>
    `;
    
    // Populate player dropdown
    playerSelect.innerHTML = '<option value="">Choose a player...</option>';
    players.forEach(player => {
        playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
    });
    
    // Show current players
    const slotData = schedule[day]?.[time] || { players: [] };
    currentPlayers.innerHTML = `
        <h5>Current Players:</h5>
        <div class="current-players-list">
            ${slotData.players.map(playerId => {
                const player = players.find(p => p.id === playerId);
                return player ? `<span class="player-tag ${player.skillLevel}">${player.name}</span>` : '';
            }).join('')}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentBookingSlot = null;
}

function confirmBooking() {
    if (!currentBookingSlot) return;
    
    const playerSelect = document.getElementById('playerSelect');
    if (!playerSelect) return;
    
    const selectedPlayerId = playerSelect.value;
    
    if (!selectedPlayerId) {
        alert('Please select a player');
        return;
    }
    
    const { day, time } = currentBookingSlot;
    
    // Initialize slot if it doesn't exist
    if (!schedule[day]) schedule[day] = {};
    if (!schedule[day][time]) schedule[day][time] = { players: [], maxCapacity: 5 };
    
    const slotData = schedule[day][time];
    
    // Check if player is already booked
    if (slotData.players.includes(selectedPlayerId)) {
        alert('This player is already booked for this slot');
        return;
    }
    
    // Check capacity
    if (slotData.players.length >= slotData.maxCapacity) {
        alert('This slot is full');
        return;
    }
    
    // Add player
    slotData.players.push(selectedPlayerId);
    
    // Save to storage
    saveSchedule();
    
    // Close modal and refresh display
    closeBookingModal();
    renderSchedule();
    
    console.log(`Booked ${selectedPlayerId} for ${day} ${time}`);
}

function removePlayer(day, time, playerId) {
    const slotData = schedule[day]?.[time];
    if (!slotData) return;
    
    const playerIndex = slotData.players.indexOf(playerId);
    if (playerIndex > -1) {
        slotData.players.splice(playerIndex, 1);
        saveSchedule();
        renderSchedule();
        console.log(`Removed ${playerId} from ${day} ${time}`);
    }
}// Data persistence
function saveSchedule() {
    localStorage.setItem('tennisSchedule', JSON.stringify(schedule));
    console.log('Schedule saved');
}

function loadSchedule() {
    const saved = localStorage.getItem('tennisSchedule');
    if (saved) {
        try {
            schedule = JSON.parse(saved);
            console.log('Schedule loaded from localStorage');
        } catch (error) {
            console.error('Error loading schedule:', error);
        }
    }
}

// Player management
function loadPlayers() {
    const playersGrid = document.getElementById('playersGrid');
    if (!playersGrid) return;
    
    playersGrid.innerHTML = players.map(player => `
        <div class="player-card ${player.skillLevel}">
            <div class="player-name">${player.name}</div>
            <div class="player-actions">
                <button onclick="editPlayer('${player.id}')" title="Edit">✏️</button>
                <button onclick="deletePlayer('${player.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function showAddPlayer() {
    const name = prompt('Enter player name:');
    if (!name) return;
    
    const skillLevel = prompt('Enter skill level (beginner/regular):', 'regular');
    if (!skillLevel || !['beginner', 'regular'].includes(skillLevel)) {
        alert('Invalid skill level. Please use "beginner" or "regular"');
        return;
    }
    
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    players.push({ id, name, skillLevel });
    savePlayers();
    loadPlayers();
}

function editPlayer(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const newName = prompt('Enter new name:', player.name);
    if (!newName) return;
    
    const newSkillLevel = prompt('Enter skill level (beginner/regular):', player.skillLevel);
    if (!newSkillLevel || !['beginner', 'regular'].includes(newSkillLevel)) {
        alert('Invalid skill level');
        return;
    }
    
    player.name = newName;
    player.skillLevel = newSkillLevel;
    
    savePlayers();
    loadPlayers();
    renderSchedule();
}

function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex > -1) {
        players.splice(playerIndex, 1);
        
        // Remove player from all schedules
        Object.keys(schedule).forEach(day => {
            Object.keys(schedule[day]).forEach(time => {
                const slot = schedule[day][time];
                const index = slot.players.indexOf(playerId);
                if (index > -1) {
                    slot.players.splice(index, 1);
                }
            });
        });
        
        savePlayers();
        saveSchedule();
        loadPlayers();
        renderSchedule();
    }
}function savePlayers() {
    localStorage.setItem('tennisPlayers', JSON.stringify(players));
}

function loadPlayersFromStorage() {
    const saved = localStorage.getItem('tennisPlayers');
    if (saved) {
        try {
            players = JSON.parse(saved);
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }
}

// Sidebar functions
function toggleSidebar() {
    const panel = document.getElementById('sidebarPanel');
    const toggle = document.getElementById('sidebarToggle');
    
    if (!panel || !toggle) return;
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        panel.classList.add('open');
        toggle.classList.add('active');
    }
}

// Announcement functions
function closeAnnouncement() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.classList.add('closing');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 400);
    }
}

// Message functions (placeholder)
function showAddMessage() {
    const message = prompt('Enter your message:');
    if (message) {
        alert('Message feature coming soon! Your message: ' + message);
    }
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing tennis app');
    
    // Load data from localStorage
    loadPlayersFromStorage();
    loadSchedule();
    
    // Initialize week offset
    currentWeekOffset = getInitialWeekOffset();
    
    // Setup password input enter key
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('bookingModal');
        if (modal && e.target === modal) {
            closeBookingModal();
        }
    });
    
    console.log('Tennis app initialization complete');
});

console.log('Script loaded - functions defined globally');
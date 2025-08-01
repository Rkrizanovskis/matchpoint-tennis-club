// App State
let isAuthenticated = false;
let currentWeekOffset = 0;
let currentBookingSlot = null;

// Data Storage
let appData = {
    players: [
        // Monday rotating players
        { id: 'richards', name: 'Ričards', skillLevel: 'regular' },
        { id: 'diana', name: 'Diāna', skillLevel: 'regular' },
        { id: 'elza', name: 'Elza', skillLevel: 'regular' },
        { id: 'agnese', name: 'Agnese', skillLevel: 'regular' },
        { id: 'arta', name: 'Arta', skillLevel: 'regular' },
        { id: 'ilvija', name: 'Ilvija', skillLevel: 'beginner' },
        
        // Tuesday players
        { id: 'aivars', name: 'Aivars', skillLevel: 'regular' },
        { id: 'liva', name: 'Līva', skillLevel: 'regular' },
        { id: 'klavs', name: 'Klāvs', skillLevel: 'regular' },
        { id: 'agnese2', name: 'Agnese', skillLevel: 'regular' },
        { id: 'sintija', name: 'Sintija', skillLevel: 'beginner' },
        { id: 'kristine', name: 'Kristīne', skillLevel: 'regular' },
        { id: 'eliza', name: 'Elīza', skillLevel: 'beginner' },
        { id: 'zelma', name: 'Zelma', skillLevel: 'beginner' },
        
        // Wednesday players
        { id: 'karina', name: 'Karīna', skillLevel: 'regular' },
        { id: 'rihards', name: 'Rihards', skillLevel: 'regular' },
        { id: 'kristaps', name: 'Kristaps', skillLevel: 'regular' },
        { id: 'sam', name: 'Sam', skillLevel: 'regular' },
        { id: 'edgars', name: 'Edgars', skillLevel: 'regular' },
        { id: 'janis', name: 'Jānis', skillLevel: 'regular' },
        
        // Thursday players
        { id: 'julija', name: 'Jūlija', skillLevel: 'beginner' },
        { id: 'darta', name: 'Dārta', skillLevel: 'beginner' },
        { id: 'rita', name: 'Rita', skillLevel: 'beginner' }
    ],
    schedules: {},
    clubWallMessages: []
};

// Authentication
function login() {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === '30:Love') {
        isAuthenticated = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        initializeDefaultSchedule();
        renderApp();
    } else {
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}
// Week Management
function getCurrentWeekKey() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
    return weekStart.toISOString().split('T')[0];
}

function getCurrentWeekText() {
    if (currentWeekOffset === 0) return 'This Week';
    if (currentWeekOffset === 1) return 'Next Week';
    if (currentWeekOffset === -1) return 'Last Week';
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    if (newOffset >= -1 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        renderApp();
    }
}

// Banner Management
function closeBanner() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.classList.add('closing');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 400);
    }
}
// Sidebar Management
function toggleSidebar() {
    const panel = document.getElementById('sidebarPanel');
    const toggle = document.getElementById('sidebarToggle');
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        panel.classList.add('open');
        toggle.classList.add('active');
    }
}

// Player Management
let currentEditingPlayerId = null;

function showAddPlayerModal() {
    document.getElementById('addPlayerModal').classList.add('show');
}

function hideAddPlayerModal() {
    document.getElementById('addPlayerModal').classList.remove('show');
    document.getElementById('playerName').value = '';
    document.getElementById('skillLevel').value = 'beginner';
}

function showEditPlayerModal(playerId) {
    const player = appData.players.find(p => p.id === playerId);
    if (!player) return;

    currentEditingPlayerId = playerId;
    document.getElementById('editPlayerName').value = player.name;
    document.getElementById('editSkillLevel').value = player.skillLevel;
    document.getElementById('editPlayerModal').classList.add('show');
}
function hideEditPlayerModal() {
    document.getElementById('editPlayerModal').classList.remove('show');
    currentEditingPlayerId = null;
    document.getElementById('editPlayerName').value = '';
    document.getElementById('editSkillLevel').value = 'beginner';
}

function savePlayerEdit() {
    if (!currentEditingPlayerId) return;

    const newName = document.getElementById('editPlayerName').value.trim();
    const newSkillLevel = document.getElementById('editSkillLevel').value;

    if (!newName) {
        alert('Player name cannot be empty');
        return;
    }

    const player = appData.players.find(p => p.id === currentEditingPlayerId);
    if (player) {
        player.name = newName;
        player.skillLevel = newSkillLevel;
        
        hideEditPlayerModal();
        renderPlayers();
        renderSchedule();
        saveData();
    }
}

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const skillLevel = document.getElementById('skillLevel').value;
    
    if (!name) return;
    
    const newPlayer = {
        id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        name: name,
        skillLevel: skillLevel
    };
    
    appData.players.push(newPlayer);
    hideAddPlayerModal();
    renderPlayers();
    saveData();
}
function deletePlayer(playerId) {
    if (confirm('Are you sure you want to delete this player?')) {
        appData.players = appData.players.filter(p => p.id !== playerId);
        
        // Remove from all schedules
        Object.keys(appData.schedules).forEach(weekKey => {
            Object.keys(appData.schedules[weekKey]).forEach(day => {
                Object.keys(appData.schedules[weekKey][day]).forEach(slot => {
                    const session = appData.schedules[weekKey][day][slot];
                    session.players = session.players.filter(id => id !== playerId);
                });
            });
        });
        
        renderApp();
        saveData();
    }
}

// Booking Management
function showBookingModal(day, timeSlot) {
    currentBookingSlot = { day, timeSlot };
    const weekKey = getCurrentWeekKey();
    const session = appData.schedules[weekKey]?.[day]?.[timeSlot];
    
    if (!session || !session.available || session.players.length >= session.maxCapacity) {
        return;
    }
    
    document.getElementById('bookingTitle').textContent = 
        `Book ${day} ${timeSlot} with ${session.coach}`;
    
    const playerSelect = document.getElementById('selectPlayer');
    playerSelect.innerHTML = '';
    
    // Filter players by skill level - but allow same player multiple times
    const eligiblePlayers = appData.players.filter(player => {
        if (session.skillLevel === 'mixed') return true;
        return player.skillLevel === session.skillLevel;
    });
    
    // Show all eligible players (don't filter out those already in this session)
    eligiblePlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;        
        // Show if player is already in this session
        const isAlreadyBooked = session.players.includes(player.id);
        option.textContent = isAlreadyBooked ? 
            `${player.name} (already booked)` : 
            player.name;
        
        playerSelect.appendChild(option);
    });
    
    if (eligiblePlayers.length === 0) {
        playerSelect.innerHTML = '<option>No eligible players available</option>';
    }
    
    document.getElementById('bookingModal').classList.add('show');
}

function hideBookingModal() {
    document.getElementById('bookingModal').classList.remove('show');
    currentBookingSlot = null;
}

function confirmBooking() {
    if (!currentBookingSlot) return;
    
    const playerId = document.getElementById('selectPlayer').value;
    if (!playerId) return;
    
    const weekKey = getCurrentWeekKey();
    const { day, timeSlot } = currentBookingSlot;
    
    if (!appData.schedules[weekKey]) {
        appData.schedules[weekKey] = {};
    }
    if (!appData.schedules[weekKey][day]) {
        appData.schedules[weekKey][day] = {};
    }
    if (!appData.schedules[weekKey][day][timeSlot]) {
        return; // Session doesn't exist
    }
    
    const session = appData.schedules[weekKey][day][timeSlot];
    
    // Allow adding player even if they're already in the session (for consecutive training)
    if (session.players.length < session.maxCapacity) {
        session.players.push(playerId);        
        // Update availability
        if (session.players.length >= session.maxCapacity) {
            session.available = false;
        }
    }
    
    hideBookingModal();
    renderSchedule();
    saveData();
}

// Handle remove player with proper event handling
function handleRemovePlayer(day, timeSlot, playerId, playerIndex) {
    event.stopPropagation(); // Prevent slot click
    
    const weekKey = getCurrentWeekKey();
    const session = appData.schedules[weekKey]?.[day]?.[timeSlot];
    
    if (!session) {
        return;
    }
    
    // Check if playerIndex is valid
    if (typeof playerIndex === 'number' && playerIndex >= 0 && playerIndex < session.players.length) {
        session.players.splice(playerIndex, 1);
    } else {
        const indexToRemove = session.players.indexOf(playerId);
        if (indexToRemove > -1) {
            session.players.splice(indexToRemove, 1);
        }
    }
    
    session.available = true;
    
    renderSchedule();
    saveData();
}
// Initialize default schedule
function initializeDefaultSchedule() {
    const weekKey = getCurrentWeekKey();
    if (!appData.schedules[weekKey]) {
        appData.schedules[weekKey] = {
            monday: {
                '20:00-21:00': {
                    coach: 'Paša',
                    skillLevel: 'mixed',
                    players: ['richards', 'diana'],
                    maxCapacity: 5,
                    isRotating: true,
                    available: true
                }
            },
            tuesday: {
                '19:00-20:00': {
                    coach: 'Justīne',
                    skillLevel: 'mixed',
                    players: ['aivars', 'liva', 'agnese2', 'klavs'],
                    maxCapacity: 5,
                    available: true
                },
                '20:00-21:00': {
                    coach: 'Justīne',
                    skillLevel: 'beginner',
                    players: ['sintija', 'ilvija', 'kristine', 'eliza', 'zelma'],
                    maxCapacity: 5,
                    available: false
                }
            },
            wednesday: {
                '19:00-20:00': {
                    coach: 'Paša',
                    skillLevel: 'mixed',
                    players: ['karina', 'rihards', 'elza', 'kristaps'],
                    maxCapacity: 5,
                    available: true
                },                '20:00-21:00': {
                    coach: 'Paša',
                    skillLevel: 'mixed',
                    players: ['arta', 'sam', 'edgars', 'janis'],
                    maxCapacity: 5,
                    available: true
                }
            },
            thursday: {
                '20:00-21:00': {
                    coach: 'Paša',
                    skillLevel: 'mixed',
                    players: ['julija', 'sintija', 'zelma', 'darta', 'rita'],
                    maxCapacity: 5,
                    available: false
                },
                '21:00-22:00': {
                    coach: 'Paša',
                    skillLevel: 'mixed',
                    players: [],
                    maxCapacity: 5,
                    available: false
                }
            }
        };
    }
    
    // Force update: Close Paša's Thursday 21:00-22:00 slot (override any existing data)
    if (appData.schedules[weekKey]?.thursday?.['21:00-22:00']) {
        appData.schedules[weekKey].thursday['21:00-22:00'].available = false;
    }
}

// Rendering Functions
function renderPlayers() {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    appData.players.forEach(player => {
        const card = document.createElement('div');
        card.className = `player-card ${player.skillLevel}`;
        card.innerHTML = `
            <span class="player-name" onclick="showEditPlayerModal('${player.id}')" style="cursor: pointer; flex-grow: 1;" title="Click to edit">${player.name}</span>
            <div class="player-actions">
                <button onclick="showEditPlayerModal('${player.id}')" title="Edit Player">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                </button>
                <button onclick="deletePlayer('${player.id}')" title="Delete Player" class="delete-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}
function renderSchedule() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;
    
    const weekKey = getCurrentWeekKey();
    const schedule = appData.schedules[weekKey] || {};
    
    grid.innerHTML = '';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    
    days.forEach((day, index) => {
        const dayData = schedule[day] || {};
        const card = document.createElement('div');
        card.className = 'day-card';
        
        // Calculate date for this day
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        
        // Get unique skill levels for this day
        const skillLevelsInDay = new Set();
        Object.values(dayData).forEach(session => {
            if (session && session.skillLevel) {
                skillLevelsInDay.add(session.skillLevel);
            }
        });
        
        // Create skill legend
        const skillLegendItems = [];
        if (skillLevelsInDay.has('beginner')) {
            skillLegendItems.push('<div class="skill-indicator"><div class="skill-dot beginner"></div>Beginners</div>');
        }
        if (skillLevelsInDay.has('regular')) {
            skillLegendItems.push('<div class="skill-indicator"><div class="skill-dot regular"></div>Regulars</div>');
        }
        if (skillLevelsInDay.has('mixed')) {
            skillLegendItems.push('<div class="skill-indicator"><div class="skill-dot mixed"></div>Mixed Level</div>');
        }        
        card.innerHTML = `
            <div class="day-header">
                <div class="day-title-row">
                    <div class="day-name">${dayNames[index]}</div>
                    <div class="day-date">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                ${skillLegendItems.length > 0 ? `<div class="skill-legend">${skillLegendItems.join('')}</div>` : ''}
            </div>
            <div class="time-slots">
                ${renderTimeSlots(day, dayData)}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function renderTimeSlots(day, dayData) {
    const timeSlots = ['19:00-20:00', '20:00-21:00', '21:00-22:00'];
    
    return timeSlots.map(timeSlot => {
        const session = dayData[timeSlot];
        
        if (!session) {
            return `
                <div class="time-slot unavailable">
                    <div class="slot-header">
                        <span class="slot-time">${timeSlot}</span>
                    </div>
                    <div class="slot-capacity">Unavailable</div>
                </div>
            `;
        }
        
        // Check if this session is in the past
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
        
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday'].indexOf(day);
        const sessionDate = new Date(weekStart);
        sessionDate.setDate(weekStart.getDate() + dayIndex);
        
        // Set session time (using start time)
        const [hours, minutes] = timeSlot.split('-')[0].split(':');
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const isPast = sessionDate < now;
        const isFull = session.players.length >= session.maxCapacity;
        const isAvailable = !isPast && session.players.length < session.maxCapacity && session.available;
        
        // Determine the CSS class
        let slotClass;
        if (isPast) {
            slotClass = 'past';
        } else if (!session.available) {
            slotClass = 'unavailable';
        } else if (isFull) {
            slotClass = 'full';
        } else {
            slotClass = 'available';
        }
        
        const coachClass = session.coach.toLowerCase() === 'paša' ? 'pasa' : 'justine';
        
        return `
            <div class="time-slot ${slotClass}">
                <div class="slot-header">
                    <span class="slot-time">${timeSlot} • Led by ${session.coach}</span>
                </div>
                <div class="slot-capacity">${session.players.length}/${session.maxCapacity} players</div>
                <div class="players-list">
                    ${session.players.map((playerId, index) => {
                        const player = appData.players.find(p => p.id === playerId);
                        if (!player) return '';
                        
                        // Count how many times this player appears in this session
                        const playerCount = session.players.filter(id => id === playerId).length;
                        const playerIndex = session.players.slice(0, index + 1).filter(id => id === playerId).length;
                        
                        // Show count if player appears multiple times
                        const displayName = playerCount > 1 ? 
                            `${player.name} (${playerIndex}/${playerCount})` : 
                            player.name;
                        
                        // Only allow removal if not in the past
                        const removeAction = isPast ? '' : `onclick="handleRemovePlayer('${day}', '${timeSlot}', '${playerId}', ${index})" title="Click to remove" style="cursor: pointer;"`;
                        const removeIndicator = isPast ? '' : ' ×';
                        
                        return `<span class="player-tag ${player.skillLevel}" ${removeAction}>${displayName}${removeIndicator}</span>`;
                    }).join('')}
                </div>
                ${isAvailable ? 
                    `<button class="add-player-btn" onclick="showBookingModal('${day}', '${timeSlot}')">+ Add Player</button>` : 
                    ''
                }
            </div>
        `;
    }).join('');
}

// Club Wall Functions
function postClubMessage() {
    const nicknameInput = document.getElementById('wallNickname');
    const messageInput = document.getElementById('wallMessage');
    
    // Check if elements exist (user might be on login screen)
    if (!nicknameInput || !messageInput) {
        return;
    }
    
    const nickname = nicknameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!nickname || !message) {
        // Instead of alert, show visual feedback in the form
        if (!nickname) {
            nicknameInput.style.borderColor = '#dc2626';
            nicknameInput.placeholder = 'Please enter your nickname';
        }
        if (!message) {
            messageInput.style.borderColor = '#dc2626';
            messageInput.placeholder = 'Please enter a message';
        }
        
        // Reset border colors after 3 seconds
        setTimeout(() => {
            if (nicknameInput) {
                nicknameInput.style.borderColor = '';
                nicknameInput.placeholder = 'Your name or nickname';
            }
            if (messageInput) {
                messageInput.style.borderColor = '';
                messageInput.placeholder = 'Share something with the club...';
            }
        }, 3000);
        
        return;
    }
    
    const newMessage = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        nickname: nickname,
        message: message,
        timestamp: new Date()
    };
    
    appData.clubWallMessages.unshift(newMessage); // Add to beginning for newest first
    
    // Clear inputs
    nicknameInput.value = '';
    messageInput.value = '';
    
    // Reset any error styling
    nicknameInput.style.borderColor = '';
    messageInput.style.borderColor = '';
    
    // Re-render wall
    renderClubWall();
    saveData();
    
    // Show success feedback
    const postBtn = document.querySelector('.post-btn');
    if (postBtn) {
        const originalText = postBtn.innerHTML;
        postBtn.innerHTML = '<span>✅</span> Posted!';
        postBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        
        setTimeout(() => {
            postBtn.innerHTML = originalText;
            postBtn.style.background = '';
        }, 1500);
    }
}

function renderClubWall() {
    const wallContainer = document.getElementById('wallMessages');
    
    // Check if element exists (user might be on login screen)
    if (!wallContainer) {
        return;
    }
    
    if (!appData.clubWallMessages || appData.clubWallMessages.length === 0) {
        wallContainer.innerHTML = `
            <div class="wall-empty">
                <div class="wall-empty-icon">💬</div>
                <div class="wall-empty-text">No messages yet. Be the first to share something!</div>
            </div>
        `;
        return;
    }
    
    wallContainer.innerHTML = appData.clubWallMessages.map(msg => {
        const messageDate = new Date(msg.timestamp);
        const now = new Date();
        const timeDiff = now - messageDate;
        
        let timeStr;
        if (timeDiff < 60000) { // Less than 1 minute
            timeStr = 'Just now';
        } else if (timeDiff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(timeDiff / 60000);
            timeStr = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (timeDiff < 86400000) { // Less than 1 day
            const hours = Math.floor(timeDiff / 3600000);
            timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (timeDiff < 604800000) { // Less than 1 week
            const days = Math.floor(timeDiff / 86400000);
            timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            timeStr = messageDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return `
            <div class="message-card">
                <div class="message-header">
                    <div class="message-nickname" style="color: ${getNicknameColor(msg.nickname)}">${escapeHtml(msg.nickname)}</div>
                    <div class="message-timestamp">${timeStr}</div>
                </div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate consistent color for nickname
function getNicknameColor(nickname) {
    // Array of tennis-themed colors
    const colors = [
        '#4F68CC', // Blue (primary)
        '#22c55e', // Green
        '#f59e0b', // Orange/Yellow
        '#dc2626', // Red
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#84cc16', // Lime
        '#f97316', // Orange
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#ef4444', // Red variant
        '#3b82f6', // Blue variant
        '#a855f7', // Purple variant
        '#14b8a6', // Teal
        '#f59e0b'  // Amber
    ];
    
    // Generate consistent hash from nickname
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
        const char = nickname.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and modulo to get color index
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
}

function renderApp() {
    // Update week navigation
    document.getElementById('currentWeekText').textContent = getCurrentWeekText();
    document.getElementById('prevWeek').disabled = currentWeekOffset <= -1;
    document.getElementById('nextWeek').disabled = currentWeekOffset >= 4;
    
    // Ensure current week schedule exists
    const weekKey = getCurrentWeekKey();
    if (!appData.schedules[weekKey]) {
        initializeDefaultSchedule();
    }
    
    // Force update: Close Paša's Thursday 21:00-22:00 slot (for all weeks)
    if (appData.schedules[weekKey]?.thursday?.['21:00-22:00']) {
        appData.schedules[weekKey].thursday['21:00-22:00'].available = false;
    }
    
    renderPlayers();
    renderSchedule();
    renderClubWall();
}
// Save/Load Data
function saveData() {
    try {
        localStorage.setItem('tennisClubData', JSON.stringify(appData));
    } catch (e) {
        console.log('Could not save data to localStorage');
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('tennisClubData');
        if (saved) {
            const parsed = JSON.parse(saved);
            appData = { ...appData, ...parsed };
        }
    } catch (e) {
        console.log('Could not load data from localStorage, using defaults');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Club Wall keyboard shortcuts
    const wallMessage = document.getElementById('wallMessage');
    if (wallMessage) {
        wallMessage.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                postClubMessage();
            }
        });
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'addPlayerModal') hideAddPlayerModal();
            if (e.target.id === 'editPlayerModal') hideEditPlayerModal();
            if (e.target.id === 'bookingModal') hideBookingModal();
        }
    });
    
    // Initialize app
    loadData();
    
    // Add swipe gesture support for mobile week navigation
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleGesture() {
        const minSwipeDistance = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swipe right - previous week
                changeWeek(-1);
            } else {
                // Swipe left - next week
                changeWeek(1);
            }
        }
    }
    
    // Add touch event listeners to the schedule grid
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (scheduleGrid) {
        scheduleGrid.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        scheduleGrid.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleGesture();
        }, { passive: true });
    }
    
    // Add tap-to-close for sidebar panel on mobile
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('sidebarPanel');
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768 && panel.classList.contains('open')) {
            // If clicked outside sidebar and panel, close it
            if (!panel.contains(e.target) && !sidebar.contains(e.target)) {
                toggleSidebar();
            }
        }
    });
});
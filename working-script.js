// App State
let isAuthenticated = false;
let currentWeekOffset = 0;
let currentBookingSlot = null;
let editingPlayerId = null;

// Function to determine initial week offset based on current day/time
function getInitialWeekOffset() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // If Friday (5), Saturday (6), or Sunday (0) - show next week
    if (day === 5 || day === 6 || day === 0) {
        return 1; // Next week
    }
    
    // If Thursday (4) after 20:30 (last session ends at 20:00 + 30 min buffer) - show next week
    if (day === 4 && (hour > 20 || (hour === 20 && minute >= 30))) {
        return 1; // Next week
    }
    
    // Otherwise show current week
    return 0;
}

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
        { id: 'anna', name: 'Anna', skillLevel: 'regular' },
        { id: 'emils', name: 'Emīls', skillLevel: 'regular' },
        
        // Thursday players
        { id: 'janis', name: 'Jānis', skillLevel: 'regular' },
        { id: 'laura', name: 'Laura', skillLevel: 'regular' },
        { id: 'martins', name: 'Mārtiņš', skillLevel: 'beginner' }
    ],
    schedules: {},
    clubWallMessages: [
        {
            id: 'welcome',
            nickname: 'Admin',
            message: 'Welcome to the Matchpoint Tennis Club member portal! 🎾',
            timestamp: new Date().toISOString()
        }
    ]
};

// Authentication
function login() {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    console.log('Login attempt with password:', password);
    
    if (password === '30:Love') {
        console.log('Password correct - logging in');
        isAuthenticated = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize the application
        initializeApp();
    } else {
        console.log('Password incorrect');
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}

function initializeApp() {
    console.log('Initializing tennis club app...');
    
    // Set initial week offset
    currentWeekOffset = getInitialWeekOffset();
    
    // Render the application
    renderApp();
    
    console.log('App initialized successfully');
}

// Week Management
function getCurrentWeekKey() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7)); // Monday of the week
    weekStart.setHours(0, 0, 0, 0);
    
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function formatWeekDisplay() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}

function changeWeek(direction) {
    currentWeekOffset += direction;
    renderSchedule();
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const weekText = document.getElementById('currentWeekText');
    if (weekText) {
        weekText.textContent = formatWeekDisplay();
    }
}

// Schedule Generation and Management
function generateDefaultSchedule() {
    const weekKey = getCurrentWeekKey();
    
    if (!appData.schedules[weekKey]) {
        appData.schedules[weekKey] = {
            'monday-18:00': { 
                coach: 'Paša', 
                type: 'Regular Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '18:00-19:00'
            },
            'monday-19:00': { 
                coach: 'Paša', 
                type: 'Regular Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '19:00-20:00'
            },
            'tuesday-18:00': { 
                coach: 'Justīne', 
                type: 'Mixed Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '18:00-19:00'
            },
            'tuesday-19:00': { 
                coach: 'Justīne', 
                type: 'Beginner Training',
                skillLevel: 'beginner',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '19:00-20:00'
            },
            'wednesday-18:00': { 
                coach: 'Paša', 
                type: 'Mixed Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '18:00-19:00'
            },
            'wednesday-19:00': { 
                coach: 'Paša', 
                type: 'Mixed Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '19:00-20:00'
            },
            'thursday-18:00': { 
                coach: 'Paša', 
                type: 'Mixed Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '18:00-19:00'
            },
            'thursday-19:00': { 
                coach: 'Paša', 
                type: 'Open Training',
                skillLevel: 'mixed',
                maxPlayers: 4,
                bookedPlayers: [],
                duration: '19:00-20:00'
            }
        };
    }
}

function renderSchedule() {
    generateDefaultSchedule();
    
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;
    
    const weekKey = getCurrentWeekKey();
    const schedule = appData.schedules[weekKey] || {};
    
    const days = [
        { name: 'Monday', key: 'monday', sessions: ['18:00', '19:00'] },
        { name: 'Tuesday', key: 'tuesday', sessions: ['18:00', '19:00'] },
        { name: 'Wednesday', key: 'wednesday', sessions: ['18:00', '19:00'] },
        { name: 'Thursday', key: 'thursday', sessions: ['18:00', '19:00'] }
    ];
    
    let html = '<div class="schedule-header">Weekly Tennis Schedule</div>';
    
    days.forEach(day => {
        html += `<div class="day-schedule">`;
        html += `<div class="day-header">${day.name}</div>`;
        
        day.sessions.forEach(time => {
            const slotKey = `${day.key}-${time}`;
            const slot = schedule[slotKey];
            
            if (slot) {
                const isAvailable = slot.bookedPlayers.length < slot.maxPlayers;
                const skillBadge = slot.skillLevel === 'beginner' ? 'skill-beginner' : 'skill-mixed';
                
                html += `
                    <div class="time-slot ${isAvailable ? 'available' : 'full'}" 
                         onclick="openBookingModal('${slotKey}')">
                        <div class="slot-time">${slot.duration}</div>
                        <div class="slot-coach">Coach: ${slot.coach}</div>
                        <div class="slot-type ${skillBadge}">${slot.type}</div>
                        <div class="slot-players">
                            ${slot.bookedPlayers.length}/${slot.maxPlayers} players
                        </div>
                        ${slot.bookedPlayers.length > 0 ? 
                            `<div class="booked-players">
                                ${slot.bookedPlayers.map(p => `<span class="player-tag">${p.name}</span>`).join('')}
                            </div>` : ''
                        }
                        <div class="book-button">
                            ${isAvailable ? '+ Book Slot' : 'Full'}
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    });
    
    scheduleGrid.innerHTML = html;
}

// Player Management
function renderPlayers() {
    const playersGrid = document.getElementById('playersGrid');
    if (!playersGrid) return;
    
    let html = '';
    appData.players.forEach(player => {
        const skillClass = player.skillLevel === 'beginner' ? 'skill-beginner' : 'skill-regular';
        html += `
            <div class="player-card ${skillClass}">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-skill">${player.skillLevel}</div>
                </div>
                <div class="player-actions">
                    <button class="btn-small" onclick="editPlayer('${player.id}')">Edit</button>
                    <button class="btn-small danger" onclick="deletePlayer('${player.id}')">Delete</button>
                </div>
            </div>
        `;
    });
    
    playersGrid.innerHTML = html;
}

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const skillLevel = document.getElementById('skillLevel').value;
    
    if (!name) {
        alert('Please enter a player name');
        return;
    }
    
    const newPlayer = {
        id: generatePlayerId(name),
        name: name,
        skillLevel: skillLevel
    };
    
    appData.players.push(newPlayer);
    renderPlayers();
    hideAddPlayerModal();
    
    // Clear form
    document.getElementById('playerName').value = '';
    document.getElementById('skillLevel').value = 'beginner';
    
    // Show confetti celebration
    if (typeof showConfetti === 'function') {
        showConfetti();
    }
    
    console.log('Added new player:', newPlayer);
}

function generatePlayerId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
}

function editPlayer(playerId) {
    const player = appData.players.find(p => p.id === playerId);
    if (!player) return;
    
    editingPlayerId = playerId;
    document.getElementById('editPlayerName').value = player.name;
    document.getElementById('editSkillLevel').value = player.skillLevel;
    showEditPlayerModal();
}

function savePlayerEdit() {
    if (!editingPlayerId) return;
    
    const name = document.getElementById('editPlayerName').value.trim();
    const skillLevel = document.getElementById('editSkillLevel').value;
    
    if (!name) {
        alert('Please enter a player name');
        return;
    }
    
    const player = appData.players.find(p => p.id === editingPlayerId);
    if (player) {
        player.name = name;
        player.skillLevel = skillLevel;
        renderPlayers();
        hideEditPlayerModal();
        console.log('Updated player:', player);
    }
}

function deletePlayer(playerId) {
    if (confirm('Are you sure you want to delete this player?')) {
        appData.players = appData.players.filter(p => p.id !== playerId);
        renderPlayers();
        console.log('Deleted player:', playerId);
    }
}

// Booking System
function openBookingModal(slotKey) {
    currentBookingSlot = slotKey;
    const weekKey = getCurrentWeekKey();
    const slot = appData.schedules[weekKey][slotKey];
    
    if (!slot) return;
    
    // Check if slot is full
    if (slot.bookedPlayers.length >= slot.maxPlayers) {
        alert('This session is already full!');
        return;
    }
    
    // Update modal title
    const title = document.getElementById('bookingTitle');
    if (title) {
        title.textContent = `Book ${slot.type} - ${slot.duration}`;
    }
    
    // Populate player dropdown
    const playerSelect = document.getElementById('selectPlayer');
    if (playerSelect) {
        playerSelect.innerHTML = '<option value="">Select a player...</option>';
        
        // Filter players based on skill level if it's a beginner session
        let availablePlayers = appData.players;
        if (slot.skillLevel === 'beginner') {
            // Beginner sessions: only beginner players
            availablePlayers = appData.players.filter(p => p.skillLevel === 'beginner');
        }
        
        // Remove already booked players
        const bookedPlayerIds = slot.bookedPlayers.map(p => p.id);
        availablePlayers = availablePlayers.filter(p => !bookedPlayerIds.includes(p.id));
        
        availablePlayers.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (${player.skillLevel})`;
            playerSelect.appendChild(option);
        });
    }
    
    showBookingModal();
}

function confirmBooking() {
    if (!currentBookingSlot) return;
    
    const playerId = document.getElementById('selectPlayer').value;
    if (!playerId) {
        alert('Please select a player');
        return;
    }
    
    const player = appData.players.find(p => p.id === playerId);
    if (!player) return;
    
    const weekKey = getCurrentWeekKey();
    const slot = appData.schedules[weekKey][currentBookingSlot];
    
    if (slot && slot.bookedPlayers.length < slot.maxPlayers) {
        slot.bookedPlayers.push({
            id: player.id,
            name: player.name,
            skillLevel: player.skillLevel
        });
        
        renderSchedule();
        hideBookingModal();
        
        // Show confetti celebration
        if (typeof showConfetti === 'function') {
            showConfetti();
        }
        
        alert(`Successfully booked ${player.name} for ${slot.type}!`);
        console.log('Booking confirmed:', { player: player.name, slot: currentBookingSlot });
    }
}

// Club Wall Functions
function renderClubWall() {
    const wallMessages = document.getElementById('wallMessages');
    if (!wallMessages) return;
    
    if (appData.clubWallMessages.length === 0) {
        wallMessages.innerHTML = '<div class="no-messages">No messages yet. Be the first to post!</div>';
        return;
    }
    
    let html = '';
    appData.clubWallMessages.slice().reverse().forEach(message => {
        const date = new Date(message.timestamp);
        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        html += `
            <div class="wall-message">
                <div class="message-header">
                    <span class="message-author">${message.nickname}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="message-content">${message.message}</div>
            </div>
        `;
    });
    
    wallMessages.innerHTML = html;
}

function postClubMessage() {
    const nickname = document.getElementById('wallNickname').value.trim();
    const message = document.getElementById('wallMessage').value.trim();
    
    if (!nickname || !message) {
        alert('Please enter both name and message');
        return;
    }
    
    const newMessage = {
        id: 'msg_' + Date.now(),
        nickname: nickname,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    appData.clubWallMessages.push(newMessage);
    renderClubWall();
    
    // Clear form
    document.getElementById('wallNickname').value = '';
    document.getElementById('wallMessage').value = '';
    
    console.log('Posted new message:', newMessage);
}

// Modal Management
function showAddPlayerModal() {
    const modal = document.getElementById('addPlayerModal');
    if (modal) modal.style.display = 'flex';
}

function hideAddPlayerModal() {
    const modal = document.getElementById('addPlayerModal');
    if (modal) modal.style.display = 'none';
}

function showEditPlayerModal() {
    const modal = document.getElementById('editPlayerModal');
    if (modal) modal.style.display = 'flex';
}

function hideEditPlayerModal() {
    const modal = document.getElementById('editPlayerModal');
    if (modal) modal.style.display = 'none';
    editingPlayerId = null;
}

function showBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = 'flex';
}

function hideBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = 'none';
    currentBookingSlot = null;
}

// Sidebar Management
function toggleSidebar() {
    const panel = document.getElementById('sidebarPanel');
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
    }
}

// Banner Management
function closeBanner() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Main Render Function
function renderApp() {
    updateWeekDisplay();
    renderSchedule();
    renderPlayers();
    renderClubWall();
    console.log('App rendered successfully');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['addPlayerModal', 'editPlayerModal', 'bookingModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Tennis Club App ready');
});

console.log('Working script loaded successfully');

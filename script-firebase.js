// Tennis Club App with Firebase Integration
console.log('Tennis app with Firebase loading...');

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
window.closeMessageModal = closeMessageModal;
window.postClubMessage = postClubMessage;
window.closePlayerModal = closePlayerModal;
window.savePlayer = savePlayer;

// App State
let isAuthenticated = false;
let currentWeekOffset = 0;
let currentBookingSlot = null;
let currentEditingPlayer = null;
let firebaseEnabled = false;
let database = null;
let playersListener = null;
let scheduleListener = null;

// Initialize Firebase
async function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            database = firebase.firestore();
            
            // Sign in anonymously
            await firebase.auth().signInAnonymously();
            console.log('✅ Firebase connected and authenticated');
            firebaseEnabled = true;
            
            // Setup real-time listeners
            setupPlayersListener();
            setupScheduleListener();
            
            return true;
        } else {
            throw new Error('Firebase not loaded');
        }
    } catch (error) {
        console.log('⚠️ Firebase not available, using localStorage:', error.message);
        firebaseEnabled = false;
        return false;
    }
}

// Real-time Firebase listeners
function setupPlayersListener() {
    if (!firebaseEnabled || !database) return;
    
    playersListener = database.collection('players')
        .onSnapshot((snapshot) => {
            console.log('📥 Players updated from Firebase');
            players = [];
            snapshot.forEach((doc) => {
                players.push({ id: doc.id, ...doc.data() });
            });
            
            // Update UI
            if (isAuthenticated) {
                loadPlayers();
                renderSchedule(); // Refresh schedule to show updated player names
            }
        }, (error) => {
            console.error('Players listener error:', error);
            firebaseEnabled = false;
        });
}

function setupScheduleListener() {
    if (!firebaseEnabled || !database) return;
    
    // Listen to current week's schedules
    const weekStart = getWeekStartDate(currentWeekOffset);
    const weekEnd = getWeekEndDate(currentWeekOffset);
    
    if (scheduleListener) {
        scheduleListener(); // Unsubscribe previous listener
    }
    
    scheduleListener = database.collection('schedules')
        .where('date', '>=', formatDateForId(weekStart))
        .where('date', '<=', formatDateForId(weekEnd))
        .onSnapshot((snapshot) => {
            console.log('📅 Schedule updated from Firebase');
            
            // Reset schedule for current week (all days, but only Tuesdays and Thursdays available)
            const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
            days.forEach(day => {
                if (day === 'tuesday' || day === 'thursday') {
                    const instructor = day === 'tuesday' ? 'Paša' : 'Justīne';
                    schedule[day] = {
                        '20:00-21:00': { players: [], maxCapacity: 5, instructor: instructor },
                        '21:00-22:00': { players: [], maxCapacity: 5, instructor: instructor }
                    };
                } else {
                    schedule[day] = {
                        '20:00-21:00': { players: [], maxCapacity: 5, unavailable: true },
                        '21:00-22:00': { players: [], maxCapacity: 5, unavailable: true }
                    };
                }
            });
            
            // Apply Firebase data
            snapshot.forEach((doc) => {
                const data = doc.data();
                const { day, time } = data;
                // Only update Tuesday and Thursday slots from Firebase
                if ((day === 'tuesday' || day === 'thursday') && schedule[day] && schedule[day][time]) {
                    const instructor = day === 'tuesday' ? 'Paša' : 'Justīne';
                    schedule[day][time] = {
                        players: data.players || [],
                        maxCapacity: data.maxCapacity || 5,
                        instructor: instructor
                    };
                }
            });
            
            // Update UI
            if (isAuthenticated) {
                renderSchedule();
            }
        }, (error) => {
            console.error('Schedule listener error:', error);
            firebaseEnabled = false;
        });
}// Default data (same as before)
let players = [
    { id: 'richards', name: 'Ričards', skillLevel: 'regular' },
    { id: 'diana', name: 'Diāna', skillLevel: 'regular' },
    { id: 'elza', name: 'Elza', skillLevel: 'regular' },
    { id: 'agnese', name: 'Agnese', skillLevel: 'regular' },
    { id: 'arta', name: 'Arta', skillLevel: 'regular' },
    { id: 'ilvija', name: 'Ilvija', skillLevel: 'beginner' }
];

let schedule = {
    'monday': {
        '20:00-21:00': { players: [], maxCapacity: 5, unavailable: true },
        '21:00-22:00': { players: [], maxCapacity: 5, unavailable: true }
    },
    'tuesday': {
        '20:00-21:00': { players: [], maxCapacity: 5, instructor: 'Paša' },
        '21:00-22:00': { players: [], maxCapacity: 5, instructor: 'Paša' }
    },
    'wednesday': {
        '20:00-21:00': { players: [], maxCapacity: 5, unavailable: true },
        '21:00-22:00': { players: [], maxCapacity: 5, unavailable: true }
    },
    'thursday': {
        '20:00-21:00': { players: [], maxCapacity: 5, instructor: 'Justīne' },
        '21:00-22:00': { players: [], maxCapacity: 5, instructor: 'Justīne' }
    }
};

// Login function
function login() {
    console.log('🎾 Login attempt...');
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === '30:Love') {
        console.log('✅ Login successful');
        isAuthenticated = true;
        
        // Show loading screen
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'flex';
        
        // Initialize app with loading steps
        initializeAppWithLoading();
    } else {
        console.log('❌ Incorrect password');
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}

// Logout function
function logout() {
    isAuthenticated = false;
    
    // Clean up Firebase listeners
    if (playersListener) {
        playersListener();
        playersListener = null;
    }
    if (scheduleListener) {
        scheduleListener();
        scheduleListener = null;
    }
    
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').textContent = '';
}

// Clear old localStorage data with invalid schedule structure
function clearOldStorageData() {
    const saved = localStorage.getItem('tennisSchedule');
    if (saved) {
        try {
            const loadedSchedule = JSON.parse(saved);
            
            // Check if it has old time slot structure
            const hasOldTimeSlots = loadedSchedule.tuesday && (loadedSchedule.tuesday['18:00-19:00'] || loadedSchedule.tuesday['19:00-20:00']);
            
            if (hasOldTimeSlots) {
                console.log('🗑️ Clearing old schedule data with wrong time slots from localStorage');
                localStorage.removeItem('tennisSchedule');
            }
        } catch (error) {
            console.log('🗑️ Clearing corrupted localStorage data');
            localStorage.removeItem('tennisSchedule');
        }
    }
}

// Initialize the app with loading steps
async function initializeAppWithLoading() {
    console.log('🚀 Initializing tennis club app with loading screen...');
    
    // Step 1: Firebase Connection
    updateLoadingStep('firebase', 'active');
    updateLoadingText('🔥 Connecting to Firebase...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to show step
    
    // Clear old localStorage data
    clearOldStorageData();
    
    // Try to initialize Firebase
    const firebaseReady = await initializeFirebase();
    updateLoadingStep('firebase', 'completed');
    
    // Step 2: Load Players
    updateLoadingStep('players', 'active');
    updateLoadingText('👥 Loading players...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (firebaseReady) {
        console.log('🔥 Firebase real-time sync enabled');
        await initializeFirebaseData();
    } else {
        console.log('💾 Using localStorage mode');
        loadPlayersFromStorage();
        loadScheduleFromStorage();
    }
    updateLoadingStep('players', 'completed');
    
    // Step 3: Setup Schedule
    updateLoadingStep('schedule', 'active');
    updateLoadingText('📅 Setting up schedule...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateWeekDisplay();
    renderSchedule();
    loadPlayers();
    updateLoadingStep('schedule', 'completed');
    
    // Step 4: Load Messages
    updateLoadingStep('messages', 'active');
    updateLoadingText('💬 Loading club wall...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    loadClubMessages();
    updateLoadingStep('messages', 'completed');
    
    // Final step: Show app
    updateLoadingText('✅ Welcome to Matchpoint Tennis Club!');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Show main app and hide loading
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Show announcement banner after app loads
    setTimeout(() => {
        const banner = document.getElementById('announcementBanner');
        if (banner) {
            banner.style.display = 'block';
        }
    }, 500);
    
    console.log('✅ App initialized successfully with loading screen');
}

// Original initialize function (kept for compatibility)
async function initializeApp() {
    console.log('🚀 Initializing tennis club app...');
    
    // Clear any old localStorage data that might have invalid schedule structure
    clearOldStorageData();
    
    // Try to initialize Firebase
    const firebaseReady = await initializeFirebase();
    
    if (firebaseReady) {
        console.log('🔥 Firebase real-time sync enabled');
        // Initialize default data in Firebase if needed
        await initializeFirebaseData();
    } else {
        console.log('💾 Using localStorage mode');
        loadPlayersFromStorage();
        loadScheduleFromStorage();
    }
    
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
    loadClubMessages();
    
    console.log('✅ App initialized successfully');
}

// Initialize Firebase data if collections are empty
async function initializeFirebaseData() {
    if (!firebaseEnabled || !database) return;
    
    try {
        // Check if players exist
        const playersSnapshot = await database.collection('players').get();
        if (playersSnapshot.empty) {
            console.log('🔧 Initializing players in Firebase...');
            const batch = database.batch();
            players.forEach(player => {
                const docRef = database.collection('players').doc(player.id);
                batch.set(docRef, {
                    name: player.name,
                    skillLevel: player.skillLevel,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log('✅ Players initialized in Firebase');
        }
        
        // Initialize default schedules for current week if needed
        await initializeWeekSchedule(currentWeekOffset);
        
    } catch (error) {
        console.error('Error initializing Firebase data:', error);
    }
}

async function initializeWeekSchedule(weekOffset) {
    if (!firebaseEnabled || !database) return;
    
    const weekStart = getWeekStartDate(weekOffset);
    const days = ['tuesday', 'thursday'];
    const timeSlots = ['20:00-21:00', '21:00-22:00'];
    
    const batch = database.batch();
    let hasWrites = false;
    
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const dayDate = new Date(weekStart);
        // Calculate proper date offset for Tuesday (1) and Thursday (3)
        const dayOffset = day === 'tuesday' ? 1 : 3;
        dayDate.setDate(weekStart.getDate() + dayOffset);
        const dateStr = formatDateForId(dayDate);
        
        for (const time of timeSlots) {
            const sessionId = getSessionId(dateStr, day, time);
            
            // Check if session already exists
            const docRef = database.collection('schedules').doc(sessionId);
            const doc = await docRef.get();
            
            if (!doc.exists) {
                const instructor = day === 'tuesday' ? 'Paša' : 'Justīne';
                const defaultPlayers = [];
                
                batch.set(docRef, {
                    date: dateStr,
                    day: day,
                    instructor: instructor,
                    time: time,
                    players: defaultPlayers,
                    maxCapacity: 5,
                    locked: false,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                hasWrites = true;
            }
        }
    }
    
    if (hasWrites) {
        await batch.commit();
        console.log('📅 Week schedule initialized in Firebase');
    }
}// Firebase-enabled booking functions
async function confirmBooking() {
    if (!currentBookingSlot) return;
    
    const { day, time } = currentBookingSlot;
    
    // Check if slot is unavailable
    const slotData = schedule[day]?.[time];
    if (!slotData || slotData.unavailable) {
        console.log('❌ Cannot book unavailable slot');
        showBookingError('This time slot is not available');
        return;
    }
    
    const playerSelect = document.getElementById('playerSelect');
    const confirmBtn = document.querySelector('.modal-footer .btn:not(.secondary)');
    const cancelBtn = document.querySelector('.modal-footer .btn.secondary');
    const modalBody = document.querySelector('.modal-body');
    const errorDiv = document.getElementById('bookingError');
    
    if (!playerSelect) return;
    
    const selectedPlayerId = playerSelect.value;
    
    if (!selectedPlayerId) {
        showBookingError('Please select a player');
        return;
    }
    
    // Start loading state
    setBookingLoading(true);
    
    try {
    
    const { day, time } = currentBookingSlot;
    
    if (firebaseEnabled && database) {
        // Firebase booking with transaction to prevent conflicts
        try {
            await database.runTransaction(async (transaction) => {
                const weekStart = getWeekStartDate(currentWeekOffset);
                const dayIndex = ['tuesday', 'thursday'].indexOf(day);
                const dayDate = new Date(weekStart);
                // Calculate proper date offset for Tuesday (1) and Thursday (3)
                const dayOffset = day === 'tuesday' ? 1 : 3;
                dayDate.setDate(weekStart.getDate() + dayOffset);
                const dateStr = formatDateForId(dayDate);
                const sessionId = getSessionId(dateStr, day, time);
                
                const docRef = database.collection('schedules').doc(sessionId);
                const doc = await transaction.get(docRef);
                
                let currentPlayers = [];
                let maxCapacity = 5;
                
                if (doc.exists) {
                    const data = doc.data();
                    currentPlayers = data.players || [];
                    maxCapacity = data.maxCapacity || 5;
                }
                
                // Check if player is already booked
                if (currentPlayers.includes(selectedPlayerId)) {
                    throw new Error('This player is already booked for this slot');
                }
                
                // Check capacity
                if (currentPlayers.length >= maxCapacity) {
                    throw new Error('This slot is full');
                }
                
                // Add player
                const updatedPlayers = [...currentPlayers, selectedPlayerId];
                
                transaction.set(docRef, {
                    date: dateStr,
                    day: day,
                    time: time,
                    players: updatedPlayers,
                    maxCapacity: maxCapacity,
                    locked: false,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            
            // Show success state briefly
            showBookingSuccess();
            
            // Close modal after short delay
            setTimeout(() => {
                closeBookingModal();
            }, 1000);
            
            console.log(`✅ Booked ${selectedPlayerId} for ${day} ${time} via Firebase`);
            
        } catch (error) {
            console.error('Booking error:', error);
            showBookingError(error.message || 'Booking failed. Please try again.');
            setBookingLoading(false);
            return;
        }
        
    } else {
        // localStorage fallback
        if (!schedule[day]) schedule[day] = {};
        if (!schedule[day][time]) schedule[day][time] = { players: [], maxCapacity: 5 };
        
        const slotData = schedule[day][time];
        
        if (slotData.players.includes(selectedPlayerId)) {
            alert('This player is already booked for this slot');
            return;
        }
        
        if (slotData.players.length >= slotData.maxCapacity) {
            showBookingError('This slot is full');
            setBookingLoading(false);
            return;
        }
        
        slotData.players.push(selectedPlayerId);
        saveScheduleToStorage();
        renderSchedule();
        
        // Show success and close
        showBookingSuccess();
        setTimeout(() => {
            closeBookingModal();
        }, 800);
        
        console.log(`✅ Booked ${selectedPlayerId} for ${day} ${time} via localStorage`);
    }
    
    } catch (error) {
        console.error('Booking error:', error);
        showBookingError('Booking failed. Please try again.');
        setBookingLoading(false);
    }
}

async function removePlayer(day, time, playerId) {
    // Check if slot is unavailable
    const slotData = schedule[day]?.[time];
    if (!slotData || slotData.unavailable) {
        console.log('❌ Cannot remove player from unavailable slot');
        return;
    }
    
    if (firebaseEnabled && database) {
        // Firebase removal with transaction
        try {
            await database.runTransaction(async (transaction) => {
                const weekStart = getWeekStartDate(currentWeekOffset);
                const dayIndex = ['tuesday', 'thursday'].indexOf(day);
                const dayDate = new Date(weekStart);
                // Calculate proper date offset for Tuesday (1) and Thursday (3)
                const dayOffset = day === 'tuesday' ? 1 : 3;
                dayDate.setDate(weekStart.getDate() + dayOffset);
                const dateStr = formatDateForId(dayDate);
                const sessionId = getSessionId(dateStr, day, time);
                
                const docRef = database.collection('schedules').doc(sessionId);
                const doc = await transaction.get(docRef);
                
                if (doc.exists) {
                    const data = doc.data();
                    const currentPlayers = data.players || [];
                    const updatedPlayers = currentPlayers.filter(id => id !== playerId);
                    
                    transaction.update(docRef, {
                        players: updatedPlayers,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            
            console.log(`✅ Removed ${playerId} from ${day} ${time} via Firebase`);
            
        } catch (error) {
            console.error('Remove player error:', error);
            alert('Failed to remove player. Please try again.');
        }
        
    } else {
        // localStorage fallback
        const slotData = schedule[day]?.[time];
        if (!slotData) return;
        
        const playerIndex = slotData.players.indexOf(playerId);
        if (playerIndex > -1) {
            slotData.players.splice(playerIndex, 1);
            saveScheduleToStorage();
            renderSchedule();
            console.log(`✅ Removed ${playerId} from ${day} ${time} via localStorage`);
        }
    }
}

// Firebase-enabled player management
function showAddPlayer() {
    currentEditingPlayer = null;
    
    // Reset form
    document.getElementById('playerModalTitle').textContent = 'Add Player';
    document.getElementById('playerName').value = '';
    document.getElementById('playerSkillLevel').value = '';
    document.getElementById('savePlayerBtn').textContent = 'Add Player';
    
    // Show modal
    document.getElementById('playerModal').style.display = 'flex';
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('playerName').focus();
    }, 100);
}

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    if (firebaseEnabled && database) {
        // Remove from Firebase
        try {
            // Remove player document
            await database.collection('players').doc(playerId).delete();
            
            // Remove player from all schedules
            const schedulesSnapshot = await database.collection('schedules')
                .where('players', 'array-contains', playerId)
                .get();
            
            const batch = database.batch();
            schedulesSnapshot.forEach(doc => {
                const data = doc.data();
                const updatedPlayers = data.players.filter(id => id !== playerId);
                batch.update(doc.ref, {
                    players: updatedPlayers,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            console.log(`✅ Deleted player ${playerId} via Firebase`);
            
        } catch (error) {
            console.error('Delete player error:', error);
            alert('Failed to delete player. Please try again.');
        }
    } else {
        // localStorage fallback
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
            
            savePlayersToStorage();
            saveScheduleToStorage();
            loadPlayers();
            renderSchedule();
            console.log(`✅ Deleted player ${playerId} via localStorage`);
        }
    }
}// Week navigation with Firebase sync
function changeWeek(direction) {
    currentWeekOffset += direction;
    updateWeekDisplay();
    
    // Setup listener for new week
    if (firebaseEnabled && database) {
        setupScheduleListener();
        // Initialize week schedule if it doesn't exist
        initializeWeekSchedule(currentWeekOffset);
    }
    
    renderSchedule();
}

// Helper functions (from firebase-config.js)
function getSessionId(date, day, time) {
    return `${date}-${day}-${time}`;
}

function formatDateForId(date) {
    return date.toISOString().split('T')[0];
}

function getWeekStartDate(weekOffset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekEndDate(weekOffset = 0) {
    const monday = getWeekStartDate(weekOffset);
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3); // Monday + 3 = Thursday
    thursday.setHours(23, 59, 59, 999);
    return thursday;
}

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

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
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

// Schedule rendering (same as before)
function renderSchedule() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const weekStart = getWeekStartDate(currentWeekOffset);
    
    console.log('🎾 Rendering schedule for days:', days);
    
    scheduleGrid.innerHTML = '';
    
    days.forEach((day, index) => {
        const dayDate = new Date(weekStart);
        // Calculate proper date offset for each day of week
        const dayOffset = day === 'monday' ? 0 : day === 'tuesday' ? 1 : day === 'wednesday' ? 2 : 3;
        dayDate.setDate(weekStart.getDate() + dayOffset);
        
        const dayCard = createDayCard(day, dayNames[index], dayDate);
        scheduleGrid.appendChild(dayCard);
    });
}

function createDayCard(day, dayName, date) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    
    const timeSlots = ['20:00-21:00', '21:00-22:00'];
    const instructor = day === 'tuesday' ? 'Paša' : day === 'thursday' ? 'Justīne' : null;
    const isUnavailableDay = day === 'monday' || day === 'wednesday';
    
    dayCard.innerHTML = `
        <div class="day-header">
            <div class="day-title-row">
                <div class="day-name">
                    <span class="day-title">${dayName}</span>
                    ${instructor ? `<span class="instructor-inline">Led by ${instructor}</span>` : '<span class="unavailable-text">No tennis today</span>'}
                </div>
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

    
    // Add data attribute for styling
    dayCard.setAttribute('data-day', day);
    
    return dayCard;
}

function createTimeSlotHTML(day, time, date) {
    const slotData = schedule[day]?.[time] || { players: [], maxCapacity: 5 };
    const isUnavailable = slotData.unavailable || false;
    const isAvailable = !isUnavailable && slotData.players.length < slotData.maxCapacity;
    const isPast = isSlotInPast(date, time);
    
    // Set the appropriate status class
    let statusClass = 'unavailable';
    if (!isUnavailable) {
        statusClass = isPast ? 'past' : (isAvailable ? 'available' : 'full');
    }
    
    // For unavailable slots, don't show players list or add button
    if (isUnavailable) {
        return `
            <div class="time-slot unavailable">
                <div class="slot-header">
                    <div class="slot-time">${time}</div>
                </div>
                <div class="slot-capacity">No tennis today</div>
            </div>
        `;
    }
    
    // For available slots, show normal functionality
    return `
        <div class="time-slot ${statusClass}" ${isAvailable && !isPast ? `onclick="openBookingModal('${day}', '${time}')"` : ''}>
            <div class="slot-header">
                <div class="slot-time">${time}</div>
            </div>
            <div class="slot-capacity">
                ${slotData.players.length}/${slotData.maxCapacity} players
            </div>
            <div class="players-list">
                ${slotData.players.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    const removeX = isPast ? '' : '<span class="remove-x">×</span>';
                    const clickAction = isPast ? '' : `onclick="removePlayer('${day}', '${time}', '${playerId}'); event.stopPropagation();" title="Click to remove player"`;
                    return player ? `<span class="player-tag ${player.skillLevel}" ${clickAction}>${player.name}${removeX}</span>` : '';
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
}// Booking modal functions (same as before)
function openBookingModal(day, time) {
    // Check if slot is unavailable
    const slotData = schedule[day]?.[time];
    if (!slotData || slotData.unavailable) {
        console.log('❌ Cannot book unavailable slot');
        return;
    }
    
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
    
    // Show current players (reuse slotData from above)
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
    
    // Clean up loading states
    setBookingLoading(false);
    
    // Remove any error messages
    const errorDiv = document.querySelector('.booking-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // Remove success messages
    const successDiv = document.querySelector('.booking-success');
    if (successDiv) {
        successDiv.remove();
    }
    
    currentBookingSlot = null;
}

// Player management UI
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

function editPlayer(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    currentEditingPlayer = playerId;
    
    // Set form values
    document.getElementById('playerModalTitle').textContent = 'Edit Player';
    document.getElementById('playerName').value = player.name;
    document.getElementById('playerSkillLevel').value = player.skillLevel;
    document.getElementById('savePlayerBtn').textContent = 'Update Player';
    
    // Show modal
    document.getElementById('playerModal').style.display = 'flex';
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('playerName').focus();
    }, 100);
}

// localStorage fallback functions
function savePlayersToStorage() {
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

function saveScheduleToStorage() {
    localStorage.setItem('tennisSchedule', JSON.stringify(schedule));
}

function loadScheduleFromStorage() {
    const saved = localStorage.getItem('tennisSchedule');
    if (saved) {
        try {
            const loadedSchedule = JSON.parse(saved);
            
            // Validate loaded schedule has correct structure (all four days)
            const expectedDays = ['monday', 'tuesday', 'wednesday', 'thursday'];
            const expectedTimeSlots = ['20:00-21:00', '21:00-22:00'];
            let isValidSchedule = true;
            
            // Check if schedule has the correct days and time slots
            for (const day of expectedDays) {
                if (!loadedSchedule[day]) {
                    isValidSchedule = false;
                    break;
                }
                for (const timeSlot of expectedTimeSlots) {
                    if (!loadedSchedule[day][timeSlot]) {
                        isValidSchedule = false;
                        break;
                    }
                    // Ensure Monday and Wednesday remain unavailable
                    if ((day === 'monday' || day === 'wednesday') && !loadedSchedule[day][timeSlot].unavailable) {
                        loadedSchedule[day][timeSlot].unavailable = true;
                    }
                }
            }
            
            if (isValidSchedule) {
                schedule = loadedSchedule;
                // Ensure Monday and Wednesday are marked as unavailable
                ['monday', 'wednesday'].forEach(day => {
                    Object.keys(schedule[day]).forEach(time => {
                        schedule[day][time].unavailable = true;
                    });
                });
                console.log('✅ Valid schedule loaded from localStorage');
            } else {
                console.log('⚠️ Invalid schedule in localStorage, using defaults');
                localStorage.removeItem('tennisSchedule'); // Clear invalid data
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            localStorage.removeItem('tennisSchedule'); // Clear corrupted data
        }
    }
}

// Sidebar and UI functions
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

function closeAnnouncement() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.classList.add('closing');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 400);
    }
}

// Club Wall Functions
function showAddMessage() {
    // Create and show the message modal
    const modal = createMessageModal();
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Focus on the message input
    setTimeout(() => {
        const messageInput = modal.querySelector('#messageInput');
        if (messageInput) messageInput.focus();
    }, 100);
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
                <div class="char-count">
                    <span id="charCount">0/500</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn secondary" onclick="closeMessageModal()">Cancel</button>
                <button class="btn" onclick="postClubMessage()">📢 Post Message</button>
            </div>
        </div>
    `;
    
    // Add character counter
    const messageInput = modal.querySelector('#messageInput');
    const charCount = modal.querySelector('#charCount');
    messageInput.addEventListener('input', function() {
        charCount.textContent = `${this.value.length}/500`;
    });
    
    return modal;
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.remove();
    }
}

async function postClubMessage() {
    const authorInput = document.getElementById('authorInput');
    const messageInput = document.getElementById('messageInput');
    
    if (!authorInput || !messageInput) return;
    
    const author = authorInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!author) {
        alert('Please enter your name');
        authorInput.focus();
        return;
    }
    
    if (!message) {
        alert('Please enter a message');
        messageInput.focus();
        return;
    }
    
    try {
        // Show loading
        const postBtn = document.querySelector('#messageModal .btn:not(.secondary)');
        const originalText = postBtn.innerHTML;
        postBtn.innerHTML = '⏳ Posting...';
        postBtn.disabled = true;
        
        // Create message document
        const messageData = {
            author: author,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            id: Date.now().toString()
        };
        
        // Add to Firestore
        await db.collection('clubMessages').add(messageData);
        
        // Trigger confetti effect
        if (window.confetti) {
            window.confetti({
                particleCount: 50,
                spread: 45,
                origin: { y: 0.8 }
            });
        }
        
        console.log('✅ Message posted successfully');
        closeMessageModal();
        
    } catch (error) {
        console.error('❌ Error posting message:', error);
        alert('Failed to post message. Please try again.');
        
        // Reset button
        const postBtn = document.querySelector('#messageModal .btn:not(.secondary)');
        if (postBtn) {
            postBtn.innerHTML = '📢 Post Message';
            postBtn.disabled = false;
        }
    }
}

function loadClubMessages() {
    console.log('📢 Loading club messages...');
    
    // Listen for real-time updates to club messages
    db.collection('clubMessages')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            console.log('📢 Club messages updated');
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderClubMessages(messages);
        }, (error) => {
            console.error('❌ Error loading club messages:', error);
            renderClubMessages([]); // Show empty state
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
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => {
        const timestamp = message.timestamp ? 
            formatMessageTime(message.timestamp.toDate()) : 
            'Just now';
            
        return `
            <div class="club-message">
                <div class="message-header">
                    <div class="message-author">👤 ${escapeHtml(message.author)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
                <div class="message-content">${escapeHtml(message.message)}</div>
            </div>
        `;
    }).join('');
}

function formatMessageTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎾 Tennis club app with Firebase loading...');
    
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
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal && e.target === bookingModal) {
            closeBookingModal();
        }
        
        const playerModal = document.getElementById('playerModal');
        if (playerModal && e.target === playerModal) {
            closePlayerModal();
        }
    });
    
    // Setup player form enter key and form validation
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePlayer();
        });
        
        const playerName = document.getElementById('playerName');
        if (playerName) {
            playerName.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('playerSkillLevel').focus();
                }
            });
        }
        
        const playerSkillLevel = document.getElementById('playerSkillLevel');
        if (playerSkillLevel) {
            playerSkillLevel.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    savePlayer();
                }
            });
        }
    }
    
    console.log('✅ Tennis app with Firebase ready');
});

console.log('🔥 Firebase-enabled tennis script loaded successfully');// Loading state management functions
function setBookingLoading(loading) {
    const confirmBtn = document.querySelector('.modal-footer .btn:not(.secondary)');
    const cancelBtn = document.querySelector('.modal-footer .btn.secondary');
    const modalBody = document.querySelector('.modal-body');
    const modal = document.querySelector('.modal-content');
    
    if (loading) {
        // Show loading on confirm button
        if (confirmBtn) {
            confirmBtn.classList.add('loading');
            confirmBtn.textContent = 'Booking...';
        }
        
        // Disable form
        if (modalBody) {
            modalBody.classList.add('form-disabled');
        }
        
        // Show loading overlay
        showModalLoadingOverlay();
        
    } else {
        // Remove loading state
        if (confirmBtn) {
            confirmBtn.classList.remove('loading');
            confirmBtn.textContent = 'Confirm Booking';
        }
        
        // Re-enable form
        if (modalBody) {
            modalBody.classList.remove('form-disabled');
        }
        
        // Hide loading overlay
        hideModalLoadingOverlay();
    }
}

function showModalLoadingOverlay() {
    const modal = document.querySelector('.modal-content');
    if (!modal) return;
    
    // Remove any existing overlay
    const existingOverlay = modal.querySelector('.modal-loading-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <span class="tennis-ball-spinner">🎾</span>
            <div class="loading-text">Booking player...</div>
            <div class="loading-subtext">Syncing with other members</div>
        </div>
    `;
    
    modal.appendChild(overlay);
    
    // Show with animation
    setTimeout(() => {
        overlay.classList.add('show');
    }, 50);
}

function hideModalLoadingOverlay() {
    const overlay = document.querySelector('.modal-loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

function showBookingSuccess() {
    const modal = document.querySelector('.modal-content');
    if (!modal) return;
    
    // Remove loading overlay first
    hideModalLoadingOverlay();
    
    // Create success message
    const success = document.createElement('div');
    success.className = 'booking-success';
    success.innerHTML = '✅ Player booked successfully!';
    
    modal.appendChild(success);
    
    // Show with animation
    setTimeout(() => {
        success.classList.add('show');
    }, 50);
    
    // Remove after delay
    setTimeout(() => {
        success.remove();
    }, 1500);
}

function showBookingError(message) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    // Remove existing error
    const existingError = modalBody.querySelector('.booking-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message
    const error = document.createElement('div');
    error.className = 'booking-error show';
    error.textContent = message;
    
    modalBody.appendChild(error);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        error.classList.remove('show');
        setTimeout(() => {
            error.remove();
        }, 300);
    }, 4000);
}

// Player Management Modal Functions
function closePlayerModal() {
    document.getElementById('playerModal').style.display = 'none';
    currentEditingPlayer = null;
    
    // Clear form
    document.getElementById('playerName').value = '';
    document.getElementById('playerSkillLevel').value = '';
    
    // Reset modal to "Add Player" mode
    document.getElementById('playerModalTitle').textContent = 'Add Player';
    document.getElementById('savePlayerBtn').textContent = 'Add Player';
}

async function savePlayer() {
    const name = document.getElementById('playerName').value.trim();
    const skillLevel = document.getElementById('playerSkillLevel').value;
    
    console.log('🎾 Saving player:', { name, skillLevel, editing: currentEditingPlayer });
    
    if (!name) {
        alert('Please enter a player name');
        document.getElementById('playerName').focus();
        return;
    }
    
    if (!skillLevel) {
        alert('Please select a skill level');
        document.getElementById('playerSkillLevel').focus();
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('savePlayerBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        if (currentEditingPlayer) {
            // Edit existing player
            if (firebaseEnabled && database) {
                // Update in Firebase
                await database.collection('players').doc(currentEditingPlayer).update({
                    name: name,
                    skillLevel: skillLevel,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Updated player ${currentEditingPlayer} via Firebase`);
                
                // Also update local array immediately for faster UI response
                const playerIndex = players.findIndex(p => p.id === currentEditingPlayer);
                if (playerIndex !== -1) {
                    players[playerIndex].name = name;
                    players[playerIndex].skillLevel = skillLevel;
                    loadPlayers();
                    renderSchedule();
                    console.log(`✅ Local player data updated for immediate UI refresh`);
                }
            } else {
                // localStorage fallback
                const playerIndex = players.findIndex(p => p.id === currentEditingPlayer);
                if (playerIndex !== -1) {
                    players[playerIndex].name = name;
                    players[playerIndex].skillLevel = skillLevel;
                    savePlayersToStorage();
                    loadPlayers();
                    renderSchedule();
                    console.log(`✅ Updated player ${currentEditingPlayer} via localStorage`);
                } else {
                    console.error(`❌ Player not found for update: ${currentEditingPlayer}`);
                    alert('Error: Player not found. Please refresh and try again.');
                }
            }
        } else {
            // Add new player
            // Generate unique ID that preserves Latvian characters
            const timestamp = Date.now();
            const cleanName = name.toLowerCase()
                .replace(/[āàáâãäå]/g, 'a')
                .replace(/[čć]/g, 'c')
                .replace(/[ēèéêë]/g, 'e')
                .replace(/[ģ]/g, 'g')
                .replace(/[īìíîï]/g, 'i')
                .replace(/[ķ]/g, 'k')
                .replace(/[ļ]/g, 'l')
                .replace(/[ņñ]/g, 'n')
                .replace(/[ōòóôõö]/g, 'o')
                .replace(/[ŗ]/g, 'r')
                .replace(/[š]/g, 's')
                .replace(/[ūùúûü]/g, 'u')
                .replace(/[ž]/g, 'z')
                .replace(/[^a-z0-9]/g, '');
            const id = `${cleanName}_${timestamp}`;
            
            // Check if player already exists
            const existingPlayer = players.find(p => 
                p.name.toLowerCase() === name.toLowerCase()
            );
            
            if (existingPlayer) {
                alert('A player with this name already exists!');
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                return;
            }
            
            if (firebaseEnabled && database) {
                // Add to Firebase
                await database.collection('players').doc(id).set({
                    name: name,
                    skillLevel: skillLevel,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Added player ${name} via Firebase`);
            } else {
                // localStorage fallback
                players.push({ id, name, skillLevel });
                savePlayersToStorage();
                loadPlayers();
                console.log(`✅ Added player ${name} via localStorage`);
            }
        }
        
        // Close modal
        closePlayerModal();
        
    } catch (error) {
        console.error('Save player error:', error);
        alert('Failed to save player. Please try again.');
        
        // Reset button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Loading Screen Helper Functions
function updateLoadingStep(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    if (step) {
        step.className = `step ${status}`;
    }
}

function updateLoadingText(text) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = text;
    }
}
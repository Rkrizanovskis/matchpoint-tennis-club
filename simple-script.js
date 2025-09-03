// Simple Login Function - No Firebase
function login() {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    console.log('Login attempt with password:', password);
    
    if (password === '30:Love') {
        console.log('Password correct - logging in');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize basic app without Firebase
        initializeBasicApp();
    } else {
        console.log('Password incorrect');
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}

function initializeBasicApp() {
    console.log('Initializing basic app...');
    
    // Basic schedule data
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (scheduleGrid) {
        scheduleGrid.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>🎾 Tennis Schedule</h2>
                <p>Weekly tennis sessions with coaches Paša and Justīne</p>
                <div style="background: #f5f5f5; padding: 15px; margin: 10px; border-radius: 8px;">
                    <strong>Monday:</strong> Paša coaching - 18:00-20:00
                </div>
                <div style="background: #f5f5f5; padding: 15px; margin: 10px; border-radius: 8px;">
                    <strong>Tuesday:</strong> Justīne coaching - 18:00-20:00
                </div>
                <div style="background: #f5f5f5; padding: 15px; margin: 10px; border-radius: 8px;">
                    <strong>Wednesday:</strong> Paša coaching - 18:00-20:00
                </div>
                <div style="background: #f5f5f5; padding: 15px; margin: 10px; border-radius: 8px;">
                    <strong>Thursday:</strong> Paša coaching - 18:00-20:00
                </div>
            </div>
        `;
    }
    
    // Basic club wall
    const wallMessages = document.getElementById('wallMessages');
    if (wallMessages) {
        wallMessages.innerHTML = `
            <div style="padding: 10px; background: #e8f5e8; margin: 10px 0; border-radius: 8px;">
                <strong>Welcome!</strong> The tennis club scheduler is now working!
            </div>
        `;
    }
    
    console.log('Basic app initialized');
}

// Week navigation functions
function changeWeek(direction) {
    console.log('Changing week:', direction);
    alert('Week navigation: ' + (direction > 0 ? 'Next week' : 'Previous week'));
}

// Toggle sidebar
function toggleSidebar() {
    console.log('Toggle sidebar');
    const panel = document.getElementById('sidebarPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    }
}

// Close banner
function closeBanner() {
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Post club message
function postClubMessage() {
    const nickname = document.getElementById('wallNickname').value;
    const message = document.getElementById('wallMessage').value;
    
    if (nickname && message) {
        const wallMessages = document.getElementById('wallMessages');
        const newMessage = document.createElement('div');
        newMessage.style.cssText = 'padding: 10px; background: #e8f5e8; margin: 10px 0; border-radius: 8px;';
        newMessage.innerHTML = `<strong>${nickname}:</strong> ${message}`;
        wallMessages.appendChild(newMessage);
        
        // Clear form
        document.getElementById('wallNickname').value = '';
        document.getElementById('wallMessage').value = '';
        
        alert('Message posted successfully!');
    } else {
        alert('Please enter both name and message');
    }
}

// Modal functions
function showAddPlayerModal() {
    alert('Add Player Modal - Coming soon!');
}

function hideAddPlayerModal() {
    // Implementation
}

function hideEditPlayerModal() {
    // Implementation  
}

function hideBookingModal() {
    // Implementation
}

console.log('Simple script loaded successfully');

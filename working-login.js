// Simple working login script
console.log('Working login script loaded');

// Basic variables
let isAuthenticated = false;

// Login function
function login() {
    console.log('Login function called');
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    console.log('Password entered:', password);
    console.log('Expected password: 30:Love');
    
    if (password === '30:Love') {
        console.log('Password correct - logging in');
        isAuthenticated = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize a basic version without Firebase for now
        initializeBasicApp();
    } else {
        console.log('Login failed - incorrect password');
        errorDiv.textContent = 'Incorrect password. Please try again.';
    }
}

// Basic app initialization
function initializeBasicApp() {
    console.log('Initializing basic app...');
    
    // Show a simple welcome message
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h1>🎾 Welcome to Matchpoint Tennis Club!</h1>
                <p><strong>Login successful!</strong></p>
                <p>This is a basic version while we debug the Firebase connection.</p>
                <button onclick="logout()" style="background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                    Logout
                </button>
            </div>
        `;
    }
}

// Logout function
function logout() {
    console.log('Logging out...');
    isAuthenticated = false;
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').textContent = '';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - setting up event listeners');
    
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        console.log('Password input found, adding Enter key listener');
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Enter key pressed, calling login()');
                login();
            }
        });
    } else {
        console.error('Password input not found!');
    }
});

console.log('Working login script initialization complete');
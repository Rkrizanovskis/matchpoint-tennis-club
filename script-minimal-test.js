// Minimal test script to check basic functionality
console.log('🎾 Minimal test script loading...');

// Test login function
function login() {
    console.log('🎾 Login function called');
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === '30:Love') {
        console.log('✅ Login successful');
        alert('Login successful!');
        errorDiv.textContent = '';
    } else {
        console.log('❌ Invalid password');
        errorDiv.textContent = 'Invalid password. Try: 30:Love';
    }
}

// Test function
function testFunction() {
    console.log('✅ Test function works');
    return true;
}

console.log('✅ Minimal test script loaded successfully');

// frontend/Scripts/auth.js - Enhanced Version

// Check if user is logged in and update UI
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            updateNavigationForLoggedInUser(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else {
        updateNavigationForGuest();
    }
}

// Update navigation for logged-in user
function updateNavigationForLoggedInUser(userData) {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (authButtons) {
        const userInitial = userData.name.charAt(0).toUpperCase();
        
        // NO ADMIN BUTTONS IN NAVIGATION - they're in page content now
        authButtons.innerHTML = `
            <div class="user-welcome">
                <div class="user-avatar-small">${userInitial}</div>
                <div class="user-info">
                    <span class="user-name">${userData.name}</span>
                    <span class="user-role">${userData.role || 'Student'}</span>
                </div>
                <button class="auth-btn secondary logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
    }
}

// Update navigation for guest users
function updateNavigationForGuest() {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (authButtons && !authButtons.querySelector('.auth-btn')) {
        authButtons.innerHTML = `
            <a href="login.html" class="auth-btn secondary">Login</a>
            <a href="signup.html" class="auth-btn">Sign Up</a>
        `;
    }
}

// Update page-specific content based on user auth
function updatePageContentForUser(userData) {
    // Add user-specific content updates here
    // For example, show "Create Event" button only for logged-in users
    
    const createEventButtons = document.querySelectorAll('[data-auth-only]');
    createEventButtons.forEach(button => {
        button.style.display = 'block';
    });
    
    // Update welcome messages
    const welcomeElements = document.querySelectorAll('[data-welcome]');
    welcomeElements.forEach(element => {
        element.textContent = `Welcome back, ${userData.name}!`;
    });
}

// Logout function
function logout() {
    // Show confirmation
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// Check if user is authenticated (for protected API calls)
function getAuthToken() {
    return localStorage.getItem('token');
}

// Get current user data
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Initialize auth when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Add event listener for page changes (if using SPA-like navigation)
    window.addEventListener('storage', function(e) {
        if (e.key === 'token' || e.key === 'user') {
            checkAuth();
        }
    });
});
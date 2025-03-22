// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const loginError = document.getElementById('login-error');
const togglePasswordBtn = document.querySelector('.toggle-password');
const rememberMeCheckbox = document.getElementById('remember-me');
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const mobileNav = document.querySelector('.mobile-nav');
const darkModeToggle = document.querySelector('.dark-mode-toggle');

// Initialize the application
function init() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Redirect to front page if already logged in
        window.location.href = 'front.html';
        return;
    }
    
    // Check if dark mode is enabled in local storage
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if there's a saved email in localStorage
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Mobile menu
    if (mobileMenuIcon) {
        mobileMenuIcon.addEventListener('click', toggleMobileMenu);
    }
    
    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Input event listeners for real-time validation
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
    }
}

// Handle login form submission
function handleLoginSubmit(event) {
    event.preventDefault();
    
    // Reset error messages
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    loginError.style.display = 'none';
    
    // Validate form inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    // If both validations pass, proceed with login
    if (isEmailValid && isPasswordValid) {
        // In a real application, you would send the credentials to a server
        // For demo purposes, we'll simulate authentication
        simulateAuthentication(emailInput.value, passwordInput.value);
    }
}

// Validate email format
function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        emailError.textContent = 'Email is required';
        emailError.style.display = 'block';
        return false;
    } else if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
        return false;
    }
    
    emailError.style.display = 'none';
    return true;
}

// Validate password
function validatePassword() {
    const password = passwordInput.value;
    
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordError.style.display = 'block';
        return false;
    } else if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters long';
        passwordError.style.display = 'block';
        return false;
    }
    
    passwordError.style.display = 'none';
    return true;
}

// Toggle password visibility
function togglePasswordVisibility() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordBtn.classList.remove('fa-eye-slash');
        togglePasswordBtn.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        togglePasswordBtn.classList.remove('fa-eye');
        togglePasswordBtn.classList.add('fa-eye-slash');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    mobileNav.classList.toggle('active');
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to local storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Simulate authentication (for demo purposes)
function simulateAuthentication(email, password) {
    // Show loading state
    const loginBtn = document.querySelector('.login-btn');
    const originalBtnText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    // Simulate API call with timeout
    setTimeout(() => {
        // For demo, we'll accept any valid email and password combination
        // In a real app, you would validate against a backend
        const isAuthenticated = true;
        
        if (isAuthenticated) {
            // Save email if "Remember me" is checked
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('savedEmail', email);
            } else {
                localStorage.removeItem('savedEmail');
            }
            
            // Set logged in state and default user data if none exists
            localStorage.setItem('isLoggedIn', 'true');
            
            // Store user name from email if not available
            if (!localStorage.getItem('userFullname')) {
                const userName = email.split('@')[0]; // Simple extraction from email
                localStorage.setItem('userFullname', userName);
            }
            localStorage.setItem('userEmail', email);
            
            // Redirect to front.html instead of main.html
            loginBtn.textContent = 'Success!';
            setTimeout(() => {
                window.location.href = 'front.html';
            }, 1000);
        } else {
            // Show login error
            loginError.textContent = 'Invalid email or password';
            loginError.style.display = 'block';
            
            // Reset button
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        }
    }, 1500);
}

// Update the browser URL to include login in navigation history
function updateBrowserHistory() {
    const url = new URL(window.location.href);
    if (!url.pathname.includes('login.html')) {
        window.history.pushState({}, 'Login - RescueRoad', 'login.html');
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init); 
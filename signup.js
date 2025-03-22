// DOM Elements
const signupForm = document.getElementById('signup-form');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const fullnameError = document.getElementById('fullname-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const signupError = document.getElementById('signup-error');
const togglePasswordBtn = document.querySelector('.toggle-password');
const toggleConfirmPasswordBtn = document.querySelector('.toggle-confirm-password');
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const mobileNav = document.querySelector('.mobile-nav');
const darkModeToggle = document.querySelector('.dark-mode-toggle');

// Initialize the application
function init() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Redirect to main page if already logged in
        window.location.href = 'main.html';
        return;
    }
    
    // Check if dark mode is enabled in local storage
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Form submission
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePasswordBtn));
    }
    
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn));
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
    if (fullnameInput) {
        fullnameInput.addEventListener('blur', validateFullname);
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    }
}

// Handle signup form submission
function handleSignupSubmit(event) {
    event.preventDefault();
    
    // Reset error messages
    fullnameError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    confirmPasswordError.style.display = 'none';
    signupError.style.display = 'none';
    
    // Validate form inputs
    const isFullnameValid = validateFullname();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    // If all validations pass, proceed with signup
    if (isFullnameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
        // In a real application, you would send the registration data to a server
        // For demo purposes, we'll simulate registration
        simulateRegistration(fullnameInput.value, emailInput.value, passwordInput.value);
    }
}

// Validate fullname
function validateFullname() {
    const fullname = fullnameInput.value.trim();
    
    if (!fullname) {
        fullnameError.textContent = 'Full name is required';
        fullnameError.style.display = 'block';
        return false;
    } else if (!/^[a-zA-Z\s]+$/.test(fullname)) {
        fullnameError.textContent = 'Name should only contain letters and spaces';
        fullnameError.style.display = 'block';
        return false;
    }
    
    fullnameError.style.display = 'none';
    return true;
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

// Validate confirm password
function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        confirmPasswordError.style.display = 'block';
        return false;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.style.display = 'block';
        return false;
    }
    
    confirmPasswordError.style.display = 'none';
    return true;
}

// Toggle password visibility
function togglePasswordVisibility(inputField, toggleButton) {
    if (inputField.type === 'password') {
        inputField.type = 'text';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    } else {
        inputField.type = 'password';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
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

// Simulate registration (for demo purposes)
function simulateRegistration(fullname, email, password) {
    // Show loading state
    const signupBtn = document.querySelector('.login-btn');
    const originalBtnText = signupBtn.textContent;
    signupBtn.textContent = 'Creating Account...';
    signupBtn.disabled = true;
    
    // Simulate API call with timeout
    setTimeout(() => {
        // For demo, we'll assume registration is successful
        // In a real app, you would send data to a backend
        
        // Store user data (for demo only - in a real app this would be handled by the backend)
        localStorage.setItem('userFullname', fullname);
        localStorage.setItem('userEmail', email);
        
        // Set logged in state
        localStorage.setItem('isLoggedIn', 'true');
        
        // Show success message
        signupBtn.textContent = 'Success!';
        
        // Redirect to main page after successful registration
        setTimeout(() => {
            window.location.href = 'front.html';
        }, 1000);
    }, 1500);
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init); 
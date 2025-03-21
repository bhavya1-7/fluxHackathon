// Global Variables
let map;
let infoWindow;
let markers = [];
let currentPosition = null;
let placesService;
let servicesList = [];
let filteredServicesList = [];
let currentFilter = 'all';
let savedLocation = null;
let mapLoaded = false;

// DOM Elements
const locationSearch = document.getElementById('location-search');
const searchButton = document.getElementById('search-button');
const currentLocationBtn = document.getElementById('current-location');
const refreshLocationBtn = document.getElementById('refresh-location');
const servicesListElement = document.getElementById('services-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const requestAssistanceBtn = document.getElementById('request-assistance-btn');
const homePage = document.getElementById('home-page');
const assistancePage = document.getElementById('assistance-page');
const homeLink = document.getElementById('home-link');
const assistanceLink = document.getElementById('assistance-link');
const mobileHomeLink = document.getElementById('mobile-home-link');
const mobileAssistanceLink = document.getElementById('mobile-assistance-link');
const logoutLink = document.getElementById('logout-link');
const mobileLogoutLink = document.getElementById('mobile-logout-link');
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const mobileNav = document.querySelector('.mobile-nav');
const assistanceForm = document.getElementById('assistance-form');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const issueInput = document.getElementById('issue');
const locationInput = document.getElementById('location');
const formCurrentLocationBtn = document.getElementById('form-current-location');
const saveLocationCheckbox = document.getElementById('save-location');
const serviceModal = document.getElementById('service-modal');
const modalContent = document.getElementById('modal-content');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmationOkBtn = document.getElementById('confirmation-ok');
const closeModalButtons = document.querySelectorAll('.close-modal');
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const logoutModal = document.getElementById('logout-modal');
const cancelLogoutBtn = document.getElementById('cancel-logout');
const confirmLogoutBtn = document.getElementById('confirm-logout');

// Initialize Google Map
function initMap() {
    // Default coordinates (will be overridden by user's location)
    const defaultPosition = { lat: 37.7749, lng: -122.4194 }; // San Francisco

    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultPosition,
        zoom: 14,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        }
    });

    infoWindow = new google.maps.InfoWindow();
    placesService = new google.maps.places.PlacesService(map);

    // Try to get user's location
    getUserLocation();

    // Set up event listeners for map
    google.maps.event.addListener(map, 'click', () => {
        if (infoWindow) infoWindow.close();
    });
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                currentPosition = pos;
                map.setCenter(pos);

                // Add marker for user's location
                addUserLocationMarker(pos);

                // Search for nearby services
                searchNearbyServices(pos);

                // If we're on the assistance page, update the location input
                if (locationInput && !locationInput.value) {
                    getAddressFromCoordinates(pos)
                        .then(address => {
                            locationInput.value = address;
                        })
                        .catch(error => {
                            console.error('Error getting address:', error);
                        });
                }
            },
            (error) => {
                handleLocationError(error);
            }
        );
    } else {
        handleLocationError({ code: 0, message: 'Geolocation not supported by this browser.' });
    }
}

// Handle geolocation errors
function handleLocationError(error) {
    let errorMessage;
    
    switch(error.code) {
        case 1:
            errorMessage = 'Permission denied. Please allow location access to use this feature.';
            break;
        case 2:
            errorMessage = 'Position unavailable. Please try again later.';
            break;
        case 3:
            errorMessage = 'Timeout. Please try again.';
            break;
        default:
            errorMessage = 'An unknown error occurred. Please enter your location manually.';
    }
    
    // Display error message
    alert(errorMessage);
    
    // Focus on the search input to encourage manual entry
    if (locationSearch) {
        locationSearch.focus();
    }
}

// Add a marker for the user's location
function addUserLocationMarker(position) {
    // Clear existing user marker if any
    markers = markers.filter(marker => marker.type !== 'user');
    
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#007BFF',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        title: 'Your Location',
        type: 'user'
    });
    
    markers.push(marker);
    
    marker.addListener('click', () => {
        infoWindow.setContent('<div><strong>Your Location</strong></div>');
        infoWindow.open(map, marker);
    });
}

// Search for nearby services
function searchNearbyServices(position) {
    const serviceTypes = [
        { type: 'mechanic', keyword: 'car mechanic' },
        { type: 'towing', keyword: 'car towing service' },
        { type: 'fuel', keyword: 'gas station' }
    ];
    
    // Clear existing service markers
    markers = markers.filter(marker => marker.type === 'user');
    servicesList = [];
    
    const searchPromises = serviceTypes.map(service => {
        return new Promise((resolve) => {
            const request = {
                location: position,
                radius: 5000, // 5km radius
                keyword: service.keyword
            };
            
            placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    results.forEach(place => {
                        place.serviceType = service.type;
                    });
                    resolve(results);
                } else {
                    resolve([]);
                }
            });
        });
    });
    
    Promise.all(searchPromises)
        .then(resultsArray => {
            // Combine all results
            const allResults = [].concat(...resultsArray);
            
            // Remove duplicates
            const uniquePlaces = removeDuplicates(allResults);
            
            // Store in global servicesList
            servicesList = uniquePlaces;
            
            // Display markers and list
            displayServiceMarkers(uniquePlaces);
            displayServicesList(uniquePlaces);
        })
        .catch(error => {
            console.error('Error searching for services:', error);
        });
}

// Remove duplicate places from results
function removeDuplicates(places) {
    const uniquePlaceIds = {};
    return places.filter(place => {
        if (!uniquePlaceIds[place.place_id]) {
            uniquePlaceIds[place.place_id] = true;
            return true;
        }
        return false;
    });
}

// Display markers for services on the map
function displayServiceMarkers(places) {
    const icons = {
        mechanic: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        towing: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        fuel: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
    };
    
    places.forEach(place => {
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: icons[place.serviceType] || 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            type: 'service',
            serviceType: place.serviceType
        });
        
        markers.push(marker);
        
        marker.addListener('click', () => {
            getPlaceDetails(place.place_id, (details) => {
                if (details) {
                    const content = `
                        <div class="info-window">
                            <h3>${details.name}</h3>
                            <p>${details.formatted_address || 'Address not available'}</p>
                            <p>${details.formatted_phone_number ? 'Phone: ' + details.formatted_phone_number : 'Phone not available'}</p>
                            ${details.opening_hours ? `<p>${details.opening_hours.open_now ? 'Open Now' : 'Closed'}</p>` : ''}
                            ${details.rating ? `<p>Rating: ${details.rating} / 5</p>` : ''}
                            ${details.website ? `<p><a href="${details.website}" target="_blank">Website</a></p>` : ''}
                        </div>
                    `;
                    
                    infoWindow.setContent(content);
                    infoWindow.open(map, marker);
                }
            });
        });
    });
}

// Display services list
function displayServicesList(services) {
    if (!servicesListElement) return;
    
    servicesListElement.innerHTML = '';
    
    if (services.length === 0) {
        servicesListElement.innerHTML = '<p class="no-services">No services found in this area. Try another location or service type.</p>';
        return;
    }
    
    // Filter services based on current filter if needed
    let displayServices = services;
    if (currentFilter !== 'all') {
        displayServices = services.filter(service => service.serviceType === currentFilter);
        
        if (displayServices.length === 0) {
            servicesListElement.innerHTML = `<p class="no-services">No ${currentFilter} services found in this area. Try another service type.</p>`;
            return;
        }
    }
    
    // Sort services by rating (highest first)
    displayServices.sort((a, b) => {
        return (b.rating || 0) - (a.rating || 0);
    });
    
    // Display services (limited to 5 for performance)
    displayServices.slice(0, 5).forEach(service => {
        const serviceType = service.serviceType || 'service';
        const serviceTypeName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
        
        const serviceElement = document.createElement('div');
        serviceElement.className = 'service-item';
        serviceElement.innerHTML = `
            <div class="service-name">
                ${service.name}
                <span class="service-type-badge ${serviceType}">${serviceTypeName}</span>
            </div>
            <div class="service-address">${service.vicinity}</div>
            <div class="service-rating">
                ${service.rating ? `
                    <div class="stars">
                        ${getStarsHTML(service.rating)}
                    </div>
                    <span class="rating-count">(${service.user_ratings_total || 0} reviews)</span>
                ` : 'No ratings available'}
            </div>
            <a href="tel:+1234567890" class="service-phone">
                <i class="fas fa-phone"></i> Call Now
            </a>
            <button class="see-more-btn" data-service-id="${service.place_id || Math.random().toString(36).substring(2, 10)}">
                See Details
            </button>
        `;
        
        servicesListElement.appendChild(serviceElement);
        
        // Add event listener to the "See Details" button
        const seeMoreBtn = serviceElement.querySelector('.see-more-btn');
        seeMoreBtn.addEventListener('click', () => {
            showServiceDetails(service);
        });
    });
}

// Get HTML for star ratings
function getStarsHTML(rating) {
    let stars = '';
    // Full stars
    for (let i = 1; i <= Math.floor(rating); i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    // Half star if needed
    if (rating % 1 >= 0.5) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    // Empty stars
    for (let i = Math.ceil(rating); i < 5; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// Show service details
function showServiceDetails(service) {
    if (!modalContent) return;
    
    const serviceType = service.serviceType || 'service';
    const serviceTypeName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
    
    modalContent.innerHTML = `
        <div class="service-details">
            <h2>${service.name}</h2>
            <div class="service-type">
                <span class="service-type-badge ${serviceType}">${serviceTypeName}</span>
            </div>
            <div class="service-address">
                <i class="fas fa-map-marker-alt"></i> ${service.vicinity}
            </div>
            <div class="service-rating">
                ${service.rating ? `
                    <div class="stars">
                        ${getStarsHTML(service.rating)}
                    </div>
                    <span class="rating-count">${service.rating} (${service.user_ratings_total || 0} reviews)</span>
                ` : 'No ratings available'}
            </div>
            <div class="service-actions">
                <a href="tel:+1234567890" class="primary-btn">
                    <i class="fas fa-phone"></i> Call Now
                </a>
                <button id="request-this-service" class="secondary-btn">
                    <i class="fas fa-ambulance"></i> Request Assistance
                </button>
            </div>
        </div>
    `;
    
    serviceModal.style.display = 'block';
    
    // Add event listener to the "Request Assistance" button
    const requestServiceBtn = document.getElementById('request-this-service');
    if (requestServiceBtn) {
        requestServiceBtn.addEventListener('click', () => {
            closeAllModals();
            navigateToAssistance();
            // Pre-fill service name in the issue field if available
            if (issueInput) {
                issueInput.value = `I need assistance from ${service.name} for my vehicle.`;
            }
        });
    }
}

// Get detailed information about a place
function getPlaceDetails(placeId, callback) {
    const request = {
        placeId: placeId,
        fields: [
            'name', 'formatted_address', 'formatted_phone_number', 
            'opening_hours', 'rating', 'website', 'reviews', 
            'photos', 'geometry'
        ]
    };
    
    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            callback(place);
        } else {
            console.error('Error getting place details:', status);
            callback(null);
        }
    });
}

// Get address from coordinates
function getAddressFromCoordinates(coordinates) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location: coordinates }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
}

// Get coordinates from address
function getCoordinatesFromAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location.toJSON());
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
}

// Check if user is logged in
function checkUserLoggedIn() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
    }
}

// Show logout confirmation
function showLogoutConfirmation(event) {
    if (event) event.preventDefault();
    logoutModal.style.display = 'flex';
}

// Handle logout
function handleLogout() {
    // Clear user data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Initialize the application
function init() {
    // Check if user is logged in
    checkUserLoggedIn();
    
    // Check if there's a saved location in local storage
    const savedLocationData = localStorage.getItem('savedLocation');
    if (savedLocationData) {
        savedLocation = JSON.parse(savedLocationData);
    }
    
    // Check if dark mode is enabled in local storage
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
    
    // Set up event listeners
    setUpEventListeners();
    
    // Load Google Maps or show fallback
    loadMapOrFallback();
}

// Load Google Maps or show fallback UI if not available
function loadMapOrFallback() {
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
        mapLoaded = true;
    } else {
        console.error('Google Maps API not loaded');
        showMapLoadError();
        
        // Still show the services section with demo data
        showFallbackServices();
    }
}

// Show error message when map can't be loaded
function showMapLoadError() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background: rgba(0,0,0,0.05); border-radius: 12px;">
                <i class="fas fa-map-marked-alt" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <h3>Map Could Not Be Loaded</h3>
                <p style="margin-bottom: 1rem;">We're unable to load the map due to a missing or invalid Google Maps API key.</p>
                <button id="manual-location-btn" class="primary-btn">
                    <i class="fas fa-search"></i> Enter Location Manually
                </button>
            </div>
        `;
        
        // Add event listener to the manual location button
        const manualLocationBtn = document.getElementById('manual-location-btn');
        if (manualLocationBtn) {
            manualLocationBtn.addEventListener('click', () => {
                if (locationSearch) {
                    locationSearch.focus();
                }
            });
        }
    }
}

// Show fallback services when map can't be loaded
function showFallbackServices() {
    // Demo data for services
    const demoServices = [
        {
            name: "Joe's Auto Repair",
            vicinity: "123 Main St, Anytown",
            serviceType: "mechanic",
            rating: 4.5,
            user_ratings_total: 128
        },
        {
            name: "Quick Tow Services",
            vicinity: "456 Broadway, Anytown",
            serviceType: "towing",
            rating: 4.2,
            user_ratings_total: 87
        },
        {
            name: "City Gas Station",
            vicinity: "789 Oak St, Anytown",
            serviceType: "fuel",
            rating: 4.0,
            user_ratings_total: 215
        },
        {
            name: "24/7 Emergency Towing",
            vicinity: "101 Pine Ave, Anytown",
            serviceType: "towing",
            rating: 4.8,
            user_ratings_total: 56
        },
        {
            name: "Premium Auto Mechanics",
            vicinity: "202 Maple Rd, Anytown",
            serviceType: "mechanic",
            rating: 4.7,
            user_ratings_total: 143
        }
    ];
    
    // Set services list
    servicesList = demoServices;
    
    // Display services
    displayServicesList(demoServices);
}

// Set up all event listeners
function setUpEventListeners() {
    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    if (locationSearch) {
        locationSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Current location buttons
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', getUserLocation);
    }
    
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', getUserLocation);
    }
    
    if (formCurrentLocationBtn) {
        formCurrentLocationBtn.addEventListener('click', () => {
            if (currentPosition) {
                getAddressFromCoordinates(currentPosition)
                    .then(address => {
                        locationInput.value = address;
                    })
                    .catch(error => {
                        console.error('Error getting address:', error);
                    });
            } else {
                getUserLocation();
            }
        });
    }
    
    // Navigation
    if (homeLink) {
        homeLink.addEventListener('click', navigateToHome);
    }
    
    if (assistanceLink) {
        assistanceLink.addEventListener('click', navigateToAssistance);
    }
    
    if (mobileHomeLink) {
        mobileHomeLink.addEventListener('click', navigateToHome);
    }
    
    if (mobileAssistanceLink) {
        mobileAssistanceLink.addEventListener('click', navigateToAssistance);
    }
    
    // Logout functionality
    if (logoutLink) {
        logoutLink.addEventListener('click', showLogoutConfirmation);
    }
    
    if (mobileLogoutLink) {
        mobileLogoutLink.addEventListener('click', showLogoutConfirmation);
    }
    
    if (requestAssistanceBtn) {
        requestAssistanceBtn.addEventListener('click', navigateToAssistance);
    }
    
    // Mobile menu
    if (mobileMenuIcon) {
        mobileMenuIcon.addEventListener('click', toggleMobileMenu);
    }
    
    // Filter buttons
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterServices(button.getAttribute('data-type'));
            });
        });
    }
    
    // Form submission
    if (assistanceForm) {
        assistanceForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Close modal buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Confirmation OK button
    if (confirmationOkBtn) {
        confirmationOkBtn.addEventListener('click', () => {
            closeAllModals();
            navigateToHome();
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === serviceModal) {
            serviceModal.style.display = 'none';
        }
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });
    
    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Check if the saved location should be used
    if (saveLocationCheckbox && savedLocation) {
        saveLocationCheckbox.checked = true;
        if (locationInput && !locationInput.value) {
            locationInput.value = savedLocation.address;
        }
    }
    
    // Logout confirmation modal
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
        });
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle search button click
function handleSearch() {
    if (!locationSearch.value.trim()) {
        alert('Please enter a location');
        return;
    }
    
    getCoordinatesFromAddress(locationSearch.value)
        .then(coordinates => {
            currentPosition = coordinates;
            map.setCenter(coordinates);
            addUserLocationMarker(coordinates);
            searchNearbyServices(coordinates);
        })
        .catch(error => {
            console.error('Error searching location:', error);
            alert('Could not find that location. Please try another search term.');
        });
}

// Filter services by type
function filterServices(type) {
    // Update active filter button
    filterButtons.forEach(button => {
        if (button.getAttribute('data-type') === type) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    currentFilter = type;
    
    // Filter markers
    markers.forEach(marker => {
        if (marker.type === 'user') {
            marker.setVisible(true);
        } else if (type === 'all') {
            marker.setVisible(true);
        } else {
            marker.setVisible(marker.serviceType === type);
        }
    });
    
    // Update services list
    displayServicesList(servicesList);
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    
    // Validate form
    let isValid = true;
    
    // Name validation
    if (!nameInput.value.trim()) {
        document.getElementById('name-error').textContent = 'Please enter your name';
        document.getElementById('name-error').style.display = 'block';
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(nameInput.value.trim())) {
        document.getElementById('name-error').textContent = 'Name should only contain letters and spaces';
        document.getElementById('name-error').style.display = 'block';
        isValid = false;
    }
    
    // Phone validation
    if (!phoneInput.value.trim()) {
        document.getElementById('phone-error').textContent = 'Please enter your phone number';
        document.getElementById('phone-error').style.display = 'block';
        isValid = false;
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(phoneInput.value.trim())) {
        document.getElementById('phone-error').textContent = 'Please enter a valid phone number';
        document.getElementById('phone-error').style.display = 'block';
        isValid = false;
    }
    
    // Issue validation
    if (!issueInput.value.trim()) {
        document.getElementById('issue-error').textContent = 'Please describe your issue';
        document.getElementById('issue-error').style.display = 'block';
        isValid = false;
    } else if (issueInput.value.trim().length < 10) {
        document.getElementById('issue-error').textContent = 'Description must be at least 10 characters long';
        document.getElementById('issue-error').style.display = 'block';
        isValid = false;
    }
    
    // Location validation
    if (!locationInput.value.trim()) {
        document.getElementById('location-error').textContent = 'Please enter your location';
        document.getElementById('location-error').style.display = 'block';
        isValid = false;
    }
    
    if (isValid) {
        // Save location if checkbox is checked
        if (saveLocationCheckbox.checked) {
            localStorage.setItem('savedLocation', JSON.stringify({
                address: locationInput.value.trim()
            }));
        } else {
            localStorage.removeItem('savedLocation');
        }
        
        // Show confirmation modal
        confirmationModal.style.display = 'block';
        
        // Reset form
        assistanceForm.reset();
        
        // Pre-fill the form with saved location if available
        if (savedLocation && saveLocationCheckbox.checked) {
            locationInput.value = savedLocation.address;
        }
    }
}

// Navigation functions
function navigateToHome(event) {
    if (event) event.preventDefault();
    
    // Update active links
    document.querySelectorAll('#home-link, #mobile-home-link').forEach(link => {
        link.classList.add('active');
    });
    document.querySelectorAll('#assistance-link, #mobile-assistance-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show home page, hide assistance page
    homePage.classList.remove('hidden');
    assistancePage.classList.add('hidden');
    
    // Close mobile menu
    mobileNav.classList.remove('active');
    
    // Refresh the map if needed
    if (map && currentPosition) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(currentPosition);
    }
}

function navigateToAssistance(event) {
    if (event) event.preventDefault();
    
    // Update active links
    document.querySelectorAll('#assistance-link, #mobile-assistance-link').forEach(link => {
        link.classList.add('active');
    });
    document.querySelectorAll('#home-link, #mobile-home-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Hide home page, show assistance page
    homePage.classList.add('hidden');
    assistancePage.classList.remove('hidden');
    
    // Close mobile menu
    mobileNav.classList.remove('active');
    
    // Pre-fill location if available
    if (currentPosition && locationInput && !locationInput.value) {
        getAddressFromCoordinates(currentPosition)
            .then(address => {
                locationInput.value = address;
            })
            .catch(error => {
                console.error('Error getting address:', error);
            });
    } else if (savedLocation && saveLocationCheckbox && saveLocationCheckbox.checked) {
        locationInput.value = savedLocation.address;
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    mobileNav.classList.toggle('active');
}

// Close all modals
function closeAllModals() {
    serviceModal.style.display = 'none';
    confirmationModal.style.display = 'none';
    logoutModal.style.display = 'none';
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

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

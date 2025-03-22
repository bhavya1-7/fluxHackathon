document.addEventListener('DOMContentLoaded', function() {
    // Initialize Map
    const map = L.map('map').setView([28.6139, 77.2090], 12); // Default location: New Delhi
    let userMarker = null;
    let serviceMarkers = [];
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // UI Elements
    const loadingOverlay = document.getElementById('map-loading');
    const servicesLoading = document.getElementById('services-loading');
    const servicesList = document.getElementById('services-list');
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const useMyLocationBtn = document.getElementById('use-my-location');
    const refreshMapBtn = document.getElementById('refresh-map');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbot = document.getElementById('chatbot');
    const minimizeChat = document.getElementById('minimize-chat');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const chatMessages = document.getElementById('chatbot-messages');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const requestHelpBtn = document.getElementById('request-help');
    const sosBtn = document.getElementById('sos-btn');
    const assistanceModal = document.getElementById('assistance-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    // Service Types with Icons and Colors
    const serviceTypes = {
        mechanic: {
            icon: 'fas fa-tools',
            color: '#4361ee',
            markerColor: 'blue',
            name: 'Mechanic'
        },
        gas: {
            icon: 'fas fa-gas-pump',
            color: '#f39c12',
            markerColor: 'orange',
            name: 'Gas Station'
        },
        police: {
            icon: 'fas fa-shield-alt',
            color: '#2b2d42',
            markerColor: 'black',
            name: 'Police Station'
        },
        fire: {
            icon: 'fas fa-fire-extinguisher',
            color: '#e74c3c',
            markerColor: 'red',
            name: 'Fire Station'
        }
    };
    
    // Initialize the Map
    function initMap() {
        showLoading(true);
        
        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const userLocation = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLocation, 14);
                    addUserMarker(userLocation);
                    fetchNearbyServices(userLocation);
                },
                error => {
                    console.error('Error getting location:', error);
                    showLoading(false);
                    // Show demo services for New Delhi if location access is denied
                    fetchNearbyServices([28.6139, 77.2090]);
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            showLoading(false);
            // Show demo services for New Delhi if geolocation is not supported
            fetchNearbyServices([28.6139, 77.2090]);
        }
    }
    
    // Add marker for user's location
    function addUserMarker(location) {
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        
        // Create a custom icon for user location
        const userIcon = L.divIcon({
            html: '<div class="user-marker"><i class="fas fa-user"></i></div>',
            className: 'user-marker-container',
            iconSize: [30, 30]
        });
        
        userMarker = L.marker(location, { icon: userIcon }).addTo(map);
        userMarker.bindPopup('Your location').openPopup();
    }
    
    // Fetch nearby services
    function fetchNearbyServices(location) {
        showServiceLoading(true);
        clearServiceMarkers();
        
        // Try to fetch real data from Overpass API first
        const [lat, lon] = location;
        const query = `
            [out:json][timeout:25];
            (
              node["shop"="car"](around:10000, ${lat}, ${lon});
              node["amenity"="car_repair"](around:10000, ${lat}, ${lon});
              node["amenity"="police"](around:10000, ${lat}, ${lon});
              node["amenity"="fire_station"](around:10000, ${lat}, ${lon});
              node["amenity"="fuel"](around:10000, ${lat}, ${lon});
            );
            out body;
        `;
        
        fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            headers: { 'Content-Type': 'text/plain' }
        })
        .then(response => response.json())
        .then(data => {
            const services = data.elements.map(element => {
                const { lat, lon, tags } = element;
                const name = tags.name || "Unknown Service";
                const type = tags.amenity === "car_repair" ? "mechanic" :
                             tags.amenity === "police" ? "police" :
                             tags.amenity === "fire_station" ? "fire" :
                             tags.amenity === "fuel" ? "gas" : "mechanic";
                             
                return {
                    id: element.id,
                    name: name,
                    type: type,
                    location: [lat, lon],
                    address: tags['addr:street'] || 'Location information not available',
                    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
                    ratingCount: Math.floor(Math.random() * 500) + 50,
                    phone: '+91 ' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
                    openNow: Math.random() > 0.2,
                    distance: calculateDistance(location, [lat, lon])
                };
            });
            
            if (services.length > 0) {
                displayServices(services);
                addServiceMarkers(services);
                showLoading(false);
                showServiceLoading(false);
            } else {
                // If no real services found, use demo data
                throw new Error("No services found");
            }
        })
        .catch(err => {
            console.error("Error fetching data: ", err);
            showLoading(false);
            
            // Fallback to demo data if API fails or returns no results
            setTimeout(() => {
                const demoServices = generateDemoServices(location);
                displayServices(demoServices);
                addServiceMarkers(demoServices);
                showServiceLoading(false);
            }, 1000);
        });
    }
    
    // Generate demo services based on location
    function generateDemoServices(location) {
        const services = [];
        const [lat, lon] = location;
        const serviceTypeKeys = Object.keys(serviceTypes);
        
        // Generate 3-5 services for each type
        serviceTypeKeys.forEach(type => {
            const count = Math.floor(Math.random() * 3) + 3; // 3-5 services per type
            
            for (let i = 0; i < count; i++) {
                // Generate a location within ~2km of the user
                const offset = (Math.random() - 0.5) * 0.04;
                const serviceLat = lat + offset;
                const serviceLon = lon + offset;
                
                services.push({
                    id: `${type}-${i}`,
                    name: getDemoServiceName(type, i),
                    type: type,
                    location: [serviceLat, serviceLon],
                    address: getDemoAddress(),
                    phone: '+91 ' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
                    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
                    ratingCount: Math.floor(Math.random() * 500) + 50, // Random number of ratings
                    distance: calculateDistance(location, [serviceLat, serviceLon]),
                    openNow: Math.random() > 0.2 // 80% chance of being open
                });
            }
        });
        
        // Sort by distance
        return services.sort((a, b) => a.distance - b.distance);
    }
    
    // Demo service names
    function getDemoServiceName(type, index) {
        const names = {
            mechanic: ['Quick Fix Auto', 'City Mechanics', 'Express Repairs', 'AutoCare Center', 'Pro Mechanics'],
            gas: ['Indian Oil', 'HP Petrol Pump', 'Shell Gas Station', 'Bharat Petroleum', 'Reliance Petrol'],
            police: ['City Police Station', 'District Police HQ', 'Police Outpost', 'Traffic Police Station', 'Central Police'],
            fire: ['City Fire Station', 'Emergency Fire Services', 'District Fire Department', 'Fire & Rescue', 'Metro Fire Brigade']
        };
        
        return names[type][index % names[type].length];
    }
    
    // Generate demo addresses
    function getDemoAddress() {
        const streets = ['MG Road', 'Nehru Place', 'Connaught Place', 'Karol Bagh', 'Chandni Chowk', 'Saket', 'Dwarka', 'Lajpat Nagar'];
        const areas = ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'Central Delhi'];
        
        return `${Math.floor(Math.random() * 100) + 1}, ${streets[Math.floor(Math.random() * streets.length)]}, ${areas[Math.floor(Math.random() * areas.length)]}`;
    }
    
    // Calculate distance between two points (simplified version using Haversine formula)
    function calculateDistance(point1, point2) {
        const [lat1, lon1] = point1;
        const [lat2, lon2] = point2;
        
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance; // Distance in km
    }
    
    // Add service markers to the map
    function addServiceMarkers(services) {
        services.forEach(service => {
            const {type, location, name} = service;
            const serviceInfo = serviceTypes[type];
            
            // Create a custom icon for the service
            const markerIcon = L.divIcon({
                html: `<div class="marker-icon ${type}"><i class="${serviceInfo.icon}"></i></div>`,
                className: 'marker-container',
                iconSize: [30, 30]
            });
            
            const marker = L.marker(location, { icon: markerIcon }).addTo(map);
            
            // Create popup content
            const popupContent = `
                <div class="marker-popup">
                    <h3>${name}</h3>
                    <div class="marker-type">
                        <i class="${serviceInfo.icon}"></i> ${serviceInfo.name}
                    </div>
                    <p>${service.address}</p>
                    <div class="marker-rating">
                        <span class="stars">
                            ${createStarsHTML(service.rating)}
                        </span>
                        <span>${service.rating} (${service.ratingCount})</span>
                    </div>
                    <p>${service.distance.toFixed(2)} km away</p>
                    <button class="primary-btn view-details-btn" data-id="${service.id}">View Details</button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.on('click', () => {
                marker.openPopup();
            });
            
            // Add marker to the array for later reference
            serviceMarkers.push(marker);
        });
    }
    
    // Clear all service markers from the map
    function clearServiceMarkers() {
        serviceMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        serviceMarkers = [];
    }
    
    // Display services in the sidebar
    function displayServices(services) {
        // Clear current list
        servicesList.innerHTML = '';
        
        if (services.length === 0) {
            servicesList.innerHTML = '<div class="no-services">No services found in this area</div>';
            return;
        }
        
        // Add each service to the list
        services.forEach(service => {
            const serviceInfo = serviceTypes[service.type];
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.dataset.id = service.id;
            serviceItem.dataset.type = service.type;
            
            serviceItem.innerHTML = `
                <div class="service-name">
                    ${service.name}
                    <span class="service-type ${service.type}">${serviceInfo.name}</span>
                </div>
                <div class="service-details">
                    <p><i class="fas fa-map-marker-alt"></i> ${service.address}</p>
                    <p><i class="fas fa-road"></i> ${service.distance.toFixed(2)} km away</p>
                    <p><i class="fas fa-phone"></i> ${service.phone}</p>
                    <p><i class="fas fa-clock"></i> ${service.openNow ? 'Open now' : 'Closed'}</p>
                </div>
                <div class="service-rating">
                    <div class="stars">
                        ${createStarsHTML(service.rating)}
                    </div>
                    <span>${service.rating} (${service.ratingCount})</span>
                </div>
            `;
            
            // Add click event to show details and highlight on map
            serviceItem.addEventListener('click', () => {
                // Find the corresponding marker and open its popup
                const marker = serviceMarkers.find((m, index) => services[index].id === service.id);
                if (marker) {
                    marker.openPopup();
                    map.setView(marker.getLatLng(), 15);
                }
                
                // Show service details modal (in a real app)
                showServiceDetails(service);
            });
            
            servicesList.appendChild(serviceItem);
        });
    }
    
    // Create HTML for star ratings
    function createStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHTML = '';
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        // Add half star if needed
        if (halfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Add empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        return starsHTML;
    }
    
    // Show service details in a modal
    function showServiceDetails(service) {
        const serviceDetailsModal = document.getElementById('service-details-modal');
        const serviceDetailsContent = document.getElementById('service-details-content');
        const serviceInfo = serviceTypes[service.type];
        
        serviceDetailsContent.innerHTML = `
            <div class="service-detail-header">
                <div class="service-detail-icon" style="background-color: ${serviceInfo.color}">
                    <i class="${serviceInfo.icon}"></i>
                </div>
                <div class="service-detail-title">
                    <h2>${service.name}</h2>
                    <span class="service-type ${service.type}">${serviceInfo.name}</span>
                </div>
            </div>
            
            <div class="service-detail-rating">
                <div class="stars">
                    ${createStarsHTML(service.rating)}
                </div>
                <span>${service.rating} (${service.ratingCount} ratings)</span>
            </div>
            
            <div class="service-detail-info">
                <p><i class="fas fa-map-marker-alt"></i> <strong>Address:</strong> ${service.address}</p>
                <p><i class="fas fa-road"></i> <strong>Distance:</strong> ${service.distance.toFixed(2)} km away</p>
                <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${service.phone}</p>
                <p><i class="fas fa-clock"></i> <strong>Status:</strong> <span class="${service.openNow ? 'open' : 'closed'}">${service.openNow ? 'Open now' : 'Closed'}</span></p>
            </div>
            
            <div class="service-detail-actions">
                <button class="primary-btn request-service-btn"><i class="fas fa-hands-helping"></i> Request Service</button>
                <button class="outline-btn call-service-btn"><i class="fas fa-phone"></i> Call</button>
                <button class="outline-btn directions-btn"><i class="fas fa-directions"></i> Directions</button>
            </div>
        `;
        
        // Add event listeners for action buttons
        const requestServiceBtn = serviceDetailsContent.querySelector('.request-service-btn');
        if (requestServiceBtn) {
            requestServiceBtn.addEventListener('click', () => {
                serviceDetailsModal.style.display = 'none';
                showAssistanceModal(service);
            });
        }
        
        serviceDetailsModal.style.display = 'block';
    }
    
    // Search for a location
    function searchLocation() {
        const query = locationInput.value.trim();
        
        if (!query) return;
        
        showLoading(true);
        
        // In a real app, this would use a geocoding service
        // For demo, we'll just set a random location near Delhi
        setTimeout(() => {
            const offset = (Math.random() - 0.5) * 0.1;
            const searchLocation = [28.6139 + offset, 77.2090 + offset];
            
            map.setView(searchLocation, 14);
            addUserMarker(searchLocation);
            fetchNearbyServices(searchLocation);
            
            // Update input with simulated address
            locationInput.value = getDemoAddress();
        }, 1000);
    }
    
    // Filter services by type
    function filterServices(type) {
        const serviceItems = document.querySelectorAll('.service-item');
        
        serviceItems.forEach(item => {
            if (type === 'all' || item.dataset.type === type) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Also filter markers
        serviceMarkers.forEach((marker, index) => {
            const markerType = marker._icon.querySelector('.marker-icon').classList[1];
            
            if (type === 'all' || markerType === type) {
                marker._icon.style.display = 'block';
            } else {
                marker._icon.style.display = 'none';
            }
        });
    }
    
    // Show loader
    function showLoading(show) {
        if (show) {
            loadingOverlay.style.display = 'flex';
        } else {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Show services loader
    function showServiceLoading(show) {
        if (show) {
            servicesLoading.style.display = 'flex';
        } else {
            servicesLoading.style.display = 'none';
        }
    }
    
    // Show the assistance request modal
    function showAssistanceModal(service = null) {
        const assistanceForm = document.getElementById('assistance-form');
        const locationField = document.getElementById('req-location');
        
        // Pre-fill location if user marker exists
        if (userMarker) {
            const latlng = userMarker.getLatLng();
            locationField.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        }
        
        // Pre-select service type if service is provided
        if (service) {
            const issueTypeSelect = document.getElementById('issue-type');
            
            // Map service types to issue types
            const typeMapping = {
                mechanic: 'engine',
                gas: 'fuel',
                police: 'other',
                fire: 'other'
            };
            
            // Set the selected option
            if (issueTypeSelect && service.type in typeMapping) {
                issueTypeSelect.value = typeMapping[service.type];
            }
        }
        
        assistanceModal.style.display = 'block';
    }
    
    // Add a chatbot message
    function addChatbotMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageDiv.innerHTML = `
            <div class="chat-avatar">
                <i class="${isUser ? 'fas fa-user' : 'fas fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${timeString}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Send user message to chatbot
    function sendUserMessage() {
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addChatbotMessage(message, true);
        
        // Clear input
        chatInput.value = '';
        
        // Send to chatbot and get response (simulated)
        setTimeout(() => {
            let response = '';
            
            // Simple keyword-based responses
            if (message.toLowerCase().includes('tow') || message.toLowerCase().includes('truck')) {
                response = "I can help you request a tow truck. Please share your location and describe your vehicle issue.";
            } else if (message.toLowerCase().includes('flat tire') || message.toLowerCase().includes('puncture')) {
                response = "For flat tire assistance, I'll need your location. Would you like me to find the nearest mechanic?";
            } else if (message.toLowerCase().includes('fuel') || message.toLowerCase().includes('petrol') || message.toLowerCase().includes('gas')) {
                response = "I see you need fuel. I can help locate the nearest gas station or arrange for emergency fuel delivery. What would you prefer?";
            } else if (message.toLowerCase().includes('battery') || message.toLowerCase().includes('jump start')) {
                response = "Battery issues can be frustrating. I can connect you with a nearby service for jump-starting your vehicle. Would you like me to do that?";
            } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                response = "Hello! How can I assist you with roadside help today?";
            } else {
                response = "I understand you need assistance. Could you provide more details about your vehicle issue? This will help me find the right service for you.";
            }
            
            // Add bot response
            addChatbotMessage(response);
        }, 1000);
    }
    
    // Toggle dark mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }
    
    // Check for dark mode preference
    function checkDarkModePreference() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
    
    // Initialize the application
    function init() {
        // Check dark mode preference
        checkDarkModePreference();
        
        // Initialize map
        initMap();
        
        // Set up event listeners
        searchBtn.addEventListener('click', searchLocation);
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchLocation();
            }
        });
        
        useMyLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                showLoading(true);
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const userLocation = [position.coords.latitude, position.coords.longitude];
                        map.setView(userLocation, 14);
                        addUserMarker(userLocation);
                        fetchNearbyServices(userLocation);
                    },
                    error => {
                        console.error('Error getting location:', error);
                        showLoading(false);
                        alert('Could not access your location. Please check your location settings and try again.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
        
        refreshMapBtn.addEventListener('click', () => {
            if (userMarker) {
                const userLocation = [userMarker.getLatLng().lat, userMarker.getLatLng().lng];
                fetchNearbyServices(userLocation);
            } else {
                initMap();
            }
        });
        
        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Filter services
                const filterType = btn.dataset.filter;
                filterServices(filterType);
            });
        });
        
        // Chatbot toggle
        chatbotToggle.addEventListener('click', () => {
            chatbot.style.display = 'block';
            chatbotToggle.style.display = 'none';
        });
        
        minimizeChat.addEventListener('click', () => {
            chatbot.style.display = 'none';
            chatbotToggle.style.display = 'flex';
        });
        
        closeChat.addEventListener('click', () => {
            chatbot.style.display = 'none';
            chatbotToggle.style.display = 'flex';
        });
        
        // Send chat message
        sendMessageBtn.addEventListener('click', sendUserMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
        
        // Chat suggestions
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chatInput.value = btn.textContent.trim();
                sendUserMessage();
            });
        });
        
        // Dark mode toggle
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Request help button
        requestHelpBtn.addEventListener('click', () => {
            showAssistanceModal();
        });
        
        // SOS button
        sosBtn.addEventListener('click', () => {
            alert('SOS request initiated! Emergency services have been notified.');
            // In a real app, this would trigger an emergency call or notification
        });
        
        // Close modals
        closeModals.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Mobile menu
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.style.display = mobileNav.style.display === 'flex' ? 'none' : 'flex';
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    // Start the application
    init();
}); 
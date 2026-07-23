/**
 * VANISHING POINTS — Atlas of the Forgotten
 */

const API_BASE = '';
let map;
let markers = [];
let places = [];
let categories = [];
let currentView = 'map';
let explored = new Set(JSON.parse(localStorage.getItem('vp_explored') || '[]'));
let favorites = new Set(JSON.parse(localStorage.getItem('vp_favorites') || '[]'));

const loadingTexts = [
    "Establishing connection to the void...",
    "Summoning cartographic spirits...",
    "Tracing forgotten coordinates...",
    "Listening for echoes...",
    "Mapping the unmappable...",
    "Retrieving lost histories..."
];

const intensityColors = {
    1: '#5a4a3a',
    2: '#7a6a52',
    3: '#9a8a6a',
    4: '#baaa8a',
    5: '#dacaaa'
};

// ============================================
// INITIALIZATION — BULLETPROOF
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        initLoadingScreen();
        initEventListeners();
        initDustParticles();
        loadCategories();
    } catch (err) {
        console.error('Init error:', err);
        forceShowApp();
    }
});

function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    const app = document.getElementById('app');
    
    if (!loadingScreen || !app) {
        forceShowApp();
        return;
    }
    
    // Rotate loading text
    let textIndex = 0;
    const textInterval = setInterval(() => {
        if (!loadingText) return;
        textIndex = (textIndex + 1) % loadingTexts.length;
        loadingText.style.opacity = '0';
        setTimeout(() => {
            if (loadingText) {
                loadingText.textContent = loadingTexts[textIndex];
                loadingText.style.opacity = '1';
            }
        }, 200);
    }, 1800);
    
    // ALWAYS advance after 3.5 seconds, no matter what
    setTimeout(() => {
        clearInterval(textInterval);
        loadingScreen.classList.add('hidden');
        
        // Wait for CSS fade-out transition (1.2s), then remove completely
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            app.style.display = 'block';
            
            // Initialize map and data
            try {
                initMap();
                setTimeout(() => {
                    loadPlaces().then(() => {
                        handleUrlParams();
                    }).catch(() => {});
                }, 100);
            } catch (e) {
                console.error('Map init error:', e);
            }
        }, 1200);
        
    }, 3500);
}

// Emergency fallback — if anything breaks, show the app
function forceShowApp() {
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        loadingScreen.classList.add('hidden');
    }
    if (app) app.style.display = 'block';
    try { initMap(); } catch(e) {}
    setTimeout(() => {
        loadPlaces().catch(() => {});
    }, 200);
}

// ============================================
// DUST PARTICLES
// ============================================

function initDustParticles() {
    const container = document.getElementById('dust-container');
    if (!container) return;
    
    const particleCount = window.innerWidth < 768 ? 12 : 25;
    
    for (let i = 0; i < particleCount; i++) {
        createDustParticle(container);
    }
}

function createDustParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'dust';
    
    const size = Math.random() * 2 + 1;
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 10;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${startX}%`;
    particle.style.top = `${startY}%`;
    particle.style.opacity = Math.random() * 0.3 + 0.1;
    
    animateParticle(particle, duration, delay);
    container.appendChild(particle);
}

function animateParticle(particle, duration, delay) {
    let start = null;
    const startX = parseFloat(particle.style.left);
    const startY = parseFloat(particle.style.top);
    const driftX = (Math.random() - 0.5) * 20;
    const driftY = (Math.random() - 0.5) * 10 - 5;
    
    function step(timestamp) {
        if (!start) start = timestamp - delay * 1000;
        const progress = Math.max(0, (timestamp - start) / (duration * 1000));
        
        if (progress >= 1) {
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            animateParticle(particle, duration, 0);
            return;
        }
        
        const x = startX + Math.sin(progress * Math.PI * 2) * driftX;
        const y = startY + progress * driftY;
        const opacity = Math.sin(progress * Math.PI) * 0.3;
        
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        particle.style.opacity = opacity;
        
        requestAnimationFrame(step);
    }
    
    setTimeout(() => requestAnimationFrame(step), delay * 1000);
}

// ============================================
// MAP
// ============================================

function initMap() {
    if (map) return;
    
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([25, 10], 2);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>');
}

// ============================================
// DATA
// ============================================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        categories = await response.json();
        populateCategoryFilter();
    } catch (err) {
        console.error('Failed to load categories:', err);
    }
}

function populateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;
    select.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category;
        option.textContent = `${cat.category} (${cat.count})`;
        select.appendChild(option);
    });
}

async function loadPlaces() {
    try {
        const category = document.getElementById('category-filter')?.value || 'all';
        const search = document.getElementById('search-input')?.value || '';
        
        let url = `${API_BASE}/api/places`;
        const params = new URLSearchParams();
        if (category && category !== 'all') params.append('category', category);
        if (search) params.append('search', search);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        places = await response.json();
        
        updateStats();
        renderMarkers();
        renderList();
    } catch (err) {
        console.error('Failed to load places:', err);
        showToast('Failed to load places. Is the server running on port 3000?', 'error');
    }
}

// ============================================
// MARKERS
// ============================================

function renderMarkers() {
    if (!map) return;
    
    markers.forEach(m => {
        try { map.removeLayer(m); } catch(e) {}
    });
    markers = [];
    
    if (places.length === 0) return;
    
    places.forEach(place => {
        const color = intensityColors[place.intensity] || intensityColors[1];
        const isExplored = explored.has(place.id);
        const isFav = favorites.has(place.id);
        const isIntense = place.intensity >= 4;
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-pin ${isFav ? 'favorite' : ''} ${isExplored ? 'explored' : ''} ${isIntense ? 'intense' : ''}" 
                     style="color: ${color}; border-color: ${color}; background: ${color}15;">
                    <div class="marker-inner" style="background: ${color}"></div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 28]
        });
        
        const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
        
        const popupContent = `
            <h3>${escapeHtml(place.name)}</h3>
            <p>${escapeHtml(place.location)}, ${escapeHtml(place.country)}</p>
        `;
        
        marker.bindPopup(popupContent, {
            closeButton: false,
            offset: [0, -14]
        });
        
        marker.on('click', () => openDetailPanel(place));
        markers.push(marker);
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('place') && markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
    }
}

// ============================================
// LIST VIEW
// ============================================

function renderList() {
    const container = document.getElementById('places-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (places.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                </svg>
                <h3>No places found</h3>
                <p>Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }
    
    places.forEach((place, index) => {
        const card = createPlaceCard(place, index);
        container.appendChild(card);
    });
}

function createPlaceCard(place, index) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.onclick = () => openDetailPanel(place);
    const isFav = favorites.has(place.id);
    
    card.innerHTML = `
        <div class="place-card-header">
            <div class="place-card-name">${escapeHtml(place.name)}</div>
            ${isFav ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>` : ''}
        </div>
        <div class="place-card-location">${escapeHtml(place.location)}, ${escapeHtml(place.country)}</div>
        <div class="place-card-description">${escapeHtml(place.description)}</div>
        <div class="place-card-meta">
            <span class="place-card-category">${place.category}</span>
            <div class="place-card-intensity">
                ${renderIntensityDiamonds(place.intensity)}
            </div>
        </div>
    `;
    return card;
}

function renderIntensityDiamonds(intensity) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<div class="intensity-diamond ${i <= intensity ? 'active' : ''}"></div>`;
    }
    return html;
}

// ============================================
// DETAIL PANEL
// ============================================

function openDetailPanel(place) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    if (!panel || !content) return;
    
    const isExplored = explored.has(place.id);
    const isFav = favorites.has(place.id);
    
    content.innerHTML = `
        <h2 class="detail-name">${escapeHtml(place.name)}</h2>
        <div class="detail-location">${escapeHtml(place.location)}, ${escapeHtml(place.country)}</div>
        
        <div class="detail-meta">
            <div class="detail-meta-item"><span>${place.category}</span></div>
            <div class="detail-meta-item"><span>Intensity: ${renderIntensityDiamonds(place.intensity)}</span></div>
            ${place.yearAbandoned ? `<div class="detail-meta-item"><span>${place.yearAbandoned}</span></div>` : ''}
        </div>
        
        <div class="detail-description"><p>${escapeHtml(place.description)}</p></div>
        
        <div class="detail-actions">
            <button class="detail-btn detail-btn-mark ${isExplored ? 'marked' : ''}" onclick="window.toggleExplored('${place.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                ${isExplored ? 'Marked' : 'Mark Explored'}
            </button>
            <button class="detail-btn detail-btn-fav ${isFav ? 'favorited' : ''}" onclick="window.toggleFavorite('${place.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                ${isFav ? 'Favorited' : 'Favorite'}
            </button>
        </div>
        
        <div class="detail-coords" onclick="window.copyCoords('${place.lat}', '${place.lng}')">${place.lat.toFixed(4)}°, ${place.lng.toFixed(4)}°</div>
        
        <div class="detail-share" onclick="window.sharePlace('${place.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Copy link to this place
        </div>
    `;
    
    panel.classList.add('open');
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('place', place.id);
    window.history.pushState({}, '', newUrl);
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    if (panel) panel.classList.remove('open');
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('place');
    window.history.pushState({}, '', newUrl);
}

window.toggleExplored = function(id) {
    if (explored.has(id)) explored.delete(id);
    else explored.add(id);
    localStorage.setItem('vp_explored', JSON.stringify([...explored]));
    const place = places.find(p => p.id === id);
    if (place) openDetailPanel(place);
    updateStats();
    renderMarkers();
};

window.toggleFavorite = function(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    localStorage.setItem('vp_favorites', JSON.stringify([...favorites]));
    const place = places.find(p => p.id === id);
    if (place) openDetailPanel(place);
    renderMarkers();
    renderList();
};

window.sharePlace = function(id) {
    const url = `${window.location.origin}?place=${id}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
};

window.copyCoords = function(lat, lng) {
    navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
        showToast('Coordinates copied', 'success');
    });
};

// ============================================
// SURPRISE ME
// ============================================

function surpriseMe() {
    if (places.length === 0) return;
    const random = places[Math.floor(Math.random() * places.length)];
    openDetailPanel(random);
    
    if (map && currentView === 'map') {
        map.flyTo([random.lat, random.lng], 10, {
            duration: 2,
            easeLinearity: 0.25
        });
    }
    
    showToast(`Found: ${random.name}`, 'success');
}

// ============================================
// MODAL
// ============================================

function openAddModal() {
    const modal = document.getElementById('add-modal');
    if (modal) modal.classList.add('active');
}

function closeAddModal() {
    const modal = document.getElementById('add-modal');
    const form = document.getElementById('add-place-form');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

async function submitPlace(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('place-name')?.value,
        location: document.getElementById('place-location')?.value,
        country: document.getElementById('place-country')?.value,
        lat: parseFloat(document.getElementById('place-lat')?.value),
        lng: parseFloat(document.getElementById('place-lng')?.value),
        category: document.getElementById('place-category')?.value,
        description: document.getElementById('place-description')?.value,
        intensity: parseInt(document.getElementById('place-intensity')?.value || '1'),
        yearAbandoned: document.getElementById('place-year')?.value || '',
        submittedBy: document.getElementById('place-submitter')?.value || 'Anonymous'
    };
    
    if (!data.name || !data.location || !data.country || isNaN(data.lat) || isNaN(data.lng) || !data.category || !data.description) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/places`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Place submitted for review. Thank you.', 'success');
            closeAddModal();
        } else {
            showToast(result.error || 'Failed to submit', 'error');
        }
    } catch (err) {
        showToast('Failed to submit. Is the server running?', 'error');
    }
}

// ============================================
// EVENTS
// ============================================

function initEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', debounce(loadPlaces, 300));
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.addEventListener('change', loadPlaces);
    
    const viewMap = document.getElementById('view-map');
    const viewList = document.getElementById('view-list');
    if (viewMap) viewMap.addEventListener('click', () => setView('map'));
    if (viewList) viewList.addEventListener('click', () => setView('list'));
    
    const btnSurprise = document.getElementById('btn-surprise');
    if (btnSurprise) btnSurprise.addEventListener('click', surpriseMe);
    
    const btnAdd = document.getElementById('btn-add-place');
    const modalClose = document.getElementById('modal-close');
    const btnCancel = document.getElementById('btn-cancel');
    const addForm = document.getElementById('add-place-form');
    const backdrop = document.querySelector('.modal-backdrop');
    
    if (btnAdd) btnAdd.addEventListener('click', openAddModal);
    if (modalClose) modalClose.addEventListener('click', closeAddModal);
    if (btnCancel) btnCancel.addEventListener('click', closeAddModal);
    if (addForm) addForm.addEventListener('submit', submitPlace);
    if (backdrop) backdrop.addEventListener('click', closeAddModal);
    
    const detailClose = document.getElementById('detail-close');
    if (detailClose) detailClose.addEventListener('click', closeDetailPanel);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailPanel();
            closeAddModal();
        }
    });
    
    window.addEventListener('popstate', handleUrlParams);
}

function setView(view) {
    currentView = view;
    document.getElementById('view-map')?.classList.toggle('active', view === 'map');
    document.getElementById('view-list')?.classList.toggle('active', view === 'list');
    document.getElementById('map-container')?.classList.toggle('active', view === 'map');
    document.getElementById('list-container')?.classList.toggle('active', view === 'list');
    
    if (view === 'map' && map) {
        setTimeout(() => map.invalidateSize(), 150);
    }
}

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const placeId = params.get('place');
    if (placeId && places.length > 0) {
        const place = places.find(p => p.id === placeId);
        if (place) openDetailPanel(place);
    }
}

function updateStats() {
    document.getElementById('places-count')?.textContent = `${places.length} place${places.length !== 1 ? 's' : ''} found`;
    document.getElementById('explored-count')?.textContent = `${explored.size} marked`;
}

// ============================================
// UTILITIES
// ============================================

function debounce(fn, ms) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 3500);
}
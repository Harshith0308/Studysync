const API_ORIGIN = (() => {
    const { hostname, port, protocol } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal && port && port !== '5000') {
        return `${protocol}//${hostname}:5000`;
    }

    return window.location.origin;
})();

window.API_ORIGIN = API_ORIGIN;

const API_URL = `${API_ORIGIN}/api`;

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers
    };

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            // Unauthorized, but allow login/register pages to handle it differently if needed
            // For now, redirect to login if not already there
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) {
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 window.location.href = 'index.html';
                 return;
            }
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
    }
}

function initReloadButton() {
    const existing = document.getElementById('global-actions');
    if (existing) existing.remove();

    const leaveGroupBtn = document.getElementById('leave-group-btn');

    const container = document.createElement('div');
    container.id = 'global-actions';
    container.className = '';
    container.style.position = 'fixed';
    container.style.top = '16px';
    container.style.right = '16px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.gap = '8px';

    const reloadBtn = document.createElement('button');
    reloadBtn.id = 'global-reload-btn';
    reloadBtn.type = 'button';
    reloadBtn.className = '';
    reloadBtn.style.fontSize = '14px';
    reloadBtn.style.padding = '6px 12px';
    reloadBtn.style.borderRadius = '9999px';
    reloadBtn.style.border = 'none';
    reloadBtn.style.cursor = 'pointer';
    reloadBtn.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)';
    reloadBtn.style.background = '#2563eb';
    reloadBtn.style.color = '#fff';
    reloadBtn.textContent = 'Reload';
    reloadBtn.addEventListener('click', () => window.location.reload());
    reloadBtn.addEventListener('mouseenter', () => (reloadBtn.style.background = '#1d4ed8'));
    reloadBtn.addEventListener('mouseleave', () => (reloadBtn.style.background = '#2563eb'));

    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle-btn';
    themeBtn.type = 'button';
    themeBtn.className = '';
    themeBtn.style.fontSize = '14px';
    themeBtn.style.padding = '6px 12px';
    themeBtn.style.borderRadius = '9999px';
    themeBtn.style.border = 'none';
    themeBtn.style.cursor = 'pointer';
    themeBtn.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)';
    themeBtn.style.background = '#111827';
    themeBtn.style.color = '#fff';
    themeBtn.textContent = getCurrentTheme() === 'dark' ? 'Light' : 'Dark';
    themeBtn.addEventListener('click', () => toggleTheme());
    themeBtn.addEventListener('mouseenter', () => (themeBtn.style.background = '#0b1220'));
    themeBtn.addEventListener('mouseleave', () => (themeBtn.style.background = '#111827'));

    container.appendChild(reloadBtn);
    container.appendChild(themeBtn);

    document.body.appendChild(container);

    if (leaveGroupBtn) {
        requestAnimationFrame(() => {
            const width = container.getBoundingClientRect().width;
            leaveGroupBtn.style.marginRight = `${Math.ceil(width) + 16}px`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body) initReloadButton();
});

function getCurrentTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
}

function toggleTheme() {
    const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

applyTheme(getCurrentTheme());

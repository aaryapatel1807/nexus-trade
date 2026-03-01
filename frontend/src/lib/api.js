// In production, VITE_API_URL points to the Render backend service.
// In development, it's empty so the Vite proxy handles /api/* → localhost:5000.
const API_BASE = import.meta.env.VITE_API_URL || ''

export function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, options)
}

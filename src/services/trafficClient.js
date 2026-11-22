/**
 * IEI MGR Student Chapter — Client Traffic & Virtual Waiting Room Interceptor
 * Transparently attaches admission tokens, handles rate limit 429 responses,
 * and seamlessly redirects unadmitted visitors to the Virtual Waiting Room.
 */

export function getWaitingRoomToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('iei_waiting_room_token') || null;
}

export function saveWaitingRoomToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('iei_waiting_room_token', token);
  document.cookie = `iei_qtoken=${encodeURIComponent(token)}; path=/; max-age=900; SameSite=Lax`;
}

export function clearWaitingRoomToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('iei_waiting_room_token');
  document.cookie = 'iei_qtoken=; path=/; max-age=0';
}

/**
 * Enhanced fetch wrapper with automatic Waiting Room admission token injection
 * and 429 QUEUED interception.
 */
export async function trafficAwareFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});

  // Attach token if present
  const token = getWaitingRoomToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (token) {
    headers.set('X-Waiting-Room-Token', token);
  }

  const response = await fetch(url, { ...options, headers });

  // Handle Waiting Room Redirection
  if (response.status === 429) {
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (body.queueRequired || body.status === 'QUEUED') {
        // Redirect to Virtual Waiting Room
        const currentHash = window.location.hash || '#/';
        sessionStorage.setItem('iei_post_admission_target', currentHash);
        window.location.hash = '#waiting-room';
      }
    } catch (e) {}
  }

  return response;
}

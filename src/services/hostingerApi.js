/**
 * IEI MGR STUDENTS CHAPTER — 100% Hostinger MySQL & Storage API Client
 * Active when VITE_BACKEND_MODE=hostinger (Zero Firebase dependency required).
 */

const TOKEN_STORAGE_KEY = 'iei_hostinger_auth_token';

function getEnvVar(key) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      return process.env[key];
    }
  } catch {
    // ignore
  }
  return '';
}

export function isHostingerBackend() {
  return String(getEnvVar('VITE_BACKEND_MODE') || '').toLowerCase() === 'hostinger';
}

export function getApiBaseUrl() {
  const configured = String(getEnvVar('VITE_API_BASE_URL') || '').trim().replace(/\/+$/, '');
  return configured || '/api';
}

export function getAuthToken() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

async function apiRequest(endpoint, { method = 'GET', body = null, auth = true } = {}) {
  const url = `${getApiBaseUrl()}/${endpoint.replace(/^\/+/, '')}`;
  const headers = { Accept: 'application/json' };

  if (body !== null && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body !== null ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Hostinger API returned non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok || (data && data.ok === false)) {
    const err = new Error(data?.message || data?.error || `Request failed (HTTP ${response.status})`);
    err.status = response.status;
    err.code = data?.error || 'API_ERROR';
    throw err;
  }

  return data;
}

// --- Authentication ---
export async function hostingerLogin(identifier, password) {
  const res = await apiRequest('auth.php?action=login', {
    method: 'POST',
    body: { identifier, password },
    auth: false,
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function hostingerVerifySession() {
  return apiRequest('auth.php?action=me', { method: 'GET', auth: true });
}

export async function hostingerLogout() {
  try {
    await apiRequest('auth.php?action=logout', { method: 'POST', auth: true });
  } catch {
    // ignore logout network errors
  } finally {
    clearAuthToken();
  }
}

// --- Internal Collections CRUD & Delta Sync ---
export async function hostingerFetchCollection(collection) {
  return apiRequest(`data.php?collection=${encodeURIComponent(collection)}`, { method: 'GET', auth: true });
}

export async function hostingerUpsertDoc(collection, id, data, isMerge = false) {
  return apiRequest(
    `data.php?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(String(id))}`,
    {
      method: isMerge ? 'PUT' : 'POST',
      body: { id: String(id), data, _merge: isMerge },
      auth: true,
    }
  );
}

export async function hostingerDeleteDoc(collection, id) {
  return apiRequest(
    `data.php?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(String(id))}`,
    { method: 'DELETE', auth: true }
  );
}

export async function hostingerDeltaSync(versions = {}) {
  const encoded = encodeURIComponent(JSON.stringify(versions));
  return apiRequest(`sync.php?versions=${encoded}`, { method: 'GET', auth: true });
}

// --- Public Profile & Upcoming Events ---
export async function hostingerFetchPublic() {
  return apiRequest('public.php', { method: 'GET', auth: false });
}

export async function hostingerSavePublicProfile(data) {
  return apiRequest('public.php?resource=profile', {
    method: 'PUT',
    body: { data },
    auth: true,
  });
}

export async function hostingerSavePublicEvent(data) {
  return apiRequest('public.php?resource=event', {
    method: 'POST',
    body: { data },
    auth: true,
  });
}

export async function hostingerDeletePublicEvent(id) {
  return apiRequest(`public.php?resource=event&id=${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    auth: true,
  });
}

// --- Immutable Audit Logs ---
export async function hostingerAppendAudit(entry) {
  return apiRequest('audit.php', { method: 'POST', body: entry, auth: true });
}

export async function hostingerFetchAuditLogs(limit = 500) {
  return apiRequest(`audit.php?limit=${encodeURIComponent(String(limit))}`, { method: 'GET', auth: true });
}

// --- Hostinger Disk & MySQL File Storage ---
export async function hostingerUploadFile(blob, filename = 'upload.jpg', folder = 'general') {
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('folder', folder);
  return apiRequest('upload.php', {
    method: 'POST',
    body: formData,
    auth: true,
  });
}

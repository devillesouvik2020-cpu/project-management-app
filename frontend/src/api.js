const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  get: (resource, search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/${resource}${query}`);
  },

  getById: (resource, id) => request(`/${resource}/${id}`),

  create: (resource, body) =>
    request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (resource, id, body) =>
    request(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  remove: (resource, id) =>
    request(`/${resource}/${id}`, {
      method: 'DELETE',
    }),
};

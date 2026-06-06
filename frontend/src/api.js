const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    let message = 'Unable to load data.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json();
}

export function getCities() {
  return request('/api/cities');
}

export function getCity(cityName) {
  return request(`/api/cities/${encodeURIComponent(cityName)}`);
}

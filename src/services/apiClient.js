// src/services/apiClient.js

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = async (endpoint, options = {}) => {
  const BASE_URL = `${DEFAULT_API_URL}/api`;
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default Content-Type to JSON unless sending FormData or explicitly provided
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized session expiration
  if (response.status === 401) {
    localStorage.removeItem('token');
  }

  // Handle HTTP 204 (No Content)
  if (response.status === 204) {
    return {};
  }

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(`Expected JSON, but received HTML/Text from server (Status ${response.status}):`, text);
    throw new Error(`Server error (${response.status}): Endpoint not returning valid JSON.`);
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! Status: ${response.status}`);
  }

  return data;
};

export default apiClient;
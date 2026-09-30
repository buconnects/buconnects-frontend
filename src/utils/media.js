// src/utils/media.js

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ACTIVE_BACKEND = DEFAULT_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
const LEGACY_BACKEND_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'buconnects-backend-to2j.onrender.com',
]);

/**
 * Resolves media URLs (images, avatars, attachments) cleanly:
 * - Strips any hardcoded legacy hosts (e.g. localhost:5000 or old render URLs stored in DB)
 * - Prepends the active backend API host
 * - Returns empty string for empty/invalid inputs
 */
export const getMediaUrl = (path) => {
  if (!path) return '';
  let rawPath = Array.isArray(path) ? path[0] : path;
  if (typeof rawPath !== 'string') return '';

  rawPath = rawPath.trim();
  if (!rawPath) return '';

  // Return blob or data URLs as-is (e.g., local preview before upload)
  if (rawPath.startsWith('blob:') || rawPath.startsWith('data:')) {
    return rawPath;
  }

  // Resolve relative paths against the configured backend and repair legacy hosts.
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    try {
      const parsed = new URL(rawPath);
      if (LEGACY_BACKEND_HOSTS.has(parsed.hostname) || parsed.origin === ACTIVE_BACKEND) {
        return `${ACTIVE_BACKEND}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      if (parsed.protocol === 'http:') parsed.protocol = 'https:';
      return parsed.href;
    } catch {
      return '';
    }
  }

  const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${ACTIVE_BACKEND}${cleanPath}`;
};

export const getAvatarUrl = (path) => {
  return getMediaUrl(path);
};

export default getMediaUrl;

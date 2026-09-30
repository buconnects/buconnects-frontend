// src/utils/media.js

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  // Determine active backend base origin without trailing /api or slashes
  const activeBackend = DEFAULT_API_URL
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  // Strip legacy localhost or render origins stored in MySQL
  if (
    rawPath.startsWith('http://localhost:5000') ||
    rawPath.startsWith('http://127.0.0.1:5000') ||
    rawPath.startsWith('https://localhost:5000')
  ) {
    rawPath = rawPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, '');
  } else if (rawPath.startsWith('https://buconnects-backend-to2j.onrender.com')) {
    rawPath = rawPath.replace('https://buconnects-backend-to2j.onrender.com', '');
  }

  // If it is an external URL (e.g. third-party image/avatar, Unsplash, Google profile), leave as is
  if ((rawPath.startsWith('http://') || rawPath.startsWith('https://')) && !rawPath.includes('/uploads/')) {
    return rawPath;
  }

  // If it starts with http(s) after the above, strip host if it points to uploads
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    try {
      const parsed = new URL(rawPath);
      rawPath = parsed.pathname;
    } catch {
      // ignore
    }
  }

  // Ensure leading slash
  const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${activeBackend}${cleanPath}`;
};

export const getAvatarUrl = (path) => {
  return getMediaUrl(path);
};

export default getMediaUrl;

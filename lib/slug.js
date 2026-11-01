/**
 * Generates a clean URL slug from room name.
 * e.g. "Moon 1" -> "moon-1"
 * Client and server safe (no Node dependencies).
 */
export function generateSlug(name = '') {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

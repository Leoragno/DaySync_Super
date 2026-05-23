import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx.
 * @param {...any[]} inputs - The classes to merge.
 * @returns {string} The merged class string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize user-generated text to prevent XSS.
 * Strips HTML tags from strings.
 * @param {string} str - The text to sanitize.
 * @returns {string} The sanitized text.
 */
export function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate text to a max length with ellipsis.
 * @param {string} str - The text to truncate.
 * @param {number} [maxLen=100] - The maximum length before truncation.
 * @returns {string} The truncated text.
 */
export function truncate(str, maxLen = 100) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

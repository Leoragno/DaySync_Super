import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize user-generated text to prevent XSS.
 * Strips HTML tags from strings.
 */
export function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(str, maxLen = 100) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

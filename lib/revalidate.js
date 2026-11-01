import { revalidatePath } from 'next/cache';

/**
 * Centralized on-demand cache revalidation helper.
 * Ensures all dependent public routes and sitemaps are refreshed
 * whenever an admin mutation occurs.
 */

export function revalidateRooms(slug) {
  try {
    revalidatePath('/');
    revalidatePath('/rooms');
    if (slug) {
      revalidatePath(`/rooms/${slug}`);
    }
    revalidatePath('/gallery');
    revalidatePath('/sitemap.xml');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating room paths:', err.message);
  }
}

export function revalidateMedia() {
  try {
    revalidatePath('/');
    revalidatePath('/rooms');
    revalidatePath('/gallery');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating media paths:', err.message);
  }
}

export function revalidateHome() {
  try {
    revalidatePath('/');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating home path:', err.message);
  }
}

export function revalidateGallery() {
  try {
    revalidatePath('/gallery');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating gallery path:', err.message);
  }
}

export function revalidateNearby() {
  try {
    revalidatePath('/');
    revalidatePath('/nearby-areas');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating nearby paths:', err.message);
  }
}

export function revalidateReviews() {
  try {
    revalidatePath('/');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating reviews path:', err.message);
  }
}

export function revalidateAll() {
  try {
    revalidatePath('/', 'layout');
  } catch (err) {
    console.warn('[Revalidate] Error revalidating layout:', err.message);
  }
}

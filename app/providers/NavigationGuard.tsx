'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * NavigationGuard Component
 * 
 * Handles client-side navigation optimizations:
 * - Prefetches critical pages
 * - Scrolls to top on navigation
 * - Dispatches page change events
 * 
 * Add this to your root layout or a provider component.
 */
export function NavigationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Prefetch critical pages for faster navigation
    const prefetchPages = ['/courses', '/instructor', '/instructors', '/user-pages/become-a-creator'];
    prefetchPages.forEach(page => {
      try {
        router.prefetch(page);
      } catch (err) {
        // Silently fail prefetch errors
        console.debug('Prefetch failed for', page, err);
      }
    });
  }, [router]);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Force scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Dispatch custom event for page change (useful for analytics or other listeners)
    const event = new CustomEvent('page-change', { 
      detail: { pathname, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
  }, [pathname]);
  
  return null;
}


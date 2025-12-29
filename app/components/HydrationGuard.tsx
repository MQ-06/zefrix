'use client';

import { useEffect, useState } from 'react';

/**
 * HydrationGuard Component
 * 
 * Prevents hydration mismatches by ensuring components only render on the client.
 * This is critical for components that use browser APIs (window, document, localStorage, etc.)
 * 
 * Usage:
 * <HydrationGuard>
 *   <ComponentThatUsesBrowserAPIs />
 * </HydrationGuard>
 */
interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationGuard({ 
  children, 
  fallback = <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
}: HydrationGuardProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Mark as mounted after first render (client-side only)
    setIsMounted(true);
  }, []);
  
  // During SSR and initial render, show fallback
  if (!isMounted) {
    return <>{fallback}</>;
  }
  
  // After mount, render children (client-side only)
  return <>{children}</>;
}


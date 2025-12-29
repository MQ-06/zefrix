'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * useReliableFetch Hook
 * 
 * A reliable data fetching hook with:
 * - Automatic retries with exponential backoff
 * - Loading and error states
 * - Dependency-based refetching
 * - Production-safe error handling
 */
interface UseReliableFetchOptions<T> {
  fetchFn: () => Promise<T>;
  deps?: any[];
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useReliableFetch<T>({
  fetchFn,
  deps = [],
  enabled = true,
  retries = 3,
  retryDelay = 1000,
  onSuccess,
  onError
}: UseReliableFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;
    
    const attemptFetch = async (attempt: number): Promise<void> => {
      try {
        const result = await fetchFn();
        
        // Check if request was aborted
        if (signal.aborted) {
          return;
        }
        
        setData(result);
        retryCountRef.current = 0; // Reset retry count on success
        onSuccess?.(result);
      } catch (err) {
        // Check if request was aborted
        if (signal.aborted) {
          return;
        }
        
        const error = err as Error;
        
        // Don't retry if max retries reached
        if (attempt >= retries) {
          setError(error);
          onError?.(error);
          return;
        }
        
        // Retry with exponential backoff
        retryCountRef.current = attempt + 1;
        const delay = retryDelay * Math.pow(2, attempt);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check if request was aborted before retrying
        if (!signal.aborted) {
          await attemptFetch(attempt + 1);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    await attemptFetch(0);
  }, [enabled, fetchFn, retries, retryDelay, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
    
    // Cleanup: abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, ...deps]);
  
  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);
  
  return { 
    data, 
    loading, 
    error, 
    refetch,
    retryCount: retryCountRef.current
  };
}


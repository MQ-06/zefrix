'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * SafePhoneInput Component
 * 
 * A phone input that prevents hydration errors by:
 * 1. Ensuring consistent initial render between server and client
 * 2. Avoiding browser API access during render
 * 3. Handling formatting safely
 * 
 * This fixes React Hydration Error #301 in production builds.
 */
interface SafePhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
  className?: string;
  pattern?: string;
  maxLength?: number;
  suppressHydrationWarning?: boolean;
  style?: React.CSSProperties;
}

export default function SafePhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  required = false,
  name = "phone",
  className = "",
  pattern,
  maxLength,
  suppressHydrationWarning,
  style
}: SafePhoneInputProps) {
  // CRITICAL: Initialize with empty string to ensure server/client match
  // Only update after mount to prevent hydration mismatches
  const [displayValue, setDisplayValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted flag and initial value after first render
  useEffect(() => {
    setIsMounted(true);
    setDisplayValue(value || '');
  }, []);
  
  // Update display value when prop changes (only after mount)
  useEffect(() => {
    if (isMounted) {
      setDisplayValue(value || '');
    }
  }, [value, isMounted]);
  
  /**
   * Handle input change safely
   * Directly update parent state to prevent hydration issues
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    onChange(newValue);
  }, [onChange]);
  
  // On server or initial render, always render empty to prevent hydration mismatch
  const safeValue = isMounted ? displayValue : '';
  
  return (
    <input
      type="tel"
      name={name}
      value={safeValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
      pattern={pattern}
      maxLength={maxLength}
      suppressHydrationWarning={true}
      style={style}
      autoComplete="tel"
      inputMode="tel"
    />
  );
}


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
  // Initialize with prop value to ensure server/client match
  const [displayValue, setDisplayValue] = useState(value);
  
  // Update display value when prop changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  
  /**
   * Handle input change safely
   * Directly update parent state to prevent hydration issues
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    onChange(newValue);
  }, [onChange]);
  
  return (
    <input
      type="tel"
      name={name}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
      pattern={pattern}
      maxLength={maxLength}
      suppressHydrationWarning={suppressHydrationWarning}
      style={style}
      autoComplete="tel"
      inputMode="tel"
    />
  );
}


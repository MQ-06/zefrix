export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  firstError?: string;
}

export interface PasswordRuleCheck {
  key: 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special' | 'noSpaces';
  label: string;
  passed: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

export function getStrongPasswordChecks(password: string): PasswordRuleCheck[] {
  const value = String(password || '');

  return [
    {
      key: 'minLength',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      passed: value.length >= MIN_PASSWORD_LENGTH,
    },
    {
      key: 'uppercase',
      label: 'At least one uppercase letter',
      passed: /[A-Z]/.test(value),
    },
    {
      key: 'lowercase',
      label: 'At least one lowercase letter',
      passed: /[a-z]/.test(value),
    },
    {
      key: 'number',
      label: 'At least one number',
      passed: /\d/.test(value),
    },
    {
      key: 'special',
      label: 'At least one special character',
      passed: /[^A-Za-z0-9]/.test(value),
    },
    {
      key: 'noSpaces',
      label: 'No spaces',
      passed: !/\s/.test(value),
    },
  ];
}

export function validateStrongPassword(password: string): PasswordValidationResult {
  const checks = getStrongPasswordChecks(password);
  const errors: string[] = checks.filter((check) => !check.passed).map((check) => `${check.label}.`);

  return {
    valid: errors.length === 0,
    errors,
    firstError: errors[0],
  };
}

export function getStrongPasswordHint(): string {
  return 'Use at least 8 characters with uppercase, lowercase, number, and special character (no spaces).';
}

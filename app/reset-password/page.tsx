'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStrongPasswordChecks, getStrongPasswordHint, validateStrongPassword } from '@/lib/passwordValidation';

type ResetStatus = 'checking' | 'ready' | 'invalid' | 'expired' | 'success';

const FALLBACK_FIREBASE_WEB_API_KEY = 'AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw';

function mapResetCodeError(code?: string): { status: ResetStatus; message: string } {
  if (code === 'EXPIRED_OOB_CODE') {
    return {
      status: 'expired',
      message: 'This reset link has expired. Please request a new password reset email.',
    };
  }

  if (code === 'INVALID_OOB_CODE') {
    return {
      status: 'invalid',
      message: 'This reset link is invalid or already used. Please request a new one.',
    };
  }

  if (code === 'NETWORK_ERROR') {
    return {
      status: 'invalid',
      message: 'Network issue while validating reset link. Please retry.',
    };
  }

  return {
    status: 'invalid',
    message: 'Unable to validate this reset link. Please request another one.',
  };
}

function mapResetSubmitError(code?: string): string {
  if (code === 'WEAK_PASSWORD') {
    return getStrongPasswordHint();
  }

  if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
    return 'Too many attempts. Please wait and try again.';
  }

  if (code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and retry.';
  }

  return 'Could not reset password. Please try again.';
}

async function callFirebaseResetPassword(apiKey: string, payload: Record<string, string>) {
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    const networkError: any = new Error('Network request failed');
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }

  const result = await response.json();
  if (!response.ok) {
    const errorCode = String(result?.error?.message || 'UNKNOWN').trim();
    const apiError: any = new Error(errorCode);
    apiError.code = errorCode;
    throw apiError;
  }

  return result;
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [status, setStatus] = useState<ResetStatus>('checking');
  const [emailHint, setEmailHint] = useState('');
  const [message, setMessage] = useState('Validating your reset link...');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queryParams, setQueryParams] = useState({
    mode: '',
    oobCode: '',
    apiKey: FALLBACK_FIREBASE_WEB_API_KEY,
    lang: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    setQueryParams({
      mode: params.get('mode') || '',
      oobCode: params.get('oobCode') || '',
      apiKey: params.get('apiKey') || FALLBACK_FIREBASE_WEB_API_KEY,
      lang: params.get('lang') || '',
    });
  }, []);

  const loginTarget = useMemo(() => {
    const params = new URLSearchParams();
    params.set('reset', 'success');
    if (queryParams.lang) {
      params.set('lang', queryParams.lang);
    }
    return `/signup-login?${params.toString()}`;
  }, [queryParams.lang]);

  useEffect(() => {
    let cancelled = false;

    const validateResetLink = async () => {
      if (queryParams.mode !== 'resetPassword' || !queryParams.oobCode) {
        setStatus('invalid');
        setMessage('Invalid password reset link. Please request a new one.');
        return;
      }

      try {
        setStatus('checking');
        setMessage('Validating your reset link...');
        const verifyResult = await callFirebaseResetPassword(queryParams.apiKey, {
          oobCode: queryParams.oobCode,
        });
        const email = String(verifyResult?.email || '').trim();

        if (cancelled) return;

        setEmailHint(email || 'your account');
        setStatus('ready');
        setMessage('Set your new password below.');
      } catch (error: any) {
        if (cancelled) return;

        const mapped = mapResetCodeError(error?.code);
        setStatus(mapped.status);
        setMessage(mapped.message);
      }
    };

    validateResetLink();

    return () => {
      cancelled = true;
    };
  }, [queryParams.apiKey, queryParams.mode, queryParams.oobCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status !== 'ready' || !queryParams.oobCode || isSubmitting) {
      return;
    }

    setSubmitError('');

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      setSubmitError(passwordValidation.firstError || getStrongPasswordHint());
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await callFirebaseResetPassword(queryParams.apiKey, {
        oobCode: queryParams.oobCode,
        newPassword,
      });

      setStatus('success');
      setMessage('Your password has been reset successfully. Redirecting to login...');

      setTimeout(() => {
        router.push(loginTarget);
      }, 1400);
    } catch (error: any) {
      if (error?.code === 'EXPIRED_OOB_CODE') {
        setStatus('expired');
        setMessage('This reset link has expired. Please request a new one.');
      } else if (error?.code === 'INVALID_OOB_CODE') {
        setStatus('invalid');
        setMessage('This reset link is invalid or already used. Please request a new one.');
      } else {
        setSubmitError(mapResetSubmitError(error?.code));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBody = () => {
    if (status === 'checking') {
      return <p className="reset-text">{message}</p>;
    }

    if (status === 'invalid' || status === 'expired') {
      return (
        <>
          <p className="reset-text">{message}</p>
          <button className="reset-btn" onClick={() => router.push('/signup-login')}>
            Request New Reset Link
          </button>
        </>
      );
    }

    if (status === 'success') {
      return <p className="reset-text success">{message}</p>;
    }

    return (
      <form onSubmit={handleSubmit} className="reset-form">
        <p className="reset-text">Password reset for {emailHint}.</p>

        <label htmlFor="new-password" className="reset-label">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className="reset-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />

        {newPassword ? (
          <div className="password-helper" aria-live="polite">
            {getStrongPasswordChecks(newPassword).map((check) => (
              <div key={check.key} className={`password-rule ${check.passed ? 'passed' : ''}`}>
                {check.passed ? '✓' : '•'} {check.label}
              </div>
            ))}
          </div>
        ) : null}

        <label htmlFor="confirm-password" className="reset-label">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          className="reset-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />

        {submitError ? <p className="reset-error">{submitError}</p> : null}

        <button className="reset-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    );
  };

  return (
    <>
      <Header />
      <main className="reset-page">
        <section className="reset-card">
          <h1>Reset Your Password</h1>
          {renderBody()}
        </section>
      </main>
      <Footer />

      <style jsx>{`
        .reset-page {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: linear-gradient(145deg, #f7f7ff 0%, #ffffff 45%, #f8fbff 100%);
        }

        .reset-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid #e8ebf6;
          border-radius: 16px;
          box-shadow: 0 18px 60px rgba(14, 21, 38, 0.08);
          padding: 28px;
        }

        h1 {
          margin: 0 0 18px;
          font-size: 28px;
          line-height: 1.25;
          color: #18203a;
        }

        .reset-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .reset-label {
          font-size: 13px;
          color: #394161;
          font-weight: 600;
        }

        .reset-input {
          border: 1px solid #c8d0ea;
          border-radius: 10px;
          padding: 12px;
          font-size: 14px;
          color: #1d2442;
          outline: none;
        }

        .reset-input:focus {
          border-color: #4e54c8;
          box-shadow: 0 0 0 3px rgba(78, 84, 200, 0.12);
        }

        .reset-btn {
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: #4e54c8;
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .reset-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .reset-text {
          margin: 0 0 14px;
          color: #38405f;
          line-height: 1.6;
          font-size: 14px;
        }

        .reset-text.success {
          color: #1f7a3e;
          font-weight: 600;
        }

        .reset-error {
          margin: 4px 0 0;
          color: #ad2f2f;
          font-size: 13px;
        }

        .password-helper {
          margin: 2px 0 4px;
          display: grid;
          gap: 4px;
        }

        .password-rule {
          font-size: 12px;
          color: #6c738e;
        }

        .password-rule.passed {
          color: #1f7a3e;
        }
      `}</style>
    </>
  );
}

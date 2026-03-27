'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HydrationGuard from '@/components/HydrationGuard';
import Script from 'next/script';

export default function CreatorBookDemoPage() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const handleCalendlyMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (!origin.includes('calendly.com')) {
        return;
      }

      const eventName = (event.data as { event?: string } | null)?.event;
      if (eventName !== 'calendly.event_scheduled' || hasRedirectedRef.current) {
        return;
      }

      hasRedirectedRef.current = true;
      router.replace('/creator-dashboard');
    };

    window.addEventListener('message', handleCalendlyMessage);
    return () => {
      window.removeEventListener('message', handleCalendlyMessage);
    };
  }, [router]);

  return (
    <HydrationGuard>
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        <Header />

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem 3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: '0 0 0.5rem', color: '#111827', fontSize: '2rem' }}>
              Book Your Onboarding Demo Call
            </h1>
            <p style={{ margin: 0, color: '#4b5563', fontSize: '1rem' }}>
              Please schedule a quick meeting with our team before you proceed.
            </p>
            <p style={{ margin: '0.6rem 0 0', color: '#6b7280', fontSize: '0.92rem' }}>
              You will be redirected automatically right after booking.
            </p>
          </div>

          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/zefrixapp/zefrix-creator-onboarding-call-clone"
            style={{ minWidth: '320px', height: '700px' }}
          />

          <Script
            src="https://assets.calendly.com/assets/external/widget.js"
            strategy="afterInteractive"
          />
        </main>

        <Footer />
      </div>
    </HydrationGuard>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import ClientLogosSection from '@/components/ClientLogosSection';
import CategorySection from '@/components/CategorySection';
import VideoSection from '@/components/VideoSection';
import StatsSection from '@/components/StatsSection';
import CoursesSection from '@/components/CoursesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import HowItWorksSection from '@/components/HowItWorksSection';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const getDashboardPath = () => {
    if (!user) return '/signup-login';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'creator') return '/creator-dashboard';
    return '/student-dashboard';
  };

  const handleGoToDashboard = () => {
    router.push(getDashboardPath());
  };

  return (
    <>
      {/* Dashboard Button - Show if logged in */}
      {!loading && user && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleGoToDashboard}
            className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#D92A63]/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </button>
        </div>
      )}

      <HeroSection />
      <CategorySection />
      {/* <VideoSection /> */}
      <StatsSection />
      <CoursesSection />
      <TestimonialsSection />
      <FAQSection />
      <HowItWorksSection />
    </>
  );
}


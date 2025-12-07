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
  return (
    <>
      <HeroSection />
      <CategorySection />
      <VideoSection />
      <StatsSection />
      <CoursesSection />
      <TestimonialsSection />
      <FAQSection />
      <HowItWorksSection />
    </>
  );
}


'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { NavigationGuard } from '@/app/providers/NavigationGuard';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  
  // Pages that never show header/footer
  const noLayoutPaths = ['/signup-login', '/student-dashboard', '/admin-dashboard', '/creator-dashboard', '/user-pages/become-a-creator', '/product', '/checkout', '/thank-you'];
  const shouldHideLayout = noLayoutPaths.some(path => pathname.startsWith(path));

  // Special handling for courses page:
  // - If authenticated: hide header/footer
  // - If not authenticated: show header/footer
  const isCoursesPage = pathname === '/courses' || pathname.startsWith('/courses/');
  const shouldHideForCourses = isCoursesPage && isAuthenticated;

  if (shouldHideLayout || shouldHideForCourses) {
    return <>{children}</>;
  }

  return (
    <>
      <NavigationGuard />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}


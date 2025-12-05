'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noLayoutPaths = ['/signup-login', '/student-dashboard', '/admin-dashboard', '/creator-dashboard', '/user-pages/become-a-creator'];
  const shouldHideLayout = noLayoutPaths.some(path => pathname.startsWith(path));

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}


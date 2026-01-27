import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import LoadingScreen from '@/components/LoadingScreen';

export const metadata: Metadata = {
  title: 'Zefrix — Live Skill Sharing | Online Workshops & Live Learning Platform',
  description:
    'Zefrix is a live skill-sharing platform connecting students and creators through interactive, real-time classes. Join live learning sessions, online workshops, and skill classes with expert creators. Learn from creators in design, music, tech, and more.',
  keywords: [
    'live learning platform',
    'online workshops',
    'live skill classes',
    'learn from creators',
    'interactive online classes',
    'real-time learning',
    'online design classes',
    'learn music online',
    'tech workshops live',
    'skill sharing platform',
  ],
  authors: [{ name: 'Zefrix Team' }],
  publisher: 'Zefrix',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://zefrix.com',
  },
  openGraph: {
    title: 'Zefrix — Live Skill Sharing | Online Workshops & Live Learning Platform',
    description: 'Join interactive live sessions with expert creators. Learn new skills, connect with mentors, and grow in a fun, casual learning environment.',
    url: 'https://zefrix.com',
    siteName: 'Zefrix',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zefrix — Live Skill Sharing Platform',
    description: 'Join interactive live sessions with expert creators. Learn new skills in real-time.',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LoadingScreen />
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}


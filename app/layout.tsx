import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';
import { CartProvider } from '@/contexts/CartContext';
import LoadingScreen from '@/components/LoadingScreen';

export const metadata: Metadata = {
  title: 'Zefrix — Live Skill Sharing',
  description:
    'Zefrix is a live skill-sharing platform connecting students and creators through interactive, real-time classes. Join, learn, and grow with expert-led sessions designed to make learning simple and engaging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <LoadingScreen />
        <CartProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}


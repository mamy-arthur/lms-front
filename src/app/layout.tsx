import type { Metadata } from 'next';
import { Providers } from '@/shared/lib/Providers';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Learneo',
  description: 'Plateforme e-learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn('font-sans', inter.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

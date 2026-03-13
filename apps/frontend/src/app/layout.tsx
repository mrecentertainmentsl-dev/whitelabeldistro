import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'MREC Entertainment — Music Distribution Platform',
  description: 'Distribute your music globally to all major platforms',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.className} ${dmMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#222222',
                color: '#eeeeee',
                border: '1px solid #2e2e2e',
                borderRadius: '6px',
                fontSize: '13px',
                padding: '10px 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

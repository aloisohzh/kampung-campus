import type { Metadata } from 'next';
import { Geist, Geist_Mono, Nunito_Sans } from 'next/font/google';
import './globals.css';
import './planner.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const brandFont = Nunito_Sans({
  variable: '--font-brand',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kampung Campus · Good things happen together',
  applicationName: 'Kampung Campus',
  icons: {
    icon: [
      { url: '/favicon.png?v=brand-1', type: 'image/png', sizes: '394x394' },
    ],
    shortcut: '/favicon.png?v=brand-1',
    apple: '/brand/kampung-campus.png',
  },
  description:
    'Find your people across Singapore. Join neighbourhood activities, contribute your skills, and turn community moments into everyday rewards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brandFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

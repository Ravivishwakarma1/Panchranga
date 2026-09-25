import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SiteLoader from '@/components/SiteLoader';

export const metadata: Metadata = {
  title: 'Panchranga — Every Color of the Story',
  description:
    'Panchranga aggregates Indian news from mainstream media, grassroots reporters, and public discourse — giving you every perspective on every story.',
  openGraph: {
    title: 'Panchranga',
    description: 'Every color of the story. Multi-perspective Indian news aggregator.',
    siteName: 'Panchranga',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] antialiased flex flex-col font-sans">
        {/* Site-wide Loading & Route Transition */}
        <Suspense fallback={null}>
          <SiteLoader />
        </Suspense>

        {/* Top Navbar, Announcement Banner & Trending Bar */}
        <Suspense fallback={<div className="h-24 bg-[#FAFAF8] border-b border-[#E5E5E0]" />}>
          <Navbar />
        </Suspense>

        {/* Main Content Area */}
        <main className="flex-1 w-full box-border">
          {children}
        </main>

        {/* Full-width Ground News Footer */}
        <Footer />
      </body>
    </html>
  );
}

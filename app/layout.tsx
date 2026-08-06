import type { Metadata } from 'next';
import { ArchiveInitializer } from '@/components/ArchiveInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vanishing Points',
  description: 'Archive Interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a18] text-[#e8e6e1] antialiased overflow-hidden">
        <ArchiveInitializer />
        {children}
      </body>
    </html>
  );
}
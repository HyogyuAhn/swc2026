import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
    title: '2026 인하대 SW융합대학 새내기배움터',
    description: '2026 인하대학교 소프트웨어융합대학 새내기배움터 공식 홈페이지',
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ko">
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-gray-900`}>{children}</body>
        </html>
    );
}

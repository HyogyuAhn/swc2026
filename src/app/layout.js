import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
    title: '2026 인하대 SW융합대학 새내기배움터',
    description: '2026 인하대학교 소프트웨어융합대학 새내기배움터 공식 홈페이지',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-gray-900`}>{children}</body>
        </html>
    );
}

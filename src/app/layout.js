import './globals.css';

export const metadata = {
    title: '2026 인하대 SW융합대학 새내기배움터',
    description: '2026 인하대학교 소프트웨어융합대학 새내기배움터 공식 홈페이지',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}

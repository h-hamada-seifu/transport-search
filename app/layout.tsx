import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '進路指導訪問 所要時間検索',
  description: '教員が進路指導で学校訪問する際の所要時間・距離を検索するアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

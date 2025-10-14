export const metadata = {
  title: 'FullStack App',
  description: 'Next.js 15 + Flask + Firebase',
};

import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
export const metadata = {
  title: 'FullStack App',
  description: 'Next.js 15 + Flask + Firebase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
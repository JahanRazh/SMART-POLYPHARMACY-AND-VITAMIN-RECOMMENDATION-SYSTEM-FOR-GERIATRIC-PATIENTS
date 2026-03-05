// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "./components/Contexts/AuthContext";
import HeaderWithAuth from "./components/HeaderWithAuth";
import Footer from "./components/Footer";

export const metadata = {
  title: "SmartPolyCare - Intelligent Geriatric Care System",
  description:
    "AI-powered polypharmacy management and vitamin deficiency detection for elderly patients",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="grammarly-disable" content="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex flex-col min-h-screen"
        style={{ fontFamily: "'Inter', Arial, sans-serif" }}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {/* HEADER */}
          <HeaderWithAuth />

          {/* MAIN CONTENT */}
          <main className="flex-grow">{children}</main>

          {/* FOOTER */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
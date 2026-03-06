// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "./components/Contexts/AuthContext";
import { NotificationProvider } from "./components/Contexts/NotificationContext";
import HeaderWithAuth from "./components/HeaderWithAuth";
import Link from "next/link";

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
        {/* Important for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent Grammarly from modifying the page */}
        <meta name="grammarly-disable" content="true" />
      </head>
      <body
        className="flex flex-col min-h-screen bg-white text-gray-900"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <NotificationProvider>
            {/* HEADER */}
            <HeaderWithAuth />

            {/* MAIN CONTENT */}
            <main className="flex-grow">{children}</main>
          </NotificationProvider>

          {/* FOOTER */}
          <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                        />
                      </svg>
                    </div>
                    <span className="text-xl font-bold">SmartPolyCare</span>
                  </div>
                  <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                    Advanced AI-driven platform for geriatric polypharmacy
                    management and vitamin deficiency prevention. Trusted by
                    healthcare providers worldwide.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2 text-lg">
                    Clinical Solutions
                  </h3>
                  <div className="flex flex-col space-y-1">
                    <Link
                      href="/polypharmacy-risk"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Risk Assessment
                    </Link>
                    <Link
                      href="/vitamin-deficiency"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Vitamin Analysis
                    </Link>
                    <Link
                      href="/drug-interactions"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Drug Interactions
                    </Link>
                    <Link
                      href="/nutrition-planning"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Nutrition Planning
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2 text-lg">
                    Connect
                  </h3>
                  <div className="flex flex-col space-y-1">
                    <Link
                      href="/research-papers"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Research
                    </Link>
                    <Link
                      href="/clinical-trials"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Clinical Trials
                    </Link>
                    <Link
                      href="/provider-network"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Provider Network
                    </Link>
                    <Link
                      href="/support"
                      className="text-gray-400 hover:text-white transition text-base"
                    >
                      Support
                    </Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-2 pt-4 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-base">
                  &copy; {new Date().getFullYear()} SmartPolyCare. Clinical-grade AI solutions.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
// app/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';
import Image from 'next/image';

export const metadata = {
  title: 'SmartPolyCare - Intelligent Geriatric Care System',
  description: 'AI-powered polypharmacy management and vitamin deficiency detection for elderly patients',
  icons: {
    icon: "images/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white text-gray-900 ">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto flex justify-between items-center py-4 px-6">
            <Link href="/" className="flex items-center space-x-3 group">
              
<div className="w-15 h-15 bg-gradient-to-br from-teal-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
  <Image
    src="/images/favicon.ico"       // path relative to /public
    alt="SmartPolyCare logo"
    width={50}            // adjust to fit your layout
    height={50}
    className="object-contain"
  />
</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900">SmartPolyCare</span>
                <span className="text-xs text-teal-600 font-medium">Geriatric Health Intelligence</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
                Home
              </Link>
              <Link href="/clinical-features" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
                Clinical Features
              </Link>
              <Link href="/research" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
                Research
              </Link>
              <Link href="/Pages/About" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
              
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow">{children}</main>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white">
          <div className="container mx-auto px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold">SmartPolyCare</span>
                </div>
                <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                  Advanced AI-driven platform for geriatric polypharmacy management and vitamin deficiency prevention. 
                  Trusted by healthcare providers worldwide.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2 text-lg">Clinical Solutions</h3>
                <div className="flex flex-col space-y-1">
                  <Link href="/polypharmacy-risk" className="text-gray-400 hover:text-white transition text-base">Risk Assessment</Link>
                  <Link href="/vitamin-deficiency" className="text-gray-400 hover:text-white transition text-base">Vitamin Analysis</Link>
                  <Link href="/drug-interactions" className="text-gray-400 hover:text-white transition text-base">Drug Interactions</Link>
                  <Link href="/nutrition-planning" className="text-gray-400 hover:text-white transition text-base">Nutrition Planning</Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2 text-lg">Connect</h3>
                <div className="flex flex-col space-y-1">
                  <Link href="/research-papers" className="text-gray-400 hover:text-white transition text-base">Research</Link>
                  <Link href="/clinical-trials" className="text-gray-400 hover:text-white transition text-base">Clinical Trials</Link>
                  <Link href="/provider-network" className="text-gray-400 hover:text-white transition text-base">Provider Network</Link>
                  <Link href="/support" className="text-gray-400 hover:text-white transition text-base">Support</Link>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-2 pt-4 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-base">&copy; 2024 SmartPolyCare. Clinical-grade AI solutions.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</Link>
                <Link href="/compliance" className="text-gray-400 hover:text-white transition text-sm">HIPAA Compliance</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
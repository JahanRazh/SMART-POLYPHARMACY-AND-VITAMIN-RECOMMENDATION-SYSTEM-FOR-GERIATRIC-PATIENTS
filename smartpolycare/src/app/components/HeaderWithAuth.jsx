// components/HeaderWithAuth.jsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import UserProfile from './UserProfile';

export default function HeaderWithAuth() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-15 h-15 bg-gradient-to-br from-teal-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Image
              src="/images/favicon.ico"
              alt="SmartPolyCare logo"
              width={50}
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
          <Link href="/research" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
            Polypharmacy Risk
          </Link>
          <Link href="/Pages/LifestyleAdvice" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
            Lifestyle Advice
          </Link>
          <Link href="/Pages/About" className="text-gray-700 hover:text-teal-600 font-medium transition-colors duration-200">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
"use client";

import Link from 'next/link';
import Image from 'next/image';
import UserProfile from './UserProfile';
import { useState } from "react";

export default function HeaderWithAuth() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      
      {/* MAIN HEADER */}
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-15 h-15 bg-gradient-to-br from-teal-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <Image
              src="/images/favicon.ico"
              alt="SmartPolyCare logo"
              width={50}
              height={50}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">SmartPolyCare</span>
            <span className="text-xs text-teal-600 font-medium">Geriatric Health Intelligence</span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/Pages/Polypharmacy" className="nav-link">Polypharmacy Risk</Link>
          <Link href="/Pages/LifestyleAdvice" className="nav-link">Lifestyle Advice</Link>
          <Link href="/Pages/About" className="nav-link">About</Link>
          <Link href="/Pages/patients" className="nav-link">Patients</Link>
        </nav>

        {/* RIGHT SIDE (USER + MOBILE MENU BUTTON) */}
        <div className="flex items-center space-x-4">
          <UserProfile />

          {/* MOBILE BURGER BUTTON */}
          <button
            className="lg:hidden p-2 border rounded-md"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="text-2xl">☰</span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <nav className="lg:hidden bg-white border-t border-gray-200 flex flex-col space-y-4 p-4">
          <Link href="/" className="mobile-link">Home</Link>
          <Link href="/Pages/Polypharmacy" className="mobile-link">Polypharmacy Risk</Link>
          <Link href="/Pages/LifestyleAdvice" className="mobile-link">Lifestyle Advice</Link>
          <Link href="/Pages/About" className="mobile-link">About</Link>
          <Link href="/Pages/patients" className="mobile-link">Patients</Link>
        </nav>
      )}
    </header>
  );
}

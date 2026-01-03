// components/HeaderWithAuth.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import UserProfile from "./UserProfile";

export default function HeaderWithAuth() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* TOP BAR */}
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 py-3 px-4">
        {/* LOGO + TITLE */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <Image
              src="/images/favicon.ico"
              alt="SmartPolyCare logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              SmartPolyCare
            </span>
            <span className="text-[11px] text-teal-600 font-medium">
              Geriatric Health Intelligence
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/Pages/Polypharmacy/Homepage"
            className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
          >
            Polypharmacy Risk
          </Link>
          <Link
            href="/Pages/LifestyleAdvice"
            className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
          >
            Lifestyle Advice
          </Link>
          <Link
            href="/Pages/About"
            className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
          >
            About
          </Link>
         
        </nav>

        {/* RIGHT SIDE: USER + MOBILE MENU BUTTON */}
        <div className="flex items-center gap-2">
          <UserProfile />

          {/* MOBILE BURGER BUTTON */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="block w-5 h-0.5 bg-gray-800 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-800 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-800" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 text-sm">
            <Link
              href="/"
              onClick={closeMenu}
              className="text-gray-800 hover:text-teal-600 font-medium"
            >
              Home
            </Link>
            <Link
              href="/Pages/Polypharmacy"
              onClick={closeMenu}
              className="text-gray-800 hover:text-teal-600 font-medium"
            >
              Polypharmacy Risk
            </Link>
            <Link
              href="/Pages/LifestyleAdvice"
              onClick={closeMenu}
              className="text-gray-800 hover:text-teal-600 font-medium"
            >
              Lifestyle Advice
            </Link>
            <Link
              href="/Pages/About"
              onClick={closeMenu}
              className="text-gray-800 hover:text-teal-600 font-medium"
            >
              About
            </Link>
            <Link
              href="/Pages/patients"
              onClick={closeMenu}
              className="text-gray-800 hover:text-teal-600 font-medium"
            >
              Patients
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

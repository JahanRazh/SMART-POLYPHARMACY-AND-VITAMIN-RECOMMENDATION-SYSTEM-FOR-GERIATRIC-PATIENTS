// components/HeaderWithAuth.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import UserProfile from "./UserProfile";
import NotificationBell from "./NotificationBell";

export default function HeaderWithAuth() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Navigation items
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/Pages/Polypharmacy/Homepage", label: "Polypharmacy Risk" },
    { href: "/Pages/LifestyleAdvice", label: "Lifestyle Advice" },
    { href: "/Pages/About", label: "About" },
  ];

  // Desktop NavLink Component - Glassmorphism on hover
  const DesktopNavLink = ({ href, label }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      <Link
        href={href}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-medium text-sm transition-all duration-300
          text-gray-800 hover:backdrop-blur-md hover:bg-white/20 hover:shadow-lg hover:shadow-inner"
      >
        <span>{label}</span>
      </Link>
    </motion.div>
  );

  // Mobile NavLink Component - Glassmorphism on hover
  const MobileNavLink = ({ href, label, index }) => (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ x: 8 }}
    >
      <Link
        href={href}
        onClick={closeMenu}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-gray-800 transition-all duration-300
          hover:backdrop-blur-md hover:bg-white/20 hover:shadow-lg hover:shadow-inner"
      >
        <span>{label}</span>
        <motion.span
          className="ml-auto"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          →
        </motion.span>
      </Link>
    </motion.div>
  );

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
        <nav className="hidden lg:flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <DesktopNavLink
              key={item.href}
              href={item.href}
              label={item.label}
            />
          ))}
        </nav>

        {/* RIGHT SIDE: USER + MOBILE MENU BUTTON */}
        <div className="flex items-center gap-2">
          <NotificationBell />
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
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 text-sm">
            {navItems.map((item, index) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                index={index}
              />
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

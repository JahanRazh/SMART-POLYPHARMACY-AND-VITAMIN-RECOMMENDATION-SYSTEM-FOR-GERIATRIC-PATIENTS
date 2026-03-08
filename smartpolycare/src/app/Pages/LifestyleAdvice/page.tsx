'use client';

// Import necessary modules and libraries
import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/Contexts/AuthContext";

// Type definition for each advice tab
// Each tab has: key, label, summary, and a list of recommendations
// This ensures strong typing and prevents runtime errors
export type AdviceTab = {
  key: string;
  label: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

// Type definition for saved advice
type DailyRecommendation = {
  day: number;
  recommendation: string;
};

type SavedAdvice = {
  id: string;
  week_1: DailyRecommendation[];
  week_2: DailyRecommendation[];
  summary: string;
  generated_date?: string;
  expires_date?: string;
  inputs?: {
    emotion: string;
    mental_health_level: string;
    polypharmacy_risk: string;
    occupation: string;
  };
  saved_at?: string;
};

// API configuration
const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      date = new Date(dateString.replace(' ', 'T'));
    }
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

// Predefined tabs containing lifestyle advice content
// Structured for easy expansion later
const tabs: AdviceTab[] = [
  {
    key: "nutrition",
    label: "Nutrition",
    summary:
      "Balance macro- and micronutrients while avoiding drug–nutrient conflicts. Center meals on lean protein, leafy greens, and fortified grains.",
    recommendations: [
      {
        title: "Breakfast Blueprint",
        detail:
          "Oatmeal with chia, walnuts, and berries plus fortified plant milk keeps fiber high and supports folate and B12 needs.",
      },
      {
        title: "Plate Framework",
        detail:
          "Build plates with 50% colorful vegetables, 25% lean protein, and 25% whole grains. Pair calcium-rich items away from thyroid meds.",
      },
      {
        title: "Hydration Rhythm",
        detail:
          "Aim for 8–10 cups of water or infused herbal teas daily, spacing fluids around diuretics to protect kidney function.",
      },
    ],
  },
  {
    key: "movement",
    label: "Movement",
    summary:
      "Low-impact activity preserves strength, balance, and cardiovascular health. Blend strength, flexibility, and aerobic bursts.",
    recommendations: [
      {
        title: "Mini Strength Sets",
        detail:
          "3 weekly sessions of chair-assisted squats, wall push-ups, and resistance band rows maintain muscle mass and glucose control.",
      },
      {
        title: "Balance Boosters",
        detail:
          "Daily heel-to-toe walks and single-leg stands (with support) reduce fall risk heightened by certain antihypertensives.",
      },
      {
        title: "Active Microbreaks",
        detail:
          "Set 90-minute timers to stretch shoulders, roll ankles, or stroll indoors to offset sedative side effects.",
      },
    ],
  },
  {
    key: "sleep",
    label: "Sleep & Mindfulness",
    summary:
      "Restorative sleep supports medication efficacy and emotional stability. Pair sleep hygiene with calming rituals.",
    recommendations: [
      {
        title: "Evening Wind-down",
        detail:
          "Dim lights 60 minutes before bed, take medications with sedative effects as prescribed, and swap screens for breathing exercises.",
      },
      {
        title: "Guided Journaling",
        detail:
          "Capture gratitude, symptoms, and medication responses nightly to build a feedback archive for clinicians.",
      },
      {
        title: "Mindful Moments",
        detail:
          "Use 5-minute box breathing or body scans after meals to steady heart rate variability and manage anxiety.",
      },
    ],
  },
];

// Tabs component – handles switching and displaying the correct tab content
function AdviceTabs() {
  // State to track which tab is currently active
  const [activeKey, setActiveKey] = useState<string>(tabs[0].key);

  // Memoized lookup to find the active tab object
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === activeKey) ?? tabs[0],
    [activeKey]
  );

  const tabIcons: Record<string, string> = {
    nutrition: '🥗',
    movement: '🏃',
    sleep: '😴',
  };

  return (
    <div className="mt-16">
      {/* Tab Buttons with enhanced styling */}
      <div
        role="tablist"
        aria-label="Lifestyle advice categories"
        className="flex flex-wrap gap-4 mb-12"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeKey;
          return (
            <motion.button
              key={tab.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              role="tab"
              aria-selected={isActive}
              className={`relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xl scale-105'
                  : 'bg-white text-teal-700 border-2 border-teal-200 hover:border-teal-400'
              }`}
              onClick={() => setActiveKey(tab.key)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl mr-2">{tabIcons[tab.key]}</span>
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Animated tab content */}
      <motion.div
        key={activeTab.key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-br from-white via-teal-50/30 to-blue-50/30 border border-teal-100 shadow-2xl overflow-hidden backdrop-blur-sm"
      >
        {/* Tab Header */}
        <div className="relative bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-b border-teal-100 px-8 py-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-700 to-blue-600 bg-clip-text text-transparent mb-3">
              {tabIcons[activeTab.key]} {activeTab.label} Guidance
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
              {activeTab.summary}
            </p>
          </motion.div>
        </div>

        {/* Recommendations Grid with Cards */}
        <div className="grid gap-6 px-8 py-12 md:grid-cols-3">
          {activeTab.recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}
              className="group rounded-2xl bg-gradient-to-br from-white to-teal-50/50 border-2 border-teal-100 p-6 cursor-pointer hover:border-teal-300 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                  ✓
                </div>
                <div className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
                  {tabIcons[activeTab.key]}
                </div>
              </div>

              <h3 className="text-xl font-bold text-teal-900 mb-3 group-hover:text-teal-700 transition-colors">
                {rec.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm group-hover:text-gray-900 transition-colors">
                {rec.detail}
              </p>

              <div className="mt-4 pt-4 border-t border-teal-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-teal-600 font-semibold">Learn more →</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Main page component – displays the lifestyle advice section
export default function LifestyleAdvicePage() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  
  // Priority: auth user email > URL params > fallback
  const userEmail = user?.email || userProfile?.email || emailParam || patientId;
  const identifier = userEmail;

  const [recentAdvice, setRecentAdvice] = useState<SavedAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Slideshow images
  const slideImages = [
    { src: '/wellness image.jpg', alt: 'Wellness and healthy lifestyle' },
    { src: '/meditation.jpg', alt: 'Meditation and mindfulness' },
    { src: '/sleep.jpg', alt: 'Quality sleep and rest' },
  ];

  // Carousel auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [slideImages.length]);

  useEffect(() => {
    const fetchRecentAdvice = async () => {
      if (!identifier || identifier === 'null') {
        setLoading(false);
        return;
      }

      try {
        // Always use 'email' parameter when identifier is an email
        const isEmail = identifier && identifier.includes('@');
        const paramName = isEmail ? 'email' : 'patientId';
        const endpoint = `/patient-advice-history?${paramName}=${encodeURIComponent(identifier)}`;
        
        console.log(`📡 Fetching advice history for ${paramName}: ${identifier}`);
        const response = await api.get(endpoint);
        const data = response.data as { advice_history: SavedAdvice[] };

        if (data.advice_history && data.advice_history.length > 0) {
          // Get the most recent advice (should be sorted by backend)
          setRecentAdvice(data.advice_history[0]);
          console.log('✅ Loaded most recent advice:', data.advice_history[0]);
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch advice history:', err);
        // Don't show error, just continue without the advice
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAdvice();
  }, [identifier]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ float: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 left-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ float: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-10 right-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-6">
          {/* Header Content with Image Carousel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-1"
            >
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-teal-300 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold tracking-wide text-teal-700 shadow-md"
              >
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                Wellness Hub
              </motion.span>

              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-6 text-4xl lg:text-5xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent leading-tight"
              >
                Your Daily Wellness Companion
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-6 text-lg text-gray-600 leading-relaxed"
              >
                Explore evidence-informed lifestyle choices that work harmoniously with your medication profile. 
                Personalized guidance for nutrition, movement, and restful sleep.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="/Pages/adviceDetails"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-4 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
                >
                  <span>Generate New Advice</span>
                  <span className="transform transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Side - Image Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-2 flex justify-center"
            >
              <div className="relative w-full max-w-2xl">
                {/* Main Carousel Image */}
                <div className="relative w-full h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300 group cursor-pointer">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={slideImages[currentImageIndex].src}
                      alt={slideImages[currentImageIndex].alt}
                      fill
                      priority
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/30 to-transparent"></div>

                  {/* Navigation Buttons */}
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + slideImages.length) % slideImages.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % slideImages.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Carousel Indicators */}
                <div className="flex justify-center gap-3 mt-6">
                  {slideImages.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-3 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-teal-600 w-8'
                          : 'bg-teal-300 w-3 hover:bg-teal-400'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Image Labels */}
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 text-center text-teal-700 font-semibold text-sm"
                >
                  {currentImageIndex === 0 && "Wellness & Healthy Lifestyle"}
                  {currentImageIndex === 1 && "Meditation & Mindfulness"}
                  {currentImageIndex === 2 && "Quality Sleep & Rest"}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative container mx-auto px-6 py-16 lg:py-20">
        {/* Most Recent Advice Section - Enhanced */}
        {!loading && recentAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            {/* Section Header */}
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3"
            >
              <span className="text-4xl">📋</span>
              Your Personalized Plan
            </motion.h2>

            {/* Main Advice Card */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl mb-8"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-teal-400/10 to-cyan-400/20" />
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

              <div className="relative p-8 lg:p-12">
                {/* Header Row */}
                <div className="flex items-start justify-between flex-wrap gap-4 mb-8 pb-8 border-b border-teal-100">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Your 2-Week Health Journey
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <p className="flex items-center gap-2 text-teal-700 font-semibold">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        Generated: {formatDate(recentAdvice.generated_date)}
                      </p>
                      <p className="flex items-center gap-2 text-amber-700 font-semibold">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        Expires: {formatDate(recentAdvice.expires_date)}
                      </p>
                    </div>
                  </motion.div>

                  {/* View History Button */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Link
                      href={`/Pages/adviceHistory?email=${identifier ? encodeURIComponent(identifier) : ''}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all"
                    >
                      📚 View All History
                      <span>→</span>
                    </Link>
                  </motion.div>
                </div>

                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8 rounded-2xl bg-gradient-to-br from-teal-50/80 to-blue-50/80 p-6 border border-teal-200"
                >
                  <h4 className="text-lg font-bold text-teal-900 mb-3 flex items-center gap-2">
                    <span>✨</span> Summary
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {recentAdvice.summary}
                  </p>
                </motion.div>

                {/* Week 1 & 2 Cards Grid */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {/* Week 1 Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📝</span> Week 1 (Days 1-7)
                    </h4>
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {recentAdvice.week_1?.map((rec) => (
                        <motion.li
                          key={rec.day}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-3 text-sm text-gray-700 bg-white/60 p-3 rounded-lg hover:bg-white/80 transition-colors"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                            {rec.day}
                          </span>
                          <span>{rec.recommendation}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Week 2 Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📝</span> Week 2 (Days 8-14)
                    </h4>
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {recentAdvice.week_2?.map((rec) => (
                        <motion.li
                          key={rec.day}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-3 text-sm text-gray-700 bg-white/60 p-3 rounded-lg hover:bg-white/80 transition-colors"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                            {rec.day}
                          </span>
                          <span>{rec.recommendation}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Patient Profile Card */}
                {recentAdvice.inputs && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 p-6"
                  >
                    <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <span>👤</span> Your Health Profile
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {recentAdvice.inputs.emotion && (
                        <div className="bg-white/70 rounded-lg p-4 text-center">
                          <p className="text-2xl mb-2">🎭</p>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Emotion</p>
                          <p className="text-sm font-bold text-indigo-700 mt-1">
                            {recentAdvice.inputs.emotion}
                          </p>
                        </div>
                      )}
                      {recentAdvice.inputs.mental_health_level && (
                        <div className="bg-white/70 rounded-lg p-4 text-center">
                          <p className="text-2xl mb-2">🧠</p>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Mental Health</p>
                          <p className="text-sm font-bold text-indigo-700 mt-1">
                            {recentAdvice.inputs.mental_health_level}
                          </p>
                        </div>
                      )}
                      {recentAdvice.inputs.polypharmacy_risk && (
                        <div className="bg-white/70 rounded-lg p-4 text-center">
                          <p className="text-2xl mb-2">💊</p>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Med Risk</p>
                          <p className="text-sm font-bold text-indigo-700 mt-1">
                            {recentAdvice.inputs.polypharmacy_risk}
                          </p>
                        </div>
                      )}
                      {recentAdvice.inputs.occupation && (
                        <div className="bg-white/70 rounded-lg p-4 text-center">
                          <p className="text-2xl mb-2">💼</p>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Occupation</p>
                          <p className="text-sm font-bold text-indigo-700 mt-1">
                            {recentAdvice.inputs.occupation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lifestyle Advice Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdviceTabs />
        </motion.div>
      </section>
    </div>
  );
}

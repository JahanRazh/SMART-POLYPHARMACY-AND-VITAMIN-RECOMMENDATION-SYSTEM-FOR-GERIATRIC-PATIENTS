'use client';

// Import necessary modules and libraries
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Type definition for each advice tab
// Each tab has: key, label, summary, and a list of recommendations
// This ensures strong typing and prevents runtime errors
export type AdviceTab = {
  key: string;
  label: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

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

  return (
    <div className="mt-10">
      {/* Tab Buttons */}
      <div
        role="tablist"
        aria-label="Lifestyle advice categories"
        className="flex flex-wrap gap-3"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring focus-visible:ring-teal-500 ${
                isActive
                  ? "bg-teal-600 text-white border-teal-600 shadow"
                  : "bg-white text-teal-700 border-teal-200 hover:border-teal-400"
              }`}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Animated tab content using Framer Motion */}
      <motion.div
        key={activeTab.key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-10 rounded-2xl bg-white border border-teal-100 shadow-sm"
      >
        {/* Tab Summary */}
        <div className="border-b border-teal-50 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            {activeTab.label} Guidance
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {activeTab.summary}
          </p>
        </div>

        {/* Recommendations grid */}
        <div className="grid gap-5 px-6 py-6 md:grid-cols-3">
          {activeTab.recommendations.map((rec) => (
            <div
              key={rec.title}
              className="rounded-xl border border-teal-100 bg-teal-50/60 p-4"
            >
              <h3 className="text-sm font-semibold text-teal-800">
                {rec.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {rec.detail}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Main page component – displays the lifestyle advice section
export default function LifestyleAdvicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
        {/* Page header intro animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium tracking-wide text-teal-700">
            Lifestyle Advice Hub
          </span>

          {/* Page title */}
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Personalized Support for Daily Living
          </h1>

          {/* Page description */}
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Explore simple, evidence-informed actions that harmonize with complex
            medication plans. Tabs keep it easy to focus on the area that matters
            most today—nutrition, movement, or rest.
          </p>

          {/* Link to the Advice Form page */}
          <Link
            href="/Pages/adviceDetails"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            Advice Form
          </Link>
        </motion.div>

        {/* Render the tab content component */}
        <AdviceTabs />
      </section>
    </div>
  );
}

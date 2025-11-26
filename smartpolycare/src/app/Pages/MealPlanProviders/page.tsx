"use client";

import { motion } from "framer-motion";
import React from "react";
import Link from "next/link";

// -------------------------------------------------------------
// TYPE DEFINITIONS
// -------------------------------------------------------------
export type ProviderCategory = {
  key: string,
  label: string,
  description: string,
  features: Array<{ title: string, detail: string }>,
};

// -------------------------------------------------------------
// STATIC CONTENT — CAN BE REPLACED WITH BACKEND DATA LATER
// -------------------------------------------------------------
const providerCategories: ProviderCategory[] = [
  {
    key: "elderly",
    label: "Elderly-Friendly Providers",
    description:
      "Meal providers specializing in soft-texture, low-sodium, and easy-to-digest meals suitable for geriatric patients.",
    features: [
      {
        title: "Soft-Texture Meals",
        detail: "Optimized for digestion and swallowing comfort.",
      },
      {
        title: "Low-Sodium Options",
        detail: "Suitable for hypertensive and cardiac patients.",
      },
      {
        title: "Low-Spice Variants",
        detail: "Reduces gastric irritation and improves nutrient absorption.",
      },
    ],
  },
  {
    key: "deficiency",
    label: "Deficiency-Specific Providers",
    description:
      "Providers offering meals tailored for vitamin deficiencies such as B12, D, and Folate.",
    features: [
      {
        title: "B12-Rich Meals",
        detail: "Fortified cereals, egg dishes, and fish-based meals.",
      },
      {
        title: "Vitamin D Meals",
        detail: "Fortified milk, baked fish, mushrooms, etc.",
      },
      {
        title: "Folate Meals",
        detail: "Leafy greens, lentils, and legume-rich recipes.",
      },
    ],
  },
  {
    key: "drugSafety",
    label: "Drug–Food Safe Providers",
    description:
      "Providers categorized by safe food preparation that will not conflict with drug–nutrient interactions.",
    features: [
      {
        title: "Safe With Metformin",
        detail: "Higher-B12 meals reducing deficiency progression.",
      },
      {
        title: "Safe With Thyroid Meds",
        detail: "Calcium-timed meals avoiding levothyroxine interference.",
      },
      {
        title: "Safe With Diuretics",
        detail: "Potassium-conscious meals as needed.",
      },
    ],
  },
];

// -------------------------------------------------------------
// MAIN PAGE COMPONENT
// -------------------------------------------------------------
export default function MealPlanProvidersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-20 lg:pt-28 lg:pb-24">
        {/* Header animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-4xl"
        >
          {/* PAGE BADGE */}
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            Meal Plan Provider Hub
          </span>

          {/* TITLE */}
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Trusted Meal Providers for Geriatric Nutrition
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Explore verified meal service providers offering safe, clinically
            suitable, elderly-friendly meals aligned with your vitamin
            deficiency goals and medication requirements.
          </p>

          {/* Button to Add Provider */}
          <Link
            href="/components/MealPlanProviders/AddProvider"
            className="mt-6 inline-flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition duration-200"
          >
            + Add New Meal Provider
          </Link>
        </motion.div>

        {/* CATEGORY GRID */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {providerCategories.map((category) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300"
            >
              {/* CARD TITLE */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {category.label}
              </h3>

              {/* CARD DESCRIPTION */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {category.description}
              </p>

              {/* FEATURES */}
              <ul className="space-y-3">
                {category.features.map((feature) => (
                  <li
                    key={feature.title}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import MealDetailsForm from "./mealdetailsform"; // Correct import

export type ProviderCategory = {
  key: string;
  label: string;
  description: string;
  features: Array<{ title: string; detail: string }>;
};

const providerCategories: ProviderCategory[] = [
  {
    key: "elderly",
    label: "Elderly-Friendly Providers",
    description:
      "Meal providers specializing in soft-texture, low-sodium, and easy-to-digest meals suitable for geriatric patients.",
    features: [
      { title: "Soft-Texture Meals", detail: "Optimized for digestion." },
      {
        title: "Low-Sodium Options",
        detail: "Good for hypertensive patients.",
      },
      { title: "Low-Spice Variants", detail: "Reduces gastric irritation." },
    ],
  },
  {
    key: "deficiency",
    label: "Deficiency-Specific Providers",
    description:
      "Meals tailored for vitamin deficiencies such as B12, D, Folate.",
    features: [
      { title: "B12 Meals", detail: "Fortified cereals, eggs, fish." },
      { title: "Vitamin D Meals", detail: "Fortified milk & baked fish." },
      { title: "Folate Meals", detail: "Leafy greens & legumes." },
    ],
  },
  {
    key: "drugSafety",
    label: "Drug–Food Safe Providers",
    description: "Meals designed to avoid drug–nutrient interactions.",
    features: [
      { title: "Safe with Metformin", detail: "B12-support meals." },
      { title: "Safe with Thyroid Meds", detail: "Avoids calcium conflicts." },
      { title: "Safe with Diuretics", detail: "Potassium-balanced meals." },
    ],
  },
];

export default function MealPlanProvidersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white text-gray-900">
      {/* Show form OR show list */}
      {showForm ? (
        <MealDetailsForm onBack={() => setShowForm(false)} />
      ) : (
        <section className="container mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              Meal Plan Provider Hub
            </span>

            <h1 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted Meal Providers for Geriatric Nutrition
            </h1>

            <p className="mt-4 text-gray-600 md:text-lg">
              Explore verified meal service providers offering safe meals for
              elderly patients.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              + Add Meal Details Form
            </button>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {providerCategories.map((category) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {category.label}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {category.description}
                </p>

                <ul className="space-y-3">
                  {category.features.map((feature) => (
                    <li
                      key={feature.title}
                      className="flex gap-3 text-gray-700"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="font-semibold">{feature.title}</p>
                        <p className="text-sm text-gray-600">
                          {feature.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

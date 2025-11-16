'use client';

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type AdviceTab = {
  key: string;
  label: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

type Mode = 'normal' | 'pro';

const normalTabs: AdviceTab[] = [
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

const proTabs: AdviceTab[] = [
  {
    key: "nutrition",
    label: "Nutrition",
    summary:
      "Advanced nutritional strategies with precise timing, micronutrient optimization, and sophisticated drug-nutrient interaction management for complex polypharmacy scenarios.",
    recommendations: [
      {
        title: "Chrononutrition Protocol",
        detail:
          "Time protein intake (30g) within 2 hours post-exercise to maximize muscle protein synthesis. Schedule calcium-rich foods 4+ hours from levothyroxine. Use meal timing apps to track interactions with warfarin, statins, and ACE inhibitors.",
      },
      {
        title: "Micronutrient Optimization Matrix",
        detail:
          "Weekly rotation: Monday (B12/folate focus), Wednesday (vitamin D + K2), Friday (magnesium + zinc). Monitor serum levels quarterly. Consider DEXA scans for bone density when on long-term corticosteroids.",
      },
      {
        title: "Advanced Hydration & Electrolyte Balance",
        detail:
          "Track daily sodium (1500-2300mg), potassium (2600-3400mg), and magnesium (320-420mg) via food logs. Adjust based on diuretic type (thiazide vs loop). Use smart water bottles with reminders spaced 2 hours from diuretic doses.",
      },
      {
        title: "Pharmacokinetic Meal Timing",
        detail:
          "Fat-soluble vitamins (A, D, E, K) with meals containing 10g+ fat. Iron supplements with vitamin C (100mg) but 2 hours from calcium. Probiotics 3 hours from antibiotics. Maintain consistent meal timing for diabetes medications.",
      },
    ],
  },
  {
    key: "movement",
    label: "Movement",
    summary:
      "Evidence-based exercise prescription with progressive overload, periodization, and medication-specific adaptations for optimal functional outcomes.",
    recommendations: [
      {
        title: "Periodized Strength Program",
        detail:
          "4-week mesocycles: Week 1-2 (hypertrophy: 3x10-12 reps), Week 3 (strength: 4x6-8 reps), Week 4 (deload: 2x8-10 reps). Adjust intensity based on beta-blocker effects on heart rate. Use RPE scale (6-8/10) instead of max HR.",
      },
      {
        title: "Advanced Balance & Proprioception",
        detail:
          "Progressive difficulty: Week 1 (tandem stance 30s), Week 2 (single-leg 20s with support), Week 3 (single-leg eyes closed 10s), Week 4 (dynamic balance on foam pad). Monitor for orthostatic hypotension post-exercise if on antihypertensives.",
      },
      {
        title: "Cardiovascular Periodization",
        detail:
          "Zone-based training: 60% time in Zone 2 (conversational pace), 20% Zone 3 (moderate), 20% Zone 4 (high intensity). Adjust target zones if on beta-blockers (subtract 20-30 bpm). Include 2x weekly HIIT sessions (4x4 protocol) for metabolic health.",
      },
      {
        title: "Recovery & Adaptation Protocols",
        detail:
          "Post-exercise: 20g whey protein + 40g carbs within 30 minutes. Cold water immersion (15°C, 10-15 min) for inflammation if on NSAIDs. Sleep quality tracking via wearables to optimize recovery between sessions.",
      },
    ],
  },
  {
    key: "sleep",
    label: "Sleep & Mindfulness",
    summary:
      "Comprehensive sleep optimization with chronobiology, cognitive behavioral therapy techniques, and advanced stress management protocols.",
    recommendations: [
      {
        title: "Circadian Rhythm Optimization",
        detail:
          "Light therapy: 10,000 lux blue-enriched light 30 minutes upon waking. Evening: amber glasses (blocking 470nm) 2 hours pre-bed. Maintain consistent sleep-wake times (±30 min) even on weekends. Track via actigraphy or sleep apps.",
      },
      {
        title: "Advanced Sleep Hygiene Protocol",
        detail:
          "Bedroom: 18-20°C, 40-60% humidity, blackout curtains, white noise (40-50 dB). Pre-sleep routine: 90 min before bed - no screens, warm bath (40°C, 20 min), progressive muscle relaxation, 4-7-8 breathing (4 cycles).",
      },
      {
        title: "Cognitive Behavioral Therapy for Insomnia (CBT-I)",
        detail:
          "Sleep restriction: Calculate average sleep efficiency, restrict time in bed to actual sleep time + 30 min, gradually increase. Stimulus control: Bed only for sleep/sex, leave if awake >20 min. Cognitive restructuring for sleep anxiety.",
      },
      {
        title: "Stress Management & HRV Training",
        detail:
          "Daily HRV monitoring via chest strap or smartwatch. Morning meditation (20 min): body scan or loving-kindness. Evening: gratitude journaling + symptom tracking. Weekly: 1-hour nature exposure for cortisol reduction. Biofeedback training for autonomic regulation.",
      },
    ],
  },
];

function AdviceTabs({ mode }: { mode: Mode }) {
  const tabs = mode === 'pro' ? proTabs : normalTabs;
  const [activeKey, setActiveKey] = useState<string>(tabs[0].key);

  // Reset active tab when mode changes
  useEffect(() => {
    setActiveKey(tabs[0].key);
  }, [mode, tabs]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === activeKey) ?? tabs[0],
    [activeKey, tabs]
  );

  return (
    <div className="mt-10">
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

      <motion.div
        key={`${mode}-${activeTab.key}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-10 rounded-2xl bg-white border border-teal-100 shadow-sm"
      >
        <div className="border-b border-teal-50 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            {activeTab.label} Guidance
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {activeTab.summary}
          </p>
        </div>

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

export default function LifestyleAdvicePage() {
  const [mode, setMode] = useState<Mode>('normal');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium tracking-wide text-teal-700">
            Lifestyle Advice Hub
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Personalized Support for Daily Living
          </h1>
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Explore simple, evidence-informed actions that harmonize with complex
            medication plans. Choose between Normal and Pro modes to access the level
            of detail that works best for you.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/Pages/adviceDetails"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
            >
              Advice Form
            </Link>
          </div>

          {/* Mode Selector */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Mode:</span>
            </div>
            <div
              role="tablist"
              aria-label="Advice mode selection"
              className="flex gap-3"
            >
              <button
                role="tab"
                aria-selected={mode === 'normal'}
                className={`rounded-lg border-2 px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring focus-visible:ring-teal-500 ${
                  mode === 'normal'
                    ? "bg-teal-600 text-white border-teal-600 shadow-md"
                    : "bg-white text-teal-700 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                }`}
                onClick={() => setMode('normal')}
              >
                Normal
              </button>
              <button
                role="tab"
                aria-selected={mode === 'pro'}
                className={`rounded-lg border-2 px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring focus-visible:ring-teal-500 ${
                  mode === 'pro'
                    ? "bg-teal-600 text-white border-teal-600 shadow-md"
                    : "bg-white text-teal-700 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
                }`}
                onClick={() => setMode('pro')}
              >
                Pro
              </button>
            </div>
            {mode === 'pro' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-teal-700 italic"
              >
                Pro mode provides advanced, detailed recommendations with precise protocols and evidence-based strategies.
              </motion.p>
            )}
          </div>
        </motion.div>

        <AdviceTabs mode={mode} />
      </section>
    </div>
  );
}


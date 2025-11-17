'use client';

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type AdviceTab = {
  key: string;
  label: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

type Mode = 'normal' | 'pro';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

// Font size multipliers
const fontSizeMultipliers = {
  small: 0.85,
  medium: 1,
  large: 1.25,
  xlarge: 1.5,
};

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

// Modal Component for Mode Selection
function ModeSelectionModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<Mode>('normal');

  const normalFeatures = [
    "Basic lifestyle recommendations",
    "Simple nutrition and exercise guidance",
    "General sleep and stress management tips",
    "Free access to advice form",
    "Standard personalized recommendations"
  ];

  const proFeatures = [
    "Advanced nutritional protocols with precise timing",
    "Evidence-based exercise prescription with periodization",
    "Comprehensive sleep optimization with CBT-I techniques",
    "HRV training and biofeedback protocols",
    "Pharmacokinetic meal timing strategies",
    "Quarterly serum level monitoring recommendations",
    "Advanced drug-nutrient interaction management"
  ];

  const handleContinue = () => {
    if (selectedMode === 'normal') {
      router.push('/Pages/adviceDetails');
    } else {
      router.push('/Pages/payment');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
          {/* Close Button - Large */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[50px] min-h-[50px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg
              className="w-8 h-8 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="p-8 sm:p-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 text-center">
              Choose Your Mode
            </h2>
            <p className="text-xl sm:text-2xl text-gray-700 mb-10 text-center leading-relaxed">
              Select the level of detail and features that best suit your needs
            </p>

            {/* Mode Tabs - Large and Accessible */}
            <div className="grid grid-cols-1 gap-6 mb-10">
              <button
                onClick={() => setSelectedMode('normal')}
                className={`rounded-2xl border-4 px-8 py-8 text-left transition-all duration-200 min-h-[140px] ${
                  selectedMode === 'normal'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xl scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      selectedMode === 'normal' ? 'bg-white/20' : 'bg-teal-100'
                    }`}>
                      <svg className={`w-10 h-10 ${selectedMode === 'normal' ? 'text-white' : 'text-teal-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-3xl font-bold">Normal Mode</span>
                  </div>
                  {selectedMode === 'normal' && (
                    <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xl opacity-90 font-medium">Free • Basic Recommendations</p>
              </button>

              <button
                onClick={() => setSelectedMode('pro')}
                className={`rounded-2xl border-4 px-8 py-8 text-left transition-all duration-200 min-h-[140px] ${
                  selectedMode === 'pro'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xl scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      selectedMode === 'pro' ? 'bg-white/20' : 'bg-teal-100'
                    }`}>
                      <svg className={`w-10 h-10 ${selectedMode === 'pro' ? 'text-white' : 'text-teal-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <span className="text-3xl font-bold">Pro Mode</span>
                  </div>
                  {selectedMode === 'pro' && (
                    <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xl opacity-90 font-medium">Premium • Advanced Protocols</p>
              </button>
            </div>

            {/* Features List - Large Text */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-8 border-2 border-gray-200">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {selectedMode === 'normal' ? 'Normal Mode Features' : 'Pro Mode Features'}
              </h3>
              <ul className="space-y-5">
                {(selectedMode === 'normal' ? normalFeatures : proFeatures).map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <svg
                      className="w-8 h-8 text-teal-600 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xl text-gray-800 leading-relaxed">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Action Buttons - Large */}
            <div className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={onClose}
                className="flex-1 min-h-[70px] px-8 py-5 rounded-2xl border-4 border-gray-400 text-gray-700 text-2xl font-bold hover:bg-gray-50 active:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 min-h-[70px] px-8 py-5 rounded-2xl bg-teal-600 text-white text-2xl font-bold hover:bg-teal-700 active:bg-teal-800 transition-all shadow-xl"
              >
                {selectedMode === 'normal' ? 'Continue to Advice Form' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AdviceTabs({ mode, fontSizeMultiplier }: { mode: Mode; fontSizeMultiplier: number }) {
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

  // Calculate font sizes based on multiplier
  const tabTextSize = `${Math.round(20 * fontSizeMultiplier)}px`;
  const headingSize = `${Math.round(36 * fontSizeMultiplier)}px`;
  const summarySize = `${Math.round(20 * fontSizeMultiplier)}px`;
  const titleSize = `${Math.round(24 * fontSizeMultiplier)}px`;
  const detailSize = `${Math.round(18 * fontSizeMultiplier)}px`;

  return (
    <div className="mt-12">
      <div
        role="tablist"
        aria-label="Lifestyle advice categories"
        className="flex flex-wrap gap-4 mb-8"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              style={{ fontSize: tabTextSize }}
              className={`rounded-2xl border-4 px-8 py-5 font-bold transition-all duration-200 min-h-[70px] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 ${
                isActive
                  ? "bg-teal-600 text-white border-teal-600 shadow-xl"
                  : "bg-white text-teal-700 border-teal-300 hover:border-teal-400 hover:bg-teal-50 hover:shadow-lg"
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
        className="mt-8 rounded-3xl bg-white border-4 border-teal-200 shadow-xl"
      >
        <div className="border-b-4 border-teal-100 px-8 py-8 bg-gradient-to-r from-teal-50 to-blue-50">
          <h2 style={{ fontSize: headingSize }} className="font-bold text-gray-900 mb-4">
            {activeTab.label} Guidance
          </h2>
          <p style={{ fontSize: summarySize }} className="text-gray-700 leading-relaxed">
            {activeTab.summary}
          </p>
        </div>

        <div className="grid gap-6 px-8 py-8 md:grid-cols-2 lg:grid-cols-3">
          {activeTab.recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border-4 border-teal-100 bg-teal-50/80 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{index + 1}</span>
                </div>
                <h3 style={{ fontSize: titleSize }} className="font-bold text-teal-900 leading-tight">
                  {rec.title}
                </h3>
              </div>
              <p style={{ fontSize: detailSize }} className="text-gray-700 leading-relaxed">
                {rec.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Font Size Control Component
function FontSizeControl({ 
  fontSize, 
  setFontSize 
}: { 
  fontSize: FontSize; 
  setFontSize: (size: FontSize) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sizes: { label: string; value: FontSize; icon: string }[] = [
    { label: 'Small', value: 'small', icon: 'A' },
    { label: 'Medium', value: 'medium', icon: 'A' },
    { label: 'Large', value: 'large', icon: 'A' },
    { label: 'Extra Large', value: 'xlarge', icon: 'A' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-teal-600 text-white shadow-2xl hover:bg-teal-700 active:bg-teal-800 transition-all flex items-center justify-center group"
        aria-label="Change font size"
        title="Change font size"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-teal-600 rounded-full text-xs font-bold flex items-center justify-center">
          {fontSize === 'small' ? 'S' : fontSize === 'medium' ? 'M' : fontSize === 'large' ? 'L' : 'XL'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 z-40 bg-white rounded-2xl shadow-2xl border-4 border-teal-200 p-4 min-w-[200px]"
            >
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Font Size</h3>
            <div className="space-y-2">
              {sizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    setFontSize(size.value);
                    setIsOpen(false);
                    localStorage.setItem('fontSize', size.value);
                  }}
                  className={`w-full px-6 py-4 rounded-xl text-xl font-bold transition-all ${
                    fontSize === size.value
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{size.label}</span>
                    <span className={`text-2xl ${fontSize === size.value ? 'text-white' : 'text-gray-500'}`}>
                      {size.icon}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LifestyleAdvicePage() {
  const [mode, setMode] = useState<Mode>('normal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSize') as FontSize;
      return saved || 'small';
    }
    return 'small';
  });

  const multiplier = fontSizeMultipliers[fontSize];

  // Calculate font sizes for main page based on multiplier
  const badgeSize = `${Math.round(20 * multiplier)}px`;
  const h1Size = `${Math.round(48 * multiplier)}px`;
  const pSize = `${Math.round(20 * multiplier)}px`;
  const buttonSize = `${Math.round(24 * multiplier)}px`;
  const h2Size = `${Math.round(36 * multiplier)}px`;
  const modeButtonSize = `${Math.round(24 * multiplier)}px`;
  const infoTextSize = `${Math.round(20 * multiplier)}px`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-4 sm:px-6 pt-12 pb-12 lg:pt-14 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header - Large and Clear */}
          <div className="text-center mb-10">
            <span style={{ fontSize: badgeSize }} className="inline-flex items-center gap-3 rounded-full border-4 border-teal-300 bg-teal-100 px-6 py-3 font-bold tracking-wide text-teal-800 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lifestyle Advice Hub
            </span>
            <h1 style={{ fontSize: h1Size }} className="mt-6 font-bold leading-tight text-gray-900 mb-6">
              Personalized Support for Daily Living
            </h1>
            <p style={{ fontSize: pSize }} className="text-gray-700 leading-relaxed max-w-3xl mx-auto mb-8">
              Explore simple, evidence-informed actions that harmonize with complex
              medication plans. Choose between Normal and Pro modes to access the level
              of detail that works best for you.
            </p>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ fontSize: buttonSize }}
                className="inline-flex items-center gap-3 rounded-2xl bg-teal-600 px-10 py-5 font-bold text-white transition-all duration-200 hover:bg-teal-700 active:bg-teal-800 shadow-xl min-h-[70px]"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Started - Advice Form
              </button>
            </div>
          </div>

          {/* Mode Selector - Large */}
          <div className="mt-12 mb-10">
            <div className="text-center mb-6">
              <h2 style={{ fontSize: h2Size }} className="font-bold text-gray-900 mb-2">Select Your Mode</h2>
              <p style={{ fontSize: pSize }} className="text-gray-600">Choose the level of detail you prefer</p>
            </div>
            <div
              role="tablist"
              aria-label="Advice mode selection"
              className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto"
            >
              <button
                role="tab"
                aria-selected={mode === 'normal'}
                style={{ fontSize: modeButtonSize }}
                className={`rounded-2xl border-4 px-10 py-6 font-bold transition-all duration-200 min-h-[80px] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 ${
                  mode === 'normal'
                    ? "bg-teal-600 text-white border-teal-600 shadow-xl scale-105"
                    : "bg-white text-teal-700 border-teal-300 hover:border-teal-400 hover:bg-teal-50 hover:shadow-lg"
                }`}
                onClick={() => setMode('normal')}
              >
                Normal Mode
              </button>
              <button
                role="tab"
                aria-selected={mode === 'pro'}
                style={{ fontSize: modeButtonSize }}
                className={`rounded-2xl border-4 px-10 py-6 font-bold transition-all duration-200 min-h-[80px] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 ${
                  mode === 'pro'
                    ? "bg-teal-600 text-white border-teal-600 shadow-xl scale-105"
                    : "bg-white text-teal-700 border-teal-300 hover:border-teal-400 hover:bg-teal-50 hover:shadow-lg"
                }`}
                onClick={() => setMode('pro')}
              >
                Pro Mode
              </button>
            </div>
            {mode === 'pro' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-6 bg-blue-50 border-4 border-blue-200 rounded-2xl max-w-3xl mx-auto"
              >
                <p style={{ fontSize: infoTextSize }} className="text-blue-900 text-center leading-relaxed">
                  <strong>Pro Mode:</strong> Advanced, detailed recommendations with precise protocols and evidence-based strategies.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <AdviceTabs mode={mode} fontSizeMultiplier={multiplier} />
      </section>

      {/* Font Size Control */}
      <FontSizeControl fontSize={fontSize} setFontSize={setFontSize} />

      {/* Mode Selection Modal */}
      <ModeSelectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}


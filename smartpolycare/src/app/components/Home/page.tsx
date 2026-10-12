// app/components/Home/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const Home = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const clinicalFeatures = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: "Polypharmacy Risk Scoring",
      description:
        "AI-powered assessment of drug-drug interactions and patient-specific risk factors using clinical algorithms.",
      metrics: "95% clinical accuracy",
      color: "teal",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      title: "Vitamin Deficiency Detection",
      description:
        "Early identification of nutrient deficiencies through symptom analysis and medication profiling.",
      metrics: "10+ vitamin profiles",
      color: "blue",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      ),
      title: "Personalized Nutrition Planning",
      description:
        "Evidence-based dietary recommendations considering drug-nutrient interactions and patient preferences.",
      metrics: "Personalized meal plans",
      color: "emerald",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Lifestyle Advice System",
      description:
        "Comprehensive wellness support with emotional tracking and lifestyle recommendations.",
      metrics: "Holistic care approach",
      color: "purple",
    },
  ];

  const clinicalStats = [
    {
      value: "98%",
      label: "Clinical Accuracy",
      description: "In drug interaction detection",
    },
    {
      value: "50k+",
      label: "Medications",
      description: "In our knowledge base",
    },
    {
      value: "24/7",
      label: "Monitoring",
      description: "Real-time risk assessment",
    },
    {
      value: "10k+",
      label: "Active Users",
      description: "Healthcare providers & patients",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      teal: "bg-teal-50 border-teal-200 text-teal-600",
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
    };
    return colors[color as keyof typeof colors] || colors.teal;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Clinical Grade */}
      <section className="relative bg-gradient-to-b from-slate-50/90 via-teal-50/20 to-white pt-1 sm:pt-2 md:pt-6 lg:pt-10 pb-2 sm:pb-4 lg:pb-6 overflow-hidden border-b border-gray-100/80">
        {/* Subtle background ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left Side: Clinical Title & Actions */}
            <motion.div
              className="space-y-6 sm:space-y-8 flex flex-col justify-center items-center lg:items-start text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4 sm:space-y-5">
                {/* Status Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 shadow-xs"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-teal-700 font-semibold text-xs sm:text-sm tracking-wide">
                    Clinical AI Intelligence Platform
                  </span>
                </motion.div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-gray-900 leading-[1.18] tracking-tight">
                  Smart Polypharmacy &{" "}
                  <span className="block sm:inline bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 bg-clip-text text-transparent">
                    Vitamin Recommendation
                  </span>
                  <span className="block text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 mt-1">
                    for Geriatric Patients
                  </span>
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Advanced AI-driven platform for medication interaction management, adverse drug event
                  prediction, and vitamin deficiency prevention. Trusted by healthcare providers for
                  evidence-based geriatric decision support.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    href="/Pages/vitamin_deficiency/Home"
                    className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800 text-white px-7 py-3.5 sm:py-4 rounded-xl font-semibold shadow-lg shadow-teal-700/20 hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto text-center"
                  >
                    <span>Assess Vitamin Deficiency</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    href="/Pages/MealPlanProviders"
                    className="inline-flex items-center justify-center border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600 text-gray-700 bg-white/80 backdrop-blur-xs px-7 py-3.5 sm:py-4 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base w-full sm:w-auto text-center"
                  >
                    Meal Plan Providers
                  </Link>
                </motion.div>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Evidence-Based Clinical Rules
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Real-Time Interaction Checks
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Geriatric Tailored
                </span>
              </div>
            </motion.div>

            {/* Right Side: Visual Illustration */}
            <motion.div
              className="relative flex items-center justify-center w-full mt-6 lg:mt-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative w-full max-w-[320px] xs:max-w-xs sm:max-w-md lg:max-w-lg mx-auto flex items-center justify-center">
                {/* Main Illustration without any background box */}
                <motion.div
                  className="flex items-center justify-center w-full"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <img
                    src="/images/polycare.png"
                    alt="Clinical illustration"
                    className="w-full h-auto max-h-[300px] sm:max-h-[380px] lg:max-h-[460px] object-contain select-none pointer-events-none"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-12 lg:mt-16 pt-8 border-t border-gray-200/70 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
            {[
              { value: "200K+", label: "Indexed Drug Interactions", sub: "Clinical Knowledge Base" },
              { value: "95%+", label: "Clinical Precision", sub: "Algorithm Accuracy" },
              { value: "28-Day", label: "Nutrient Calibration", sub: "Geriatric Meal Plans" },
              { value: "Real-Time", label: "Deficiency Detection", sub: "Multi-Prescription Safety" },
            ].map((stat, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-teal-700">{stat.value}</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5">{stat.label}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Comprehensive Clinical Solutions
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Integrated AI systems designed specifically for geriatric patient
              care and medication safety.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {clinicalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${activeFeature === index ? "ring-2 ring-teal-500" : ""
                  }`}
                onMouseEnter={() => setActiveFeature(index)}
                whileHover={{ y: -6 }}
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <motion.div
                    className={`p-3.5 sm:p-4 rounded-xl flex-shrink-0 ${getColorClasses(
                      feature.color
                    )}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs sm:text-sm font-semibold text-teal-600">
                        {feature.metrics}
                      </span>
                      <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={`/features/${feature.title
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                        >
                          Learn more →
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Workflow Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Streamlined Clinical Workflow
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-2">
              Designed for seamless integration into healthcare practices
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: 1,
                  title: "Patient Data Input",
                  description: "Secure entry of medications, health history, and clinical parameters",
                  color: "teal",
                },
                {
                  step: 2,
                  title: "AI Analysis",
                  description: "Comprehensive assessment of interactions and deficiency risks",
                  color: "blue",
                },
                {
                  step: 3,
                  title: "Clinical Report",
                  description: "Actionable insights and evidence-based recommendations",
                  color: "emerald",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center p-6 sm:p-8 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                  whileHover={{ y: -6 }}
                >
                  <motion.div
                    className={`w-14 h-14 sm:w-16 sm:h-16 ${item.color === "teal"
                      ? "bg-teal-100 text-teal-600"
                      : item.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-600"
                      } rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm`}
                    whileHover={{ scale: 1.15, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-xl sm:text-2xl font-bold">{item.step}</span>
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

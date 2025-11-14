'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type LifestyleAdvice = {
  nutrition?: {
    summary: string;
    recommendations: Array<{ title: string; detail: string }>;
  };
  movement?: {
    summary: string;
    recommendations: Array<{ title: string; detail: string }>;
  };
  sleep?: {
    summary: string;
    recommendations: Array<{ title: string; detail: string }>;
  };
  stress?: {
    summary: string;
    recommendations: Array<{ title: string; detail: string }>;
  };
  general?: {
    summary: string;
    recommendations: Array<{ title: string; detail: string }>;
  };
};

type AdviceTab = {
  key: string;
  label: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

export default function PatientAdvicePage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [advice, setAdvice] = useState<LifestyleAdvice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('nutrition');

  const api = React.useMemo(
    () => axios.create({ baseURL: 'http://127.0.0.1:5000/api' }),
    []
  );

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      setError('');

      try {
        const endpoint = patientId 
          ? `/patient-advice?patientId=${patientId}`
          : '/patient-advice';
        
        const response = await api.get<LifestyleAdvice>(endpoint);
        setAdvice(response.data);
        
        // Set first available tab as active
        if (response.data) {
          const firstTab = Object.keys(response.data)[0];
          if (firstTab) setActiveTab(firstTab);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || 
          'Failed to fetch personalized advice. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [patientId, api]);

  const tabs: AdviceTab[] = React.useMemo(() => {
    if (!advice) return [];

    const tabMap: { [key: string]: AdviceTab } = {};

    if (advice.nutrition) {
      tabMap.nutrition = {
        key: 'nutrition',
        label: 'Nutrition',
        summary: advice.nutrition.summary,
        recommendations: advice.nutrition.recommendations,
      };
    }

    if (advice.movement) {
      tabMap.movement = {
        key: 'movement',
        label: 'Movement & Exercise',
        summary: advice.movement.summary,
        recommendations: advice.movement.recommendations,
      };
    }

    if (advice.sleep) {
      tabMap.sleep = {
        key: 'sleep',
        label: 'Sleep & Rest',
        summary: advice.sleep.summary,
        recommendations: advice.sleep.recommendations,
      };
    }

    if (advice.stress) {
      tabMap.stress = {
        key: 'stress',
        label: 'Stress Management',
        summary: advice.stress.summary,
        recommendations: advice.stress.recommendations,
      };
    }

    if (advice.general) {
      tabMap.general = {
        key: 'general',
        label: 'General Wellness',
        summary: advice.general.summary,
        recommendations: advice.general.recommendations,
      };
    }

    return Object.values(tabMap);
  }, [advice]);

  const activeTabData = tabs.find((tab) => tab.key === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Generating your personalized advice...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium tracking-wide text-teal-700">
            AI-Generated Lifestyle Advice
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Your Personalized Non-Medical Lifestyle Recommendations
          </h1>
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Based on your lifestyle data, our trained model has generated tailored advice
            to help optimize your daily habits and support your overall wellness.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/Pages/adviceDetails"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
            >
              Update Patient Data
            </Link>
            <Link
              href="/Pages/LifestyleAdvice"
              className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-5 py-3 text-sm font-semibold text-teal-700 transition-colors duration-200 hover:bg-teal-50"
            >
              View General Lifestyle Advice
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-800"
            >
              <p className="font-semibold">Error Loading Advice</p>
              <p className="mt-1 text-sm">{error}</p>
            </motion.div>
          )}

          {advice && tabs.length > 0 && (
            <div className="mt-10">
              {/* Tab Navigation */}
              <div
                role="tablist"
                aria-label="Advice categories"
                className="flex flex-wrap gap-3 mb-8"
              >
                {tabs.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      role="tab"
                      aria-selected={isActive}
                      className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring focus-visible:ring-teal-500 ${
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow'
                          : 'bg-white text-teal-700 border-teal-200 hover:border-teal-400'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Content */}
              {activeTabData && (
                <motion.div
                  key={activeTabData.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-white border border-teal-100 shadow-sm"
                >
                  <div className="border-b border-teal-50 px-6 py-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      {activeTabData.label} Recommendations
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      {activeTabData.summary}
                    </p>
                  </div>

                  <div className="grid gap-5 px-6 py-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeTabData.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-sm font-semibold text-teal-800 mb-2">
                          {rec.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {rec.detail}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 rounded-lg bg-blue-50 border border-blue-200 px-6 py-4"
              >
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These recommendations are non-medical lifestyle advice
                  generated by an AI model based on your provided information. Always consult with
                  healthcare professionals for medical concerns or before making significant
                  lifestyle changes, especially if you have existing health conditions or are taking
                  medications.
                </p>
              </motion.div>
            </div>
          )}

          {advice && tabs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 rounded-2xl bg-white border border-teal-100 shadow-sm p-8 text-center"
            >
              <p className="text-gray-600">
                No advice data available. Please check back later or update your patient information.
              </p>
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}


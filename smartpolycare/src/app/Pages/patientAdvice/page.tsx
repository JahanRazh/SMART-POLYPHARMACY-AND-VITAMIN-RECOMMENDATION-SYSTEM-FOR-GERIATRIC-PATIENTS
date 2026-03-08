'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type DailyRecommendation = {
  day: number;
  recommendation: string;
};

type TwoWeekAdvice = {
  week_1: DailyRecommendation[];
  week_2: DailyRecommendation[];
  summary: string;
  source: string;
  generated_date?: string;
  expires_date?: string;
  inputs?: {
    emotion: string;
    mental_health_level: string;
    polypharmacy_risk: string;
    occupation: string;
  };
};

// ─── Stable axios instance outside component to avoid re-creation ────────────
const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

// ─── formatDate: robust ISO-8601 / any date-string handler ───────────────────
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';

  // Try parsing as-is first
  let date = new Date(dateString);

  // If invalid, attempt common non-standard formats (e.g. "2024-06-01 14:30:00")
  if (isNaN(date.getTime())) {
    // Replace space separator with 'T' to make it ISO-compliant
    date = new Date(dateString.replace(' ', 'T'));
  }

  // Still invalid — return the raw string rather than "Invalid Date"
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    // Use the viewer's local timezone so the display is always meaningful
    timeZoneName: 'short',
  });
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────
function PatientAdviceContent() {
  const searchParams = useSearchParams();
  const patientId  = searchParams.get('patientId');
  const emailParam = searchParams.get('email');

  // Prefer email, fall back to patientId
  const identifier = emailParam || patientId;

  const [advice, setAdvice]         = useState<TwoWeekAdvice | null>(null);
  const [loading, setLoading]       = useState<boolean>(true);
  const [error, setError]           = useState<string>('');
  const [activeWeek, setActiveWeek] = useState<'week_1' | 'week_2'>('week_1');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ── fetchAdvice is stable thanks to useCallback ──────────────────────────
  const saveAdviceToHistory = useCallback(
    async (adviceData: TwoWeekAdvice) => {
      try {
        const payload = {
          email: identifier,
          week_1: adviceData.week_1,
          week_2: adviceData.week_2,
          summary: adviceData.summary,
          generated_date: adviceData.generated_date,
          expires_date: adviceData.expires_date,
          inputs: adviceData.inputs,
        };

        console.log('💾 Auto-saving advice to history...');
        await api.post('/save-advice', payload);
        console.log('✅ Advice auto-saved to history');
      } catch (err: any) {
        console.warn('⚠️ Failed to auto-save advice:', err);
        // Don't break the UI if saving fails
      }
    },
    [identifier]
  );

  const fetchAdvice = useCallback(
    async (forceRegenerate = false) => {
      if (!identifier) {
        setError('No patient identifier provided. Please go back and submit the form.');
        setLoading(false);
        return;
      }

      // Only show full-screen spinner on the initial load, not on refresh
      if (!forceRegenerate) setLoading(true);
      setError('');

      try {
        const paramName = emailParam ? 'email' : 'patientId';
        const endpoint  = `/patient-advice?${paramName}=${encodeURIComponent(identifier)}${
          forceRegenerate ? '&force_regenerate=true' : ''
        }`;

        console.log(`📡 Fetching advice: ${endpoint}`);
        const response = await api.get(endpoint);
        const data = response.data as TwoWeekAdvice;

        console.log('✅ Response:', data);

        if (
          data.week_1 && data.week_2 &&
          Array.isArray(data.week_1) && Array.isArray(data.week_2)
        ) {
          setAdvice(data);
          // Auto-save to history
          await saveAdviceToHistory(data);
        } else {
          console.error('Invalid response structure:', data);
          setError(
            (data as any).debug
              ? `Advice data incomplete: ${JSON.stringify((data as any).debug)}`
              : 'Incomplete advice data received from server.'
          );
        }
      } catch (err: any) {
        console.error('Error fetching advice:', err);
        const debugInfo     = err.response?.data?.debug;
        const errorMessage  =
          err.response?.data?.message ||
          err.response?.data?.error    ||
          'Failed to fetch personalized advice. Please try again later.';

        setError(
          debugInfo
            ? `${errorMessage}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`
            : errorMessage
        );
      } finally {
        setLoading(false);
      }
    },
    // emailParam changes whenever the URL changes, so include it
    [identifier, emailParam, saveAdviceToHistory]
  );

  // Run once on mount (and whenever identifier changes)
  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdvice(true);
    setRefreshing(false);
  };

  const currentWeekData = advice?.[activeWeek] ?? [];

  // ── Full-screen loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
          <p className="mt-4 text-lg text-gray-600">
            Generating your personalized 2-week plan…
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
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
            Personalized Care Plan
          </span>

          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Your 2-Week Personalized Health Plan
          </h1>
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Based on your emotional state, mental health, medication profile, and lifestyle,
            here are your personalized recommendations for the next two weeks.
          </p>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/Pages/adviceDetails"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
            >
              Update Patient Data
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-5 py-3 text-sm font-semibold text-teal-700 transition-colors duration-200 hover:bg-teal-50 disabled:opacity-50"
            >
              {refreshing ? 'Regenerating…' : 'Regenerate Advice'}
            </button>
            {advice && identifier && !identifier.includes('null') && (
              <Link
                href={`/Pages/adviceHistory?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:bg-blue-50"
              >
                📋 View History
              </Link>
            )}
          </div>

          {/* Error panel */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg bg-red-50 border-2 border-red-300 px-6 py-5 text-red-900"
            >
              <p className="font-bold text-lg">❌ Error Loading Advice</p>
              <pre className="mt-2 text-sm font-mono bg-red-100 rounded p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {error}
              </pre>
              <div className="mt-4 text-sm">
                <p className="font-semibold">Troubleshooting:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Make sure the Flask server is running at{' '}
                    <code className="bg-red-100 px-1">http://127.0.0.1:5000</code>
                  </li>
                  <li>Check that Google API key is set in the{' '}
                    <code className="bg-red-100 px-1">.env</code> file
                  </li>
                  <li>Verify the API key is active and has sufficient quota</li>
                  <li>Ensure you have completed your patient assessment first</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Advice content */}
          {advice && (
            <div className="mt-10">
              {/* Summary card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-white border border-teal-100 shadow-sm p-6 mb-8"
              >
                <h2 className="text-lg font-bold text-gray-900">Plan Overview</h2>
                <p className="mt-3 text-gray-700 leading-relaxed">{advice.summary}</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient profile */}
                  <div className="rounded-lg bg-teal-50 p-4">
                    <h3 className="text-sm font-semibold text-teal-900">Your Profile</h3>
                    <ul className="mt-2 space-y-1 text-sm text-teal-800">
                      {advice.inputs?.emotion            && <li>• Emotion: {advice.inputs.emotion}</li>}
                      {advice.inputs?.mental_health_level && <li>• Mental Health: {advice.inputs.mental_health_level}</li>}
                      {advice.inputs?.polypharmacy_risk   && <li>• Medication Risk: {advice.inputs.polypharmacy_risk}</li>}
                      {advice.inputs?.occupation          && <li>• Occupation: {advice.inputs.occupation}</li>}
                    </ul>
                  </div>

                  {/* Plan timeline — uses fixed formatDate */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900">Plan Timeline</h3>
                    <ul className="mt-2 space-y-1 text-sm text-blue-800">
                      <li>• Generated: {formatDate(advice.generated_date)}</li>
                      <li>• Expires:&nbsp;&nbsp; {formatDate(advice.expires_date)}</li>
                      <li>• Duration: 14 days</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Week tabs */}
              <div className="flex gap-3 mb-8 flex-wrap">
                {(['week_1', 'week_2'] as const).map((week, i) => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`rounded-full px-6 py-3 font-semibold transition-all duration-200 ${
                      activeWeek === week
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-teal-700 border-2 border-teal-200 hover:border-teal-400'
                    }`}
                  >
                    {i === 0 ? 'Week 1 (Days 1–7)' : 'Week 2 (Days 8–14)'}
                  </button>
                ))}
                
                {/* Premium 1-Month Button */}
                <Link
                  href={`/Pages/premium?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier)}`}
                  className="relative rounded-full px-6 py-3 font-semibold transition-all duration-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 hover:shadow-lg hover:shadow-amber-300 group"
                >
                  <span className="relative flex items-center gap-2">
                    👑 1 Month (Premium)
                  </span>
                </Link>
              </div>

              {/* Daily recommendations */}
              <motion.div
                key={activeWeek}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                {currentWeekData.length > 0 ? (
                  currentWeekData.map((dailyRec, index) => (
                    <motion.div
                      key={dailyRec.day}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.07 }}
                      className="rounded-xl bg-white border border-teal-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-teal-600 text-white font-bold text-sm">
                          D{dailyRec.day}
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Day {dailyRec.day}
                          </h3>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                            {dailyRec.recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No recommendations available for this week.</p>
                  </div>
                )}
              </motion.div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 rounded-lg bg-blue-50 border border-blue-200 px-6 py-4"
              >
                <p className="text-sm text-blue-800">
                  <strong>Important Disclaimer:</strong> These personalized recommendations are
                  non-medical lifestyle advice generated by doctor recommendations based on your
                  provided information. Always consult with your healthcare provider before making
                  significant lifestyle changes, especially given your medication profile. If you
                  experience any adverse effects, discontinue the recommended activity and consult
                  your healthcare team immediately.
                </p>
              </motion.div>
            </div>
          )}

          {/* No advice yet */}
          {!loading && !advice && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 rounded-2xl bg-white border border-teal-100 shadow-sm p-8 text-center"
            >
              <p className="text-gray-600 mb-4">No personalized advice available yet.</p>
              <button
                onClick={() => fetchAdvice()}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
              >
                Generate Advice
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

// ─── Public export: wraps inner component in required Suspense boundary ───────
export default function PatientAdvicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white flex items-center justify-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
        </div>
      }
    >
      <PatientAdviceContent />
    </Suspense>
  );
}
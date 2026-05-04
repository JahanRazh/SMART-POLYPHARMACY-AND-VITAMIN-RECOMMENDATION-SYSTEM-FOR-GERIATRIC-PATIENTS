'use client';

// ============================================================================
// PatientAdvice Page
// The central dashboard for a patient's generated health advice.
// It aggregates data from multiple sources:
// 1. The 2-week AI-generated lifestyle plan (Flask /patient-advice endpoint)
// 2. Vitamin deficiency predictions & mapped lab tests (Flask /vitamin-deficiency endpoint)
// 3. Polypharmacy risk analysis & safety advice
// 4. Psychometric score history (MentalHealthGraph)
// It then auto-saves this complete snapshot to the advice history and pushes notifications.
// ============================================================================

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/components/Contexts/AuthContext';
import { useNotifications } from '@/app/components/Contexts/NotificationContext';
import { generatePatientReport } from '@/app/utils/generateReport';

// Dynamic import avoids SSR issues with Recharts canvas
const MentalHealthGraph = dynamic(
  () => import('@/app/components/MentalHealthGraph'),
  {
    ssr: false, loading: () => (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-8 flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
);

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
  };
  // Snapshot fields saved to history
  polypharmacy_advices?: { icon: string; title: string; detail: string }[];
  lab_tests?: { vitamin: string; name: string; test: string }[];
  vitamin_deficiencies?: string[];
};

const VITAMIN_LAB_TESTS: Record<string, { test: string, description: string, why?: string }> = {
  "D": { test: "25-Hydroxy Vitamin D (25(OH)D)", description: "Bone pain, weakness, fatigue", why: "Best indicator of overall Vitamin D status" },
  "B12": { test: "Serum Vitamin B12", description: "Nerve problems, anemia, memory issues", why: "More accurate (if borderline): Methylmalonic Acid (MMA), Homocysteine" },
  "Folate": { test: "Serum Folate (or RBC Folate for long-term status)", description: "Anemia, fatigue" },
  "B1": { test: "Whole blood Thiamine or Thiamine Pyrophosphate", description: "Nerve and heart issues (common in alcohol use)" },
  "B6": { test: "Plasma Pyridoxal-5-Phosphate (PLP)", description: "Skin issues, anemia, confusion" },
  "B7": { test: "Serum Biotin (rare)", description: "Hair loss, dermatitis" },
  "A": { test: "Serum Retinol", description: "Night blindness, dry eyes" },
  "E": { test: "Serum Alpha-Tocopherol", description: "Nerve and muscle damage (rare)" },
  "K": { test: "Prothrombin Time (PT/INR) (indirect test)", description: "Bleeding problems" },
  "C": { test: "Plasma/Serum Ascorbic Acid", description: "Measures level of ascorbic acid in blood" }
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
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Prefer email, fall back to patientId
  const identifier = emailParam || patientId;

  const [advice, setAdvice] = useState<TwoWeekAdvice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [vitaminAssessment, setVitaminAssessment] = useState<any>(null);
  const [psychometricScores, setPsychometricScores] = useState<{ gds15: number; gad7: number; mmas8: number; iadl: number } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Prevention for duplicate concurrent fetches
  const isFetchingRef = React.useRef(false);
  const hasNotifiedRef = React.useRef(false);
  const [activeWeek, setActiveWeek] = useState<'week_1' | 'week_2'>('week_1');

  // ── fetchAdvice is stable thanks to useCallback ──────────────────────────
  
  // ==========================================================================
  // Auto-Save Function
  // Compiles the 2-week plan, polypharmacy safety advice, and recommended
  // lab tests into a single snapshot payload and posts it to the history DB.
  // ==========================================================================
  const saveAdviceToHistory = useCallback(
    async (adviceData: TwoWeekAdvice, vitaminData?: any) => {
      try {
        // Build polypharmacy advices snapshot based on risk level
        const risk = (adviceData.inputs?.polypharmacy_risk || '').toLowerCase();
        const isVeryHigh = risk.includes('very high');
        const isHigh = !isVeryHigh && risk.includes('high');
        const highAdvices = [
          { icon: '🔄', title: 'Review medications regularly', detail: 'Schedule a doctor/pharmacist review to check necessity, duplication, and interactions.' },
          { icon: '🚫', title: 'Avoid self-medication', detail: 'Do not take over-the-counter drugs, herbal products, or supplements without approval.' },
          { icon: '🩺', title: 'Monitor your health routinely', detail: 'Check liver, kidney, blood pressure, and blood sugar every 3–6 months.' },
          { icon: '⚠️', title: 'Watch for side effects early', detail: 'Report symptoms like dizziness, fatigue, nausea, or confusion immediately.' },
          { icon: '🥗', title: 'Maintain a healthy lifestyle', detail: 'Stay hydrated, limit salt and alcohol, and follow a balanced diet to protect organs.' },
        ];
        const veryHighAdvices = [
          { icon: '🚨', title: 'Urgent comprehensive medication review', detail: 'Immediate evaluation by a doctor to reduce unnecessary drugs (deprescribing).' },
          { icon: '⛔', title: 'Strictly avoid all non-prescribed substances', detail: 'No OTC drugs, supplements, or herbal remedies unless medically approved.' },
          { icon: '🔬', title: 'Close and frequent monitoring', detail: 'Perform lab tests (liver, kidney, electrolytes) and clinical follow-ups regularly.' },
          { icon: '💊', title: 'Simplify medication regimen', detail: 'Use the lowest effective doses and reduce complexity to prevent errors.' },
          { icon: '🆘', title: 'Be alert for serious warning signs', detail: 'Seek medical help if experiencing confusion, severe weakness, reduced urine, or yellowing of eyes/skin.' },
        ];
        const polypharmacyAdvices = isVeryHigh ? veryHighAdvices : isHigh ? highAdvices : [];

        // Build lab tests snapshot from vitamin predictions
        const labTests = (vitaminData?.predictions || []).map((pred: any) => {
          const info = VITAMIN_LAB_TESTS[pred.vitamin];
          return info ? { vitamin: pred.vitamin, name: pred.name || `Vitamin ${pred.vitamin}`, test: info.test } : null;
        }).filter(Boolean);

        const vitaminDeficiencies = (vitaminData?.predictions || []).map((p: any) => p.name || p.vitamin);

        const payload = {
          email: identifier,
          week_1: adviceData.week_1,
          week_2: adviceData.week_2,
          summary: adviceData.summary,
          generated_date: adviceData.generated_date,
          expires_date: adviceData.expires_date,
          inputs: adviceData.inputs,
          polypharmacy_advices: polypharmacyAdvices,
          lab_tests: labTests,
          vitamin_deficiencies: vitaminDeficiencies,
        };

        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        console.log('💾 Auto-saving advice to history...');
        await api.post('/save-advice', payload);
        console.log('✅ Advice auto-saved to history');
      } catch (err: any) {
        console.warn('⚠️ Failed to auto-save advice:', err);
        // Don't break the UI if saving fails
      } finally {
        isFetchingRef.current = false;
      }
    },
    [identifier]
  );

  // ==========================================================================
  // Main Data Fetcher
  // 1. Fetches the AI 2-week plan
  // 2. Fetches the vitamin assessment (by UID)
  // 3. Fetches the psychometric scores for the PDF report
  // 4. Calls saveAdviceToHistory to snapshot everything together
  // 5. Triggers UI Notifications (Bell icon)
  // ==========================================================================
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
        const endpoint = `/patient-advice?${paramName}=${encodeURIComponent(identifier)}${forceRegenerate ? '&force_regenerate=true' : ''
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

          // Fetch vitamin assessment first, then save everything to history together
          let vitaminData: any = null;
          const uid = user?.uid;
          if (uid) {
            try {
              const vitEndpoint = `/vitamin-deficiency/assessment?userId=${encodeURIComponent(uid)}`;
              console.log(`📡 Fetching vitamin assessment by UID: ${vitEndpoint}`);
              const vitResponse = await api.get(vitEndpoint);
              if (vitResponse.data && vitResponse.data.predictions) {
                vitaminData = vitResponse.data;
                setVitaminAssessment(vitResponse.data);
                console.log('✅ Vitamin assessment loaded:', vitResponse.data.predictions.length, 'deficiencies');
              }
            } catch (vitErr) {
              console.warn("No vitamin deficiency assessment found or error:", vitErr);
            }
          } else {
            console.warn("⚠️ No Firebase UID available — skipping vitamin assessment fetch");
          }

          // Fetch psychometric scores for PDF report
          try {
            const psyRes = await fetch(`/api/assessment_history?email=${encodeURIComponent(identifier)}`);
            if (psyRes.ok) {
              const psyData = await psyRes.json();
              const assessments = psyData.assessments || [];
              if (assessments.length > 0) {
                const latest = assessments[assessments.length - 1];
                setPsychometricScores({
                  gds15: latest.gds15_score ?? 0,
                  gad7: latest.gad7_score ?? 0,
                  mmas8: latest.mmas8_score ?? 0,
                  iadl: latest.iadl_score ?? 0,
                });
              }
            }
          } catch { /* non-critical */ }

          // Auto-save full snapshot (advice + polypharmacy + lab tests + vitamins) to history via Flask backend
          await saveAdviceToHistory(data, vitaminData);

          // ── Push notifications to the bell (only once per page load) ──
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;

            addNotification({
              title: 'Health Report Ready',
              message: 'Your personalized 2-week advice, risk analysis, and lab test recommendations have been generated.',
              type: 'success',
            });

            // Vitamin deficiency alert
            const defCount = vitaminData?.predictions?.length || 0;
            if (defCount > 0) {
              const names = vitaminData.predictions.map((p: any) => p.name || `Vitamin ${p.vitamin}`).join(', ');
              addNotification({
                title: `${defCount} Vitamin Deficienc${defCount > 1 ? 'ies' : 'y'} Detected`,
                message: `Recommended lab tests for: ${names}. Check your report for details.`,
                type: 'info',
              });
            }
          }

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
        const debugInfo = err.response?.data?.debug;
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
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
    // emailParam and user change whenever the URL / auth state changes, so include them
    [identifier, emailParam, saveAdviceToHistory, user]
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

  const handleDownloadReport = async () => {
    if (!advice) return;
    setDownloadingPdf(true);
    try {
      generatePatientReport(advice, vitaminAssessment, psychometricScores, identifier || undefined);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloadingPdf(false);
    }
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
            Preparing your personalized advice report…
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Advice, risk analysis, lab tests & more
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
            Your Personalized Advices
          </h1>

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
            {advice && (
              <button
                onClick={handleDownloadReport}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
                ) : (
                  <><span>📥</span> Download Report</>
                )}
              </button>
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


              {/* ── Patient Profile Overview Cage ── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 text-xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Your Profile Overview</h2>
                    <p className="text-sm text-gray-600">A snapshot of your current health inputs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Emotion Card */}
                  <div className="rounded-xl bg-white border border-indigo-50 p-4 flex gap-3 shadow-sm items-center">
                    <span className="text-3xl">🎭</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-0.5">Emotion</p>
                      <p className="text-sm font-bold text-gray-900">{advice.inputs?.emotion || 'Not detected'}</p>
                    </div>
                  </div>

                  {/* Mental Health Card */}
                  <div className="rounded-xl bg-white border border-indigo-50 p-4 flex gap-3 shadow-sm items-center">
                    <span className="text-3xl">🧠</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-0.5">Mental Health</p>
                      <p className="text-sm font-bold text-gray-900">{advice.inputs?.mental_health_level || 'Not assessed'}</p>
                    </div>
                  </div>

                  {/* Medication Risk Card */}
                  <div className={`rounded-xl bg-white border p-4 flex gap-3 shadow-sm items-center ${(advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('very high') ? 'border-red-200' :
                      (advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('high') ? 'border-orange-200' :
                        'border-indigo-50'
                    }`}>
                    <span className="text-3xl">💊</span>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${(advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('very high') ? 'text-red-500' :
                          (advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('high') ? 'text-orange-500' :
                            'text-indigo-500'
                        }`}>Medication Risk</p>
                      <p className={`text-sm font-bold ${(advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('very high') ? 'text-red-700' :
                          (advice.inputs?.polypharmacy_risk || '').toLowerCase().includes('high') ? 'text-orange-700' :
                            'text-gray-900'
                        }`}>{advice.inputs?.polypharmacy_risk || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Mental Health & Functional Assessment Line Graph ── */}
              <MentalHealthGraph email={emailParam || identifier} />

              {/* Recommended Lab Tests Cage (Vitamin Deficiencies) */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-2xl bg-blue-50 border border-blue-200 shadow-sm p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 text-xl">
                    🧪
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Recommended Lab Tests</h2>
                    <p className="text-sm text-gray-600">Based on your analyzed vitamin deficiencies</p>
                  </div>
                </div>

                {!vitaminAssessment || !vitaminAssessment.predictions || vitaminAssessment.predictions.length === 0 ? (
                  <div className="text-center p-6 bg-white rounded-xl border border-blue-100">
                    <p className="text-gray-600 font-medium">No specific vitamin deficiencies detected requiring lab testing.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vitaminAssessment.predictions.map((pred: any, idx: number) => {
                      const labTestInfo = VITAMIN_LAB_TESTS[pred.vitamin];
                      if (!labTestInfo) return null;
                      return (
                        <div key={idx} className="rounded-xl border border-blue-100 bg-white p-4 flex flex-col gap-2 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{pred.icon || "💊"}</span>
                            <h3 className="font-bold text-blue-900">{pred.name || `Vitamin ${pred.vitamin}`} Deficiency</h3>
                          </div>

                          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Recommended Test</p>
                            <p className="text-sm font-medium text-gray-900">{labTestInfo.test}</p>
                            {labTestInfo.why && <p className="text-xs text-gray-600 mt-1 italic">Why: {labTestInfo.why}</p>}
                          </div>

                          <div className="mt-1">
                            <p className="text-xs text-blue-800"><strong>Linked to:</strong> {labTestInfo.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-500 italic">
                  * Please present these recommendations to your physician before undergoing any laboratory tests.
                </p>
              </motion.div>

              {/* ── Polypharmacy Risk Advice Cage ── */}
              {(() => {
                const risk = (advice.inputs?.polypharmacy_risk || '').toLowerCase();
                const isHigh = risk.includes('very high') ? false : risk.includes('high');
                const isVeryHigh = risk.includes('very high');

                if (!isHigh && !isVeryHigh) return null;

                const highAdvices = [
                  { icon: '🔄', title: 'Review medications regularly', detail: 'Schedule a doctor/pharmacist review to check necessity, duplication, and interactions.' },
                  { icon: '🚫', title: 'Avoid self-medication', detail: 'Do not take over-the-counter drugs, herbal products, or supplements without approval.' },
                  { icon: '🩺', title: 'Monitor your health routinely', detail: 'Check liver, kidney, blood pressure, and blood sugar every 3–6 months.' },
                  { icon: '⚠️', title: 'Watch for side effects early', detail: 'Report symptoms like dizziness, fatigue, nausea, or confusion immediately.' },
                  { icon: '🥗', title: 'Maintain a healthy lifestyle', detail: 'Stay hydrated, limit salt and alcohol, and follow a balanced diet to protect organs.' },
                ];

                const veryHighAdvices = [
                  { icon: '🚨', title: 'Urgent comprehensive medication review', detail: 'Immediate evaluation by a doctor to reduce unnecessary drugs (deprescribing).' },
                  { icon: '⛔', title: 'Strictly avoid all non-prescribed substances', detail: 'No OTC drugs, supplements, or herbal remedies unless medically approved.' },
                  { icon: '🔬', title: 'Close and frequent monitoring', detail: 'Perform lab tests (liver, kidney, electrolytes) and clinical follow-ups regularly.' },
                  { icon: '💊', title: 'Simplify medication regimen', detail: 'Use the lowest effective doses and reduce complexity to prevent errors.' },
                  { icon: '🆘', title: 'Be alert for serious warning signs', detail: 'Seek medical help if experiencing confusion, severe weakness, reduced urine, or yellowing of eyes/skin.' },
                ];

                const advices = isVeryHigh ? veryHighAdvices : highAdvices;
                const badgeBg = isVeryHigh ? 'bg-red-100' : 'bg-orange-100';
                const badgeText = isVeryHigh ? 'text-red-700' : 'text-orange-700';
                const borderCol = isVeryHigh ? 'border-red-200' : 'border-orange-200';
                const cageBg = isVeryHigh ? 'bg-red-50' : 'bg-orange-50';
                const iconBg = isVeryHigh ? 'bg-red-100' : 'bg-orange-100';
                const iconText = isVeryHigh ? 'text-red-600' : 'text-orange-600';
                const cardBorder = isVeryHigh ? 'border-red-100' : 'border-orange-100';
                const titleText = isVeryHigh ? 'text-red-900' : 'text-orange-900';
                const detailText = isVeryHigh ? 'text-red-700' : 'text-orange-700';
                const label = isVeryHigh ? 'Very High' : 'High';
                const emoji = isVeryHigh ? '⛔' : '⚠️';

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className={`rounded-2xl ${cageBg} border ${borderCol} shadow-sm p-6 mb-8`}
                  >
                    {/* Cage header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`flex items-center justify-center h-10 w-10 rounded-full ${iconBg} ${iconText} text-xl`}>
                        {emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-gray-900">Polypharmacy Safety Advice</h2>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                            {label} Risk
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {isVeryHigh
                            ? 'Your medication risk is very high — please follow these urgent guidelines carefully.'
                            : 'Your medication risk is elevated — follow these guidelines to stay safe.'}
                        </p>
                      </div>
                    </div>

                    {/* Advice cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {advices.map((adv, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl bg-white border ${cardBorder} p-4 flex gap-3 shadow-sm`}
                        >
                          <span className="text-2xl shrink-0 mt-0.5">{adv.icon}</span>
                          <div>
                            <p className={`text-sm font-bold ${titleText} mb-1`}>{adv.title}</p>
                            <p className={`text-xs leading-relaxed ${detailText}`}>{adv.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-500 italic">
                      * These recommendations are based on your assessed polypharmacy risk level.
                      Always follow your prescribing physician's guidance.
                    </p>
                  </motion.div>
                );
              })()}

              <div className="pt-8 border-t border-gray-200 mt-10">
                <h2 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                  Your 2-Week Personalized Health Plan
                </h2>
                <p className="mt-4 mb-8 text-gray-600 md:text-lg leading-relaxed">
                  Based on your emotional state, mental health, medication profile, and lifestyle,
                  here are your personalized recommendations for the next two weeks.
                </p>

                {/* Summary card */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl bg-white border border-teal-100 shadow-sm p-6 mb-8"
                >
                  <h3 className="text-lg font-bold text-gray-900">Plan Overview</h3>
                  <p className="mt-3 text-gray-700 leading-relaxed">{advice.summary}</p>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plan timeline — uses fixed formatDate */}
                    <div className="rounded-lg bg-blue-50 p-4 md:col-span-2">
                      <h4 className="text-sm font-semibold text-blue-900">Plan Timeline</h4>
                      <ul className="mt-2 space-y-1 text-sm text-blue-800">
                        <li>• Generated: {formatDate(advice.generated_date)}</li>
                        <li>• Expires:&nbsp;&nbsp; {formatDate(advice.expires_date)}</li>
                        <li>• Duration: 14 days</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Week tabs */}
              <div className="flex gap-3 mb-8 flex-wrap">
                {(['week_1', 'week_2'] as const).map((week, i) => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`rounded-full px-6 py-3 font-semibold transition-all duration-200 ${activeWeek === week
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
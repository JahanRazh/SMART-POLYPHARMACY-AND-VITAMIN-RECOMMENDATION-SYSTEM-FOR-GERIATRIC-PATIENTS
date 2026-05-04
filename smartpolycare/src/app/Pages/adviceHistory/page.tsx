'use client';

// ============================================================================
// AdviceHistory Page
// Displays a chronological archive of all personalized health plans generated 
// for the user. It fetches from the 'lifestyle_results/history' collection
// via the Flask backend, rendering the most recent advice in a highlighted 
// banner and previous advice as a grid of cards.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import MentalHealthGraph, { AssessmentEntry, overallStatus } from '@/app/components/MentalHealthGraph';

type SavedAdvice = {
  // Comprehensive type definition matching the data structure saved to Firestore
  id: string;
  email: string;
  week_1: Array<{ day: number; recommendation: string }>;
  week_2: Array<{ day: number; recommendation: string }>;
  summary: string;
  generated_date: string;
  expires_date: string;
  inputs: {
    emotion: string;
    mental_health_level: string;
    polypharmacy_risk: string;
  };
  saved_at: string;
  polypharmacy_advices?: { icon: string; title: string; detail: string }[];
  lab_tests?: { vitamin: string; name: string; test: string }[];
  vitamin_deficiencies?: string[];
};

const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return dateString; }
}

function riskColor(risk: string) {
  const r = risk.toLowerCase();
  if (r.includes('very high')) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  if (r.includes('high')) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
  if (r.includes('moderate')) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
  return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
}

/* ── Most Recent Summary Banner ──────────────────────────────────────── */
// Component specifically designed to highlight the very latest generated advice,
// displaying high-level information (Emotion, Risk, Deficiencies) prominently.
function MostRecentSummary({ advice }: { advice: SavedAdvice }) {
  const rc = riskColor(advice.inputs?.polypharmacy_risk || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 rounded-2xl border border-teal-200 bg-white shadow-md overflow-hidden"
    >
      {/* Banner header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
        <span className="text-2xl">📋</span>
        <div>
          <h2 className="text-lg font-bold text-white">Most Recent Advice Summary</h2>
          <p className="text-xs text-teal-100">Generated: {formatDate(advice.generated_date)}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile chips */}
        <div className="flex flex-wrap gap-2">
          {advice.inputs?.emotion && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              🎭 {advice.inputs.emotion}
            </span>
          )}
          {advice.inputs?.mental_health_level && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              🧠 {advice.inputs.mental_health_level}
            </span>
          )}
          {advice.inputs?.polypharmacy_risk && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${rc.bg} ${rc.text}`}>
              💊 {advice.inputs.polypharmacy_risk} Polypharmacy Risk
            </span>
          )}
        </div>

        {/* Plan summary text */}
        <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Plan Overview</p>
          <p className="text-sm text-gray-700 leading-relaxed">{advice.summary}</p>
        </div>

        {/* Vitamin deficiencies */}
        {advice.vitamin_deficiencies && advice.vitamin_deficiencies.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🧪 Detected Vitamin Deficiencies</p>
            <div className="flex flex-wrap gap-2">
              {advice.vitamin_deficiencies.map((v, i) => (
                <span key={i} className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Lab tests */}
        {advice.lab_tests && advice.lab_tests.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🔬 Recommended Lab Tests</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {advice.lab_tests.map((lt, i) => (
                <div key={i} className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2">
                  <p className="text-xs font-bold text-blue-800">{lt.name}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">{lt.test}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polypharmacy safety advices */}
        {advice.polypharmacy_advices && advice.polypharmacy_advices.length > 0 && (
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${rc.text}`}>
              ⚠️ Polypharmacy Safety Advice ({advice.inputs?.polypharmacy_risk} Risk)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {advice.polypharmacy_advices.map((adv, i) => (
                <div key={i} className={`rounded-lg border ${rc.border} ${rc.bg} bg-opacity-30 px-4 py-2 flex gap-2`}>
                  <span className="shrink-0">{adv.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${rc.text}`}>{adv.title}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{adv.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expires note */}
        <p className="text-xs text-gray-400 italic">Plan expires: {formatDate(advice.expires_date)}</p>
      </div>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */
function AdviceHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  const emailParam = searchParams.get('email');
  const identifier = emailParam || patientId;

  const [adviceHistory, setAdviceHistory] = useState<SavedAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdvice, setSelectedAdvice] = useState<SavedAdvice | null>(null);

  const isFetchingRef = React.useRef(false);

  // ==========================================================================
  // Effect: Fetch Full Advice History
  // Calls the backend to retrieve the array of all past advices for the user.
  // The array is returned sorted descending by timestamp by the server.
  // ==========================================================================
  useEffect(() => {
    const fetchHistory = async () => {
      if (!identifier || identifier === 'null' || identifier === 'undefined' || isFetchingRef.current) {
        if (!identifier || identifier === 'null' || identifier === 'undefined') {
          setError('No valid patient identifier. Please complete the assessment form first.');
          setLoading(false);
        }
        return;
      }
      isFetchingRef.current = true;
      try {
        const paramName = emailParam ? 'email' : 'patientId';
        const response = await api.get(`/patient-advice-history?${paramName}=${encodeURIComponent(identifier)}`);
        const data = response.data as { advice_history: SavedAdvice[] };
        setAdviceHistory(data.advice_history || []);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setAdviceHistory([]);
        } else {
          setError(err.response?.data?.message || 'Failed to fetch advice history.');
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };
    fetchHistory();
  }, [identifier, emailParam]);

  const handleDelete = async (adviceId: string) => {
    if (!confirm('Are you sure you want to delete this advice?')) return;
    try {
      await api.delete(`/patient-advice-history/${adviceId}?email=${encodeURIComponent(identifier)}`);
      setAdviceHistory(h => h.filter(a => a.id !== adviceId));
      setSelectedAdvice(null);
    } catch { alert('Failed to delete advice.'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
          <p className="mt-4 text-lg text-gray-600">Loading advice history…</p>
        </div>
      </div>
    );
  }

  // Most recent = index 0 (already sorted desc by saved_at in server)
  const mostRecent = adviceHistory.length > 0 ? adviceHistory[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="max-w-5xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium tracking-wide text-teal-700">
            Saved Advice Archives
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Your Advice History
          </h1>
          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            View all previously generated personalized health plans.
          </p>

          {/* Navigation */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/Pages/patientAdvice?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier || '')}`}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700">
              ← Back to Current Advice
            </Link>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-red-700">
              <p className="font-semibold text-lg">⚠️ Unable to Load History</p>
              <p className="mt-2 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Empty */}
          {adviceHistory.length === 0 && !error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-8 text-center">
              <p className="text-gray-600">No saved advice yet.</p>
              <Link href={`/Pages/patientAdvice?${emailParam ? 'email' : 'patientId'}=${encodeURIComponent(identifier || '')}`}
                className="mt-4 inline-block rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                Generate Your First Advice
              </Link>
            </motion.div>
          )}

          {/* Mental Health Graph for historical context */}
          {!error && identifier && (
            <div className="mt-8">
              <MentalHealthGraph email={identifier} />
            </div>
          )}

          {/* ── Most Recent Summary ── */}
          {mostRecent && <MostRecentSummary advice={mostRecent} />}

          {/* ── Older Advice History Records ── */}
          {adviceHistory.length > 1 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Previous Advice Records</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {adviceHistory.slice(1).map((advice, idx) => {
                  const rc = riskColor(advice.inputs?.polypharmacy_risk || '');
                  return (
                    <motion.div
                      key={advice.id || idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="group relative rounded-3xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 p-6">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${rc.bg} ${rc.text} border ${rc.border}`}>
                          {advice.inputs?.polypharmacy_risk} Risk
                        </span>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Generated On</p>
                        <h3 className="text-lg font-bold text-gray-900">{formatDate(advice.generated_date)}</h3>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {advice.inputs?.emotion && (
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            🎭 {advice.inputs.emotion}
                          </span>
                        )}
                        {advice.inputs?.mental_health_level && (
                          <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            🧠 {advice.inputs.mental_health_level}
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50/50 rounded-2xl p-4 mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                          "{advice.summary}"
                        </p>
                      </div>

                      {/* Highlights: Vitamins & Lab Tests */}
                      <div className="space-y-4 mb-8">
                        {advice.vitamin_deficiencies && advice.vitamin_deficiencies.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">🧪 Deficiencies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {advice.vitamin_deficiencies.map((v, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-100">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {advice.lab_tests && advice.lab_tests.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">🔬 Recommended Tests</p>
                            <div className="grid grid-cols-1 gap-2">
                              {advice.lab_tests.slice(0, 2).map((lt, i) => (
                                <div key={i} className="flex items-center gap-2 bg-cyan-50/50 border border-cyan-100 rounded-lg px-3 py-1.5">
                                  <span className="text-xs">🧬</span>
                                  <span className="text-[10px] font-bold text-cyan-800 truncate">{lt.name}: {lt.test}</span>
                                </div>
                              ))}
                              {advice.lab_tests.length > 2 && (
                                <p className="text-[10px] text-cyan-600 font-medium ml-1">+ {advice.lab_tests.length - 2} more tests</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedAdvice(advice)}
                          className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-700 transition-colors"
                        >
                          View Full Plan
                        </button>
                        <button
                          onClick={() => handleDelete(advice.id)}
                          className="px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm"
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Detail Modal ── */}
          {selectedAdvice && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedAdvice(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Advice Details</h2>
                  <button onClick={() => setSelectedAdvice(null)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-5">
                  {/* Timeline */}
                  <div className="rounded-xl bg-blue-50 p-4">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Timeline</h3>
                    <p className="text-sm text-blue-700">• Generated: {formatDate(selectedAdvice.generated_date)}</p>
                    <p className="text-sm text-blue-700">• Expires: {formatDate(selectedAdvice.expires_date)}</p>
                  </div>

                  {/* Profile */}
                  <div className="rounded-xl bg-teal-50 p-4">
                    <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wide mb-2">Profile</h3>
                    {selectedAdvice.inputs?.emotion && <p className="text-sm text-teal-700">• Emotion: {selectedAdvice.inputs.emotion}</p>}
                    {selectedAdvice.inputs?.mental_health_level && <p className="text-sm text-teal-700">• Mental Health: {selectedAdvice.inputs.mental_health_level}</p>}
                    {selectedAdvice.inputs?.polypharmacy_risk && <p className="text-sm text-teal-700">• Medication Risk: {selectedAdvice.inputs.polypharmacy_risk}</p>}
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Plan Summary</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedAdvice.summary}</p>
                  </div>

                  {/* Vitamin deficiencies */}
                  {selectedAdvice.vitamin_deficiencies && selectedAdvice.vitamin_deficiencies.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">🧪 Vitamin Deficiencies</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAdvice.vitamin_deficiencies.map((v, i) => (
                          <span key={i} className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab tests */}
                  {selectedAdvice.lab_tests && selectedAdvice.lab_tests.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">🔬 Recommended Lab Tests</h3>
                      <div className="space-y-1.5">
                        {selectedAdvice.lab_tests.map((lt, i) => (
                          <div key={i} className="rounded-lg bg-blue-50 px-3 py-2">
                            <p className="text-xs font-bold text-blue-800">{lt.name}</p>
                            <p className="text-[11px] text-blue-600">{lt.test}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polypharmacy advices */}
                  {selectedAdvice.polypharmacy_advices && selectedAdvice.polypharmacy_advices.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">⚠️ Polypharmacy Safety Advice</h3>
                      <div className="space-y-1.5">
                        {selectedAdvice.polypharmacy_advices.map((adv, i) => (
                          <div key={i} className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 flex gap-2">
                            <span className="shrink-0 text-sm">{adv.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-orange-800">{adv.title}</p>
                              <p className="text-[11px] text-orange-700">{adv.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Week 1 & 2 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                      <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">Week 1</h3>
                      <ul className="space-y-2 text-xs text-purple-700">
                        {selectedAdvice.week_1?.map(r => (
                          <li key={r.day} className="border-l-2 border-purple-300 pl-2">
                            <strong>Day {r.day}:</strong> {r.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-green-50 to-teal-50 p-4">
                      <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Week 2</h3>
                      <ul className="space-y-2 text-xs text-green-700">
                        {selectedAdvice.week_2?.map(r => (
                          <li key={r.day} className="border-l-2 border-green-300 pl-2">
                            <strong>Day {r.day}:</strong> {r.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setSelectedAdvice(null)}
                      className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                      Close
                    </button>
                    <button onClick={() => handleDelete(selectedAdvice.id)}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default function AdviceHistory() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AdviceHistoryContent />
    </React.Suspense>
  );
}

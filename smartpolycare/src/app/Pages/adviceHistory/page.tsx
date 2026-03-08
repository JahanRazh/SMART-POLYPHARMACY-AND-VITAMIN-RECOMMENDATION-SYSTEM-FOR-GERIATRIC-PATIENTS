'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type SavedAdvice = {
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
    occupation: string;
  };
  saved_at: string;
};

const api = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      date = new Date(dateString.replace(' ', 'T'));
    }
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

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

  useEffect(() => {
    const fetchHistory = async () => {
      // Check for null, undefined, or the string "null"
      if (!identifier || identifier === 'null' || identifier === 'undefined') {
        setError('No valid patient identifier. Please complete the assessment form first.');
        setLoading(false);
        return;
      }

      try {
        const paramName = emailParam ? 'email' : 'patientId';
        const endpoint = `/patient-advice-history?${paramName}=${encodeURIComponent(identifier)}`;
        
        console.log(`📡 Fetching advice history: ${endpoint}`);
        const response = await api.get(endpoint);
        const data = response.data as { advice_history: SavedAdvice[] };

        console.log('✅ History Response:', data);
        setAdviceHistory(data.advice_history || []);
      } catch (err: any) {
        console.error('Error fetching history:', err);
        if (err.response?.status === 404) {
          // No history found is not an error - just show empty state
          setAdviceHistory([]);
        } else {
          setError(err.response?.data?.message || 'Failed to fetch advice history.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [identifier, emailParam]);

  const handleDeleteAdvice = async (adviceId: string) => {
    if (!confirm('Are you sure you want to delete this advice?')) return;

    try {
      await api.delete(`/patient-advice-history/${adviceId}?email=${encodeURIComponent(identifier)}`);
      setAdviceHistory(adviceHistory.filter(a => a.id !== adviceId));
      setSelectedAdvice(null);
      alert('Advice deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting advice:', err);
      alert('Failed to delete advice.');
    }
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
            <Link
              href="/Pages/patientAdvice"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
            >
              ← Back to Current Advice
            </Link>
          </div>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-red-700"
            >
              <p className="font-semibold text-lg">⚠️ Unable to Load History</p>
              <p className="mt-2 text-sm">{error}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/Pages/adviceDetails"
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Complete Assessment Form
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-400 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {adviceHistory.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-8 text-center"
            >
              <p className="text-gray-600">No saved advice yet.</p>
              <Link
                href="/Pages/patientAdvice"
                className="mt-4 inline-block rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Generate Your First Advice
              </Link>
            </motion.div>
          )}

          {/* Advice History Grid */}
          {adviceHistory.length > 0 && (
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {adviceHistory.map((advice, idx) => (
                <motion.div
                  key={advice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedAdvice(advice)}
                  className="cursor-pointer rounded-lg border border-teal-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Generated</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatDate(advice.generated_date)}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">Expires: {formatDate(advice.expires_date)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAdvice(advice.id);
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Quick summary */}
                  <div className="mt-4 pt-4 border-t border-teal-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Profile</p>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      {advice.inputs?.emotion && <p>🎭 Emotion: {advice.inputs.emotion}</p>}
                      {advice.inputs?.mental_health_level && <p>🧠 Mental Health: {advice.inputs.mental_health_level}</p>}
                      {advice.inputs?.occupation && <p>💼 Occupation: {advice.inputs.occupation}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          {selectedAdvice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedAdvice(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Advice Details</h2>
                  <button
                    onClick={() => setSelectedAdvice(null)}
                    className="text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Timeline */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900">Timeline</h3>
                    <ul className="mt-2 space-y-1 text-sm text-blue-800">
                      <li>• Generated: {formatDate(selectedAdvice.generated_date)}</li>
                      <li>• Expires: {formatDate(selectedAdvice.expires_date)}</li>
                      <li>• Duration: 14 days</li>
                    </ul>
                  </div>

                  {/* Profile */}
                  <div className="rounded-lg bg-teal-50 p-4">
                    <h3 className="text-sm font-semibold text-teal-900">Profile</h3>
                    <ul className="mt-2 space-y-1 text-sm text-teal-800">
                      {selectedAdvice.inputs?.emotion && <li>• Emotion: {selectedAdvice.inputs.emotion}</li>}
                      {selectedAdvice.inputs?.mental_health_level && <li>• Mental Health: {selectedAdvice.inputs.mental_health_level}</li>}
                      {selectedAdvice.inputs?.polypharmacy_risk && <li>• Medication Risk: {selectedAdvice.inputs.polypharmacy_risk}</li>}
                      {selectedAdvice.inputs?.occupation && <li>• Occupation: {selectedAdvice.inputs.occupation}</li>}
                    </ul>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">{selectedAdvice.summary}</p>
                  </div>

                  {/* Week 1 & 2 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                      <h3 className="text-sm font-semibold text-purple-900">Week 1</h3>
                      <ul className="mt-3 space-y-2 text-xs text-purple-800">
                        {selectedAdvice.week_1?.map((rec) => (
                          <li key={rec.day} className="border-l-2 border-purple-300 pl-3">
                            <strong>Day {rec.day}:</strong> {rec.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-teal-50 p-4">
                      <h3 className="text-sm font-semibold text-green-900">Week 2</h3>
                      <ul className="mt-3 space-y-2 text-xs text-green-800">
                        {selectedAdvice.week_2?.map((rec) => (
                          <li key={rec.day} className="border-l-2 border-green-300 pl-3">
                            <strong>Day {rec.day}:</strong> {rec.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedAdvice(null)}
                      className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteAdvice(selectedAdvice.id);
                      }}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
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

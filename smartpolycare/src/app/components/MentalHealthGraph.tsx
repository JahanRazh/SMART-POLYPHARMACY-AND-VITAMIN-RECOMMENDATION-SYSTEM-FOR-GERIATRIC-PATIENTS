'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceArea, LabelList,
} from 'recharts';
import { motion } from 'framer-motion';

/* ── Types ─────────────────────────────────────────────────────────── */
export type AssessmentEntry = {
  id?: string;
  timestamp: string;
  gds15_score: number;
  gad7_score: number;
  mmas8_score: number;
  iadl_score: number;
};

/* ── Psychometric severity helpers ─────────────────────────────────── */
export function getGDS15Severity(s: number) {
  if (s <= 4) return { label: 'Normal', color: '#10b981' };
  if (s <= 8) return { label: 'Mild', color: '#f59e0b' };
  if (s <= 11) return { label: 'Moderate', color: '#f97316' };
  return { label: 'Severe', color: '#ef4444' };
}
export function getGAD7Severity(s: number) {
  if (s <= 4) return { label: 'Minimal', color: '#10b981' };
  if (s <= 9) return { label: 'Mild', color: '#f59e0b' };
  if (s <= 14) return { label: 'Moderate', color: '#f97316' };
  return { label: 'Severe', color: '#ef4444' };
}
export function getMMAS8Severity(s: number) {
  if (s >= 8) return { label: 'High Adherence', color: '#10b981' };
  if (s >= 6) return { label: 'Medium Adherence', color: '#f59e0b' };
  return { label: 'Low Adherence', color: '#ef4444' };
}
export function getIADLSeverity(s: number) {
  if (s >= 8) return { label: 'Fully Independent', color: '#10b981' };
  if (s >= 6) return { label: 'Mild Impairment', color: '#f59e0b' };
  if (s >= 4) return { label: 'Moderate Impairment', color: '#f97316' };
  return { label: 'Severe Impairment', color: '#ef4444' };
}

export function overallStatus(e: AssessmentEntry) {
  const sevs = [
    getGDS15Severity(e.gds15_score),
    getGAD7Severity(e.gad7_score),
    getMMAS8Severity(e.mmas8_score),
    getIADLSeverity(e.iadl_score),
  ];
  if (sevs.some(s => s.color === '#ef4444')) return { label: 'High Risk', color: '#ef4444' };
  if (sevs.some(s => s.color === '#f97316')) return { label: 'Moderate Risk', color: '#f97316' };
  if (sevs.some(s => s.color === '#f59e0b')) return { label: 'Mild Risk', color: '#f59e0b' };
  return { label: 'Normal', color: '#10b981' };
}

/* ── Score cards ────────────────────────────────────────────────────── */
type CardDef = {
  key: string; icon: string; title: string; sub: string;
  bg: string; iconBg: string; score: number; max: number;
  pct: number; sev: { label: string; color: string };
};

function ScoreCard({ d }: { d: CardDef }) {
  return (
    <div className={`rounded-2xl border ${d.bg} p-4 flex items-center gap-4`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${d.iconBg} text-2xl shrink-0`}>
        {d.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500 truncate">{d.title}</p>
        <p className="text-[10px] text-gray-400 truncate">{d.sub}</p>
        <div className="flex items-end gap-1 mt-1">
          <span className="text-2xl font-extrabold text-gray-900">{d.pct}</span>
          <span className="text-sm text-gray-400 mb-0.5">/100</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: d.sev.color + '22', color: d.sev.color }}>
          {d.sev.label}
        </span>
      </div>
    </div>
  );
}

/* ── Custom dot with label ─────────────────────────────────────────── */
function CustomDot(props: any) {
  const { cx, cy, value } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#1e40af"
        fontSize={11} fontWeight="700">{value}</text>
    </g>
  );
}

/* ── Custom Tooltip ─────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const rawScore = payload[0]?.payload?.rawScore;
  const rawMax = payload[0]?.payload?.rawMax;
  const severity = payload[0]?.payload?.severity;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm min-w-[200px]">
      <p className="font-bold text-gray-800 mb-2 border-b pb-2">{label}</p>
      <div className="flex justify-between items-center gap-4">
        <span className="text-gray-600 text-xs">Health Score</span>
        <span className="font-bold text-blue-600">{v}%</span>
      </div>
      {rawScore !== undefined && (
        <div className="flex justify-between items-center gap-4 mt-1">
          <span className="text-gray-600 text-xs">Raw Score</span>
          <span className="font-bold text-gray-700">{rawScore}/{rawMax}</span>
        </div>
      )}
      {severity && (
        <div className="mt-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: severity.color + '22', color: severity.color }}>
            {severity.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Clinical Insights ──────────────────────────────────────────────── */
function ClinicalInsights({ entry }: { entry: AssessmentEntry }) {
  const insights: { icon: string; text: string; color: string }[] = [];

  const gdsSev = getGDS15Severity(entry.gds15_score);
  if (entry.gds15_score >= 5)
    insights.push({
      icon: '🧠', color: gdsSev.color,
      text: `Depression ${gdsSev.label.toLowerCase()} — GDS-15: ${entry.gds15_score}/15. ${entry.gds15_score >= 9 ? 'Immediate evaluation recommended.' : 'Monitor closely.'}`
    });

  const gadSev = getGAD7Severity(entry.gad7_score);
  if (entry.gad7_score >= 5)
    insights.push({
      icon: '💭', color: gadSev.color,
      text: `Anxiety ${gadSev.label.toLowerCase()} — GAD-7: ${entry.gad7_score}/21. ${entry.gad7_score >= 10 ? 'Consider counselling referral.' : 'Relaxation techniques advised.'}`
    });

  const mmasSev = getMMAS8Severity(entry.mmas8_score);
  if (entry.mmas8_score < 8)
    insights.push({
      icon: '💊', color: mmasSev.color,
      text: `${mmasSev.label} — MMAS-8: ${entry.mmas8_score}/8. ${entry.mmas8_score < 6 ? 'Urgent pharmacist consultation.' : 'Reinforce medication routine.'}`
    });

  const iadlSev = getIADLSeverity(entry.iadl_score);
  if (entry.iadl_score < 8)
    insights.push({
      icon: '🚶', color: iadlSev.color,
      text: `Functional ${iadlSev.label.toLowerCase()} — IADL: ${entry.iadl_score}/8. ${entry.iadl_score < 4 ? 'Caregiver support required.' : 'Encourage continued activity.'}`
    });

  if (insights.length === 0)
    insights.push({
      icon: '✅', color: '#10b981',
      text: 'All indicators within healthy range. Continue current care plan.'
    });

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-bold text-gray-800">AI Clinical Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: ins.color + '11' }}>
            <span className="text-base mt-0.5 shrink-0">{ins.icon}</span>
            <p className="text-xs text-gray-700 leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Assessment History Table ───────────────────────────────────────── */
function HistoryTable({ entries }: { entries: AssessmentEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mt-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Assessment History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Date</th>
              <th className="text-center py-2 px-2 text-indigo-600 font-semibold">GDS-15<br /><span className="text-[10px] text-gray-400 font-normal">Depression</span></th>
              <th className="text-center py-2 px-2 text-amber-600 font-semibold">GAD-7<br /><span className="text-[10px] text-gray-400 font-normal">Anxiety</span></th>
              <th className="text-center py-2 px-2 text-emerald-600 font-semibold">MMAS-8<br /><span className="text-[10px] text-gray-400 font-normal">Adherence</span></th>
              <th className="text-center py-2 px-2 text-blue-600 font-semibold">IADL<br /><span className="text-[10px] text-gray-400 font-normal">Independence</span></th>
              <th className="text-center py-2 pl-2 text-gray-500 font-semibold">Overall</th>
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((e, i) => {
              const st = overallStatus(e);
              return (
                <tr key={e.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-4 text-gray-600 font-medium whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-indigo-600">{e.gds15_score}<span className="text-gray-400 font-normal">/15</span></td>
                  <td className="py-2.5 px-2 text-center font-bold text-amber-600">{e.gad7_score}<span className="text-gray-400 font-normal">/21</span></td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-600">{e.mmas8_score}<span className="text-gray-400 font-normal">/8</span></td>
                  <td className="py-2.5 px-2 text-center font-bold text-blue-600">{e.iadl_score}<span className="text-gray-400 font-normal">/8</span></td>
                  <td className="py-2.5 pl-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: st.color + '22', color: st.color }}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function MentalHealthGraph({ email }: { email: string | null }) {
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [normalized, setNormalized] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/assessment_history?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data.assessments || []);
    } catch (e: any) {
      setError('Could not load assessment history.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* Latest entry drives the chart */
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  /* Normalize: for GDS-15 & GAD-7 lower raw = healthier, so invert for display */
  const toHealth = (raw: number, max: number, invert: boolean) => {
    const pct = Math.round((raw / max) * 100);
    return invert ? 100 - pct : pct;
  };

  /* Build the 4-point chart data (X = questionnaire part) */
  const chartData = latest ? [
    {
      category: 'Emotional Health\n(GDS-15)',
      score: toHealth(latest.gds15_score, 15, true),
      rawScore: latest.gds15_score, rawMax: 15,
      severity: getGDS15Severity(latest.gds15_score),
    },
    {
      category: 'Anxiety Control\n(GAD-7)',
      score: toHealth(latest.gad7_score, 21, true),
      rawScore: latest.gad7_score, rawMax: 21,
      severity: getGAD7Severity(latest.gad7_score),
    },
    {
      category: 'Medication Adherence\n(MMAS-8)',
      score: toHealth(latest.mmas8_score, 8, false),
      rawScore: latest.mmas8_score, rawMax: 8,
      severity: getMMAS8Severity(latest.mmas8_score),
    },
    {
      category: 'Functional Independence\n(IADL)',
      score: toHealth(latest.iadl_score, 8, false),
      rawScore: latest.iadl_score, rawMax: 8,
      severity: getIADLSeverity(latest.iadl_score),
    },
  ] : [];

  /* Score cards config */
  const cards: CardDef[] = latest ? [
    { key: 'gds15', icon: '🧠', title: 'Emotional Health', sub: '(GDS-15)', bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100', score: latest.gds15_score, max: 15, pct: toHealth(latest.gds15_score, 15, true), sev: getGDS15Severity(latest.gds15_score) },
    { key: 'gad7', icon: '💭', title: 'Anxiety Control', sub: '(GAD-7)', bg: 'bg-green-50 border-green-100', iconBg: 'bg-green-100', score: latest.gad7_score, max: 21, pct: toHealth(latest.gad7_score, 21, true), sev: getGAD7Severity(latest.gad7_score) },
    { key: 'mmas8', icon: '💊', title: 'Medication Adherence', sub: '(MMAS-8)', bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', score: latest.mmas8_score, max: 8, pct: toHealth(latest.mmas8_score, 8, false), sev: getMMAS8Severity(latest.mmas8_score) },
    { key: 'iadl', icon: '🚶', title: 'Functional Independence', sub: '(IADL)', bg: 'bg-purple-50 border-purple-100', iconBg: 'bg-purple-100', score: latest.iadl_score, max: 8, pct: toHealth(latest.iadl_score, 8, false), sev: getIADLSeverity(latest.iadl_score) },
  ] : [];

  /* Custom X-axis tick — splits on \n */
  const CustomXTick = ({ x, y, payload }: any) => {
    const lines: string[] = (payload.value as string).split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line: string, i: number) => (
          <text key={i} x={0} y={0} dy={14 + i * 14}
            textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={i === 0 ? 600 : 400}>
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 text-xl">📊</div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Health Profile Overview</h2>
            <p className="text-sm text-gray-500">Psychometric assessment — latest results</p>
          </div>
        </div>
        <button
          onClick={() => setNormalized(n => !n)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {normalized ? 'View: Health Score (%)' : 'View: Raw Scores'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="ml-3 text-sm text-gray-500">Loading assessment…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && <div className="py-8 text-center text-sm text-red-500">{error}</div>}

      {/* Empty */}
      {!loading && !error && entries.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No assessment data yet.</p>
          <p className="text-sm text-gray-400 mt-1">Complete the questionnaire to see your health profile.</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && latest && (
        <>
          {/* 4 Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {cards.map(d => <ScoreCard key={d.key} d={d} />)}
          </div>

          {/* Chart + Insights side-by-side */}
          <div className="flex flex-col xl:flex-row gap-6 mb-2 xl:items-stretch">
            {/* Chart */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Band legend */}
              <div className="flex flex-wrap gap-4 mb-3 text-[11px] font-semibold text-gray-600">
                <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded-sm" style={{ background: '#10b98130' }} />Healthy (70–100)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded-sm" style={{ background: '#f59e0b28' }} />Moderate (40–70)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded-sm" style={{ background: '#ef444428' }} />High Risk (0–40)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-blue-500" />Patient Score</span>
              </div>

              <ResponsiveContainer width="100%" height="100%" minHeight={300} className="flex-1">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>

                  {/* Coloured background bands */}
                  <ReferenceArea y1={70} y2={100} fill="#10b981" fillOpacity={0.10} />
                  <ReferenceArea y1={40} y2={70} fill="#f59e0b" fillOpacity={0.10} />
                  <ReferenceArea y1={0} y2={40} fill="#ef4444" fillOpacity={0.10} />

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                  <XAxis
                    dataKey="category"
                    tick={<CustomXTick />}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={0}
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Patient Score"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={<CustomDot />}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Clinical Insights */}
            <div className="xl:w-72 shrink-0">
              <ClinicalInsights entry={latest} />
            </div>
          </div>

          {/* History Table */}
          <HistoryTable entries={entries} />

          {/* High-Risk urgent note (only when overall status = High Risk) */}
          {overallStatus(latest).label === 'High Risk' && (
            <div className="mt-5 flex items-start gap-4 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4">
              <div className="shrink-0 mt-0.5">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">⚠️ Urgent — Professional Support Recommended</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                  Your current psychometric profile indicates <strong>High Risk</strong> across one or more health dimensions.
                  It is essential to book a session with a certified wellness counsellor as soon as possible
                  for a proper clinical evaluation and personalised support plan.
                </p>
              </div>
            </div>
          )}

          {/* Book Counsellor Button — always visible */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/Pages/bookCounsellor"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
              style={{
                background: overallStatus(latest).label === 'High Risk'
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              }}
            >
              <span className="text-base">🩺</span>
              Book a Wellness Counsellor
            </Link>
            <p className="text-xs text-gray-400 italic">
              * Always consult your healthcare provider before making significant changes.
            </p>
          </div>

          <p className="mt-3 text-[11px] text-gray-400 italic">
            Scores computed using validated tools: GDS-15, GAD-7, MMAS-8, Lawton IADL.
            Health Score (%) — GDS-15 &amp; GAD-7: lower raw = higher health %; MMAS-8 &amp; IADL: higher raw = higher health %.
          </p>
        </>
      )}
    </motion.div>
  );
}

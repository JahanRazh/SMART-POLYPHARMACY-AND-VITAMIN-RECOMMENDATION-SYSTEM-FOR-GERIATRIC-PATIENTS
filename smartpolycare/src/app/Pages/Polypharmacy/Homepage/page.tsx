"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* ───────────────── animation helpers ───────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ───────────────── page ───────────────── */
export default function PolypharmacyHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white text-gray-900">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto max-w-6xl px-6 pt-24 pb-16 relative">
          <motion.div {...fadeUp()} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Clinical Decision Support
            </span>

            <h1 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">
              Intelligent Polypharmacy Risk
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Assessment System
              </span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-600 md:text-xl max-w-2xl">
              An intelligent, ML-powered platform designed for geriatric care.
              Analyze drug–drug interactions, predict adverse events, and
              calculate personalized polypharmacy risk scores all in one
              comprehensive clinical dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/Pages/Polypharmacy/Polyform"
                className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5"
              >
                Start New Analysis
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

              <Link
                href="/Pages/Polypharmacy/DashBoard"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                </svg>
                View Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Hero stat cards */}
          <motion.div
            {...fadeUp(0.25)}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                  <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                  <path d="M3.265 15.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                </svg>
              }
              label="Knowledge Base"
              value="200K+"
              sub="Drug interactions indexed"
              accent="indigo"
            />
            <StatCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              }
              label="Real-time"
              value="Instant"
              sub="DDI detection speed"
              accent="emerald"
            />
            <StatCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                </svg>
              }
              label="Risk Factors"
              value="5"
              sub="Clinical parameters assessed"
              accent="violet"
            />
            <StatCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a2.63 2.63 0 001.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258a2.63 2.63 0 00-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.63 2.63 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.63 2.63 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
                </svg>
              }
              label="ML-Powered"
              value="ADE"
              sub="Adverse event prediction"
              accent="amber"
            />
          </motion.div>
        </div>
      </section>

      {/* ── WHAT IS POLYPHARMACY ── */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Understanding the Problem"
            title="What is Polypharmacy?"
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <p className="text-gray-600 leading-relaxed text-[15px]">
                <strong className="text-gray-900">Polypharmacy</strong> refers
                to the concurrent use of <strong>five or more medications</strong>{" "}
                by a patient, a phenomenon increasingly common among elderly
                populations. As the number of prescribed drugs grows, so does the
                probability of harmful drug–drug interactions (DDIs), adverse
                drug events (ADEs), medication non-adherence, and reduced quality
                of life.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed text-[15px]">
                Geriatric patients are particularly vulnerable due to
                age-related changes in drug metabolism, compromised liver and
                kidney function, and multiple co-existing chronic conditions.
                Clinical studies show that patients on 5+ medications face a{" "}
                <strong className="text-rose-600">58% higher risk</strong> of
                adverse drug events compared to those on fewer drugs.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 shadow-sm">
              <h3 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-indigo-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                Why It Matters
              </h3>
              <ul className="space-y-3">
                {[
                  "Over 40% of elderly patients are prescribed 5+ medications simultaneously",
                  "Drug interactions account for 6–30% of all adverse drug events in hospitals",
                  "Undetected high-risk DDIs can lead to hospitalization or fatal outcomes",
                  "Manual review of drug pairs scales poorly — AI-assisted screening is essential",
                  "Early risk identification enables proactive deprescribing and safer care",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-indigo-900/80">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-200/60 text-xs font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-gray-100">
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <motion.div {...fadeUp(0.1)}>
            <SectionHeading
              badge="System Workflow"
              title="How the Analysis Works"
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <StepCard
                step="01"
                title="Input Patient Data"
                desc="Enter the patient's age, gender, organ function levels, existing diseases, and the full list of current medications through our guided form interface."
                color="indigo"
              />
              <StepCard
                step="02"
                title="AI-Powered Analysis"
                desc="Our system cross-references all drug pairs against a knowledge base of 200K+ interactions, identifies severity levels (Major / Moderate / Minor), and runs ML models to predict adverse drug events."
                color="violet"
              />
              <StepCard
                step="03"
                title="Risk Report & Export"
                desc="Receive a comprehensive risk dashboard with severity breakdowns, ADE predictions, multi-factor risk scoring, medical recommendations, and one-click export to professional PDF or Excel reports."
                color="emerald"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Core Capabilities"
            title="What Our System Analyzes"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
                </svg>
              }
              title="Drug–Drug Interaction Detection"
              desc="Every pair of medications is cross-referenced against a comprehensive knowledge base. Interactions are classified into Major, Moderate, and Minor severity levels with detailed clinical descriptions."
              accent="rose"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              }
              title="Adverse Drug Event Prediction"
              desc="Machine learning models trained on clinical datasets predict potential adverse events based on the patient's specific combination of drugs, age, and pre-existing conditions — providing proactive safety alerts."
              accent="amber"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                </svg>
              }
              title="Multiparametric Risk Scoring"
              desc="A weighted composite score (0–100) is computed from five clinical parameters: medication count (S1), patient age (S2), interaction severity (S3), hepatic function (S4), and renal function (S5)."
              accent="indigo"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              }
              title="Liver & Kidney Function Assessment"
              desc="Organ function levels (ALT/AST for liver, eGFR staging for kidneys) are factored into the risk model. Impaired organ function significantly amplifies drug toxicity in elderly patients."
              accent="purple"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
                </svg>
              }
              title="Clinical Recommendations"
              desc="Based on the computed risk level (Low, Moderate, High, Very High), the system provides evidence-based medical recommendations — from routine monitoring to urgent comprehensive medication review."
              accent="teal"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm5.845 17.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V12a.75.75 0 00-1.5 0v4.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z" clipRule="evenodd" />
                  <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                </svg>
              }
              title="Professional Report Export"
              desc="Download your complete analysis as a branded PDF clinical report or a multi-sheet Excel workbook. Reports include patient details, interaction tables, severity summaries, ADE predictions, and full risk breakdowns."
              accent="sky"
            />
          </div>
        </motion.div>
      </section>

      {/* ── RISK SCORING EXPLAINED ── */}
      <section className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white">
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <motion.div {...fadeUp(0.1)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Risk Methodology
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How the Risk Score is Calculated
            </h2>
            <p className="mt-3 max-w-2xl text-gray-400 text-[15px] leading-relaxed">
              The polypharmacy risk score is a weighted composite of five
              clinical sub-scores, computed using rule-based algorithms and
              evidence-based thresholds. Each parameter is scored independently
              and combined using configurable clinical weights.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <ScoreCard
                label="S1"
                title="Medication Count"
                weight="25%"
                desc="Scores drug burden. 0 for <5 drugs, scaling to 1.0+ for 8+ medications."
                color="indigo"
              />
              <ScoreCard
                label="S2"
                title="Patient Age"
                weight="25%"
                desc="Geriatric risk factor. Ranges from 0 (under 65) to 1.0 (85+ years)."
                color="blue"
              />
              <ScoreCard
                label="S3"
                title="Drug Interactions"
                weight="30%"
                desc="Weighted DDI severity. Major×1.0, Moderate×0.6, Minor×0.3 per interaction."
                color="orange"
              />
              <ScoreCard
                label="S4"
                title="Liver Function"
                weight="10%"
                desc="ALT/AST-based hepatic assessment. 0 for normal, up to 1.0 for severe."
                color="purple"
              />
              <ScoreCard
                label="S5"
                title="Kidney Function"
                weight="10%"
                desc="eGFR-based renal staging. Stage 1 = 0, scaling to 1.0 for Stage 5."
                color="teal"
              />
            </div>

            {/* Formula */}
            <div className="mt-8 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                Risk Score Formula
              </p>
              <p className="font-mono text-sm text-gray-300 leading-relaxed">
                Risk Score = min( (W₁ × S₁) + (W₂ × S₂) + (W₃ × S₃) + (W₄ × S₄) + (W₅ × S₅) , 100 )
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <RiskLevelBadge level="Low" range="0 – 29" color="emerald" />
                <RiskLevelBadge level="Moderate" range="30 – 59" color="yellow" />
                <RiskLevelBadge level="High" range="60 – 79" color="orange" />
                <RiskLevelBadge level="Very High" range="80 – 100" color="rose" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TARGET AUDIENCE ── */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Who Benefits"
            title="Designed for Geriatric Care"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AudienceCard
              emoji="👨‍⚕️"
              title="Physicians"
              desc="Quickly screen multi-drug regimens for hidden interactions before prescribing."
            />
            <AudienceCard
              emoji="💊"
              title="Pharmacists"
              desc="Validate prescription safety and identify deprescribing opportunities."
            />
            <AudienceCard
              emoji="👩‍👧‍👦"
              title="Caretakers"
              desc="Monitor elderly family members' medication risks with easy-to-understand reports."
            />
            <AudienceCard
              emoji="🧓"
              title="Patients"
              desc="Understand your medication risk profile and share professional reports with your doctor."
            />
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white">
        <div className="container mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.div {...fadeUp(0.1)}>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to Analyze Your Medications?
            </h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
              Start a comprehensive polypharmacy risk assessment in under a
              minute. Enter your medications, receive instant insights, and
              download a clinical-grade report.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/Pages/Polypharmacy/Polyform"
                className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5"
              >
                Start Analysis Now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                href="/Pages/Polypharmacy/DashBoard"
                className="rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 hover:-translate-y-0.5"
              >
                View My Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ────────────────── COMPONENTS ────────────────── */

function SectionHeading({ badge, title }: { badge: string; title: string }) {
  return (
    <div>
      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
        {badge}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  const colors: Record<string, string> = {
    indigo: "border-indigo-100 bg-white text-indigo-600",
    emerald: "border-emerald-100 bg-white text-emerald-600",
    violet: "border-violet-100 bg-white text-violet-600",
    amber: "border-amber-100 bg-white text-amber-600",
  };
  return (
    <div
      className={`group rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${colors[accent]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="opacity-70">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
  color,
}: {
  step: string;
  title: string;
  desc: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    violet: "from-violet-500 to-violet-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bgMap[color]} text-white text-sm font-bold shadow-sm`}
      >
        {step}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
}) {
  const borderMap: Record<string, string> = {
    rose: "hover:border-rose-200",
    amber: "hover:border-amber-200",
    indigo: "hover:border-indigo-200",
    purple: "hover:border-purple-200",
    teal: "hover:border-teal-200",
    sky: "hover:border-sky-200",
  };
  const iconBgMap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div
      className={`group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${borderMap[accent]}`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBgMap[accent]}`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function ScoreCard({
  label,
  title,
  weight,
  desc,
  color,
}: {
  label: string;
  title: string;
  weight: string;
  desc: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    teal: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-extrabold">{label}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {weight}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed opacity-70">{desc}</p>
    </div>
  );
}

function RiskLevelBadge({
  level,
  range,
  color,
}: {
  level: string;
  range: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${bgMap[color]}`}
    >
      <span className="text-xs font-bold">{level}</span>
      <span className="text-xs font-mono opacity-70">{range}</span>
    </div>
  );
}

function AudienceCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center transition-all hover:shadow-md hover:-translate-y-0.5">
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

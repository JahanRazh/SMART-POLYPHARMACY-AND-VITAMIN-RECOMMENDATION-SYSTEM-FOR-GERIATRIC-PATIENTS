"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PolypharmacyRiskHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      <section className="container mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100 px-4 py-2 text-sm font-medium text-teal-700">
            Polypharmacy Risk Analysis Hub
          </span>

          <h1 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">
            Intelligent Polypharmacy Risk Assessment
          </h1>

          <p className="mt-4 text-gray-600 md:text-lg leading-relaxed">
            Analyze drug–drug interactions, severity levels, and patient-specific
            risk factors to identify potential adverse outcomes in geriatric care.
          </p>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/Pages/Polypharmacy/Polyform"
              className="rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition"
            >
              Drug Detail Form
            </Link>

            <Link
              href="/Pages/Polypharmacy/Polyform"
              className="rounded-lg border border-teal-300 bg-white px-5 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition"
            >
              View Risk Breakdown
            </Link>
          </div>
        </motion.div>

        {/* Explanation Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-12 rounded-2xl bg-white border border-teal-100 shadow-sm"
        >
          <div className="border-b border-teal-50 px-6 py-5">
            <h2 className="text-lg font-bold">
              How the Risk Score is Calculated
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The polypharmacy risk score is generated using interaction severity,
              drug count, and patient-related risk factors.
            </p>
          </div>

          <div className="grid gap-5 px-6 py-6 md:grid-cols-3">
            <RiskFactor
              title="Drug Count"
              desc="Increased number of medications raises interaction probability."
            />
            <RiskFactor
              title="Interaction Severity"
              desc="Severe DDIs contribute higher weighted risk values."
            />
            <RiskFactor
              title="Patient Factors"
              desc="Age and organ function amplify adverse reaction risk."
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ---------------- Components ---------------- */

function RiskFactor({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
      <h3 className="text-sm font-semibold text-teal-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

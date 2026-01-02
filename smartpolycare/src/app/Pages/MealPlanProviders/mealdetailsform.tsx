"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

/* ================= TYPES ================= */
type MealDetailsFormProps = {
  onBack: () => void;
};

type VitaminLevel = "Low" | "Medium" | "Normal";

/* ================= COMPONENT ================= */
export default function MealDetailsForm({ onBack }: MealDetailsFormProps) {
  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-gray-800 " +
    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

  const checkboxClass = "accent-blue-600 w-4 h-4";

  /* ================= STEP 1 – BMI ================= */
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [bmi, setBmi] = useState(0);
  const [bmiLabel, setBmiLabel] = useState("");

  useEffect(() => {
    if (height > 0 && weight > 0) {
      const h = height / 100;
      const val = Number((weight / (h * h)).toFixed(1));
      setBmi(val);
      if (val < 18.5) setBmiLabel("Underweight");
      else if (val < 25) setBmiLabel("Normal");
      else if (val < 30) setBmiLabel("Overweight");
      else setBmiLabel("Obese");
    } else {
      setBmi(0);
      setBmiLabel("");
    }
  }, [height, weight]);

  /* ================= STEP 3 ================= */
  const [conditions, setConditions] = useState([
    {
      diseaseName: "",
      category: "",
      duration: "",
      severity: "",
      controlStatus: "",
      symptoms: "",
      foodIssues: "",
    },
  ]);

  const addCondition = () =>
    setConditions([
      ...conditions,
      {
        diseaseName: "",
        category: "",
        duration: "",
        severity: "",
        controlStatus: "",
        symptoms: "",
        foodIssues: "",
      },
    ]);

  /* ================= STEP 4 ================= */
  const [medications, setMedications] = useState([
    {
      drugName: "",
      dose: "",
      frequency: "",
      timing: "",
      term: "",
      comments: "",
    },
  ]);

  const addMedication = () =>
    setMedications([
      ...medications,
      {
        drugName: "",
        dose: "",
        frequency: "",
        timing: "",
        term: "",
        comments: "",
      },
    ]);

  /* ================= STEP 5 ================= */
  const vitamins = [
    "Vitamin A",
    "Vitamin B1",
    "Vitamin B2",
    "Vitamin B6",
    "Vitamin B12",
    "Vitamin C",
    "Vitamin D",
    "Vitamin E",
    "Vitamin K",
  ];

  const [vitaminLevels, setVitaminLevels] = useState<
    Record<string, VitaminLevel>
  >({});

  const toggleVitamin = (v: string) => {
    setVitaminLevels((prev) => {
      const copy = { ...prev };
      if (copy[v]) delete copy[v];
      else copy[v] = "Medium";
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white pb-20">
      {/* HEADER */}
      <section className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">
            Patient Meal Data Collection
          </h1>

          <button
            onClick={onBack}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold"
          >
            ← Back to Providers
          </button>
        </div>
      </section>

      {/* FORM */}
      <section className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl bg-white rounded-3xl border border-blue-200 shadow-lg p-10">
          <form className="space-y-16">
            {/* STEP 1 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Step 1 – Basic Profile</h2>

              <label>
                <span className="font-medium">Patient Name</span>
                <input className={inputClass} />
              </label>

              <label>
                <span className="font-medium">Age</span>
                <input type="number" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">Gender</span>
                <select className={inputClass}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>

              <label>
                <span className="font-medium">Height (cm)</span>
                <input
                  type="number"
                  className={inputClass}
                  onChange={(e) => setHeight(+e.target.value)}
                />
              </label>

              <label>
                <span className="font-medium">Weight (kg)</span>
                <input
                  type="number"
                  className={inputClass}
                  onChange={(e) => setWeight(+e.target.value)}
                />
              </label>

              <label>
                <span className="font-medium">BMI (Auto)</span>
                <input
                  readOnly
                  className={inputClass}
                  value={bmi ? `${bmi} (${bmiLabel})` : ""}
                />
              </label>
            </div>

            {/* STEP 2 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 2 – Lifestyle & Appetite
              </h2>

              <label>
                <span className="font-medium">Appetite Level</span>
                <select className={inputClass}>
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                </select>
              </label>

              <label>
                <span className="font-medium">Recent Weight Change</span>
                <select className={inputClass}>
                  <option>Loss</option>
                  <option>Gain</option>
                  <option>Stable</option>
                </select>
              </label>

              <label>
                <span className="font-medium">
                  Digestive / Swallowing Issues
                </span>
                <input className={inputClass} />
              </label>
            </div>

            {/* STEP 3 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 3 – Medical Conditions
              </h2>

              {conditions.map((_, i) => (
                <div key={i} className="border rounded-xl p-5 space-y-4">
                  <label>
                    <span>Disease Name</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Disease Category</span>
                    <select className={inputClass}>
                      <option>Diabetes</option>
                      <option>Heart</option>
                      <option>Kidney</option>
                      <option>Gastric</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    <span>Duration</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Severity</span>
                    <select className={inputClass}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </label>
                  <label>
                    <span>Symptoms</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Food Discomforts</span>
                    <input className={inputClass} />
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={addCondition}
                className="text-blue-600"
              >
                + Add another condition
              </button>
            </div>

            {/* STEP 4 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Step 4 – Medications</h2>

              {medications.map((_, i) => (
                <div key={i} className="border rounded-xl p-5 space-y-4">
                  <label>
                    <span>Drug Name</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Dose</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Frequency</span>
                    <input className={inputClass} />
                  </label>
                  <label>
                    <span>Timing</span>
                    <select className={inputClass}>
                      <option>Before food</option>
                      <option>After food</option>
                      <option>Morning</option>
                      <option>Night</option>
                    </select>
                  </label>
                  <label>
                    <span>Patient Comments</span>
                    <textarea className={inputClass} />
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={addMedication}
                className="text-blue-600"
              >
                + Add another medicine
              </button>
            </div>

            {/* STEP 5 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Step 5 – Vitamin Levels</h2>

              {vitamins.map((v) => (
                <div key={v} className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={!!vitaminLevels[v]}
                    onChange={() => toggleVitamin(v)}
                  />
                  <span className="w-32">{v}</span>
                  {vitaminLevels[v] && (
                    <select
                      className={inputClass}
                      value={vitaminLevels[v]}
                      onChange={(e) =>
                        setVitaminLevels({
                          ...vitaminLevels,
                          [v]: e.target.value as VitaminLevel,
                        })
                      }
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>Normal</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* ================= STEP 6 ================= */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 6 – Dietary Restrictions & Safety
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Low sugar (Diabetes)",
                  "Low salt (Blood pressure)",
                  "Low fat (Heart disease)",
                  "Soft food (Elderly)",
                  "Fluid restriction",
                  "Renal-safe food",
                  "Gastric-friendly food",
                ].map((rule) => (
                  <label key={rule} className="flex items-center gap-3">
                    <input type="checkbox" className={checkboxClass} />
                    <span>{rule}</span>
                  </label>
                ))}
              </div>

              <label>
                <span className="font-medium">Other Special Restrictions</span>
                <input
                  className={inputClass}
                  placeholder="Any other food safety rules"
                />
              </label>
            </div>

            {/* ================= STEP 6 ================= */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 6 – Dietary Restrictions & Safety
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Low sugar (Diabetes)",
                  "Low salt (Blood pressure)",
                  "Low fat (Heart disease)",
                  "Soft food (Elderly)",
                  "Fluid restriction",
                  "Renal-safe food",
                  "Gastric-friendly food",
                ].map((rule) => (
                  <label key={rule} className="flex items-center gap-3">
                    <input type="checkbox" className={checkboxClass} />
                    <span>{rule}</span>
                  </label>
                ))}
              </div>

              <label>
                <span className="font-medium">Other Special Restrictions</span>
                <input
                  className={inputClass}
                  placeholder="Any other food safety rules"
                />
              </label>
            </div>

            {/* ================= STEP 7 ================= */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 7 – Meal Timing & Eating Windows
              </h2>

              <label>
                <span className="font-medium">Breakfast Time</span>
                <input type="time" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">Lunch Time</span>
                <input type="time" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">Dinner Time</span>
                <input type="time" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">
                  Mid-morning Snack Time (Optional)
                </span>
                <input type="time" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">
                  Evening Snack Time (Optional)
                </span>
                <input type="time" className={inputClass} />
              </label>

              <label>
                <span className="font-medium">
                  Night Milk / Food Time (Optional)
                </span>
                <input type="time" className={inputClass} />
              </label>
            </div>

            {/* ================= STEP 8 ================= */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 8 – Sri Lankan Meal Preferences
              </h2>

              <label>
                <span className="font-medium">Preferred Rice Type</span>
                <select className={inputClass}>
                  <option value="">Select rice type</option>
                  <option>White rice</option>
                  <option>Red rice</option>
                  <option>Keeri samba</option>
                  <option>Kurakkan</option>
                </select>
              </label>

              <label>
                <span className="font-medium">Curry Style Preference</span>
                <select className={inputClass}>
                  <option value="">Select spice level</option>
                  <option>Mild</option>
                  <option>Less spicy</option>
                  <option>Medium</option>
                </select>
              </label>

              <label>
                <span className="font-medium">Preferred Foods</span>
                <input
                  className={inputClass}
                  placeholder="Parippu, mallung, fish curry, gotukola…"
                />
              </label>

              <label>
                <span className="font-medium">Foods to Avoid</span>
                <input
                  className={inputClass}
                  placeholder="Dry fish, milk, jackfruit, brinjal…"
                />
              </label>
            </div>

            {/* SUBMIT */}
            <div className="pt-6 text-right">
              <button className="rounded-lg bg-blue-600 px-8 py-3 text-white font-semibold">
                Save Patient Meal Data
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

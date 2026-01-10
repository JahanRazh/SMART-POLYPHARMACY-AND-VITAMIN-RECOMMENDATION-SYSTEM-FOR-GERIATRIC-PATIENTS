"use client";

import { useAuth } from "@/app/components/Contexts/AuthContext";
import React, { FormEvent, useEffect, useState } from "react";

type SeveritySummary = Record<string, number>;

type Interaction = {
  drugA: string;
  drugB: string;
  severity: string;
  ddinterIdA?: string;
  ddinterIdB?: string;
};

type RiskCalculation = {
  scores: {
    s1: number;
    s2: number;
    s3: number;
    s4: number;
    s5: number;
  };
  weights: {
    drugWeight: number;
    ageWeight: number;
    ddiWeight: number;
    liverWeight: number;
    kidneyWeight: number;
  };
  drugCount: number;
  ddiCount: number;
  riskScore: number;
  riskLevel: string;
  calculation: {
    drugComponent: number;
    ageComponent: number;
    ddiComponent: number;
    liverComponent: number;
    kidneyComponent: number;
    s1Explanation?: string;
    s2Explanation?: string;
    s3Explanation?: string;
    s4Explanation?: string;
    s5Explanation?: string;
  };
};

type AssessmentResponse = {
  assessmentId: string;
  mode?: "self" | "caretaker";
  user: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    age?: number;
    gender?: string;
    email?: string;
  };
  drugCount: number;
  drugs: string[];
  interactionsFound: number;
  interactions: Interaction[];
  severitySummary: SeveritySummary;
  age: number;
  liverFunction: string;
  kidneyFunction: string;
  riskCalculation: RiskCalculation;
  createdAt: string;
  source?: string;
};

const MAX_DRUGS = 20;
const API_BASE = process.env.NEXT_PUBLIC_LOCAL_API_URL;

const PolypharmacyPage = () => {
  const { user, userProfile } = useAuth();
  const [drugs, setDrugs] = useState<string[]>([""]);
  const [activeDrugIndex, setActiveDrugIndex] = useState<number | null>(null);
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [isFullNameDirty, setIsFullNameDirty] = useState<boolean>(false);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [ageError, setAgeError] = useState<string>("");
  const [liverFunction, setLiverFunction] = useState<string>("");
  const [kidneyFunction, setKidneyFunction] = useState<string>("");
  const [analysis, setAnalysis] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const liverFunctionOptions = [
    { value: "Normal (<40 IU/L)", label: "Normal (<40 IU/L)" },
    { value: "Mild risk (40-80 IU/L)", label: "Mild risk (40-80 IU/L)" },
    {
      value: "Moderate risk (80-150 IU/L)",
      label: "Moderate risk (80-150 IU/L)",
    },
    { value: "Severe risk (>150 IU/L)", label: "Severe risk (>150 IU/L)" },
  ];

  const kidneyFunctionOptions = [
    { value: "Stage 1: eGFR of 90", label: "Stage 1: eGFR of 90" },
    { value: "Stage 2: eGFR of 60-89", label: "Stage 2: eGFR of 60-89" },
    { value: "Stage 3a: eGFR of 45-59", label: "Stage 3a: eGFR of 45-59" },
    { value: "Stage 3b: eGFR of 30-44", label: "Stage 3b: eGFR of 30-44" },
    { value: "Stage 4: eGFR of 15-29", label: "Stage 4: eGFR of 15-29" },
    { value: "Stage 5: eGFR below 15", label: "Stage 5: eGFR below 15" },
  ];

  useEffect(() => {
    // Auto-fill from the authenticated user's profile when available
    if (
      userProfile?.age !== undefined &&
      userProfile?.age !== null &&
      age === ""
    ) {
      setAge(String(userProfile.age));
    }
    if (userProfile?.firstName && firstName === "") {
      setFirstName(userProfile.firstName);
    }
    if (userProfile?.lastName && lastName === "") {
      setLastName(userProfile.lastName);
    }
    if (userProfile?.gender && gender === "") {
      setGender(userProfile.gender);
    }
  }, [userProfile, age, firstName, lastName, gender]);

  useEffect(() => {
    // Auto-fill full name based on firstName and lastName
    const nameFromFields = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    
    // In self mode, initially prefer displayName from profile if firstName/lastName are empty
    if (userProfile?.displayName && !firstName && !lastName && !fullName && !isFullNameDirty) {
      setFullName(userProfile.displayName);
      return;
    }

    // If fullName matches the auto-generated value, reset dirty flag to allow auto-updates
    if (isFullNameDirty && nameFromFields && fullName === nameFromFields) {
      setIsFullNameDirty(false);
    }

    // Don't auto-update if user has manually edited the full name
    if (isFullNameDirty) return;

    // Update full name from firstName + lastName (works in both modes)
    if (nameFromFields) {
      if (nameFromFields !== fullName) {
        setFullName(nameFromFields);
      }
    }
  }, [userProfile, firstName, lastName, isFullNameDirty, fullName]);

  const handleDrugChange = async (index: number, value: string) => {
    setDrugs((prev) => prev.map((drug, idx) => (idx === index ? value : drug)));

    const query = value.trim();
    setActiveDrugIndex(index);

    if (!query) {
      setDrugSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({ q: query, limit: "15" });
      const response = await fetch(
        `${API_BASE}/api/polypharmacy/drugs/search?${params.toString()}`,
        {
          method: "GET",
        }
      );
      const data = await response.json().catch(() => null);
      if (response.ok && data && Array.isArray(data.items)) {
        setDrugSuggestions(data.items);
      } else {
        setDrugSuggestions([]);
      }
    } catch {
      setDrugSuggestions([]);
    }
  };

  const handleSelectSuggestion = (index: number, suggestion: string) => {
    setDrugs((prev) =>
      prev.map((drug, idx) => (idx === index ? suggestion : drug))
    );
    setActiveDrugIndex(null);
    setDrugSuggestions([]);
  };

  const addDrugField = () => {
    if (drugs.length >= MAX_DRUGS) return;
    setDrugs((prev) => [...prev, ""]);
  };

  const removeDrugField = (index: number) => {
    setDrugs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setAnalysis(null);

    if (!user) {
      setError("Please sign in to analyze polypharmacy risk.");
      return;
    }

    const cleanedDrugs = drugs
      .map((drug) => drug.trim())
      .filter((drug, index, self) => drug && self.indexOf(drug) === index);

    if (cleanedDrugs.length < 2) {
      setError("Enter at least two different drugs to run the analysis.");
      return;
    }

    if (cleanedDrugs.length > MAX_DRUGS) {
      setError(`You can analyze up to ${MAX_DRUGS} drugs at a time.`);
      return;
    }

    const ageNum = parseInt(age, 10);
    // Validation: Age must be between 1 and 120
    if (age === "") {
      setAgeError("Age is required");
      setError("Please enter a valid age.");
      return;
    } else if (isNaN(ageNum) || ageNum < 1) {
      setAgeError("Age must be at least 1");
      setError("Please enter a valid age.");
      return;
    } else if (ageNum > 120) {
      setAgeError("Age cannot be more than 120");
      setError("Please enter a valid age.");
      return;
    } else {
      setAgeError("");
    }
    
    if (!liverFunction) {
      setError("Please select a liver function level.");
      return;
    }

    if (!kidneyFunction) {
      setError("Please select a kidney function level.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/polypharmacy/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          drugs: cleanedDrugs,
          age: ageNum,
          liverFunction: liverFunction,
          kidneyFunction: kidneyFunction,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to analyze polypharmacy risk."
        );
      }

      setAnalysis(data);
      setSuccessMessage("Polypharmacy risk analysis completed successfully.");
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Unexpected error while analyzing polypharmacy risk.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSeverityCard = (label: string, count: number, accent: string) => (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
  );

  const severitySummary = analysis?.severitySummary || {};

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-indigo-500">
            Polypharmacy Risk
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Personalized Drug Interaction Checker
          </h1>
          <p className="mt-3 text-gray-600">
            Our engine cross-checks every combination against the curated Drug
            Interaction and highlights the severity in real time.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Please sign in to run a polypharmacy risk analysis.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Patient Snapshot
                </h2>
                <p className="text-sm text-gray-500">
                  We auto-fill what we know about you.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setIsFullNameDirty(true);
                    setFullName(e.target.value);
                  }}
                  placeholder="Enter full name"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Age *
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => {
                      // allow only numbers
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setAge(val);
                        
                        // Validation: Age must be between 1 and 120
                        if (val === "") {
                          setAgeError("Age is required");
                        } else if (Number(val) < 1) {
                          setAgeError("Age must be at least 1");
                        } else if (Number(val) > 120) {
                          setAgeError("Age cannot be more than 120");
                        } else {
                          setAgeError("");
                        }
                      }
                    }}
                    placeholder="Enter age"
                    className={`mt-1 w-full rounded-xl border px-4 py-2 text-gray-900 focus:outline-none ${
                      ageError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"
                    }`}
                  />
                  {ageError && (
                    <p className="mt-1 text-sm text-red-600">{ageError}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Liver Function (ALT/AST Level) *
                  </label>
                  <select
                    value={liverFunction}
                    onChange={(e) => setLiverFunction(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select liver function level</option>
                    {liverFunctionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Kidney Function (CKD Stage) *
                  </label>
                  <select
                    value={kidneyFunction}
                    onChange={(e) => setKidneyFunction(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select kidney function stage</option>
                    {kidneyFunctionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Medication List
                </h2>
                <p className="text-sm text-gray-500">
                  Add drugs you are currently taking use Format (ex; Conjugated
                  estrogens).
                </p>
              </div>
              <button
                type="button"
                onClick={addDrugField}
                disabled={drugs.length >= MAX_DRUGS}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Drug
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {drugs.map((drug, index) => (
                <div key={`drug-${index}`} className="space-y-2">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={drug}
                        onChange={(event) =>
                          handleDrugChange(index, event.target.value)
                        }
                        onFocus={() => {
                          setActiveDrugIndex(index);
                        }}
                        placeholder={`Drug ${index + 1}`}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                      />
                      {activeDrugIndex === index &&
                        drugSuggestions.length > 0 && (
                          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                            {drugSuggestions.map((suggestion) => (
                              <li
                                key={suggestion}
                                className="cursor-pointer px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectSuggestion(index, suggestion);
                                }}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    {drugs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDrugField(index)}
                        className="h-fit rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              We will check every drug pair (N*(N-1)/2 comparisons).
            </p>
            <button
              type="submit"
              disabled={!user || isSubmitting}
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Analyzing..." : "Analyze Drug Interactions"}
            </button>
          </div>
        </form>

        {analysis && (
          <section className="mt-10 space-y-6">
            {/* Risk Score and Level */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-500">
                    Polypharmacy Risk Assessment
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Risk Prediction
                  </h2>
                  <p className="text-sm text-gray-500">
                    {analysis.drugCount} drugs • {analysis.interactionsFound}{" "}
                    interactions detected
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>ID: {analysis.assessmentId}</p>
                  <p>{new Date(analysis.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {analysis.riskCalculation && (
                <div className="mt-6">
                  <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-indigo-600">
                          Polypharmacy Risk Score
                        </p>
                        <p className="text-4xl font-bold text-indigo-900">
                          {analysis.riskCalculation.riskScore} %
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-indigo-600">Risk Level</p>
                        <p
                          className={`text-2xl font-bold ${
                            analysis.riskCalculation.riskLevel === "Very High"
                              ? "text-red-600"
                              : analysis.riskCalculation.riskLevel === "High"
                              ? "text-orange-600"
                              : analysis.riskCalculation.riskLevel ===
                                "Moderate"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {analysis.riskCalculation.riskLevel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {renderSeverityCard(
                  "Major",
                  severitySummary.Major || 0,
                  "bg-rose-50 border-rose-100"
                )}
                {renderSeverityCard(
                  "Moderate",
                  severitySummary.Moderate || 0,
                  "bg-amber-50 border-amber-100"
                )}
                {renderSeverityCard(
                  "Minor",
                  severitySummary.Minor || 0,
                  "bg-emerald-50 border-emerald-100"
                )}
               
              </div>
            </div>

            {/* Calculation Details */}
            {analysis.riskCalculation && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Detailed Calculation
                </h3>

                {/* Sub-scores */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Sub-Scores (S1-S5)
                  </h4>
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        S1 (Medication Count)
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {analysis.riskCalculation.scores.s1}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        From {analysis.drugCount} drugs
                      </p>
                      {analysis.riskCalculation.calculation.s1Explanation && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          {analysis.riskCalculation.calculation.s1Explanation}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">S2 (Age)</p>
                      <p className="text-xl font-bold text-gray-900">
                        {analysis.riskCalculation.scores.s2}
                      </p>
                      {analysis.riskCalculation.calculation.s2Explanation && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          {analysis.riskCalculation.calculation.s2Explanation}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">S3 (DDI)</p>
                      <p className="text-xl font-bold text-gray-900">
                        {analysis.riskCalculation.scores.s3}
                      </p>
                      {analysis.riskCalculation.calculation.s3Explanation && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          {analysis.riskCalculation.calculation.s3Explanation}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">S4 (Liver)</p>
                      <p className="text-xl font-bold text-gray-900">
                        {analysis.riskCalculation.scores.s4}
                      </p>
                      {analysis.riskCalculation.calculation.s4Explanation && (
                        <p className="text-xs text-purple-600 mt-1 font-medium">
                          {analysis.riskCalculation.calculation.s4Explanation}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">S5 (Kidney)</p>
                      <p className="text-xl font-bold text-gray-900">
                        {analysis.riskCalculation.scores.s5}
                      </p>
                      {analysis.riskCalculation.calculation.s5Explanation && (
                        <p className="text-xs text-teal-600 mt-1 font-medium">
                          {analysis.riskCalculation.calculation.s5Explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weights */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Weights
                  </h4>
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Drug Weight</p>
                      <p className="text-lg font-bold text-blue-900">
                        {analysis.riskCalculation.weights.drugWeight}
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Age Weight</p>
                      <p className="text-lg font-bold text-blue-900">
                        {analysis.riskCalculation.weights.ageWeight}
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">DDI Weight</p>
                      <p className="text-lg font-bold text-blue-900">
                        {analysis.riskCalculation.weights.ddiWeight}
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Liver Weight</p>
                      <p className="text-lg font-bold text-blue-900">
                        {analysis.riskCalculation.weights.liverWeight}
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Kidney Weight</p>
                      <p className="text-lg font-bold text-blue-900">
                        {analysis.riskCalculation.weights.kidneyWeight}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Total Weight:{" "}
                    {Object.values(analysis.riskCalculation.weights).reduce(
                      (a, b) => a + b,
                      0
                    )}
                  </p>
                </div>

                {/* S1 Calculation Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    S1 (Drug Sub-Score) Calculation
                  </h4>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Drug Count:
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                          {analysis.drugCount} drugs
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <p className="text-xs text-blue-700 mb-2">
                          S1 Calculation Rules:
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1 ml-4 list-disc">
                          <li>Drug count &lt; 5: S1 = 0.0</li>
                          <li>Drug count 5-7: S1 = 0.7</li>
                          <li>Drug count 8-10: S1 = 1.0</li>
                          <li>
                            Drug count &gt; 10: S1 = 1.0 + (drug count - 10) ×
                            0.1
                          </li>
                        </ul>
                      </div>
                      {analysis.riskCalculation.calculation.s1Explanation && (
                        <div className="border-t border-blue-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              Calculated S1:
                            </span>
                            <span className="text-lg font-bold text-blue-900">
                              {analysis.riskCalculation.scores.s1}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1 italic">
                            {analysis.riskCalculation.calculation.s1Explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* S2 Calculation Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    S2 (Age Sub-Score) Calculation
                  </h4>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">
                          Age:
                        </span>
                        <span className="text-lg font-bold text-green-900">
                          {analysis.age} years
                        </span>
                      </div>
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <p className="text-xs text-green-700 mb-2">
                          S2 Calculation Rules:
                        </p>
                        <ul className="text-xs text-green-600 space-y-1 ml-4 list-disc">
                          <li>Age &lt; 65: S2 = 0.0</li>
                          <li>Age 65-74: S2 = 0.5</li>
                          <li>Age 75-84: S2 = 0.7</li>
                          <li>Age ≥ 85: S2 = 1.0</li>
                        </ul>
                      </div>
                      {analysis.riskCalculation.calculation.s2Explanation && (
                        <div className="border-t border-green-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-900">
                              Calculated S2:
                            </span>
                            <span className="text-lg font-bold text-green-900">
                              {analysis.riskCalculation.scores.s2}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1 italic">
                            {analysis.riskCalculation.calculation.s2Explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* S3 Calculation Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    S3 (DDI Sub-Score) Calculation
                  </h4>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <span className="text-xs text-orange-700">
                            Major DDI:
                          </span>
                          <p className="text-lg font-bold text-orange-900">
                            {severitySummary.Major || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-orange-700">
                            Moderate DDI:
                          </span>
                          <p className="text-lg font-bold text-orange-900">
                            {severitySummary.Moderate || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-orange-700">
                            Minor DDI:
                          </span>
                          <p className="text-lg font-bold text-orange-900">
                            {severitySummary.Minor || 0}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-orange-200 pt-2 mt-2">
                        <p className="text-xs text-orange-700 mb-2">
                          S3 Calculation Rules:
                        </p>
                        <ul className="text-xs text-orange-600 space-y-1 ml-4 list-disc">
                          <li>Major DDI: 1.0 × Major DDI Count</li>
                          <li>Moderate DDI: 0.6 × Moderate DDI Count</li>
                          <li>Minor DDI: 0.3 × Minor DDI Count</li>
                          <li>
                            S3 = (Major × 1.0) + (Moderate × 0.6) + (Minor ×
                            0.3)
                          </li>
                          <li>No DDI: S3 = 0.0</li>
                        </ul>
                      </div>
                      {analysis.riskCalculation.calculation.s3Explanation && (
                        <div className="border-t border-orange-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-900">
                              Calculated S3:
                            </span>
                            <span className="text-lg font-bold text-orange-900">
                              {analysis.riskCalculation.scores.s3}
                            </span>
                          </div>
                          <p className="text-xs text-orange-600 mt-1 italic">
                            {analysis.riskCalculation.calculation.s3Explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* S4 Calculation Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    S4 (Liver Function Sub-Score) Calculation
                  </h4>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">
                          Liver Function:
                        </span>
                        <span className="text-lg font-bold text-purple-900">
                          {analysis.liverFunction}
                        </span>
                      </div>
                      <div className="border-t border-purple-200 pt-2 mt-2">
                        <p className="text-xs text-purple-700 mb-2">
                          S4 Calculation Rules:
                        </p>
                        <ul className="text-xs text-purple-600 space-y-1 ml-4 list-disc">
                          <li>Normal (&lt;40 IU/L): S4 = 0.0</li>
                          <li>Mild risk (40-80 IU/L): S4 = 0.3</li>
                          <li>Moderate risk (80-150 IU/L): S4 = 0.6</li>
                          <li>Severe risk (&gt;150 IU/L): S4 = 1.0</li>
                        </ul>
                      </div>
                      {analysis.riskCalculation.calculation.s4Explanation && (
                        <div className="border-t border-purple-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-900">
                              Calculated S4:
                            </span>
                            <span className="text-lg font-bold text-purple-900">
                              {analysis.riskCalculation.scores.s4}
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 mt-1 italic">
                            {analysis.riskCalculation.calculation.s4Explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* S5 Calculation Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    S5 (Kidney Function Sub-Score) Calculation
                  </h4>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-teal-900">
                          Kidney Function:
                        </span>
                        <span className="text-lg font-bold text-teal-900">
                          {analysis.kidneyFunction}
                        </span>
                      </div>
                      <div className="border-t border-teal-200 pt-2 mt-2">
                        <p className="text-xs text-teal-700 mb-2">
                          S5 Calculation Rules:
                        </p>
                        <ul className="text-xs text-teal-600 space-y-1 ml-4 list-disc">
                          <li>Stage 1 (eGFR 90): S5 = 0.0</li>
                          <li>Stage 2 (eGFR 60-89): S5 = 0.3</li>
                          <li>Stage 3a (eGFR 45-59): S5 = 0.5</li>
                          <li>Stage 3b (eGFR 30-44): S5 = 0.7</li>
                          <li>Stage 4 (eGFR 15-29): S5 = 0.9</li>
                          <li>Stage 5 (eGFR &lt;15): S5 = 1.0</li>
                        </ul>
                      </div>
                      {analysis.riskCalculation.calculation.s5Explanation && (
                        <div className="border-t border-teal-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-teal-900">
                              Calculated S5:
                            </span>
                            <span className="text-lg font-bold text-teal-900">
                              {analysis.riskCalculation.scores.s5}
                            </span>
                          </div>
                          <p className="text-xs text-teal-600 mt-1 italic">
                            {analysis.riskCalculation.calculation.s5Explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculation Components */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Weighted Components
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        Drug Component ={" "}
                        {analysis.riskCalculation.weights.drugWeight} ×{" "}
                        {analysis.riskCalculation.scores.s1} (S1 from{" "}
                        {analysis.drugCount} drugs)
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        = {analysis.riskCalculation.calculation.drugComponent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        Age Component ={" "}
                        {analysis.riskCalculation.weights.ageWeight} ×{" "}
                        {analysis.riskCalculation.scores.s2}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        = {analysis.riskCalculation.calculation.ageComponent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        DDI Component ={" "}
                        {analysis.riskCalculation.weights.ddiWeight} ×{" "}
                        {analysis.riskCalculation.scores.s3}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        = {analysis.riskCalculation.calculation.ddiComponent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        Liver Component ={" "}
                        {analysis.riskCalculation.weights.liverWeight} ×{" "}
                        {analysis.riskCalculation.scores.s4}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        = {analysis.riskCalculation.calculation.liverComponent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        Kidney Component ={" "}
                        {analysis.riskCalculation.weights.kidneyWeight} ×{" "}
                        {analysis.riskCalculation.scores.s5}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        = {analysis.riskCalculation.calculation.kidneyComponent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border-2 border-indigo-300 bg-indigo-50 p-4 mt-3">
                      <span className="text-base font-semibold text-indigo-900">
                        Total Risk Score
                      </span>
                      <span className="text-2xl font-bold text-indigo-900">
                        = {analysis.riskCalculation.riskScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Categories */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Risk Categories
                  </h4>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div
                      className={`rounded-lg border p-3 ${
                        analysis.riskCalculation.riskScore < 30
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-600">Low</p>
                      <p className="text-sm font-medium text-gray-900">
                        0 - 29
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 ${
                        analysis.riskCalculation.riskScore >= 30 &&
                        analysis.riskCalculation.riskScore < 60
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-600">Moderate</p>
                      <p className="text-sm font-medium text-gray-900">
                        30 - 59
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 ${
                        analysis.riskCalculation.riskScore >= 60 &&
                        analysis.riskCalculation.riskScore < 80
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-600">High</p>
                      <p className="text-sm font-medium text-gray-900">
                        60 - 79
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 ${
                        analysis.riskCalculation.riskScore >= 80
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-600">Very High</p>
                      <p className="text-sm font-medium text-gray-900">≥ 80</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Interaction Breakdown
              </h3>
              {analysis.interactions.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  No interactions were found for this drug list.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-2">Drug A</th>
                        <th className="px-4 py-2">Drug B</th>
                        <th className="px-4 py-2">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.interactions.map((interaction, index) => (
                        <tr
                          key={`${interaction.drugA}-${interaction.drugB}-${index}`}
                          className="border-t"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {interaction.drugA}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {interaction.drugB}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                interaction.severity === "Major"
                                  ? "bg-rose-100 text-rose-700"
                                  : interaction.severity === "Moderate"
                                  ? "bg-amber-100 text-amber-700"
                                  : interaction.severity === "Minor"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {interaction.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {interaction.ddinterIdA || "—"} /{" "}
                            {interaction.ddinterIdB || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PolypharmacyPage;

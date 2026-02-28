"use client";

import { useAuth } from "@/app/components/Contexts/AuthContext";
import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SeveritySummary = Record<string, number>;

type Interaction = {
  drugA: string;
  drugB: string;
  severity: string;
  description?: string;
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
  const router = useRouter();
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

  useEffect(() => {
    // Fetch saved assessment
    const fetchAssessment = async () => {
      if (!user) return;

      try {
        const response = await fetch(`${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`);
        if (response.ok) {
          const data: AssessmentResponse = await response.json();
          setAnalysis(data);
          // Restore form state
          setDrugs(data.drugs || [""]);
          setAge(String(data.age));
          setLiverFunction(data.liverFunction);
          setKidneyFunction(data.kidneyFunction);
        }
      } catch (error) {
        console.error("Failed to fetch assessment", error);
      }
    };

    fetchAssessment();
  }, [user]);

  const handleClear = async () => {
    if (!user) return;

    try {
      await fetch(`${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`, {
        method: "DELETE",
      });
      setAnalysis(null);
      setDrugs([""]);
      setAge("");
      setLiverFunction("");
      setKidneyFunction("");
      setSuccessMessage("Analysis cleared successfully.");
    } catch (error) {
      setError("Failed to clear analysis.");
    }
  };

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
      router.push("/Pages/Polypharmacy/DashBoard");
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
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href="/Pages/Polypharmacy/Homepage"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <span>←</span> Polypharmacy Risk Analysis Hub
            </Link>
            {analysis && (
              <Link
                href="/Pages/Polypharmacy/DashBoard"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-all hover:bg-indigo-100"
              >
                <span>📊</span> View Last Risk Breakdown
              </Link>
            )}
          </div>
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
                    className={`mt-1 w-full rounded-xl border px-4 py-2 text-gray-900 focus:outline-none ${ageError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"
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


      </div>
    </div>
  );
};

export default PolypharmacyPage;

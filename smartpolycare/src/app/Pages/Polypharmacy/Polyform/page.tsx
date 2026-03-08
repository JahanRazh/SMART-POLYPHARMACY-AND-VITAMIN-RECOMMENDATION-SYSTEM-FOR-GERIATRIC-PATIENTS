"use client";

import { useAuth } from "@/app/components/Contexts/AuthContext";
import React, { FormEvent, useEffect, useRef, useState } from "react";
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
  existingDiseases?: string[];
  adePredictions?: {
    drug: string;
    disease: string;
    predictedADE: string;
    confidence: number;
  }[];
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
  const [isLoadingVitaminDrugs, setIsLoadingVitaminDrugs] =
    useState<boolean>(false);
  const [existingDiseases, setExistingDiseases] = useState<string[]>([""]);
  const [activeDiseaseIndex, setActiveDiseaseIndex] = useState<number | null>(
    null,
  );
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<string[]>([]);
  const initialLoadDone = useRef(false);

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

  // Auto-add/remove diseases based on liver and kidney function selections
  useEffect(() => {
    const liverLower = liverFunction.toLowerCase();
    const isSevereLiver =
      liverLower.includes("severe") || liverLower.includes(">150");
    const kidneyLower = kidneyFunction.toLowerCase();
    const isSevereKidney =
      kidneyLower.includes("stage 5") || kidneyLower.includes("below 15");

    setExistingDiseases((prev) => {
      let updated = prev.filter(
        (d) => d !== "Liver Issues" && d !== "Kidney Issues",
      );

      const autoEntries: string[] = [];
      if (isSevereLiver) autoEntries.push("Liver Issues");
      if (isSevereKidney) autoEntries.push("Kidney Issues");

      // Prepend auto entries
      updated = [...autoEntries, ...updated];

      // Ensure there's always at least one empty slot for manual entry
      if (updated.length === 0 || updated.every((d) => d.trim() !== "")) {
        updated.push("");
      }

      return updated;
    });
  }, [liverFunction, kidneyFunction]);

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

  // Auto-save Patient Snapshot fields to Firestore on change (debounced)
  useEffect(() => {
    // Skip the initial render / auto-fill phase
    if (!initialLoadDone.current) {
      if (user && (firstName || lastName || gender || age)) {
        initialLoadDone.current = true;
      }
      return;
    }

    if (!user) return;

    const timer = setTimeout(() => {
      const payload: Record<string, unknown> = { userId: user.uid };
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (gender) payload.gender = gender;
      const ageNum = parseInt(age, 10);
      if (!isNaN(ageNum) && ageNum > 0 && ageNum <= 120) payload.age = ageNum;
      const nameFromFields =
        `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
      if (nameFromFields) payload.displayName = nameFromFields;

      fetch(`${API_BASE}/api/polypharmacy/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [firstName, lastName, gender, age, user]);

  useEffect(() => {
    // Auto-fill full name based on firstName and lastName
    const nameFromFields =
      `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();

    // In self mode, initially prefer displayName from profile if firstName/lastName are empty
    if (
      userProfile?.displayName &&
      !firstName &&
      !lastName &&
      !fullName &&
      !isFullNameDirty
    ) {
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
        const response = await fetch(
          `${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`,
        );
        if (response.ok) {
          const data: AssessmentResponse = await response.json();
          setAnalysis(data);
          // Restore form state
          setDrugs(data.drugs || [""]);
          setAge(String(data.age));
          setLiverFunction(data.liverFunction);
          setKidneyFunction(data.kidneyFunction);
          setExistingDiseases(
            data.existingDiseases && data.existingDiseases.length > 0
              ? data.existingDiseases
              : [""],
          );
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
      await fetch(
        `${API_BASE}/api/polypharmacy/assessment?userId=${user.uid}`,
        {
          method: "DELETE",
        },
      );
      setAnalysis(null);
      setDrugs([""]);
      setAge("");
      setLiverFunction("");
      setKidneyFunction("");
      setExistingDiseases([""]);
      setSuccessMessage("Analysis cleared successfully.");
    } catch (error) {
      setError("Failed to clear analysis.");
    }
  };

  const loadDrugsFromVitaminAssessment = async () => {
    if (!user) {
      setError("Please sign in to load drugs from Vitamin Assessment.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setIsLoadingVitaminDrugs(true);
    try {
      const response = await fetch(
        `${API_BASE || "http://localhost:5000"}/api/vitamin-deficiency/assessment?userId=${user.uid}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.inputDrugs && data.inputDrugs.length > 0) {
          const validDrugs = data.inputDrugs.filter(
            (d: string) => d.trim().length > 0,
          );
          if (validDrugs.length > 0) {
            // Merge valid drugs, removing empty slots, but keeping current valid ones if we wanted to merge.
            // Requirement asks to "import patient drug ... using load drug button", setting the ones from vitamin assessment is simplest.
            setDrugs(validDrugs);
            setSuccessMessage(
              "Drugs loaded successfully from Vitamin Deficiency Assessment.",
            );
          } else {
            setError(
              "No valid drugs found in your Vitamin Deficiency Assessment.",
            );
          }
        } else {
          setError("No drugs found in your Vitamin Deficiency Assessment.");
        }
      } else {
        setError("Failed to fetch Vitamin Deficiency Assessment.");
      }
    } catch (err) {
      setError("Error loading drugs from Vitamin Assessment.");
    } finally {
      setIsLoadingVitaminDrugs(false);
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
        },
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
      prev.map((drug, idx) => (idx === index ? suggestion : drug)),
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
          gender: gender,
          liverFunction: liverFunction,
          kidneyFunction: kidneyFunction,
          existingDiseases: existingDiseases
            .map((d) => d.trim())
            .filter((d) => d),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to analyze polypharmacy risk.",
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] rounded-full bg-violet-400/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]"></div>
      </div>
      <div className="relative z-10 pb-20">
        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <img
              src="/clinical_hero.png"
              alt="Clinical environment"
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-indigo-800/70 to-violet-900/80" />
          </div>

          <div className="relative container mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                href="/Pages/Polypharmacy/Homepage"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Overview
              </Link>
              {analysis && (
                <Link
                  href="/Pages/Polypharmacy/DashBoard"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-emerald-100 transition-all hover:bg-emerald-500/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                  </svg>
                  View Risk Dashboard
                </Link>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Polypharmacy Risk Assessment Form
                </span>
                <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl leading-tight">
                  Personalized Drug Interaction
                  <span className="block text-indigo-200">
                    Analysis & Adverse Drug Event Prediction
                  </span>
                </h1>
                <p className="mt-3 text-indigo-100/80 leading-relaxed max-w-lg">
                  Enter your patient details and medication list. Our ML-powered
                  engine cross-references every drug combination against a
                  comprehensive knowledge base of 200K+ interactions in real
                  time.
                </p>

                {/* Quick info pills */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-emerald-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto-fill from profile
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-amber-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Smart drug suggestions
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-rose-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ADE prediction
                  </span>
                </div>
              </div>

              {/* Hero image card */}
              <div className="hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
                  <img
                    src="/patient_care.png"
                    alt="Doctor consulting with patient"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white/90 text-sm font-medium">
                      Evidence-Based Clinical Support
                    </p>
                    <p className="text-indigo-200/70 text-xs mt-1">
                      Designed for geriatric polypharmacy risk management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="container mx-auto max-w-5xl px-6 py-10">
          {!user && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Please sign in to run a polypharmacy risk analysis.
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── PATIENT SNAPSHOT ── */}
            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Patient Snapshot
                  </h2>
                  <p className="text-sm text-gray-500">
                    We auto-fill from your profile. Update any field as needed.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="mt-2 w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all placeholder:text-gray-400 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                    className="mt-2 w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all placeholder:text-gray-400 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                    className="mt-2 w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all placeholder:text-gray-400 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                      className="mt-2 w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          setAge(val);
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
                      className={`mt-2 w-full rounded-2xl border px-5 py-3 text-gray-900 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-4 ${
                        ageError
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-200/80 bg-white/50 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                      }`}
                    />
                    {ageError && (
                      <p className="mt-1 text-sm text-red-600">{ageError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Organ Function — separate visual block */}
              <div className="mt-8 relative overflow-hidden rounded-2xl border border-purple-100/50 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-purple-600"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-800">
                    Organ Function Assessment
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Liver Function (ALT/AST Level) *
                    </label>
                    <select
                      value={liverFunction}
                      onChange={(e) => setLiverFunction(e.target.value)}
                      required
                      className="mt-2 w-full rounded-2xl border border-purple-200/80 bg-white/60 px-5 py-3 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:border-purple-300 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10"
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
                      className="mt-2 w-full rounded-2xl border border-purple-200/80 bg-white/60 px-5 py-3 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:border-purple-300 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10"
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

            {/* ── EXISTING DISEASES ── */}
            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Existing Conditions
                    </h2>
                    <p className="text-sm text-gray-500">
                      Pre-existing diseases help predict adverse drug events
                      more accurately.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExistingDiseases((prev) => [...prev, ""])}
                  className="group flex items-center gap-2 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-orange-300 hover:shadow-[0_4px_15px_rgba(249,115,22,0.1)] hover:-translate-y-0.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Condition
                </button>
              </div>
              <div className="space-y-3">
                {existingDiseases.map((disease, index) => (
                  <div key={`disease-${index}`} className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={disease}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setExistingDiseases((prev) =>
                            prev.map((d, idx) => (idx === index ? value : d)),
                          );
                          setActiveDiseaseIndex(index);
                          const query = value.trim();
                          if (!query) {
                            setDiseaseSuggestions([]);
                            return;
                          }
                          try {
                            const params = new URLSearchParams({
                              q: query,
                              limit: "15",
                            });
                            const res = await fetch(
                              `${API_BASE}/api/polypharmacy/diseases/search?${params.toString()}`,
                            );
                            const data = await res.json().catch(() => null);
                            if (res.ok && data?.items) {
                              const currentDiseases = existingDiseases.map(
                                (d) => d.trim().toLowerCase(),
                              );
                              const filtered = data.items.filter(
                                (item: string) =>
                                  !currentDiseases.includes(item.toLowerCase()),
                              );
                              setDiseaseSuggestions(filtered);
                            } else {
                              setDiseaseSuggestions([]);
                            }
                          } catch {
                            setDiseaseSuggestions([]);
                          }
                        }}
                        onFocus={() => setActiveDiseaseIndex(index)}
                        onBlur={() => {
                          setTimeout(() => setActiveDiseaseIndex(null), 150);
                        }}
                        placeholder={`Condition ${index + 1}`}
                        className="w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-gray-400 hover:border-orange-300 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                      />
                      {activeDiseaseIndex === index &&
                        diseaseSuggestions.length > 0 && (
                          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                            {diseaseSuggestions.map((suggestion) => (
                              <li
                                key={suggestion}
                                className="cursor-pointer px-3 py-2 text-sm text-gray-800 hover:bg-orange-50"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setExistingDiseases((prev) =>
                                    prev.map((d, idx) =>
                                      idx === index ? suggestion : d,
                                    ),
                                  );
                                  setActiveDiseaseIndex(null);
                                  setDiseaseSuggestions([]);
                                }}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    {existingDiseases.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExistingDiseases((prev) =>
                            prev.filter((_, idx) => idx !== index),
                          )
                        }
                        className="h-fit rounded-2xl border border-gray-200/80 bg-white/50 px-3 py-3 text-sm text-gray-500 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── MEDICATION LIST ── */}
            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                      <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Medication List
                    </h2>
                    <p className="text-sm text-gray-500">
                      Add all current medications. Use generic names (e.g.,
                      Conjugated estrogens).
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadDrugsFromVitaminAssessment}
                    disabled={isLoadingVitaminDrugs || !user}
                    className="group flex items-center gap-2 rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-2.5 text-sm font-semibold text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-blue-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    title="Import from Vitamin Deficiency Assessment"
                  >
                    {isLoadingVitaminDrugs ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    Load Patient Drugs
                  </button>
                  <button
                    type="button"
                    onClick={addDrugField}
                    disabled={drugs.length >= MAX_DRUGS}
                    className="group flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-2.5 text-sm font-semibold text-emerald-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-emerald-300 hover:shadow-[0_4px_15px_rgba(16,185,129,0.1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add Drug ({drugs.length}/{MAX_DRUGS})
                  </button>
                </div>
              </div>

              {/* Medication analysis image inline */}
              <div className="mb-5 rounded-xl overflow-hidden border border-emerald-100">
                <div className="relative h-28">
                  <img
                    src="/medication_analysis.png"
                    alt="Drug interaction analysis"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 via-emerald-800/50 to-transparent flex items-center pl-5">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        AI-Powered Drug Screening
                      </p>
                      <p className="text-emerald-100/80 text-xs mt-0.5">
                        Every pair checked — N×(N-1)/2 comparisons
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {drugs.map((drug, index) => (
                  <div key={`drug-${index}`} className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-sm font-bold text-emerald-700 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] flex-shrink-0">
                      {index + 1}
                    </div>
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
                        placeholder={`Medication name`}
                        className="w-full rounded-2xl border border-gray-200/80 bg-white/50 px-5 py-3 text-gray-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-gray-400 hover:border-emerald-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                      />
                      {activeDrugIndex === index &&
                        drugSuggestions.length > 0 && (
                          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                            {drugSuggestions.map((suggestion) => (
                              <li
                                key={suggestion}
                                className="cursor-pointer px-3 py-2 text-sm text-gray-800 hover:bg-emerald-50"
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
                        className="h-fit rounded-2xl border border-gray-200/80 bg-white/50 px-3 py-3 text-sm text-gray-500 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── SUBMIT ── */}
            <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 via-white/60 to-violet-50/80 p-8 shadow-xl shadow-indigo-100/30 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-900">
                    Comprehensive Analysis
                  </h3>
                  <p className="text-sm text-indigo-700/80 mt-0.5">
                    All drug pairs will be checked (N×(N-1)/2 comparisons) + ADE
                    prediction.
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={!user || isSubmitting}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-4 text-base font-bold text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze & Predict
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
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PolypharmacyPage;

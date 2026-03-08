"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import MealDetailsForm from "./mealdetailsform";
import MealPlanResult from "./MealPlanResult";
import {
  Eye,
  Download,
  Calendar,
  FileText,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/app/components/Contexts/AuthContext";

/* ───────────────── animation helpers ───────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as any },
});

/* ───────────────── types ───────────────── */
export type ProviderCategory = {
  key: string;
  label: string;
  description: string;
  features: Array<{ title: string; detail: string }>;
};

interface SavedMealPlan {
  id: string;
  selectedPlan: {
    name: string;
    patientName: string;
    patientAge?: string;
    patientGender?: string;
    bmi: number;
    bmiCategory: string;
    bmiAdvice?: string;
    dailyCalorieRange?: string;
    weight?: string;
    height?: string;
    activityLevel?: string;
    plan_duration?: string;
    medicalConditions?: string[];
    dietaryRestrictions?: string[];
    vitaminDeficiencies?: { name: string; level: string }[];
    conditions?: string[];
    dietary_restrictions?: string[];
    vitamin_deficiencies?: any[];
    basicProfile?: any;
    selectedDay: string;
    totalCalories: number;
    numberOfMeals: number;
    timestamp: string;
    weeklyPlan?: {
      [key: string]: {
        meals: string[];
        total_calories: number;
      };
    };
  };
  height?: string;
  weight?: string;
  activityLevel?: string;
  plan_duration?: string;
  vitamin_deficiencies?: any[];
  user?: any;
  createdAt: string;
  planName: string;
  patientName: string;
  bmi: number;
  originalPlanId?: string;
}

/* ───────────────── main page ───────────────── */
export default function MealPlanProvidersPage() {
  const [showForm, setShowForm] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [activePlan, setActivePlan] = useState<SavedMealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const { user } = useAuth() as any;

  const loadSavedPlans = () => {
    try {
      const saved = localStorage.getItem("savedMealPlans");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setActivePlan(parsed[0]);
          setShowSavedPlans(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Error parsing saved plans from local storage:", error);
    }
    setActivePlan(null);
    setShowSavedPlans(false);
  };

  useEffect(() => {
    // Only run when user changes, and avoid running if loading
    if (!user) {
      loadSavedPlans();
      return;
    }
    if (user.uid) {
      fetchActivePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const fetchActivePlan = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/meal-plans/active?userId=${user.uid}`,
      );
      if (response.status === 404) {
        // No active plan found, show message or fallback
        console.warn("No active meal plan found for user.");
        setActivePlan(null);
        setShowSavedPlans(false);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`Backend responded with status ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched meal plan from backend:", data);
      if (!data || Object.keys(data).length === 0) {
        // No plan found, fallback to local
        loadSavedPlans();
      } else {
        setActivePlan(data);
        setShowSavedPlans(true);
      }
    } catch (error) {
      console.warn("Error fetching active plan (fallback to local data):", error instanceof Error ? error.message : String(error));
      loadSavedPlans();
    } finally {
      setLoading(false);
    }
  };

  const savePlanToLocalStorage = (plan: any) => {
    try {
      const newPlan = {
        id: Date.now().toString(),
        selectedPlan: plan.selectedPlan,
        originalPlanId:
          plan.originalPlanId ||
          (plan.selectedPlan as any).databaseId ||
          (plan.selectedPlan as any).id ||
          "unknown",
        createdAt: new Date().toISOString(),
        planName: plan.selectedPlan.name,
        patientName: plan.selectedPlan.patientName,
        bmi: plan.selectedPlan.bmi,
      };
      localStorage.setItem("savedMealPlans", JSON.stringify([newPlan]));
      setActivePlan(newPlan);
      return newPlan;
    } catch (error) {
      console.error("Error saving plan to localStorage:", error);
      return null;
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete your active meal plan?"))
      return;
    try {
      // 1. Remove from Firestore via backend (if user is logged in)
      if (user?.uid) {
        const response = await fetch(
          `http://127.0.0.1:5000/api/meal-plans/delete?userId=${user.uid}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.error("❌ Backend delete failed:", err);
          // Still clear local state even if backend fails
        } else {
          console.log("✅ Meal plan deleted from database");
        }
      }
      // 2. Always clear localStorage
      localStorage.removeItem("savedMealPlans");
      setActivePlan(null);
      setShowPlanDetails(false);
      setShowSavedPlans(false);
    } catch (error) {
      console.error("Error deleting plan:", error);
      // Still clear local state so UI doesn't get stuck
      localStorage.removeItem("savedMealPlans");
      setActivePlan(null);
      setShowPlanDetails(false);
      setShowSavedPlans(false);
    }
  };

  const viewPlanDetails = (plan: SavedMealPlan) => setShowPlanDetails(true);

  const exportPlan = (plan: SavedMealPlan) => {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `meal-plan-${plan.selectedPlan.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ─── routing ─── */
  if (showForm) {
    return (
      <MealDetailsForm
        onBack={() => setShowForm(false)}
        onSavePlan={savePlanToLocalStorage}
      />
    );
  }

  if (showPlanDetails && activePlan) {
    return (
      <PlanDetailsView
        plan={activePlan}
        onBack={() => setShowPlanDetails(false)}
        onExport={() => exportPlan(activePlan)}
        onDelete={() => {
          deletePlan(activePlan.id);
          setShowPlanDetails(false);
        }}
      />
    );
  }

  /* ─── homepage ─── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white text-gray-900">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto max-w-6xl px-6 pt-24 pb-16 relative">
          <motion.div {...fadeUp()} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Geriatric Nutrition Hub
            </span>

            <h1 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">
              Personalised Meal Planning
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                for Elderly Patients
              </span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-600 md:text-xl max-w-2xl">
              AI-generated, BMI-calibrated 28-day meal plans tailored to your
              medical conditions, vitamin deficiencies, and drug-food safety
              requirements — all in one clinical dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {!activePlan ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 hover:-translate-y-0.5"
                >
                  Create My Meal Plan
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowPlanDetails(true)}
                  className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 hover:-translate-y-0.5"
                >
                  <Eye className="h-4 w-4" />
                  View My Active Plan
                </button>
              )}

              <button
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:-translate-y-0.5"
              >
                {showSavedPlans ? "Hide Plan Summary" : "View Plan Summary"}
                {activePlan && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Hero stat cards */}
          <motion.div
            {...fadeUp(0.25)}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              label="Plan Duration"
              value="28-Day"
              sub="Full monthly schedule"
              accent="emerald"
            />
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              label="Generation"
              value="Instant"
              sub="AI-powered planning"
              accent="teal"
            />
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              }
              label="Conditions"
              value="10+"
              sub="Medical conditions handled"
              accent="rose"
            />
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              label="Calibration"
              value="BMI"
              sub="Personalised calorie targets"
              accent="amber"
            />
          </motion.div>
        </div>
      </section>

      {/* Active Plan Summary panel */}
      {showSavedPlans && (
        <section className="container mx-auto max-w-6xl px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Current Meal Plan
              </h2>
              <span className="text-sm text-gray-500">
                One plan active at a time
              </span>
            </div>

            {!activePlan ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No active plan yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your personalised geriatric meal plan to get started
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  + Create My Plan
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="border-2 border-emerald-100 bg-emerald-50/30 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 rounded-lg text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl group-hover:text-emerald-700 transition-colors">
                          {activePlan.selectedPlan.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Patient: {activePlan.selectedPlan.patientName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePlan(activePlan.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-3 rounded-xl border border-emerald-50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Status
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-semibold text-gray-700">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Patient BMI
                      </p>
                      <p className="text-sm font-bold text-emerald-700">
                        {activePlan.selectedPlan.bmi} (
                        {activePlan.selectedPlan.bmiCategory})
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Daily Goal
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        {activePlan.selectedPlan.totalCalories} kcal
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Meals
                      </p>
                      <p className="text-sm font-bold text-gray-700 text-center">
                        {activePlan.selectedPlan.numberOfMeals} / Day
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => viewPlanDetails(activePlan)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      View Active Plan
                    </button>
                    <button
                      onClick={() => exportPlan(activePlan)}
                      className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-emerald-300 transition-all"
                      title="Export JSON"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-100/50 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Last Updated: {formatDate(activePlan.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* ── WHAT IS GERIATRIC NUTRITION ── */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Understanding the Need"
            title="Why Geriatric Nutrition Matters"
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <p className="text-gray-600 leading-relaxed text-[15px]">
                <strong className="text-gray-900">Geriatric nutrition</strong>{" "}
                addresses the unique dietary needs of elderly patients aged 65
                and above. As people age, their metabolism slows, nutrient
                absorption decreases, and <strong>chronic conditions</strong>{" "}
                like diabetes, hypertension, and osteoporosis become more
                prevalent.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed text-[15px]">
                Elderly patients on multiple medications face additional risks
                from drug–food interactions. Clinical evidence shows that
                properly managed geriatric nutrition can reduce hospital
                readmission rates by{" "}
                <strong className="text-emerald-600">up to 30%</strong> and
                significantly improve quality of life.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-sm">
              <h3 className="text-base font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 text-emerald-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Why a Specialised Plan?
              </h3>
              <ul className="space-y-3">
                {[
                  "Over 65% of elderly patients have at least one chronic condition affecting diet",
                  "Drug–food interactions can reduce medication efficacy or cause toxicity",
                  "Vitamin B12, D, and calcium deficiencies are 3× more common after age 70",
                  "Caloric needs decrease but protein and micronutrient needs increase with age",
                  "AI-calibrated meal plans reduce manual consultation burden on caregivers",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-emerald-900/80"
                  >
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200/60 text-xs font-bold text-emerald-700">
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
              title="How Your Meal Plan is Generated"
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <StepCard
                step="01"
                title="Enter Health Details"
                desc="Provide your age, gender, BMI, medical conditions, vitamin deficiencies, dietary restrictions, and current medications through a guided clinical form."
                color="emerald"
              />
              <StepCard
                step="02"
                title="AI Generates Your Plan"
                desc="Our system cross-references your health profile with a database of geriatric-safe foods, calculates calorie targets, and produces a balanced 28-day weekly schedule."
                color="teal"
              />
              <StepCard
                step="03"
                title="Follow & Track Daily"
                desc="Access your full weekly plan, track meals day-by-day, monitor progress, and receive patient-specific safety instructions for each session."
                color="cyan"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PLAN FEATURES ── */}
      <section className="container mx-auto max-w-6xl px-6 py-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Core Capabilities"
            title="What Your Meal Plan Includes"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="BMI-Calibrated Calories"
              desc="Daily calorie targets are computed from your BMI, weight, activity level, and age to ensure safe, effective nutrition delivery."
              accent="emerald"
            />
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              }
              title="Medical Condition Filters"
              desc="Plans adapt to diabetes, hypertension, osteoporosis, heart disease, and more — automatically adjusting food selections to match each condition."
              accent="rose"
            />
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="Vitamin-Rich Meal Selections"
              desc="If you have B12, Vitamin D, Folate, or other deficiencies, foods rich in those nutrients are prioritised throughout your weekly plan."
              accent="amber"
            />
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="Drug–Food Safety"
              desc="Dangerous food–drug combinations are avoided. For patients on polypharmacy, the system flags and filters foods that interfere with common medications."
              accent="indigo"
            />
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="28-Day Weekly Schedule"
              desc="A complete 4-week rotating meal schedule with breakfast, lunch, dinner, and snacks — keeping variety high while ensuring nutritional consistency."
              accent="teal"
            />
            <FeatureCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="Progress Tracking"
              desc="Mark meals as consumed day-by-day. Your progress is saved to the cloud and your caregiver or clinician can review adherence over time."
              accent="purple"
            />
          </div>
        </motion.div>
      </section>

      {/* ── WHO BENEFITS ── */}
      <section className="container mx-auto max-w-6xl px-6 pb-16">
        <motion.div {...fadeUp(0.1)}>
          <SectionHeading
            badge="Who Benefits"
            title="Designed for Geriatric Care Teams"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AudienceCard
              emoji="🧓"
              title="Elderly Patients"
              desc="Follow a safe, personalised daily meal plan that accounts for your conditions, medications, and nutritional needs."
            />
            <AudienceCard
              emoji="👨‍⚕️"
              title="Physicians"
              desc="Prescribe evidence-based dietary interventions alongside pharmacological treatment for holistic geriatric care."
            />
            <AudienceCard
              emoji="👩‍👧‍👦"
              title="Caretakers"
              desc="Monitor your elderly family member's nutrition compliance and receive daily meal suggestions with ease."
            />
            <AudienceCard
              emoji="💊"
              title="Pharmacists"
              desc="Ensure dietary plans are compatible with current drug regimens by leveraging our drug–food interaction filters."
            />
          </div>
        </motion.div>
      </section>

      {/* ── DARK CTA ── */}
      <section className="bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 text-white">
        <div className="container mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.div {...fadeUp(0.1)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Get Started Today
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Create Your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Personalised Meal Plan?
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Fill in your health profile once and receive an instant,
              AI-generated 28-day meal plan calibrated to your BMI, medical
              conditions, and vitamin needs.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {!activePlan ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:-translate-y-0.5"
                >
                  Generate My Plan Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  onClick={() => setShowPlanDetails(true)}
                  className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:-translate-y-0.5"
                >
                  <Eye className="h-5 w-5" />
                  Open My Active Plan
                </button>
              )}
              <button
                onClick={() => setShowSavedPlans(true)}
                className="rounded-xl border border-gray-600 bg-transparent px-8 py-4 text-base font-semibold text-gray-300 shadow-sm transition-all hover:border-emerald-500 hover:text-emerald-400 hover:-translate-y-0.5"
              >
                View Plan Summary
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ────────────────── PLAN DETAILS VIEW ────────────────── */
interface PlanDetailsViewProps {
  plan: SavedMealPlan;
  onBack: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const PlanDetailsView: React.FC<PlanDetailsViewProps> = ({
  plan,
  onBack,
  onExport,
  onDelete,
}) => {
  const mappedResult = {
    databaseId:
      plan.originalPlanId ||
      (plan.selectedPlan as any).databaseId ||
      (plan.selectedPlan as any).id,
    bmi: plan.selectedPlan.bmi,
    bmi_category:
      (!plan.selectedPlan.bmiCategory || plan.selectedPlan.bmiCategory === "N/A")
        ? (plan.selectedPlan.bmi_category || plan.user?.bmiLevel || "N/A")
        : plan.selectedPlan.bmiCategory,
    bmi_advice:
      (!plan.selectedPlan.bmiAdvice || plan.selectedPlan.bmiAdvice === "N/A")
        ? "Follow this personalised meal plan based on your health assessment."
        : plan.selectedPlan.bmiAdvice,
    daily_calorie_range: 
      (!plan.selectedPlan.dailyCalorieRange || plan.selectedPlan.dailyCalorieRange === "N/A")
        ? (plan.selectedPlan.daily_calorie_range || "N/A")
        : plan.selectedPlan.dailyCalorieRange,
    plan_duration: 
      (!plan.selectedPlan.plan_duration || plan.selectedPlan.plan_duration === "N/A")
        ? (plan.selectedPlan.planDuration || "1 Month")
        : plan.selectedPlan.plan_duration,
    conditions:
      (plan.selectedPlan.medicalConditions && plan.selectedPlan.medicalConditions.length > 0)
        ? plan.selectedPlan.medicalConditions
        : (plan.selectedPlan.conditions || []),
    dietary_restrictions:
      (plan.selectedPlan.dietaryRestrictions && plan.selectedPlan.dietaryRestrictions.length > 0)
        ? plan.selectedPlan.dietaryRestrictions
        : (plan.selectedPlan.dietary_restrictions || []),
    vitamin_deficiencies:
      (plan.selectedPlan.vitaminDeficiencies && plan.selectedPlan.vitaminDeficiencies.length > 0)
        ? plan.selectedPlan.vitaminDeficiencies
        : (plan.selectedPlan.vitamin_deficiencies || plan.vitamin_deficiencies || []),
    mealPlanOptions: [plan.selectedPlan as any],
    basicProfile: {
      name: plan.patientName || plan.selectedPlan.patientName || plan.user?.name || "Patient",
      age: plan.selectedPlan.patientAge || plan.user?.age || "N/A",
      gender: plan.selectedPlan.patientGender || plan.user?.gender || "N/A",
      weight: plan.weight || plan.selectedPlan.weight || (plan.user?.weight || "N/A"),
      height: plan.height || (plan.selectedPlan as any).height || (plan.user?.height || "N/A"),
      activityLevel: plan.activityLevel || plan.selectedPlan.activityLevel || (plan.user?.activityLevel || "N/A"),
    },
    weight: plan.weight || plan.selectedPlan.weight || (plan.user?.weight || "N/A"),
    height: plan.height || (plan.selectedPlan as any).height || (plan.user?.height || "N/A"),
    activityLevel: plan.activityLevel || plan.selectedPlan.activityLevel || (plan.user?.activityLevel || "N/A"),
    planDuration: plan.plan_duration || plan.selectedPlan.plan_duration || plan.selectedPlan.planDuration || "1 Month",
    patientWeight: plan.weight || plan.selectedPlan.weight || (plan.user?.weight || "N/A"),
    patientHeight: plan.height || (plan.selectedPlan as any).height || (plan.user?.height || "N/A"),
    patientActivityLevel: plan.activityLevel || plan.selectedPlan.activityLevel || (plan.user?.activityLevel || "N/A"),
    dailyCalorieRange: plan.selectedPlan.dailyCalorieRange || plan.selectedPlan.daily_calorie_range || "N/A",
  };

  return (
    <div className="pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition font-medium"
        >
          ← Back to Overview
        </button>
      </div>
      <MealPlanResult result={mappedResult} />
    </div>
  );
};

/* ────────────────── SHARED COMPONENTS ────────────────── */

function SectionHeading({ badge, title }: { badge: string; title: string }) {
  return (
    <div>
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
        {badge}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-100 bg-white text-emerald-600",
    teal: "border-teal-100 bg-white text-teal-600",
    // ...existing code...
    rose: "border-rose-100 bg-white text-rose-600",
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
    emerald: "from-emerald-500 to-emerald-600",
    teal: "from-teal-500 to-teal-600",
    cyan: "from-cyan-500 to-cyan-600",
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
    emerald: "hover:border-emerald-200",
    rose: "hover:border-rose-200",
    amber: "hover:border-amber-200",
    indigo: "hover:border-indigo-200",
    teal: "hover:border-teal-200",
    purple: "hover:border-purple-200",
  };
  const iconBgMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    teal: "bg-teal-50 text-teal-600",
    purple: "bg-purple-50 text-purple-600",
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

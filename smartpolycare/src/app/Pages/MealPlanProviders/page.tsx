"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import MealDetailsForm from "./mealdetailsform"; // Correct import
import MealPlanResult from "./MealPlanResult";
import { Eye, Download, Calendar, User, FileText, Trash2 } from "lucide-react";

export type ProviderCategory = {
  key: string;
  label: string;
  description: string;
  features: Array<{ title: string; detail: string }>;
};

const providerCategories: ProviderCategory[] = [
  {
    key: "elderly",
    label: "Elderly-Friendly Providers",
    description:
      "Meal providers specializing in soft-texture, low-sodium, and easy-to-digest meals suitable for geriatric patients.",
    features: [
      { title: "Soft-Texture Meals", detail: "Optimized for digestion." },
      {
        title: "Low-Sodium Options",
        detail: "Good for hypertensive patients.",
      },
      { title: "Low-Spice Variants", detail: "Reduces gastric irritation." },
    ],
  },
  {
    key: "deficiency",
    label: "Deficiency-Specific Providers",
    description:
      "Meals tailored for vitamin deficiencies such as B12, D, Folate.",
    features: [
      { title: "B12 Meals", detail: "Fortified cereals, eggs, fish." },
      { title: "Vitamin D Meals", detail: "Fortified milk & baked fish." },
      { title: "Folate Meals", detail: "Leafy greens & legumes." },
    ],
  },
  {
    key: "drugSafety",
    label: "Drug–Food Safe Providers",
    description: "Meals designed to avoid drug–nutrient interactions.",
    features: [
      { title: "Safe with Metformin", detail: "B12-support meals." },
      { title: "Safe with Thyroid Meds", detail: "Avoids calcium conflicts." },
      { title: "Safe with Diuretics", detail: "Potassium-balanced meals." },
    ],
  },
];

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
    activityLevel?: string;
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
  createdAt: string;
  planName: string;
  patientName: string;
  bmi: number;
  originalPlanId?: string;
}

export default function MealPlanProvidersPage() {
  const [showForm, setShowForm] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavedMealPlan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Load saved plans from localStorage on component mount
  useEffect(() => {
    loadSavedPlans();
  }, []);

  const loadSavedPlans = () => {
    try {
      const saved = localStorage.getItem("savedMealPlans");
      if (saved) {
        setSavedPlans(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading saved plans:", error);
    }
  };

  const savePlanToLocalStorage = (plan: any) => {
    try {
      const existingPlans = JSON.parse(
        localStorage.getItem("savedMealPlans") || "[]"
      );
      const newPlan = {
        id: Date.now().toString(),
        selectedPlan: plan.selectedPlan,
        originalPlanId: plan.originalPlanId || (plan.selectedPlan as any).databaseId || (plan.selectedPlan as any).id || "unknown",
        createdAt: new Date().toISOString(),
        planName: plan.selectedPlan.name,
        patientName: plan.selectedPlan.patientName,
        bmi: plan.selectedPlan.bmi,
      };

      const updatedPlans = [newPlan, ...existingPlans.slice(0, 9)]; // Keep last 10 plans
      localStorage.setItem("savedMealPlans", JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);

      return newPlan;
    } catch (error) {
      console.error("Error saving plan to localStorage:", error);
      return null;
    }
  };

  const deletePlan = (id: string) => {
    try {
      const updatedPlans = savedPlans.filter((plan) => plan.id !== id);
      localStorage.setItem("savedMealPlans", JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
        setShowPlanDetails(false);
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const viewPlanDetails = (plan: SavedMealPlan) => {
    setSelectedPlan(plan);
    setShowPlanDetails(true);
  };

  const exportPlan = (plan: SavedMealPlan) => {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `meal-plan-${plan.selectedPlan.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white text-gray-900">
      {/* Show form OR show list */}
      {showForm ? (
        <MealDetailsForm
          onBack={() => setShowForm(false)}
          onSavePlan={savePlanToLocalStorage}
        />
      ) : showPlanDetails && selectedPlan ? (
        <PlanDetailsView
          plan={selectedPlan}
          onBack={() => setShowPlanDetails(false)}
          onExport={() => exportPlan(selectedPlan)}
          onDelete={() => {
            deletePlan(selectedPlan.id);
            setShowPlanDetails(false);
          }}
        />
      ) : (
        <section className="container mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              Meal Plan Provider Hub
            </span>

            <h1 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted Meal Providers for Geriatric Nutrition
            </h1>

            <p className="mt-4 text-gray-600 md:text-lg">
              Explore verified meal service providers offering safe meals for
              elderly patients. Create, save, and manage your meal plans.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                + Create New Meal Plan
              </button>

              <button
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="inline-flex items-center gap-3 rounded-lg border border-blue-600 bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
              >
                <Eye className="w-4 h-4" />
                {showSavedPlans ? "Hide Saved Plans" : "View Saved Plans"}
                {savedPlans.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                    {savedPlans.length}
                  </span>
                )}
              </button>

              {showSavedPlans && savedPlans.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete ALL saved plans?")) {
                      localStorage.removeItem("savedMealPlans");
                      setSavedPlans([]);
                    }
                  }}
                  className="inline-flex items-center gap-3 rounded-lg border border-red-600 bg-white px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  Clear All Plans
                </button>
              )}
            </div>
          </motion.div>

          {/* Saved Plans Section */}
          {showSavedPlans && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Saved Meal Plans
                </h2>
                <span className="text-gray-600">
                  {savedPlans.length} plan{savedPlans.length !== 1 ? "s" : ""}{" "}
                  saved
                </span>
              </div>

              {savedPlans.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No saved plans yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first meal plan to get started
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    + Create First Plan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            {plan.selectedPlan.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Patient: {plan.selectedPlan.patientName}
                          </p>
                        </div>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              plan.selectedPlan.bmiCategory === "Normal"
                                ? "bg-green-500"
                                : plan.selectedPlan.bmiCategory ===
                                  "Underweight"
                                ? "bg-blue-500"
                                : plan.selectedPlan.bmiCategory === "Overweight"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="font-medium">
                            BMI: {plan.selectedPlan.bmi} (
                            {plan.selectedPlan.bmiCategory})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Day: {plan.selectedPlan.selectedDay}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>
                            {plan.selectedPlan.numberOfMeals} meals •{" "}
                            {plan.selectedPlan.totalCalories} kcal
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(plan.createdAt)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => viewPlanDetails(plan)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => exportPlan(plan)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Provider Categories */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Provider Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {providerCategories.map((category) => (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {category.label}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {category.description}
                  </p>

                  <ul className="space-y-3">
                    {category.features.map((feature) => (
                      <li
                        key={feature.title}
                        className="flex gap-3 text-gray-700"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2"></div>
                        <div>
                          <p className="font-semibold">{feature.title}</p>
                          <p className="text-sm text-gray-600">
                            {feature.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Plan Details View Component
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
  // Map SavedMealPlan to the expected format for MealPlanResult
  const mappedResult = {
    databaseId: plan.originalPlanId || (plan.selectedPlan as any).databaseId || (plan.selectedPlan as any).id,
    bmi: plan.selectedPlan.bmi,
    bmi_category: plan.selectedPlan.bmiCategory || "N/A",
    bmi_advice: plan.selectedPlan.bmiAdvice || "Follow this personalized meal plan based on your health assessment.",
    daily_calorie_range: plan.selectedPlan.dailyCalorieRange || "N/A",
    conditions: plan.selectedPlan.medicalConditions || plan.selectedPlan.conditions || [],
    dietary_restrictions: plan.selectedPlan.dietaryRestrictions || plan.selectedPlan.dietary_restrictions || [],
    vitamin_deficiencies: plan.selectedPlan.vitaminDeficiencies || plan.selectedPlan.vitamin_deficiencies || [],
    weight: plan.selectedPlan.weight || plan.selectedPlan.basicProfile?.weight || "N/A",
    mealPlanOptions: [plan.selectedPlan as any], // Cast because the interface is roughly compatible
    basicProfile: {
      name: plan.selectedPlan.patientName,
      age: plan.selectedPlan.patientAge || plan.selectedPlan.basicProfile?.age || "N/A",
      gender: plan.selectedPlan.patientGender || plan.selectedPlan.basicProfile?.gender || "N/A",
      weight: plan.selectedPlan.weight || plan.selectedPlan.basicProfile?.weight || "N/A",
      activityLevel: plan.selectedPlan.activityLevel || plan.selectedPlan.basicProfile?.activityLevel || "N/A",
    },
  };

  return (
    <div className="pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition font-medium"
        >
          ← Back to Saved Plans
        </button>
      </div>
      <MealPlanResult result={mappedResult} />
    </div>
  );
};

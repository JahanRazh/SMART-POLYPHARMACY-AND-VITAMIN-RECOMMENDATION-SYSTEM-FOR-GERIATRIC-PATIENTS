"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import MealDetailsForm from "./mealdetailsform"; // Correct import
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
    bmi: number;
    bmiCategory: string;
    selectedDay: string;
    totalCalories: number;
    numberOfMeals: number;
    timestamp: string;
  };
  createdAt: string;
  planName: string;
  patientName: string;
  bmi: number;
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
  return (
    <div className="container mx-auto px-6 pt-24 pb-20">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
      >
        ← Back to Providers
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {plan.selectedPlan.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Saved on {formatDate(plan.createdAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-blue-700 mb-2">
              Patient Information
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {plan.selectedPlan.patientName}
            </p>
            <p className="text-sm text-gray-600 mt-1">Meal Plan Patient</p>
          </div>

          <div
            className={`rounded-xl p-5 ${
              plan.selectedPlan.bmiCategory === "Normal"
                ? "bg-green-50"
                : plan.selectedPlan.bmiCategory === "Underweight"
                ? "bg-blue-50"
                : plan.selectedPlan.bmiCategory === "Overweight"
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              BMI Status
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {plan.selectedPlan.bmi} ({plan.selectedPlan.bmiCategory})
            </p>
            <p className="text-sm text-gray-600 mt-1">Health Assessment</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-purple-700 mb-2">
              Selected Day
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {plan.selectedPlan.selectedDay}
            </p>
            <p className="text-sm text-gray-600 mt-1">Meal Plan Day</p>
          </div>

          <div className="bg-green-50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-green-700 mb-2">
              Nutrition Summary
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {plan.selectedPlan.totalCalories} kcal
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {plan.selectedPlan.numberOfMeals} meals
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Plan Overview</h4>
              <p className="text-gray-600">
                This meal plan was created for {plan.selectedPlan.patientName}{" "}
                with a BMI of {plan.selectedPlan.bmi}(
                {plan.selectedPlan.bmiCategory}). The plan provides{" "}
                {plan.selectedPlan.totalCalories} calories across{" "}
                {plan.selectedPlan.numberOfMeals} meals for{" "}
                {plan.selectedPlan.selectedDay}.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Storage Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">Plan ID:</span> {plan.id}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(plan.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">Storage:</span> Local Browser
                    Storage
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Data Type:</span> Meal Plan
                    Selection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <span className="font-medium">Note:</span> This is a summary
            view. For detailed meal information including specific foods and
            ingredients, please check the Firebase database or export the
            complete plan.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function for date formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

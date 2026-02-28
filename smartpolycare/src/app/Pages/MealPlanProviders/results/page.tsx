"use client";

import { useEffect, useState } from "react";
import MealPlanResult from "../MealPlanResult";

const MealPlanResultPage = () => {
  const [mealResult, setMealResult] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = sessionStorage.getItem("mealPlanResult");
    const profile = sessionStorage.getItem("patientProfile");

    if (result) {
      try {
        const parsedResult = JSON.parse(result);
        console.log("Parsed mealPlanResult:", parsedResult);
        setMealResult(parsedResult);
      } catch (error) {
        console.error("Error parsing mealPlanResult:", error);
      }
    }

    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        console.log("Parsed patientProfile:", parsedProfile);
        setPatient(parsedProfile);
      } catch (error) {
        console.error("Error parsing patientProfile:", error);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (!mealResult) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Meal Plan Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please go back and create a meal plan first.
            </p>
            <a
              href="/Pages/MealPlanProviders"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go Back to Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* PATIENT DETAILS */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Patient Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Name</p>
              <p className="text-lg font-semibold text-gray-800">
                {patient?.name || "Not provided"}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Age</p>
              <p className="text-lg font-semibold text-gray-800">
                {patient?.age || "Not provided"}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                patient?.bmiLevel === "Normal"
                  ? "bg-green-50"
                  : patient?.bmiLevel === "Overweight" ||
                    patient?.bmiLevel === "Obese"
                  ? "bg-yellow-50"
                  : "bg-blue-50"
              }`}
            >
              <p className="text-sm font-medium">BMI</p>
              <p className="text-lg font-semibold text-gray-800">
                {patient?.bmi || "N/A"}
                {patient?.bmiLevel && ` (${patient.bmiLevel})`}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">
                Activity Level
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {patient?.activityLevel || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* MEAL PLAN */}
        <MealPlanResult result={mealResult} />
      </div>
    </div>
  );
};

export default MealPlanResultPage;

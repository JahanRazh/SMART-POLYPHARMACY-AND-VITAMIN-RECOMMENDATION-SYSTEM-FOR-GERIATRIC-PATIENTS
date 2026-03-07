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

    if (result && profile) {
      try {
        const parsedResult = JSON.parse(result);
        const parsedProfile = JSON.parse(profile);
        
        // Extract clinical data from Profile (Conditions, Restrictions, Deficiencies)
        const conditions = Object.keys(parsedProfile.medicalConditions || {})
          .filter(k => k !== 'other' && parsedProfile.medicalConditions[k]);
        if (parsedProfile.medicalConditions?.other) conditions.push(parsedProfile.medicalConditions.other);

        const restrictions = Object.keys(parsedProfile.dietaryRestrictions || {})
          .filter(k => k !== 'other' && parsedProfile.dietaryRestrictions[k]);
        if (parsedProfile.dietaryRestrictions?.other) restrictions.push(parsedProfile.dietaryRestrictions.other);

        // Merge everything into a unified object for MealPlanResult
        const mergedResult = {
          ...parsedResult,
          basicProfile: parsedProfile.basicProfile,
          conditions: conditions,
          dietary_restrictions: restrictions,
          vitamin_deficiencies: parsedProfile.vitaminDeficiencies || [],
          weight: parsedProfile.basicProfile?.weight,
          bmi: parsedProfile.basicProfile?.bmi,
          bmi_category: parsedProfile.basicProfile?.bmiLevel
        };

        console.log("Unified Meal Result:", mergedResult);
        setMealResult(mergedResult);
        setPatient(parsedProfile.basicProfile);
      } catch (error) {
        console.error("Error synchronizing meal results:", error);
      }
    } else if (result) {
      setMealResult(JSON.parse(result));
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
        {/* MEAL PLAN */}
        <MealPlanResult result={mealResult} />
      </div>
    </div>
  );
};

export default MealPlanResultPage;

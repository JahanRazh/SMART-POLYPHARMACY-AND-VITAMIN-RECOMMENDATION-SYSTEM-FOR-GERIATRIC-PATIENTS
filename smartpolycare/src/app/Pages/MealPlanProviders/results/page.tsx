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

    console.log("DEBUG Refresh - Raw Result from session:", result ? "Present (length: " + result.length + ")" : "MISSING");
    console.log("DEBUG Refresh - Raw Profile from session:", profile ? "Present (length: " + profile.length + ")" : "MISSING");

    if (result) {
      try {
        const parsedResult = JSON.parse(result);
        const parsedProfile = profile ? JSON.parse(profile) : {};
        
        console.log("DEBUG Refresh - Parsed Result Keys:", Object.keys(parsedResult));
        console.log("DEBUG Refresh - Parsed Profile Keys:", Object.keys(parsedProfile));
        if (parsedResult.basicProfile) console.log("DEBUG Refresh - Result.basicProfile Keys:", Object.keys(parsedResult.basicProfile));
        if (parsedProfile.basicProfile) console.log("DEBUG Refresh - Profile.basicProfile Keys:", Object.keys(parsedProfile.basicProfile));

        // Extract clinical data from Profile (Conditions, Restrictions, Deficiencies)
        const conditions = parsedProfile.medicalConditions 
          ? Object.keys(parsedProfile.medicalConditions)
            .filter(k => k !== 'other' && parsedProfile.medicalConditions[k])
          : (parsedResult.conditions || []);
        
        if (parsedProfile.medicalConditions?.other) conditions.push(parsedProfile.medicalConditions.other);

        const restrictions = parsedProfile.dietaryRestrictions
          ? Object.keys(parsedProfile.dietaryRestrictions)
            .filter(k => k !== 'other' && parsedProfile.dietaryRestrictions[k])
          : (parsedResult.dietary_restrictions || []);
          
        if (parsedProfile.dietaryRestrictions?.other) restrictions.push(parsedProfile.dietaryRestrictions.other);

        // Merge everything into a unified object for MealPlanResult
        const mergedResult = {
          ...parsedResult,
          basicProfile: parsedProfile.basicProfile || parsedResult.basicProfile,
          conditions: conditions,
          dietary_restrictions: restrictions,
          vitamin_deficiencies: parsedProfile.vitaminDeficiencies || parsedResult.vitamin_deficiencies || [],
          // Top-level Redundancy (for resilience)
          weight: parsedProfile.basicProfile?.weight || parsedResult.weight || parsedResult.basicProfile?.weight || parsedResult.patientWeight || "N/A",
          height: parsedProfile.basicProfile?.height || parsedResult.height || parsedResult.basicProfile?.height || parsedResult.patientHeight || "N/A",
          activityLevel: parsedProfile.basicProfile?.activityLevel || parsedResult.activityLevel || parsedResult.basicProfile?.activityLevel || parsedResult.patientActivityLevel || "N/A",
          plan_duration: parsedResult.plan_duration || parsedProfile.plan_duration || parsedResult.planDuration || "1 Month",
          // CamelCase Redundancy (for resilience)
          patientWeight: parsedProfile.basicProfile?.weight || parsedResult.weight || parsedResult.basicProfile?.weight || parsedResult.patientWeight,
          patientHeight: parsedProfile.basicProfile?.height || parsedResult.height || parsedResult.basicProfile?.height || parsedResult.patientHeight,
          patientActivityLevel: parsedProfile.basicProfile?.activityLevel || parsedResult.activityLevel || parsedResult.basicProfile?.activityLevel || parsedResult.patientActivityLevel,
          planDuration: parsedResult.plan_duration || parsedProfile.plan_duration || parsedResult.planDuration || "1 Month",
          dailyCalorieRange: parsedResult.daily_calorie_range || parsedResult.dailyCalorieRange || "N/A",
          // BMI Details
          bmi: parsedProfile.basicProfile?.bmi || parsedResult.bmi || parsedResult.basicProfile?.bmi,
          bmi_category: parsedProfile.basicProfile?.bmiLevel || parsedResult.bmi_category || parsedResult.bmiCategory || parsedResult.bmi_category
        };

        console.log("Unified Meal Result (Robust Merge):", mergedResult);
        setMealResult(mergedResult);
        setPatient(parsedProfile.basicProfile || parsedResult.basicProfile);
      } catch (error) {
        console.error("Error synchronizing meal results:", error);
        // Fallback to raw result if parsing profile fails
        try {
          setMealResult(JSON.parse(result));
        } catch (e) {}
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

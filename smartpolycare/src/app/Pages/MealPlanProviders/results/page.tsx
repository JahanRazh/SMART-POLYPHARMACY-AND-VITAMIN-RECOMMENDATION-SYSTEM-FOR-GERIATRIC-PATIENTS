"use client";

import { useEffect, useState } from "react";
import MealPlanResult from "../MealPlanResult";

const MealPlanResultPage = () => {
  const [mealResult, setMealResult] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = sessionStorage.getItem("mealPlanResult");
    // Check both session and local storage for the profile
    const profile = sessionStorage.getItem("patientProfile") || localStorage.getItem("patientProfile");

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

        // Helper to sanitize "N/A" and handle fallback
        const sanitize = (val: any, fallback: any) => {
          if (val === undefined || val === null || val === "" || val === "N/A" || val === "n/a") {
            return fallback || "N/A";
          }
          return val;
        };

        const profileData = parsedProfile.basicProfile || {};

        const mergedResult = {
          ...parsedResult,
          basicProfile: {
            name: sanitize(parsedResult.patient_name || parsedResult.patientName, profileData.name || "Unknown Patient"),
            age: sanitize(parsedResult.patient_age || parsedResult.patientAge, profileData.age),
            gender: sanitize(parsedResult.patient_gender || parsedResult.patientGender, profileData.gender),
            height: sanitize(parsedResult.height || parsedResult.patientHeight, profileData.height),
            weight: sanitize(parsedResult.weight || parsedResult.patientWeight, profileData.weight),
            bmi: sanitize(parsedResult.bmi, profileData.bmi),
            bmiLevel: sanitize(parsedResult.bmi_category || parsedResult.bmiCategory, profileData.bmiLevel),
            activityLevel: sanitize(parsedResult.activity_level || parsedResult.activityLevel, profileData.activityLevel),
          },
          // Maintenance for flat keys
          patient_name: sanitize(parsedResult.patient_name || parsedResult.patientName, profileData.name || "Unknown Patient"),
          weight: sanitize(parsedResult.weight || parsedResult.patientWeight, profileData.weight),
          height: sanitize(parsedResult.height || parsedResult.patientHeight, profileData.height),
          activity_level: sanitize(parsedResult.activity_level || parsedResult.activityLevel, profileData.activityLevel),
          plan_duration: sanitize(parsedResult.plan_duration || parsedResult.planDuration, parsedProfile.plan_duration || "1 Month"),
          bmi_category: sanitize(parsedResult.bmi_category || parsedResult.bmiCategory, profileData.bmiLevel),
          // Deficiencies and conditions
          vitamin_deficiencies: (parsedResult.vitamin_deficiencies && parsedResult.vitamin_deficiencies.length > 0) ? parsedResult.vitamin_deficiencies : (parsedProfile.vitaminDeficiencies || []),
          conditions: (parsedResult.conditions && parsedResult.conditions.length > 0) ? parsedResult.conditions : (parsedProfile.medicalConditions ? Object.keys(parsedProfile.medicalConditions).filter(k => k !== 'other' && parsedProfile.medicalConditions[k]) : [])
        };

        console.log("Unified Meal Result (Robust Merge):", mergedResult);
        setMealResult(mergedResult);
        setPatient(mergedResult.basicProfile);
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

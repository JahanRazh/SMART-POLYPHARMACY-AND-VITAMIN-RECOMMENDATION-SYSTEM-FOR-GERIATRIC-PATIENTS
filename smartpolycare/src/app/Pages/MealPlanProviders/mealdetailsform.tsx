"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/Contexts/AuthContext";

interface BasicProfile {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  bmi: string;
  bmiLevel: string;
  activityLevel: string;
}

interface MedicalConditions {
  diabetes: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  thyroid: boolean;
  other: string;
}

interface DietaryRestrictions {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutAllergy: boolean;
  other: string;
}

interface FormData {
  basicProfile: BasicProfile;
  medicalConditions: MedicalConditions;
  dietaryRestrictions: DietaryRestrictions;
  vitaminDeficiencies: { name: string; level: string }[];
}

interface MealPlanFormProps {
  onBack?: () => void;
  onSavePlan?: (plan: any) => any;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({ onBack, onSavePlan }) => {
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const router = useRouter();
  const { user, userProfile, updateProfileData } = useAuth() as any;

  const [formData, setFormData] = useState<FormData>({
    basicProfile: {
      name: "",
      age: "",
      gender: "",
      height: "",
      weight: "",
      bmi: "",
      bmiLevel: "",
      activityLevel: "",
    },
    medicalConditions: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      kidneyDisease: false,
      liverDisease: false,
      thyroid: false,
      other: "",
    },
    dietaryRestrictions: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutAllergy: false,
      other: "",
    },
    vitaminDeficiencies: [],
  });

  const [initialFillDone, setInitialFillDone] = useState(false);

  // Auto-fill from user profile
  useEffect(() => {
    if (userProfile && !initialFillDone) {
      const nameFromProfile = userProfile.displayName || 
        `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim();
      
      setFormData(prev => ({
        ...prev,
        basicProfile: {
          ...prev.basicProfile,
          name: prev.basicProfile.name || nameFromProfile || "",
          age: prev.basicProfile.age || String(userProfile.age || ""),
          gender: prev.basicProfile.gender || userProfile.gender || "",
        }
      }));

      if (nameFromProfile || userProfile.age || userProfile.gender) {
        setInitialFillDone(true);
      }
    }
  }, [userProfile, initialFillDone]);

  // Auto-fill from Vitamin Deficiencies Assessment
  useEffect(() => {
    const fetchVitaminDeficiencies = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/vitamin-deficiency/assessment?userId=${user.uid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.predictions && data.predictions.length > 0) {
              setFormData((prev) => {
                // Keep existing manually added ones and only add new unique vitamins
                const existingNames = new Set(prev.vitaminDeficiencies.map(v => v.name));
                const newDeficiencies = data.predictions
                  .filter((p: any) => !existingNames.has(p.vitamin))
                  .map((p: any) => ({ name: p.vitamin, level: "Moderate" }));
                
                if (newDeficiencies.length > 0) {
                  return {
                    ...prev,
                    vitaminDeficiencies: [...prev.vitaminDeficiencies, ...newDeficiencies]
                  };
                }
                return prev;
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch pre-existing vitamin deficiencies:", err);
        }
      }
    };
    
    fetchVitaminDeficiencies();
  }, [user?.uid]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const API_URL = "http://127.0.0.1:5000/api/meal-plans";
  const calculateBMI = (height: string, weight: string) => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        return (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
      }
    }
    return "";
  };

  const calculateBMILevel = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi < 25) return "Normal";
    if (bmi >= 25 && bmi < 30) return "Overweight";
    return "Obese";
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    const b = formData.basicProfile;

    if (!b.name || b.name.length < 3)
      errors.push("Name must be at least 3 characters");
    if (!b.age || +b.age < 18 || +b.age > 120)
      errors.push("Age must be between 18 and 120");
    if (!b.gender) errors.push("Gender is required");
    if (+b.height < 100 || +b.height > 250)
      errors.push("Height must be between 100–250 cm");
    if (+b.weight < 30 || +b.weight > 300)
      errors.push("Weight must be between 30–300 kg");
    if (!b.activityLevel) errors.push("Activity level is required");
    
    return errors;
  };

  const handleInputChange = (
    section: keyof FormData,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, any>),
          [field]: value,
        },
      };

      if (
        section === "basicProfile" &&
        (field === "height" || field === "weight")
      ) {
        const profile = updated.basicProfile;
        const bmiValue = calculateBMI(profile.height, profile.weight);

        updated.basicProfile.bmi = bmiValue;

        if (bmiValue) {
          updated.basicProfile.bmiLevel = calculateBMILevel(
            parseFloat(bmiValue)
          );
        } else {
          updated.basicProfile.bmiLevel = "";
        }
      }

      return updated;
    });
  };

  const handleCheckbox = (
    section: "medicalConditions" | "dietaryRestrictions",
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: !(prev[section] as Record<string, any>)[field],
      },
    }));
  };

  const wakeUpServer = async () => {
    try {
      await fetch("http://127.0.0.1:5000/", {
        method: "GET",
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Waking up server...");
    }
  };


  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      
      // Scroll to top where errors are displayed
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setFormErrors([]);
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Clear out any stale session data before building a new plan
      sessionStorage.removeItem("mealPlanResult");
      sessionStorage.removeItem("patientProfile");
      
      // Update the main user profile with the latest data from this form
      if (user && updateProfileData) {
        try {
          const profileUpdate: any = {};
          if (formData.basicProfile.age) profileUpdate.age = parseInt(formData.basicProfile.age);
          if (formData.basicProfile.gender) profileUpdate.gender = formData.basicProfile.gender;
          
          await updateProfileData(profileUpdate);
          console.log("✅ Profile updated with latest age/gender");
        } catch (profileErr) {
          console.error("Failed to update profile data", profileErr);
        }
      }

      await wakeUpServer();

      const payload = {
        ...formData,
        userId: user?.uid
      };

      console.log("Sending form data to API:", payload);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("DEBUG: Full API Response Received:", data);
      console.log("DEBUG: databaseId from server:", data.databaseId);
      if (data.db_error) {
        console.error("❌ DATABASE SAVE ERROR FROM SERVER:", data.db_error);
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create meal plan");
      }

      // Check if data was saved to database
      if (data.formDataSaved || data.databaseId) {
        console.log(
          `✅ Form data saved to database with ID: ${data.databaseId || data.id}`
        );
      } else {
        console.warn("⚠️ API response received but formDataSaved is false and no databaseId found!");
      }

      // Auto-save the generated plan to localStorage and prepare for display
      if (data.mealPlanOptions && data.mealPlanOptions.length > 0) {
        try {
          const selectedOption = data.mealPlanOptions[0];
          const firstDayKey = Object.keys(selectedOption.weeklyPlan).sort()[0] || "Day 1";
          const firstDayData = selectedOption.weeklyPlan[firstDayKey];

          const savePayload = {
            selectedPlan: {
              ...selectedOption,
              name: selectedOption.name,
              patientName: data.patient_name || formData.basicProfile.name || "Unknown Patient",
              patientAge: formData.basicProfile.age || "N/A",
              patientGender: formData.basicProfile.gender || "N/A",
              bmi: data.bmi,
              bmiCategory: data.bmi_category,
              bmiAdvice: data.bmi_advice,
              dailyCalorieRange: data.daily_calorie_range,
              height: formData.basicProfile.height,
              weight: formData.basicProfile.weight,
              activityLevel: formData.basicProfile.activityLevel,
              plan_duration: data.plan_duration,
              medicalConditions: Object.keys(formData.medicalConditions).filter(k => k !== 'other' && formData.medicalConditions[k as keyof MedicalConditions]),
              dietaryRestrictions: Object.keys(formData.dietaryRestrictions).filter(k => k !== 'other' && formData.dietaryRestrictions[k as keyof DietaryRestrictions]),
              vitaminDeficiencies: formData.vitaminDeficiencies,
              selectedDay: "Full 7-Day Plan",
              totalCalories: firstDayData?.total_calories || 0,
              numberOfMeals: firstDayData?.meals?.length || 0,
              timestamp: new Date().toISOString(),
            },
            originalPlanId: data.databaseId || data.id || data.originalPlanId || "unknown",
            formDataSaved: data.formDataSaved || false,
            createdAt: new Date().toISOString(),
            planName: selectedOption.name,
            patientName: data.patient_name || formData.basicProfile.name || "Unknown Patient",
            bmi: data.bmi,
          };

          const localStoragePlan = {
            id: user?.uid || Date.now().toString(),
            selectedPlan: savePayload.selectedPlan,
            originalPlanId: savePayload.originalPlanId,
            createdAt: savePayload.createdAt,
            planName: savePayload.planName,
            patientName: savePayload.patientName,
            bmi: savePayload.bmi,
          };
          
          localStorage.setItem("savedMealPlans", JSON.stringify([localStoragePlan]));
          console.log("✅ Auto-saved active plan to localStorage!", localStoragePlan);
          
        } catch (e) {
          console.error("Auto-save to local storage failed", e);
        }
      }

      // Save data to sessionStorage
      sessionStorage.setItem("mealPlanResult", JSON.stringify(data));
      sessionStorage.setItem(
        "patientProfile",
        JSON.stringify(formData)
      );

      console.log("Saved to sessionStorage:");
      console.log("mealPlanResult:", data);
      console.log("patientProfile:", formData.basicProfile);

      setSuccess(true);
      // Navigate to results page
      router.push("/Pages/MealPlanProviders/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-10 relative">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="absolute left-0 top-1 text-gray-500 hover:text-gray-800 transition flex items-center gap-1 font-medium"
              >
                &larr; Back
              </button>
            )}
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Meal Plan Assessment
            </h1>
            <p className="text-gray-600 mb-4">
              Complete this risk-form style assessment to generate your personalized plan
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Meal plan created successfully!</span>
            </div>
          )}

          {formErrors.length > 0 && (
            <div className="mb-8 p-4 bg-red-50 border border-red-300 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">Please correct the following errors:</h3>
              <ul className="space-y-1">
                {formErrors.map((err, index) => (
                  <li key={index} className="flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-12 divide-y divide-gray-100">
            {/* SECTION 1: Basic Profile */}
            <section className="space-y-6 pt-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Basic Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.basicProfile.name}
                    onChange={(e) =>
                      handleInputChange("basicProfile", "name", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={formData.basicProfile.age}
                    onChange={(e) =>
                      handleInputChange("basicProfile", "age", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.basicProfile.gender}
                    onChange={(e) =>
                      handleInputChange("basicProfile", "gender", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={formData.basicProfile.height}
                    onChange={(e) =>
                      handleInputChange("basicProfile", "height", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Height in cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.basicProfile.weight}
                    onChange={(e) =>
                      handleInputChange("basicProfile", "weight", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BMI (Auto-calculated)
                  </label>
                  <input
                    type="text"
                    value={formData.basicProfile.bmi}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BMI Level
                  </label>
                  <input
                    type="text"
                    value={formData.basicProfile.bmiLevel}
                    disabled
                    className={`w-full px-4 py-2 border rounded-lg font-semibold ${
                      formData.basicProfile.bmiLevel === "Normal"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : formData.basicProfile.bmiLevel === "Overweight"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : formData.basicProfile.bmiLevel === "Underweight"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : formData.basicProfile.bmiLevel === "Obese"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Level *
                  </label>
                  <select
                    value={formData.basicProfile.activityLevel}
                    onChange={(e) =>
                      handleInputChange(
                        "basicProfile",
                        "activityLevel",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Activity Level</option>
                    <option value="sedentary">
                      Sedentary (little or no exercise)
                    </option>
                    <option value="light">Light (exercise 1-3 days/week)</option>
                    <option value="moderate">
                      Moderate (exercise 3-5 days/week)
                    </option>
                    <option value="active">
                      Active (exercise 6-7 days/week)
                    </option>
                    <option value="very-active">
                      Very Active (intense exercise daily)
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* SECTION 2: Medical Conditions */}
            <section className="space-y-6 pt-10">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Medical Conditions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  Object.keys(formData.medicalConditions) as Array<
                    keyof MedicalConditions
                  >
                ).map((key) => {
                  const value = formData.medicalConditions[key];
                  if (key === "other") {
                    return (
                      <div key={key} className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Conditions
                        </label>
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) =>
                            handleInputChange(
                              "medicalConditions",
                              "other",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Specify other conditions"
                        />
                      </div>
                    );
                  }
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={() => handleCheckbox("medicalConditions", key)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <span className="text-gray-700 capitalize text-lg">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* SECTION 4: Dietary Restrictions */}
            <section className="space-y-6 pt-10">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Dietary Restrictions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  Object.keys(formData.dietaryRestrictions) as Array<
                    keyof DietaryRestrictions
                  >
                ).map((key) => {
                  const value = formData.dietaryRestrictions[key];
                  if (key === "other") {
                    return (
                      <div key={key} className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Restrictions
                        </label>
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) =>
                            handleInputChange(
                              "dietaryRestrictions",
                              "other",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Specify other restrictions"
                        />
                      </div>
                    );
                  }
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={() =>
                          handleCheckbox("dietaryRestrictions", key)
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <span className="text-gray-700 capitalize text-lg">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* SECTION: Vitamin Deficiencies */}
            <section className="space-y-6 pt-10">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Vitamin Deficiencies
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  Based on your prior Vitamin Deficiency Assessment, the following
                  deficiencies have been automatically identified and pre-filled into your profile.
                </p>

                {formData.vitaminDeficiencies.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Identified Deficiencies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.vitaminDeficiencies.map((def, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                          <span className="text-sm font-medium text-gray-800">{def.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">{def.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                   <p className="text-sm text-gray-500 italic">No previous deficiency records found.</p>
                )}
              </div>
            </section>
          </div>

          {/* Submit Button */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto md:min-w-[300px] ml-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mx-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Meal Plan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanForm;

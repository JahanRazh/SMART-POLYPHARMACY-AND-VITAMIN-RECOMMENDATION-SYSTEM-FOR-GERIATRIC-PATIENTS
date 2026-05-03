"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, User, Activity, Clipboard, ShieldAlert, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import { motion } from "framer-motion";

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

  // Helper to determine BMI level
  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

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
          height: prev.basicProfile.height || String(userProfile.height || ""),
          weight: prev.basicProfile.weight || String(userProfile.weight || ""),
          activityLevel: prev.basicProfile.activityLevel || userProfile.activityLevel || "",
          bmi: prev.basicProfile.bmi || String(userProfile.bmi || ""),
          bmiLevel: prev.basicProfile.bmiLevel || userProfile.bmiLevel || "",
        }
      }));

      if (nameFromProfile || userProfile.age || userProfile.gender || userProfile.height || userProfile.weight) {
        setInitialFillDone(true);
      }
    }
  }, [userProfile, initialFillDone]);

  // Real-time BMI Calculation
  useEffect(() => {
    const h = parseFloat(formData.basicProfile.height);
    const w = parseFloat(formData.basicProfile.weight);
    
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const bmiValue = w / (heightInMeters * heightInMeters);
      const bmiString = bmiValue.toFixed(1);
      const bmiLevel = getBMICategory(bmiValue);
      
      if (formData.basicProfile.bmi !== bmiString || formData.basicProfile.bmiLevel !== bmiLevel) {
        setFormData(prev => ({
          ...prev,
          basicProfile: {
            ...prev.basicProfile,
            bmi: bmiString,
            bmiLevel: bmiLevel
          }
        }));
      }
    }
  }, [formData.basicProfile.height, formData.basicProfile.weight]);

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
                const existingNames = new Set(prev.vitaminDeficiencies.map(v => v.name));
                const newDeficiencies = data.predictions
                  .filter((p: any) => !existingNames.has(p.vitamin))
                  .map((p: any) => ({ name: p.vitamin, level: p.level || "Moderate" }));
                
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
      await fetch("http://127.0.0.1:5000/", { method: "GET" });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setFormErrors([]);
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      sessionStorage.removeItem("mealPlanResult");
      sessionStorage.removeItem("patientProfile");
      
      if (user && updateProfileData) {
        try {
          const profileUpdate: any = {};
          if (formData.basicProfile.age) profileUpdate.age = parseInt(formData.basicProfile.age);
          if (formData.basicProfile.gender) profileUpdate.gender = formData.basicProfile.gender;
          await updateProfileData(profileUpdate);
        } catch (profileErr) {
          console.error("Failed to update profile data", profileErr);
        }
      }

      await wakeUpServer();

      const payload = {
        ...formData,
        userId: user?.uid
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create meal plan");
      }

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
        } catch (e) {
          console.error("Auto-save to local storage failed", e);
        }
      }

      sessionStorage.setItem("mealPlanResult", JSON.stringify(data));
      sessionStorage.setItem("patientProfile", JSON.stringify(formData));
      localStorage.setItem("patientProfile", JSON.stringify(formData));

      setSuccess(true);
      router.push("/Pages/MealPlanProviders/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="mb-10 text-center relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute left-0 top-1 text-teal-600 hover:text-teal-800 transition flex items-center gap-2 font-bold px-4 py-2 rounded-xl bg-white/50 border border-teal-100 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Meal Plan Assessment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete this comprehensive assessment to generate your personalized, AI-driven geriatric nutrition plan
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            className="mb-6 rounded-3xl border border-red-200/50 bg-red-50/80 backdrop-blur-md p-5 text-red-700 font-medium flex items-center gap-3 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form Errors List */}
        {formErrors.length > 0 && (
          <motion.div
            className="mb-8 rounded-3xl border border-orange-200/50 bg-orange-50/80 backdrop-blur-md p-6 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-orange-800 font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Please correct the following:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {formErrors.map((err, index) => (
                <li key={index} className="flex items-center gap-2 text-orange-700 text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Success Alert */}
        {success && (
          <motion.div
            className="mb-6 rounded-3xl border border-emerald-200/50 bg-emerald-50/80 backdrop-blur-md p-5 text-emerald-700 font-medium flex items-center gap-3 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle className="w-6 h-6 flex-shrink-0 text-emerald-500" />
            <span>Meal plan created successfully! Redirecting...</span>
          </motion.div>
        )}

        <form className="space-y-8">
          {/* SECTION 1: Basic Profile */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <User className="w-6 h-6" />
                </div>
                Basic Profile
              </h2>
              <p className="text-sm text-gray-600 ml-12">Essential physical measurements for calorie calculation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.basicProfile.name}
                  onChange={(e) => handleInputChange("basicProfile", "name", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Age</label>
                <input
                  type="number"
                  value={formData.basicProfile.age}
                  onChange={(e) => handleInputChange("basicProfile", "age", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  placeholder="Years"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Gender</label>
                <select
                  value={formData.basicProfile.gender}
                  onChange={(e) => handleInputChange("basicProfile", "gender", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.basicProfile.height}
                  onChange={(e) => handleInputChange("basicProfile", "height", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  placeholder="Height in cm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.basicProfile.weight}
                  onChange={(e) => handleInputChange("basicProfile", "weight", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  placeholder="Weight in kg"
                />
              </div>

              {/* BMI Insight Card */}
              <div className="md:col-span-2 mt-2 p-6 rounded-3xl bg-gradient-to-br from-blue-50/50 to-teal-50/50 border border-white shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Body Mass Index</span>
                  <span className="text-3xl font-black text-gray-900">{formData.basicProfile.bmi || "—"}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Health Category</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1 rounded-full text-sm font-black shadow-sm ${
                      formData.basicProfile.bmiLevel === "Normal" ? "bg-green-100 text-green-700" :
                      formData.basicProfile.bmiLevel === "Overweight" ? "bg-yellow-100 text-yellow-700" :
                      formData.basicProfile.bmiLevel === "Underweight" ? "bg-blue-100 text-blue-700" :
                      formData.basicProfile.bmiLevel === "Obese" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {formData.basicProfile.bmiLevel || "Awaiting Input"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Activity Level</label>
                <select
                  value={formData.basicProfile.activityLevel}
                  onChange={(e) => handleInputChange("basicProfile", "activityLevel", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm appearance-none"
                >
                  <option value="">Select Activity Level</option>
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                  <option value="active">Active (exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (intense exercise daily)</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* SECTION 2: Medical Conditions */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <Activity className="w-6 h-6" />
                </div>
                Medical Conditions
              </h2>
              <p className="text-sm text-gray-600 ml-12">Select any existing health conditions for tailored nutrition</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(formData.medicalConditions) as Array<keyof MedicalConditions>).map((key, idx) => {
                const value = formData.medicalConditions[key];
                if (key === "other") return null;

                return (
                  <motion.label
                    key={key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all group ${
                      value ? 'bg-red-50/50 border-red-200 shadow-md' : 'bg-white/30 border-white/50 hover:bg-white/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      value ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 bg-white group-hover:border-red-400'
                    }`}>
                      {value && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={() => handleCheckbox("medicalConditions", key)}
                      className="hidden"
                    />
                    <span className={`text-lg font-bold transition-colors ${value ? 'text-red-900' : 'text-gray-700'}`}>
                      {key.replace(/([A-Z])/g, " $1").trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, " $1").trim().slice(1)}
                    </span>
                  </motion.label>
                );
              })}
              
              <div className="md:col-span-2 mt-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Other Conditions</label>
                <input
                  type="text"
                  value={formData.medicalConditions.other}
                  onChange={(e) => handleInputChange("medicalConditions", "other", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all shadow-sm"
                  placeholder="Specify other conditions (comma separated)"
                />
              </div>
            </div>
          </motion.section>

          {/* SECTION 3: Dietary Restrictions */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <Heart className="w-6 h-6" />
                </div>
                Dietary Restrictions
              </h2>
              <p className="text-sm text-gray-600 ml-12">Your dietary preferences and allergies</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(formData.dietaryRestrictions) as Array<keyof DietaryRestrictions>).map((key, idx) => {
                const value = formData.dietaryRestrictions[key];
                if (key === "other") return null;

                return (
                  <motion.label
                    key={key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all group ${
                      value ? 'bg-emerald-50/50 border-emerald-200 shadow-md' : 'bg-white/30 border-white/50 hover:bg-white/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      value ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white group-hover:border-emerald-400'
                    }`}>
                      {value && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={() => handleCheckbox("dietaryRestrictions", key)}
                      className="hidden"
                    />
                    <span className={`text-lg font-bold transition-colors ${value ? 'text-emerald-900' : 'text-gray-700'}`}>
                      {key.replace(/([A-Z])/g, " $1").trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, " $1").trim().slice(1)}
                    </span>
                  </motion.label>
                );
              })}
              
              <div className="md:col-span-2 mt-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Other Restrictions</label>
                <input
                  type="text"
                  value={formData.dietaryRestrictions.other}
                  onChange={(e) => handleInputChange("dietaryRestrictions", "other", e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
                  placeholder="Specify allergies or preferences"
                />
              </div>
            </div>
          </motion.section>

          {/* SECTION: Vitamin Deficiencies */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Clipboard className="w-6 h-6" />
                </div>
                Vitamin Deficiencies
              </h2>
              <p className="text-sm text-gray-600 ml-12">Auto-filled from your previous assessments</p>
            </div>
            
            <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-inner">
              {formData.vitaminDeficiencies.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    The following deficiencies have been identified and will be prioritized in your meal plan generation:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {formData.vitaminDeficiencies.map((def, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-2 bg-white border border-amber-200 px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-sm font-black text-gray-800">{def.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-black uppercase tracking-wider">{def.level}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-amber-700/60 font-medium italic">No previous deficiency records found in your profile.</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Submit Button */}
          <motion.div
            className="pt-10 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full md:w-auto md:min-w-[400px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-px font-bold text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-5 transition-all group-hover:bg-transparent">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Analyzing & Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">Generate Personalized Meal Plan</span>
                    <CheckCircle className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </div>
              {/* Animated background glow */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100 blur-xl animate-pulse"></div>
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default MealPlanForm;

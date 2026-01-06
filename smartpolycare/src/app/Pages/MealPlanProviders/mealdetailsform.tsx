import React, { useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import MealPlanResult from "./MealPlanResult";


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

interface VitaminDeficiency {
  name: string;
  level: string;
}

interface DietaryRestrictions {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutAllergy: boolean;
  other: string;
}

interface MealTimings {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

interface Preferences {
  spiceLevel: string;
  foodDislikes: string;
  specialRequests: string;
}

interface FormData {
  basicProfile: BasicProfile;
  medicalConditions: MedicalConditions;
  vitaminDeficiencies: VitaminDeficiency[];
  dietaryRestrictions: DietaryRestrictions;
  mealTimings: MealTimings;
  preferences: Preferences;
}

const MealPlanForm: React.FC = () => {
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
    vitaminDeficiencies: [],
    dietaryRestrictions: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutAllergy: false,
      other: "",
    },
    mealTimings: {
      breakfast: "",
      lunch: "",
      dinner: "",
      snacks: "",
    },
    preferences: {
      spiceLevel: "",
      foodDislikes: "",
      specialRequests: "",
    },
  });

  const [selectedVitamin, setSelectedVitamin] = useState("");
  const [deficiencyLevel, setDeficiencyLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mealPlanResult, setMealPlanResult] = useState<any>(null);

  const API_URL = "http://127.0.0.1:5000/api/meal-plans";

  const vitamins = [
    "Vitamin A",
    /*"Vitamin B1 (Thiamine)",
    "Vitamin B2 (Riboflavin)",
    "Vitamin B3 (Niacin)",
    "Vitamin B5 (Pantothenic Acid)",*/
    "Vitamin B6 (Pyridoxine)",
    /*"Vitamin B7 (Biotin)",
    "Vitamin B9 (Folate)",*/
    "Vitamin B12 (Cobalamin)",
    "Vitamin C",
    //"Vitamin D",
    "Vitamin E",
    "Vitamin K",
    /*"Calcium",
    "Iron",
    "Magnesium",
    "Zinc",
    "Omega-3",*/
  ];

  // Calculate BMI when height or weight changes
  const calculateBMI = (height: string, weight: string) => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
        return bmi;
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


  const handleInputChange = (
    section: keyof Omit<FormData, "vitaminDeficiencies">,
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

      // Auto-calculate BMI when height or weight changes
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

  const addVitaminDeficiency = () => {
    if (selectedVitamin && deficiencyLevel) {
      const newDeficiency: VitaminDeficiency = {
        name: selectedVitamin,
        level: deficiencyLevel,
      };
      setFormData((prev) => ({
        ...prev,
        vitaminDeficiencies: [...prev.vitaminDeficiencies, newDeficiency],
      }));
      setSelectedVitamin("");
      setDeficiencyLevel("");
    }
  };

  const removeVitaminDeficiency = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      vitaminDeficiencies: prev.vitaminDeficiencies.filter(
        (_, i) => i !== index
      ),
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
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await wakeUpServer();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create meal plan");
      }

      setSuccess(true);
      setMealPlanResult(data);
      console.log("Meal Plan Created:", data);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Meal Plan Assessment
            </h1>
            <p className="text-gray-600">
              Complete this form to create your personalized meal plan
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

          <div className="space-y-8">
            {/* Basic Profile */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Basic Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      handleInputChange(
                        "basicProfile",
                        "gender",
                        e.target.value
                      )
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
                      handleInputChange(
                        "basicProfile",
                        "height",
                        e.target.value
                      )
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
                      handleInputChange(
                        "basicProfile",
                        "weight",
                        e.target.value
                      )
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
                    <option value="light">
                      Light (exercise 1-3 days/week)
                    </option>
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

            {/* Medical Conditions */}
            <section className="space-y-4">
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
                      <div key={key} className="md:col-span-2">
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
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={() =>
                          handleCheckbox("medicalConditions", key)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Vitamin Deficiencies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Vitamin Deficiencies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vitamin
                  </label>
                  <select
                    value={selectedVitamin}
                    onChange={(e) => setSelectedVitamin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a vitamin</option>
                    {vitamins.map((vit) => (
                      <option key={vit} value={vit}>
                        {vit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deficiency Level
                  </label>
                  <select
                    value={deficiencyLevel}
                    onChange={(e) => setDeficiencyLevel(e.target.value)}
                    disabled={!selectedVitamin}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Level</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={addVitaminDeficiency}
                disabled={!selectedVitamin || !deficiencyLevel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Vitamin Deficiency
              </button>
              <div className="flex flex-wrap gap-2">
                {formData.vitaminDeficiencies.map((deficiency, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300"
                  >
                    <span className="font-semibold">{deficiency.name}</span>
                    <span className="text-sm">({deficiency.level})</span>
                    <button
                      type="button"
                      onClick={() => removeVitaminDeficiency(index)}
                      className="text-green-600 hover:text-green-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Dietary Restrictions */}
            <section className="space-y-4">
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
                      <div key={key} className="md:col-span-2">
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
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={() =>
                          handleCheckbox("dietaryRestrictions", key)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Meal Timings */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Meal Timings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breakfast Time *
                  </label>
                  <input
                    type="time"
                    value={formData.mealTimings.breakfast}
                    onChange={(e) =>
                      handleInputChange(
                        "mealTimings",
                        "breakfast",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lunch Time *
                  </label>
                  <input
                    type="time"
                    value={formData.mealTimings.lunch}
                    onChange={(e) =>
                      handleInputChange("mealTimings", "lunch", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dinner Time *
                  </label>
                  <input
                    type="time"
                    value={formData.mealTimings.dinner}
                    onChange={(e) =>
                      handleInputChange("mealTimings", "dinner", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snack Times
                  </label>
                  <input
                    type="text"
                    value={formData.mealTimings.snacks}
                    onChange={(e) =>
                      handleInputChange("mealTimings", "snacks", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10:00 AM, 4:00 PM"
                  />
                </div>
              </div>
            </section>

            {/* Food Preferences */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                Food Preferences
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spice Level *
                </label>
                <select
                  value={formData.preferences.spiceLevel}
                  onChange={(e) =>
                    handleInputChange(
                      "preferences",
                      "spiceLevel",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Spice Level</option>
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra-hot">Extra Hot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Dislikes
                </label>
                <textarea
                  value={formData.preferences.foodDislikes}
                  onChange={(e) =>
                    handleInputChange(
                      "preferences",
                      "foodDislikes",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="List any foods you dislike or want to avoid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={formData.preferences.specialRequests}
                  onChange={(e) =>
                    handleInputChange(
                      "preferences",
                      "specialRequests",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any special dietary requirements or preferences"
                />
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Meal Plan...
                  </>
                ) : (
                  "Create Meal Plan"
                )}
              </button>
            </div>
            {mealPlanResult && <MealPlanResult result={mealPlanResult} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanForm;

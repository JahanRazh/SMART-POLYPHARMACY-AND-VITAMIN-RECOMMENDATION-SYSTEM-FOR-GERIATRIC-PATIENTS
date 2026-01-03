"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useAuth } from "@/app/components/Contexts/AuthContext";

const PatientAssessmentForm = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const { userProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    exercise_time: "",
    sleep_duration: "",
    physical_activity: "",
    screen_time: "",
    work_hours: "",
    social_interaction_duration: "",
    gender: "Male",
    occupation: "",
    smoking_habit: "No",
    alcohol_intake: "No",
    meditation_practice: "No",
  });

  const [detectedEmotion, setDetectedEmotion] = useState("");
  const [mentalHealthLevel, setMentalHealthLevel] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Auto-fill from user profile
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => {
        const updates: Partial<typeof formData> = {};

        // Auto-fill name (use displayName or combine firstName and lastName)
        if (!prev.name) {
          const fullName = userProfile.displayName || 
            `${(userProfile.firstName || "").trim()} ${(userProfile.lastName || "").trim()}`.trim();
          if (fullName) {
            updates.name = fullName;
          }
        }

        // Auto-fill age
        if (userProfile.age !== undefined && userProfile.age !== null && !prev.age) {
          updates.age = String(userProfile.age);
        }

        // Auto-fill gender (map to capitalize first letter to match form format)
        if (userProfile.gender && prev.gender === "Male") {
          const genderCapitalized = userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1).toLowerCase();
          // Map "Other" or other values to "Male" as default, or handle as needed
          if (genderCapitalized === "Male" || genderCapitalized === "Female") {
            updates.gender = genderCapitalized;
          }
        }

        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [userProfile]);

  // Capture webcam image every 5 seconds for emotion (background detection)
  useEffect(() => {
    if (!formData.name || !formData.age) {
      setCameraActive(false);
      return;
    }

    // Check if webcam is available
    const checkWebcam = () => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setCameraActive(true);
          return true;
        }
      }
      setCameraActive(false);
      return false;
    };

    // Initial check after a short delay to allow webcam to initialize
    const initTimeout = setTimeout(() => {
      checkWebcam();
    }, 1000);

    const interval = setInterval(async () => {
      if (!webcamRef.current) {
        setCameraActive(false);
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setCameraActive(false);
        return;
      }

      setCameraActive(true);

      try {
        const res = await fetch("http://127.0.0.1:5000/detect_emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            age: Number(formData.age),
            image: imageSrc,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          console.error("Emotion detection API error:", errorData);
          setCameraActive(false);
          return;
        }

        const data = await res.json();
        console.log("Emotion detection response:", data);
        
        if (data.emotion) {
          setDetectedEmotion(data.emotion);
          setCameraActive(true);
        } else if (data.error) {
          console.error("Emotion detection error:", data.error);
          setCameraActive(false);
        }
      } catch (error) {
        console.error("Emotion detection failed:", error);
        setCameraActive(false);
      }
    }, 5000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [formData.name, formData.age]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    if (!formData.name || !formData.age) {
      setError("Please fill in name and age fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send mental health data to backend
      const res = await fetch("http://127.0.0.1:5000/full_assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
          exercise_time: Number(formData.exercise_time),
          sleep_duration: Number(formData.sleep_duration),
          physical_activity: Number(formData.physical_activity),
          screen_time: Number(formData.screen_time),
          work_hours: Number(formData.work_hours),
          social_interaction_duration: Number(formData.social_interaction_duration),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMentalHealthLevel(data.mental_health_level);

        // Now save everything (including occupation, emotion, etc.) in Firebase
        await fetch("/api/save_patient_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            detectedEmotion,
            mentalHealthLevel: data.mental_health_level,
          }),
        });

        setSuccessMessage("Patient assessment completed successfully!");
      } else {
        setError("Error predicting mental health: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      setError("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-indigo-500">
            Patient Assessment
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Mental Health & Lifestyle Assessment
          </h1>
          <p className="mt-3 text-gray-600">
            Complete this assessment to receive personalized mental health insights and lifestyle recommendations.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="text-sm text-gray-500">
                Basic details about the patient
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  required
                  min="1"
                  max="120"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Enter occupation"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Lifestyle Habits Section */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Lifestyle Habits
              </h2>
              <p className="text-sm text-gray-500">
                Information about daily habits and practices
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Smoking Habit
                </label>
                <select
                  name="smoking_habit"
                  value={formData.smoking_habit}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Alcohol Intake
                </label>
                <select
                  name="alcohol_intake"
                  value={formData.alcohol_intake}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Meditation Practice
                </label>
                <select
                  name="meditation_practice"
                  value={formData.meditation_practice}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </section>

          {/* Activity & Time Tracking Section */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity & Time Tracking
              </h2>
              <p className="text-sm text-gray-500">
                Daily activities and time spent (in hours)
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Exercise Time (hours/day)
                </label>
                <input
                  type="number"
                  name="exercise_time"
                  value={formData.exercise_time}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Sleep Duration (hours/day)
                </label>
                <input
                  type="number"
                  name="sleep_duration"
                  value={formData.sleep_duration}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Physical Activity (hours/day)
                </label>
                <input
                  type="number"
                  name="physical_activity"
                  value={formData.physical_activity}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Screen Time (hours/day)
                </label>
                <input
                  type="number"
                  name="screen_time"
                  value={formData.screen_time}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Work Hours (hours/day)
                </label>
                <input
                  type="number"
                  name="work_hours"
                  value={formData.work_hours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Social Interaction (hours/day)
                </label>
                <input
                  type="number"
                  name="social_interaction_duration"
                  value={formData.social_interaction_duration}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Hidden Webcam for Background Emotion Detection */}
          <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              width={320}
              height={240}
              videoConstraints={{ facingMode: "user" }}
            />
          </div>

          {/* Emotion Detection Status Section */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Emotion Detection
              </h2>
              <p className="text-sm text-gray-500">
                Facial emotion analysis is running in the background to ensure natural responses. 
                Camera access will be requested automatically.
              </p>
            </div>

            <div className="mt-6">
              {cameraActive && detectedEmotion && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-sm font-medium text-indigo-600">
                      Emotion Detection Active
                    </p>
                  </div>
                  <p className="text-xs text-indigo-500 mb-3">
                    Last detected emotion (updated every 5 seconds)
                  </p>
                  <p className="text-3xl font-bold text-indigo-900 capitalize">
                    {detectedEmotion}
                  </p>
                </div>
              )}
              {cameraActive && !detectedEmotion && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-sm font-medium text-blue-600">
                      Camera Active - Analyzing...
                    </p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Emotion detection is running in the background. Results will appear shortly.
                  </p>
                </div>
              )}
              {!cameraActive && formData.name && formData.age && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <p className="text-sm font-medium text-amber-600">
                      Waiting for Camera Access
                    </p>
                  </div>
                  <p className="text-sm text-amber-700">
                    Please allow camera access when prompted to enable emotion detection. 
                    The camera feed will not be displayed to ensure natural responses.
                  </p>
                </div>
              )}
              {(!formData.name || !formData.age) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <p className="text-sm font-medium text-gray-600">
                      Emotion Detection Inactive
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please fill in name and age to enable background emotion detection.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-indigo-600 px-8 py-3 text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processing..." : "Submit Assessment"}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {mentalHealthLevel && (
          <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-emerald-500">
                Assessment Results
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                Mental Health Assessment
              </h2>
            </div>

            <div className="mt-6">
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-medium text-emerald-600">
                  Mental Health Level
                </p>
                <p className="mt-2 text-4xl font-bold text-emerald-900 capitalize">
                  {mentalHealthLevel}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PatientAssessmentForm;

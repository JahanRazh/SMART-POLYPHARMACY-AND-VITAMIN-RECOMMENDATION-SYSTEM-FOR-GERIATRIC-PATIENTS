"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import { useRouter } from "next/navigation";

const PatientAssessmentForm = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const { userProfile, user } = useAuth();
  const router = useRouter();

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
  const [allPredictions, setAllPredictions] = useState<Record<string, number>>({});
  const [mentalHealthLevel, setMentalHealthLevel] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [webcamReady, setWebcamReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [stopDetection, setStopDetection] = useState(false);
  const [occupationSuggestions, setOccupationSuggestions] = useState<string[]>([]);
  const [isFetchingOccupations, setIsFetchingOccupations] = useState(false);
  const [occupationSelected, setOccupationSelected] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
   const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // Auto-fill from user profile
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => {
        const updates: Partial<typeof formData> = {};

        if (!prev.name) {
          const fullName =
            userProfile.displayName ||
            `${(userProfile.firstName || "").trim()} ${(userProfile.lastName || "").trim()}`.trim();
          if (fullName) {
            updates.name = fullName;
          }
        }

        if (userProfile.age !== undefined && userProfile.age !== null && !prev.age) {
          updates.age = String(userProfile.age);
        }

        if (userProfile.gender && prev.gender === "Male") {
          const genderCapitalized =
            userProfile.gender.charAt(0).toUpperCase() +
            userProfile.gender.slice(1).toLowerCase();
          if (genderCapitalized === "Male" || genderCapitalized === "Female") {
            updates.gender = genderCapitalized;
          }
        }

        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [userProfile]);

  // Select real webcam (not OBS virtual camera)
  useEffect(() => {
    async function selectRealWebcam() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.log("⚠️ Media devices API not available");
          return;
        }

        // First, request camera permission to get device labels.
        // We request a temporary stream and immediately stop it so labels become available.
        let tempStream: MediaStream | null = null;
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop temporary tracks so the real Webcam component can open the camera.
          tempStream.getTracks().forEach((t) => t.stop());
        } catch (err: any) {
          console.warn("Camera permission denied or unavailable during device selection:", err);
          setCameraError(
            "Camera permission denied or unavailable. Click 'Enable Camera' below and allow access."
          );
          return; // Exit early if permission denied
        }

        // Small delay to ensure devices are enumerated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now enumerate devices (labels will be available after permission)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");

        // Prefer real webcams: exclude OBS / virtual devices when possible
        const filtered = videoInputs.filter(
          (d) => d.label && !d.label.toLowerCase().includes("obs") && !d.label.toLowerCase().includes("virtual")
        );
        setVideoDevices(filtered.length > 0 ? filtered : videoInputs);

        if (videoInputs.length === 0) {
          console.log("⚠️ No video input devices found");
          return;
        }

        // Filter out OBS virtual camera
        const realCameras = videoInputs.filter(
          (d) => d.label && 
                 !d.label.toLowerCase().includes("obs") && 
                 !d.label.toLowerCase().includes("virtual")
        );

        // Use first real camera, or fall back to first available if no real camera found
        const chosen = realCameras.length > 0 ? realCameras[0] : videoInputs[0];
        
        setSelectedDeviceId(chosen.deviceId);
        console.log("🎥 Selected camera:", chosen.label || chosen.deviceId);
        setCameraError(""); // Clear any previous errors
      } catch (err) {
        console.warn("⚠️ Could not select camera device:", err);
        setCameraError("Failed to detect camera devices. Please refresh the page.");
      }
    }

    selectRealWebcam();
  }, []);

  // Explicit camera permission request triggered by the user when preview doesn't start automatically
  const requestCameraPermission = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not available in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream — the `Webcam` component will open the camera when it mounts.
      stream.getTracks().forEach((t) => t.stop());
      setCameraError("");
      
      // Small delay to ensure devices are enumerated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger a re-check for devices and select non-OBS camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      // Update available devices list and prefer physical webcams
      const filtered = videoInputs.filter(
        (d) => d.label && !d.label.toLowerCase().includes("obs") && !d.label.toLowerCase().includes("virtual")
      );
      setVideoDevices(filtered.length > 0 ? filtered : videoInputs);
      
      if (videoInputs.length > 0) {
        // Filter out OBS virtual camera
        const realCameras = videoInputs.filter(
          (d) => d.label && 
                 !d.label.toLowerCase().includes("obs") && 
                 !d.label.toLowerCase().includes("virtual")
        );
        const chosen = realCameras.length > 0 ? realCameras[0] : videoInputs[0];
        setSelectedDeviceId(chosen.deviceId);
        console.log("🎥 Selected camera after permission:", chosen.label || chosen.deviceId);
      }
      
      // Force Webcam component to re-render by toggling webcamReady
      setWebcamReady(false);
    } catch (err: any) {
      console.error("Error requesting camera permission:", err);
      setCameraError(
        "Unable to access camera. Check Windows privacy settings and allow camera access for your browser."
      );
    }
  };

  const handleWebcamLoad = () => {
    console.log("✅ Webcam loaded successfully");
    setWebcamReady(true);
  };

  const handleWebcamError = (error: string | DOMException) => {
    console.error("⚠️ Webcam error:", error);
    setCameraError("Failed to access camera. Please check permissions and try clicking 'Enable Camera'.");
    setWebcamReady(false);
  };

  // Emotion detection
  useEffect(() => {
    if (!formData.name || !formData.age || !webcamReady || stopDetection) {
      setCameraActive(false);
      return;
    }

    let mounted = true;
    let detectionInterval: NodeJS.Timeout;

    const captureAndDetect = async () => {
      if (!mounted || stopDetection) return;

      try {
        if (!webcamRef.current) {
          console.log("⚠️ Webcam ref null (ignored)");
          return;
        }

        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) {
          console.log("⚠️ Video not ready (ignored)");
          return;
        }

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.log("⚠️ No video dimensions (ignored)");
          return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc || imageSrc.length < 5000) {
          console.log("⚠️ Invalid screenshot (ignored)");
          return;
        }

        console.log(`📸 Capture #${detectionCount + 1}`);
        setCameraActive(true);

        // Get user email for emotion detection
        const userEmail = user?.email || userProfile?.email || "";

        const res = await fetch("http://127.0.0.1:5000/detect_emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            age: Number(formData.age),
            email: userEmail,
            image: imageSrc,
            timestamp: Date.now(),
          }),
        });

        if (!res.ok) {
          console.log("⚠️ API error (ignored)");
          return;
        }

        const data = await res.json();

        // Backend now tells us whether a real face was detected.
        if (!data.face_detected) {
          console.log("ℹ️ No face detected in frame – skipping emotion update.");
          return;
        }

        console.log("✅ Emotion:", data.emotion);

        if (data.emotion) {
          setDetectedEmotion(data.emotion);
          setAllPredictions(data.all_predictions || {});
          setDetectionCount((prev) => prev + 1);
        }
      } catch (error) {
        console.log("⚠️ Detection failed (ignored)");
      }
    };

    const startDetection = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("🚀 Starting emotion detection");
      
      await captureAndDetect();
      detectionInterval = setInterval(captureAndDetect, 5000);
    };

    startDetection();

    return () => {
      mounted = false;
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, [formData.name, formData.age, webcamReady, stopDetection, detectionCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // When user types occupation, show suggestions
    if (name === "occupation") {
      // User is typing again → unlock suggestions
      setOccupationSelected(false);
      setOccupationSuggestions([]);
    }
  };

  // Fuzzy occupation suggestions (from Flask API using occupation.csv)
  useEffect(() => {
    // If user already chose a suggestion, don't refetch until they type again
    if (occupationSelected) return;

    const query = formData.occupation.trim();

    if (query.length < 2) {
      setOccupationSuggestions([]);
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      try {
        setIsFetchingOccupations(true);
        const res = await fetch(
          `http://127.0.0.1:5000/occupation_suggestions?q=${encodeURIComponent(
            query
          )}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch occupation suggestions");
        }

        const data = await res.json();
        if (!active) return;

        const labels: string[] = (data.suggestions || []).map(
          (item: { label: string }) => item.label
        );
        setOccupationSuggestions(labels);
      } catch (err) {
        console.warn("Occupation suggestions error:", err);
        if (active) {
          setOccupationSuggestions([]);
        }
      } finally {
        if (active) {
          setIsFetchingOccupations(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 250); // debounce typing

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [formData.occupation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Basic validation for required fields
    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!formData.age) {
      setError("Age is required.");
      return;
    }
    if (!formData.occupation.trim()) {
      setError("Occupation is required.");
      return;
    }

    const numericFields: { key: keyof typeof formData; label: string }[] = [
      { key: "exercise_time", label: "Exercise Time" },
      { key: "sleep_duration", label: "Sleep Duration" },
      { key: "physical_activity", label: "Physical Activity" },
      { key: "screen_time", label: "Screen Time" },
      { key: "work_hours", label: "Work Hours" },
      {
        key: "social_interaction_duration",
        label: "Social Interaction Duration",
      },
    ];

    for (const field of numericFields) {
      const raw = (formData[field.key] as string).trim();
      if (!raw) {
        setError(`${field.label} is required.`);
        return;
      }
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0 || value > 24) {
        setError(
          `${field.label} must be a number between 0 and 24 hours per day.`
        );
        return;
      }
    }

    // Stop emotion detection
    setStopDetection(true);
    console.log("🛑 Stopping emotion detection");

    setIsSubmitting(true);

    // Provide user's email to the assessment endpoint so the server
    // can store it with the assessment record.
    const userEmail = user?.email || userProfile?.email || "";

    try {
      // Get mental health assessment
      const assessmentRes = await fetch("http://127.0.0.1:5000/full_assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
          exercise_time: Number(formData.exercise_time) || 0,
          sleep_duration: Number(formData.sleep_duration) || 0,
          physical_activity: Number(formData.physical_activity) || 0,
          screen_time: Number(formData.screen_time) || 0,
          work_hours: Number(formData.work_hours) || 0,
          social_interaction_duration: Number(formData.social_interaction_duration) || 0,
          email: userEmail,
        }),
      });

      const assessmentData = await assessmentRes.json();
      
      if (!assessmentRes.ok) {
        throw new Error(assessmentData.error || "Assessment failed");
      }

      setMentalHealthLevel(assessmentData.mental_health_level);

      // Save complete data including emotion and email
      const completeData = {
        ...formData,
        email: userEmail,
        detectedEmotion: detectedEmotion || "Not detected",
        emotionConfidence: allPredictions[detectedEmotion] || 0,
        allEmotionPredictions: allPredictions,
        mentalHealthLevel: assessmentData.mental_health_level,
        timestamp: new Date().toISOString(),
      };

      console.log("💾 Saving data:", completeData);

      const saveRes = await fetch("/api/save_patient_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save patient data");
      }

      const saveJson = await saveRes.json();

      setSuccessMessage("Patient assessment completed successfully!");

      // Redirect to patientAdvice page after successful submission
      try {
        const patientId = saveJson?.id || null;
        const target = patientId
          ? `/Pages/patientAdvice?patientId=${encodeURIComponent(patientId)}`
          : "/Pages/patientAdvice";
        router.push(target);
      } catch (err) {
        console.warn("Navigation failed:", err);
      }
      
    } catch (error: any) {
      console.error("❌ Error:", error);
      setError(error.message || "Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
                <div className="relative">
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="Start typing occupation"
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                    autoComplete="off"
                  />

                  {/* Suggestions dropdown */}
                  {formData.occupation.trim().length >= 2 &&
                    occupationSuggestions.length > 0 && !occupationSelected && (
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {occupationSuggestions.map((occ) => (
                          <button
                            type="button"
                            key={occ}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                occupation: occ,
                              }));
                              setOccupationSuggestions([]);
                              setOccupationSelected(true);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Loading / helper text */}
                  {isFetchingOccupations && (
                    <p className="mt-1 text-xs text-gray-400">
                      Searching occupations...
                    </p>
                  )}
                  {!isFetchingOccupations &&
                    formData.occupation.trim().length >= 2 &&
                    occupationSuggestions.length === 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        No matching occupations found.
                      </p>
                    )}
                </div>
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
                  required
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
                  required
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
                  required
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
                  required
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
                  required
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
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Small Webcam Preview (needed for capture to work) */}
          {!stopDetection && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Camera Preview
                </h2>
                <p className="text-sm text-gray-500">
                  Small camera preview (required for emotion detection to work properly)
                </p>
              </div>

              {/* Camera device selector placed above preview */}
              <div className="mb-3 flex justify-start">
                {videoDevices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="camera-select" className="text-sm text-gray-700">Camera</label>
                    <select
                      id="camera-select"
                      aria-label="Select camera"
                      value={selectedDeviceId || ""}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value || null);
                        setWebcamReady(false);
                      }}
                      className="rounded-md bg-white px-2 py-1 text-sm border"
                    >
                      <option value="">Default camera</option>
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || d.deviceId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <div className="relative rounded-lg overflow-hidden border-2 border-indigo-300">
                  <Webcam
                    key={selectedDeviceId || "default"}
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.95}
                    width={160}
                    height={120}
                    videoConstraints={{
                      ...(selectedDeviceId
                        ? { deviceId: { exact: selectedDeviceId } }
                        : { facingMode: "user" }),
                      width: { ideal: 640 },
                      height: { ideal: 480 },
                    }}
                    onUserMedia={handleWebcamLoad}
                    onUserMediaError={handleWebcamError}
                  />
                  {webcamReady && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {!webcamReady && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-amber-600">
                    ⏳ Waiting for camera to initialize...
                  </p>
                  {cameraError && (
                    <p className="mt-2 text-xs text-red-600">{cameraError}</p>
                  )}
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={requestCameraPermission}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                      Enable Camera
                    </button>
                  </div>
                </div>
              )}
              {webcamReady && (
                <p className="text-center text-sm text-green-600 mt-3">
                  ✅ Camera ready - Emotion detection active
                </p>
              )}
            </section>
          )}

          {stopDetection && (
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  📷 Camera stopped
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Camera has been stopped after form submission
                </p>
              </div>
            </section>
          )}

          {/* Emotion Detection Status Section (no emotion details shown to user) */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Background Analysis
              </h2>
              <p className="text-sm text-gray-500">
                The system runs a brief background analysis during the assessment to improve recommendation quality.
              </p>
            </div>

            <div className="mt-6">
              {stopDetection && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <p className="text-sm font-medium text-gray-600">
                      Background Analysis Finished
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analysis has been stopped for submission.
                  </p>
                </div>
              )}

              {!stopDetection && cameraActive && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-sm font-medium text-blue-600">
                      Background Analysis Running
                    </p>
                  </div>
                  <p className="text-sm text-blue-600">
                    Please continue filling the form normally while we run a short analysis.
                  </p>
                </div>
              )}

              {!stopDetection && !cameraActive && formData.name && formData.age && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <p className="text-sm font-medium text-amber-600">
                      Waiting for Camera Access
                    </p>
                  </div>
                  <p className="text-sm text-amber-700">
                    Please allow camera access when prompted to enable background analysis.
                  </p>
                </div>
              )}

              {(!formData.name || !formData.age) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <p className="text-sm font-medium text-gray-600">
                      Analysis Inactive
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please fill in name and age to enable background analysis.
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

        {/* Results Section (no emotion details shown) */}
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

            <div className="mt-6 space-y-4">
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
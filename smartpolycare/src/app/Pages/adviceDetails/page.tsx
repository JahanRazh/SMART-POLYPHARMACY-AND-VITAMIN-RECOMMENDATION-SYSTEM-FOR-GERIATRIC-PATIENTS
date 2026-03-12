"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
      // Step 1: Get mental health assessment
      console.log("📡 Step 1/3: Calling mental health assessment endpoint...");
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

      if (!assessmentRes.ok) {
        const errorData = await assessmentRes.json();
        console.error("❌ Assessment endpoint failed:", errorData);
        throw new Error(
          `Mental health assessment failed (${assessmentRes.status}): ${errorData.error || assessmentRes.statusText}`
        );
      }

      const assessmentData = await assessmentRes.json();
      console.log("✅ Step 1 complete: Mental health level =", assessmentData.mental_health_level);

      setMentalHealthLevel(assessmentData.mental_health_level);

      // Step 2: Prepare complete data
      console.log("📦 Step 2/3: Preparing complete patient data...");
      const completeData = {
        ...formData,
        email: userEmail,
        detectedEmotion: detectedEmotion || "Not detected",
        emotionConfidence: allPredictions[detectedEmotion] || 0,
        allEmotionPredictions: allPredictions,
        mentalHealthLevel: assessmentData.mental_health_level,
        timestamp: new Date().toISOString(),
      };

      console.log("💾 Complete data to save:", completeData);

      // Step 3: Save patient data
      console.log("📡 Step 3/3: Saving patient data to database...");
      const saveRes = await fetch("/api/save_patient_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        console.error("❌ Save endpoint failed:", errorData);
        throw new Error(
          `Failed to save patient data (${saveRes.status}): ${errorData.error || saveRes.statusText}`
        );
      }

      const saveJson = await saveRes.json();
      console.log("✅ Step 3 complete: Patient assessment saved with ID:", saveJson.id);

      setSuccessMessage("Patient assessment completed successfully! Redirecting...");

      // Redirect to patientAdvice page after successful submission.
      // Include email in query so server can lookup patient_assessment by email
      const patientId = saveJson?.id || null;
      const emailParam = userEmail ? `&email=${encodeURIComponent(userEmail)}` : "";
      const target = patientId
        ? `/Pages/patientAdvice?patientId=${encodeURIComponent(patientId)}${emailParam}`
        : `/Pages/patientAdvice${emailParam ? `?email=${encodeURIComponent(userEmail)}` : ""}`;
      
      console.log("🔄 Redirecting to:", target);
      
      // Wait a moment for user to see success message
      setTimeout(() => {
        router.push(target);
      }, 1000);
      
    } catch (error: any) {
      console.error("❌ Error details:", error);
      
      let displayError = error.message || "Failed to submit data. Please try again.";
      
      // Add helpful troubleshooting info
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        displayError = `Network Error: Cannot connect to the server. Please check:\n` +
          `1. Flask server is running (http://127.0.0.1:5000)\n` +
          `2. Next.js dev server is running (http://localhost:3000)\n` +
          `3. You have internet connection\n\n` +
          `Original error: ${error.message}`;
      } else if (error.message.includes("Assessment failed")) {
        displayError = `Mental health assessment failed. Please check that:\n` +
          `1. All lifestyle fields are filled with numbers 0-24\n` +
          `2. Flask server is running\n\n` +
          `Error: ${error.message}`;
      } else if (error.message.includes("save patient data")) {
        displayError = `Database save failed. Please check that:\n` +
          `1. Next.js API is running\n` +
          `2. Firebase credentials are configured\n` +
          `3. Email is provided\n\n` +
          `Error: ${error.message}`;
      }
      
      setError(displayError);
      setIsSubmitting(false);
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
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Patient Assessment</h1>
          <p className="text-lg text-gray-600">Comprehensive health evaluation for personalized care recommendations</p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            className="mb-6 rounded-3xl border border-red-200/50 bg-red-50/80 backdrop-blur-md p-5 text-red-700 font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ❌ {error}
          </motion.div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <motion.div
            className="mb-6 rounded-3xl border border-emerald-200/50 bg-emerald-50/80 backdrop-blur-md p-5 text-emerald-700 font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ✅ {successMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                👤 Personal Information
              </h2>
              <p className="text-sm text-gray-600">Basic details about the patient</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                { name: "name", label: "Full Name", type: "text", placeholder: "Enter full name" },
                { name: "age", label: "Age", type: "number", placeholder: "Enter age", min: 1, max: 120 },
              ].map((field, idx) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label} *
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                    {...(field.min && { min: field.min })}
                    {...(field.max && { max: field.max })}
                    className="w-full rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </motion.div>

              <motion.div
                className="md:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="Start typing occupation"
                    required
                    className="w-full rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    autoComplete="off"
                  />

                  {formData.occupation.trim().length >= 2 &&
                    occupationSuggestions.length > 0 &&
                    !occupationSelected && (
                      <motion.div
                        className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-xl"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {occupationSuggestions.map((occ) => (
                          <button
                            type="button"
                            key={occ}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, occupation: occ }));
                              setOccupationSuggestions([]);
                              setOccupationSelected(true);
                            }}
                            className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-100/50 transition-colors"
                          >
                            {occ}
                          </button>
                        ))}
                      </motion.div>
                    )}

                  {isFetchingOccupations && (
                    <p className="mt-2 text-xs text-gray-500">Searching occupations...</p>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Lifestyle Habits Section */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                🌱 Lifestyle Habits
              </h2>
              <p className="text-sm text-gray-600">Information about daily habits and practices</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "smoking_habit", label: "Smoking" },
                { name: "alcohol_intake", label: "Alcohol" },
                { name: "meditation_practice", label: "Meditation" },
              ].map((field, idx) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                  <select
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Activity & Time Tracking Section */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                ⏱️ Activity & Time Tracking
              </h2>
              <p className="text-sm text-gray-600">Daily activities and time spent (in hours)</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "exercise_time", label: "Exercise Time" },
                { name: "sleep_duration", label: "Sleep Duration" },
                { name: "physical_activity", label: "Physical Activity" },
                { name: "screen_time", label: "Screen Time" },
                { name: "work_hours", label: "Work Hours" },
                { name: "social_interaction_duration", label: "Social Interaction" },
              ].map((field, idx) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label} (hrs/day) *
                  </label>
                  <input
                    type="number"
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    max="24"
                    step="0.5"
                    required
                    className="w-full rounded-2xl border border-white/50 bg-white/30 backdrop-blur-sm px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Camera Preview */}
          {!stopDetection && (
            <motion.section
              className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  📷 Emotion Detection
                </h2>
                <p className="text-sm text-gray-600">Enable your camera for emotion analysis</p>
              </div>

              {videoDevices.length > 0 && (
                <div className="mb-6 flex items-center gap-3">
                  <label htmlFor="camera-select" className="text-sm font-semibold text-gray-700">
                    Camera Device
                  </label>
                  <select
                    id="camera-select"
                    value={selectedDeviceId || ""}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value || null);
                      setWebcamReady(false);
                    }}
                    className="rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
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

              <div className="flex justify-center mb-6">
                <motion.div
                  className="relative rounded-3xl overflow-hidden border-2 border-blue-300/50 shadow-lg"
                  animate={webcamReady ? { boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" } : {}}
                >
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
                    <motion.div
                      className="absolute top-3 right-3 bg-green-500 rounded-full p-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {!webcamReady && (
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm text-gray-600 mb-4">⏳ Waiting for camera to initialize...</p>
                  {cameraError && (
                    <p className="text-xs font-medium text-red-600 mb-4 bg-red-50/50 p-3 rounded-2xl">{cameraError}</p>
                  )}
                  <motion.button
                    type="button"
                    onClick={requestCameraPermission}
                    className="rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 px-6 py-3 text-white font-semibold hover:shadow-lg transition-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Enable Camera
                  </motion.button>
                </motion.div>
              )}

              {webcamReady && (
                <motion.p
                  className="text-center text-sm text-green-600 font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✅ Camera active - Detection running
                </motion.p>
              )}
            </motion.section>
          )}

          {stopDetection && (
            <motion.section
              className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">📷 Camera Analysis Complete</p>
                <p className="text-xs text-gray-500 mt-2">Camera stopped after analysis</p>
              </div>
            </motion.section>
          )}

          {/* Background Analysis Status */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              📊 Analysis Status
            </h2>

            {stopDetection && (
              <motion.div
                className="rounded-2xl border border-gray-300/50 bg-gray-100/50 p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <p className="text-sm font-medium text-gray-700">Analysis Complete</p>
                </div>
              </motion.div>
            )}

            {!stopDetection && cameraActive && (
              <motion.div
                className="rounded-2xl border border-blue-300/50 bg-blue-100/50 p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    className="h-3 w-3 rounded-full bg-blue-500"
                    animate={{ opacity: [0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  ></motion.div>
                  <p className="text-sm font-medium text-blue-700">Analysis Running</p>
                </div>
                <p className="text-xs text-blue-600">Complete the form while we analyze emotions</p>
              </motion.div>
            )}
          </motion.section>

          {/* Submit Button */}
          <motion.div
            className="flex gap-4 pt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 px-8 py-4 font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? "🔄 Processing..." : "✅ Complete Assessment"}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientAssessmentForm;
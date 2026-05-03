"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// --- Questionnaire Data Structures ---
const gda15Questions = [
  "Are you basically satisfied with your life?",
  "Have you dropped many of your activities and interests?",
  "Do you feel that your life is empty?",
  "Do you often get bored?",
  "Are you in good spirits most of the time?",
  "Are you afraid that something bad is going to happen to you?",
  "Do you feel happy most of the time?",
  "Do you often feel helpless?",
  "Do you prefer to stay at home, rather than going out and doing new things?",
  "Do you feel you have more problems with memory than most?",
  "Do you think it is wonderful to be alive now?",
  "Do you feel pretty worthless the way you are now?",
  "Do you feel full of energy?",
  "Do you feel that your situation is hopeless?",
  "Do you think that most people are better off than you are?"
];
const gad7Questions = [
  "Feeling nervous, anxious, or on edge", "Not being able to stop or control worrying",
  "Worrying too much about different things", "Trouble relaxing",
  "Being so restless that it's hard to sit still", "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];
const gad7Options = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
const marsQuestions = [
  "1. Do you sometimes forget to take your antihypertensive medication?",
  "2. Over the past 2 weeks, were there any days when you did not take your antihypertensive medication?",
  "3. Have you ever cut back or stopped taking your antihypertensive medication without telling your doctor because you felt worse when you took it?",
  "4. When you travel or leave home, do you sometimes forget to bring your antihypertensive medication?",
  "5. Did you take your antihypertensive medicine yesterday?",
  "6. When you feel like your blood pressure are under control, do you sometimes stop taking your antihypertensive medication?",
  "7. Do you ever feel hassled about sticking to your treatment plan?"
];
const marsQ8 = "8. How often do you have difficulty remembering to take all your antihypertensive medication?";
const marsQ8Options = ["Never/Rarely", "Once in a while", "Sometimes", "Usually", "All the time"];
const iadlQuestions = [
  { title: "A. Ability to Use Telephone", options: ["Operates telephone on own initiative-looks up and dials numbers, etc.", "Dials a few well-known numbers", "Answers telephone but does not dial", "Does not use telephone at all"] },
  { title: "B. Shopping", options: ["Takes care of all shopping needs independently", "Shops independently for small purchases", "Needs to be accompanied on any shopping trip", "Completely unable to shop"] },
  { title: "C. Food Preparation", options: ["Plans, prepares and serves adequate meals independently", "Prepares adequate meals if supplied with ingredients", "Heats, serves and prepares meals, or prepares meals but does not maintain adequate diet", "Needs to have meals prepared and served"] },
  { title: "D. Housekeeping", options: ["Maintains house alone or with occasional assistance (e.g. \"heavy work domestic help\")", "Performs light daily tasks such as dish washing, bed making", "Performs light daily tasks but cannot maintain acceptable level of cleanliness", "Needs help with all home maintenance tasks", "Does not participate in any housekeeping tasks"] },
  { title: "E. Laundry", options: ["Does personal laundry completely", "Launders small items-rinses stockings, etc.", "All laundry must be done by others"] },
  { title: "F. Mode of Transportation", options: ["Travels independently on public transportation or drives own car", "Arranges own travel via taxi, but does not otherwise use public transportation", "Travels on public transportation when accompanied by another", "Travel limited to taxi or automobile with assistance of another", "Does not travel at all"] },
  { title: "G. Responsibility for Own Medications", options: ["Is responsible for taking medication in correct dosages at correct time", "Takes responsibility if medication is prepared in advance in separate dosage", "Is not capable of dispensing own medication"] },
  { title: "H. Ability to Handle Finances", options: ["Manages financial matters independently (budgets, writes checks, pays rent, bills, goes to bank), collects and keeps track of income", "Manages day-to-day purchases, but needs help with banking, major purchases, etc.", "Incapable of handling money"] }
];

const manualEmotions = [
  { label: "Angry", emoji: "😠" },
  { label: "Disgust", emoji: "🤢" },
  { label: "Fear", emoji: "😨" },
  { label: "Happy", emoji: "😀" },
  { label: "Sad", emoji: "😢" },
  { label: "Surprise", emoji: "😲" },
  { label: "Neutral", emoji: "😐" },
];

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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [useCamera, setUseCamera] = useState(true);

  // Questionnaire States
  const [currentStep, setCurrentStep] = useState(1);
  const questionnaireTopRef = useRef<HTMLDivElement>(null);

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    setTimeout(() => {
      // Use block: 'start' with some offset logic if there's a sticky header, but start is usually fine.
      questionnaireTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const [gda15, setGda15] = useState<Record<number, string>>({});
  const [gad7, setGad7] = useState<Record<number, string>>({});
  const [mars, setMars] = useState<Record<number, string>>({});
  const [mars8, setMars8] = useState<string>("");
  const [iadl, setIadl] = useState<Record<number, string>>({});
  const [questionnaireSaved, setQuestionnaireSaved] = useState(false);

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
  };



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
        questionnaire: { gda15, gad7, mars, mars8, iadl },
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

      // Step 4: Save psychometric scores snapshot for time-series charting
      console.log("📡 Step 4/4: Saving psychometric assessment snapshot...");
      try {
        await fetch("/api/assessment_history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            questionnaire: { gda15, gad7, mars, mars8, iadl },
          }),
        });
        console.log("✅ Step 4 complete: Psychometric snapshot saved");
      } catch (snapErr) {
        console.warn("⚠️ Could not save psychometric snapshot (non-critical):", snapErr);
      }

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
          {/* Emotion Detection & Analysis Cage */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      📷 Emotion & Status Analysis
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCamera(!useCamera);
                        if (useCamera) {
                          setCameraActive(false);
                          setStopDetection(false);
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white/50 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      {useCamera ? "Turn Camera Off" : "Turn Camera On"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Real-time emotion detection for your assessment or select manually</p>

                  {/* Caregiver Note */}
                  <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/60 backdrop-blur-sm px-4 py-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5 shrink-0">👥</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">For Caregivers</p>
                      <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                        If you are filling this form on behalf of a patient, please <strong>turn off the camera</strong> using the button above, then <strong>select the patient's current emotion</strong> from the emoji picker that appears below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Status Inside Cage */}
                <div className="mb-6">
                  {!useCamera && detectedEmotion ? (
                    <motion.div
                      className="rounded-2xl border border-green-300/50 bg-green-100/50 p-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <p className="text-sm font-medium text-green-700">Emotion Selected: {detectedEmotion}</p>
                      </div>
                      <p className="text-xs text-green-600">Manual selection recorded</p>
                    </motion.div>
                  ) : stopDetection ? (
                    <motion.div
                      className="rounded-2xl border border-gray-300/50 bg-gray-100/50 p-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                        <p className="text-sm font-medium text-gray-700">Analysis Complete</p>
                      </div>
                      <p className="text-xs text-gray-500">Camera stopped after analysis</p>
                    </motion.div>
                  ) : cameraActive ? (
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
                  ) : (
                    <div className="rounded-2xl border border-gray-200/50 bg-white/50 p-5">
                      <p className="text-sm font-medium text-gray-600">Camera inactive / Manual mode</p>
                    </div>
                  )}
                </div>

                {!stopDetection && useCamera && videoDevices.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label htmlFor="camera-select" className="text-sm font-semibold text-gray-700">
                      Camera:
                    </label>
                    <select
                      id="camera-select"
                      value={selectedDeviceId || ""}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value || null);
                        setWebcamReady(false);
                      }}
                      className="rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all flex-1"
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

              {/* Webcam Component */}
              <div className="shrink-0 w-full md:w-auto flex flex-col items-center">
                {!useCamera ? (
                  <div className="w-full md:w-[280px] p-5 rounded-3xl bg-white/50 border border-white/50 shadow-md backdrop-blur-md">
                    <p className="text-sm font-semibold text-center text-gray-700 mb-4">Select Emotion Manually</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {manualEmotions.map((emo) => (
                        <button
                          key={emo.label}
                          type="button"
                          onClick={() => {
                            setDetectedEmotion(emo.label);
                            setAllPredictions({ [emo.label]: 1.0 });
                            setStopDetection(true);
                          }}
                          className={`flex flex-col items-center justify-center p-2 w-[70px] h-[70px] rounded-2xl transition-all ${
                            detectedEmotion === emo.label 
                              ? 'bg-blue-100 border-2 border-blue-400 shadow-md scale-105' 
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-3xl mb-1">{emo.emoji}</span>
                          <span className="text-[10px] font-bold text-gray-600">{emo.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !stopDetection ? (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      className="relative rounded-3xl overflow-hidden border-2 border-blue-300/50 shadow-lg bg-gray-900 w-[160px] h-[120px]"
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
                        className="object-cover w-full h-full"
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
                          className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </motion.div>
                      )}
                    </motion.div>
                    
                    {!webcamReady && (
                      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-xs text-gray-600 mb-2">⏳ Initializing...</p>
                        {cameraError ? (
                          <p className="text-xs font-medium text-red-600 bg-red-50/50 p-2 rounded-xl">{cameraError}</p>
                        ) : (
                          <motion.button
                            type="button"
                            onClick={requestCameraPermission}
                            className="text-xs rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 px-4 py-2 text-white font-semibold hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Enable Camera
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="w-[160px] h-[120px] rounded-3xl bg-gray-100 flex flex-col items-center justify-center border-2 border-gray-200">
                    <span className="text-2xl mb-1">✅</span>
                    <span className="text-xs text-gray-500 font-medium">Done</span>
                  </div>
                )}
              </div>
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


          {/* Questionnaire Cage */}
          <motion.section
            className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="mb-6" ref={questionnaireTopRef}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                📋 Pre-Consultation Questionnaire
              </h2>
              <p className="text-sm text-gray-600">Please complete all 4 parts for an accurate assessment</p>
            </div>

            {questionnaireSaved ? (
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl border border-emerald-200 text-center">
                <p className="text-xl mb-2">✅</p>
                <p className="font-bold text-lg">Questionnaire Responses Saved</p>
                <p className="text-sm mt-1">Your responses have been recorded and will be submitted along with the assessment.</p>
                <button type="button" onClick={() => { setQuestionnaireSaved(false); handleStepChange(1); }} className="mt-4 text-emerald-600 underline text-sm">Edit Responses</button>
              </div>
            ) : (
              <div className="bg-white/50 rounded-2xl p-6 border border-white/60">
                {/* Step Navigation Bar */}
                <div className="flex justify-between items-center mb-8 bg-gray-100 rounded-full p-1 relative">
                  <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(currentStep / 4) * 100}%`, zIndex: 0 }}></div>
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`relative z-10 w-1/4 text-center py-2 text-sm font-bold rounded-full transition-colors ${currentStep >= step ? 'text-white' : 'text-gray-500'}`}>
                      Part {step}
                    </div>
                  ))}
                </div>

                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-800">Part 1: GDA-15</h3>
                    <div className="space-y-4">
                      {gda15Questions.map((q, i) => (
                        <div key={`gda-${i}`} className="bg-white p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                          <label className="text-gray-700 flex-1">{i + 1}. {q}</label>
                          <div className="flex gap-4 shrink-0">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded-lg hover:bg-blue-50">
                                <input type="radio" name={`gda15-${i}`} value={opt} checked={gda15[i] === opt} onChange={(e) => setGda15({...gda15, [i]: e.target.value})} className="w-4 h-4 text-blue-600" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button type="button" onClick={() => handleStepChange(2)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">Next Part →</button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-teal-800">Part 2: GAD-7</h3>
                    <div className="space-y-4">
                      {gad7Questions.map((q, i) => (
                        <div key={`gad-${i}`} className="bg-white p-4 rounded-xl border space-y-3 shadow-sm">
                          <label className="text-gray-700 block font-medium">{i + 1}. {q}</label>
                          <div className="flex flex-wrap gap-4">
                            {gad7Options.map(opt => (
                              <label key={opt} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${gad7[i] === opt ? 'bg-teal-50 border-teal-300' : 'bg-gray-50'}`}>
                                <input type="radio" name={`gad7-${i}`} value={opt} checked={gad7[i] === opt} onChange={(e) => setGad7({...gad7, [i]: e.target.value})} className="w-4 h-4" />
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button type="button" onClick={() => handleStepChange(1)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">← Back</button>
                      <button type="button" onClick={() => handleStepChange(3)} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md hover:bg-teal-700 transition-colors">Next Part →</button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-amber-800">Part 3: MARS/MMAS</h3>
                    <div className="space-y-4">
                      {marsQuestions.map((q, i) => (
                        <div key={`mars-${i}`} className="bg-white p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                          <label className="text-gray-700 flex-1">{q}</label>
                          <div className="flex gap-4 shrink-0">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded-lg hover:bg-amber-50">
                                <input type="radio" name={`mars-${i}`} value={opt} checked={mars[i] === opt} onChange={(e) => setMars({...mars, [i]: e.target.value})} className="w-4 h-4 text-amber-600" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="bg-white p-4 rounded-xl border space-y-3 shadow-sm">
                        <label className="text-gray-700 block font-medium">{marsQ8}</label>
                        <div className="flex flex-wrap gap-4">
                          {marsQ8Options.map(opt => (
                            <label key={opt} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${mars8 === opt ? 'bg-amber-50 border-amber-300' : 'bg-gray-50'}`}>
                              <input type="radio" name="mars8" value={opt} checked={mars8 === opt} onChange={(e) => setMars8(e.target.value)} className="w-4 h-4 text-amber-600" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button type="button" onClick={() => handleStepChange(2)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">← Back</button>
                      <button type="button" onClick={() => handleStepChange(4)} className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 transition-colors">Next Part →</button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-purple-800">Part 4: IADL</h3>
                    <div className="space-y-4">
                      {iadlQuestions.map((group, i) => (
                        <div key={`iadl-${i}`} className="bg-white p-5 rounded-xl border space-y-4 shadow-sm">
                          <label className="text-purple-900 block font-bold text-lg border-b pb-2">{group.title}</label>
                          <div className="flex flex-col gap-3">
                            {group.options.map((opt, optIndex) => (
                              <label key={optIndex} className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${iadl[i] === opt ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name={`iadl-${i}`} value={opt} checked={iadl[i] === opt} onChange={(e) => setIadl({...iadl, [i]: e.target.value})} className="w-5 h-5 mt-0.5 text-purple-600" />
                                <span className="text-gray-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
                      <button type="button" onClick={() => handleStepChange(3)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">← Back</button>
                      <button type="button" onClick={() => setQuestionnaireSaved(true)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transform transition-transform hover:scale-105">
                        💾 Save Response
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
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
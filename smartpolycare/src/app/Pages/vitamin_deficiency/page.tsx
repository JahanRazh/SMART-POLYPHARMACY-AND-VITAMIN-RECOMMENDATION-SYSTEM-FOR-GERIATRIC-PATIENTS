"use client";
// === React & Next.js imports ===
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// === Context & Styling imports ===
import { useAuth } from "@/app/components/Contexts/AuthContext";
import styles from "./page.module.css";

// === UI Component icons from Lucide React ===
import { Plus, X, Search, Beaker, RotateCcw, Activity, Download, FileText, FileSpreadsheet } from "lucide-react";

// === Export libraries for PDF and Excel generation ===
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/* ================= TYPES DEFINITIONS ================= */

/** Represents dosage information for a single medication */
type DrugDosage = {
  dosage_mg: string;           // Dosage in milligrams
  quantity: string;            // Number of doses per day
  duration_weeks: string;      // How long the medication is taken (in weeks)
};

/** Represents a single vitamin deficiency prediction result */
type VitaminResult = {
  vitamin: string;             // Vitamin identifier/code (e.g., "B12")
  name: string;                // Full name of the vitamin
  description: string;         // Risk description and clinical significance
  foods: string[];             // Recommended dietary sources for this vitamin
  icon: string;                // Emoji or icon representation
  contributing_pairs: string[]; // Drug combinations causing this deficiency
  risk_percentage: number;     // Calculated risk level (0-100%)
};

/** Represents a specific drug-drug interaction pair and its effects */
type PairDetail = {
  drug1: string;               // First medication in the pair
  drug2: string;               // Second medication in the pair
  vitamins: string[];          // Vitamins affected by this combination
};

/** Complete response object from the prediction API */
type PredictionResponse = {
  predictions: VitaminResult[]; // Array of predicted vitamin depletions
  drugs: string[];             // List of input medications
  symptoms: string[];          // List of input symptoms
  predicted_vitamins: string[]; // Array of vitamin codes predicted
  pair_details: PairDetail[];  // Detailed breakdown of drug interactions
  total_pairs_analyzed: number; // Total number of drug combinations analyzed
  overall_risk_percentage: number; // Overall risk level
  dosage_info: DrugDosage[];   // Dosage information for each medication
};

/* ================= API CONFIGURATION ================= */
/** Base URL for all vitamin deficiency prediction API endpoints */
const API = "http://localhost:5000/api/vitamin-deficiency";

/* ================= MAIN COMPONENT ================= */
/**
 * VitaminDeficiencyPage Component
 * 
 * Main page for predicting drug-induced vitamin deficiencies.
 * Allows users to:
 * - Enter medications with dosage details
 * - Select symptoms from a searchable list
 * - Submit for ML-based prediction analysis
 * - View detailed vulnerability predictions
 * - Export results as PDF or Excel
 */
export default function VitaminDeficiencyPage() {
  // === Auth Context ===
  const { user, userProfile } = useAuth();
  
  /* ================ STATE MANAGEMENT ================ */
  // --- Medication Input State ---
  const [drugs, setDrugs] = useState<string[]>(["", "", "", "", ""]); // List of selected medications (min 5 empty slots)
  const [drugDosages, setDrugDosages] = useState<DrugDosage[]>( // Dosage details for each medication
    Array(5).fill(null).map(() => ({ dosage_mg: "", quantity: "", duration_weeks: "" }))
  );
  const [drugSuggestions, setDrugSuggestions] = useState<Record<number, string[]>>({}); // Autocomplete suggestions by drug index
  const [activeDrugDrop, setActiveDrugDrop] = useState<number | null>(null); // Index of currently open dropdown

  // --- Symptom Selection State ---
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]); // All available symptoms from API
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]); // User-selected symptoms
  const [symptomSearch, setSymptomSearch] = useState(""); // Search filter for symptoms

  // --- Prediction & UI State ---
  const [results, setResults] = useState<PredictionResponse | null>(null); // API response with predictions
  const [loading, setLoading] = useState(false); // Loading indicator for prediction request
  const [error, setError] = useState(""); // Error message display

  // --- DOM References ---
  const drugsContainerRef = useRef<HTMLDivElement>(null); // Reference to drugs container for click-outside detection

  /* ================ SIDE EFFECTS (useEffect) ================ */
  
  /** Load all available symptoms from API on component mount */
  useEffect(() => {
    fetch(`${API}/symptoms`)
      .then((r) => r.json())
      .then((d) => setAllSymptoms(d.items || [])) // Populate symptoms list
      .catch(() => { }); // Silent fail if API unavailable
  }, []);

  /** Fetch and restore previously saved assessment from database when user is logged in */
  useEffect(() => {
    if (!user) return; // Skip if no user authenticated
    
    fetch(`${API}/assessment?userId=${user.uid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.inputDrugs) {
          // --- Restore saved medications ---
          const restoredDrugs = [...data.inputDrugs];
          // Ensure minimum 5 empty slots for consistency
          while (restoredDrugs.length < 5) restoredDrugs.push("");
          setDrugs(restoredDrugs);

          // --- Restore selected symptoms ---
          setSelectedSymptoms(data.inputSymptoms || []);

          // --- Restore dosage information ---
          if (data.dosageInfo && data.dosageInfo.length > 0) {
            const restoredDosages = [...data.dosageInfo];
            while (restoredDosages.length < 5) {
              restoredDosages.push({ dosage_mg: "", quantity: "", duration_weeks: "" });
            }
            setDrugDosages(restoredDosages);
          }

          // --- Restore previous prediction results if available ---
          if (data.predictions) {
            const validCount = data.inputDrugs.length;
            setResults({
              predictions: data.predictions,
              drugs: data.inputDrugs,
              symptoms: data.inputSymptoms || [],
              predicted_vitamins: [],
              pair_details: data.pairDetails || [],
              total_pairs_analyzed: validCount >= 2 ? (validCount * (validCount - 1)) / 2 : 0,
              overall_risk_percentage: data.overallRiskPercentage || 0,
              dosage_info: data.dosageInfo || []
            });
          }
        }
      })
      .catch(() => { }); // Silent fail on network error
  }, [user]);

  /** Close drug suggestions dropdown when clicking outside the container */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      // Close dropdown if click occurs outside the drugs container
      if (
        drugsContainerRef.current &&
        !drugsContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDrugDrop(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle); // Cleanup listener
  }, []);

  /* ================ EVENT HANDLERS & CALLBACKS ================ */
  
  /** Fetch drug suggestions from API based on search query (autocomplete) */
  const searchDrugs = useCallback(
    async (query: string, index: number) => {
      // Clear suggestions if query is empty
      if (query.length < 1) {
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
        return;
      }
      try {
        // Fetch matching drug names from API
        const res = await fetch(
          `${API}/drugs?q=${encodeURIComponent(query)}&limit=10`
        );
        const data = await res.json();
        setDrugSuggestions((prev) => ({ ...prev, [index]: data.items || [] }));
      } catch {
        // Clear suggestions on error
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
      }
    },
    []
  );

  /** Update a specific medication name at given index */
  const updateDrug = (index: number, value: string) => {
    const updated = [...drugs];
    updated[index] = value;
    setDrugs(updated);
  };

  /** Update dosage field (dosage_mg, quantity, or duration_weeks) for a medication */
  const updateDosage = (index: number, field: keyof DrugDosage, value: string) => {
    setDrugDosages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /** Add a new empty medication input field */
  const addDrug = () => {
    setDrugs([...drugs, ""]);
    setDrugDosages([...drugDosages, { dosage_mg: "", quantity: "", duration_weeks: "" }]);
  };

  /** Remove medication at given index (minimum 5 fields always remain) */
  const removeDrug = (index: number) => {
    if (drugs.length <= 5) return; // Enforce minimum 5 fields
    setDrugs(drugs.filter((_, i) => i !== index));
    setDrugDosages(drugDosages.filter((_, i) => i !== index));
    setDrugSuggestions({}); // Clear all suggestions
    setActiveDrugDrop(null); // Close dropdown
  };

  /** Toggle symptom selection on/off */
  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  /** Filter symptoms by search query and exclude already selected ones */
  const filteredSymptoms = allSymptoms.filter(
    (s) =>
      s.toLowerCase().includes(symptomSearch.toLowerCase()) &&
      !selectedSymptoms.includes(s)
  );

  /** Get count of non-empty drug entries */
  const validDrugs = drugs.filter((d) => d.trim().length > 0);

  /** Submit prediction request to backend API with validation */
  const handlePredict = async () => {
    // Validate input: minimum 2 drugs required
    if (validDrugs.length < 2) return setError("Please enter at least 2 drugs");
    // Validate input: minimum 1 symptom required
    if (selectedSymptoms.length === 0)
      return setError("Please select at least one symptom");

    // Reset error and show loading state
    setError("");
    setLoading(true);
    setResults(null);

    try {
      // Send prediction request to backend
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid, // For saving assessment history
          drugs: validDrugs,
          symptoms: selectedSymptoms,
          dosageInfo: validDrugs.map((_, idx) => ({
            // Parse dosage information, with fallback to defaults
            dosage_mg: parseFloat(drugDosages[idx]?.dosage_mg || "0") || 0,
            quantity: parseInt(drugDosages[idx]?.quantity || "1", 10) || 1,
            duration_weeks: parseInt(drugDosages[idx]?.duration_weeks || "0", 10) || 0,
          })),
        }),
      });

      const data = await res.json();

      // Check for API errors
      if (!res.ok) {
        setError(data.message || "Prediction failed");
        return;
      }

      // Store results for display
      setResults(data as PredictionResponse);
    } catch {
      // Network or parsing error
      setError("Server error — make sure the backend is running");
    } finally {
      setLoading(false);
    }
  };

  /** Reset all inputs, results, and clear saved assessment from database */
  const handleReset = async () => {
    // Reset all input fields
    setDrugs(["", "", "", "", ""]);
    setDrugDosages(Array(5).fill(null).map(() => ({ dosage_mg: "", quantity: "", duration_weeks: "" })));
    setSelectedSymptoms([]);
    setResults(null);
    setError("");
    setDrugSuggestions({});

    // Delete saved assessment from database
    if (user) {
      try {
        await fetch(`${API}/assessment?userId=${user.uid}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete assessment", err);
      }
    }
  };

  /** Export prediction results as PDF report */
  const exportPDF = () => {
    if (!results) return; // Skip if no results available
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add report title
    doc.setFontSize(18);
    doc.text("Vitamin Deficiency Assessment Report", 14, 22);

    // Add patient information header
    doc.setFontSize(11);
    doc.text(`Patient Name: ${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`, 14, 30);
    doc.text(`Age: ${userProfile?.age || "N/A"}   |   Gender: ${userProfile?.gender || "N/A"}`, 14, 36);

    // Section 1: Input medications and symptoms
    doc.setFontSize(14);
    doc.text("1. Input Medications & Symptoms", 14, 48);

    // Add medications and symptoms table
    autoTable(doc, {
      startY: 53,
      head: [["Medications", "Symptoms"]],
      body: [
        [results.drugs.join(", "), results.symptoms.join(", ")]
      ],
      theme: "grid",
      headStyles: { fillColor: [14, 165, 233] },
    });

    // Get position after last table and add section 2
    let finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(14);
    doc.text("2. Predicted Vitamin Depletions", 14, finalY + 15);

    // Format vulnerability data for table
    const vulnerabilityData = results.predictions.map(v => [
      v.name,
      v.description,
      v.contributing_pairs.join(", "),
      `${v.risk_percentage}%`,
      v.foods.join(", ")
    ]);

    // Add detailed vitamins table with risk data
    autoTable(doc, {
      startY: finalY + 20,
      head: [["Vitamin", "Risk Description", "Causing Drug Pair", "Risk %", "Dietary Sources Needed"]],
      body: vulnerabilityData.length > 0 ? vulnerabilityData : [["None", "No specific vulnerabilities detected", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { cellPadding: 4, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 38 }, 3: { cellWidth: 18 } }
    });

    // Download PDF file
    doc.save("vitamin_assessment_report.pdf");
  };

  /** Export prediction results as Excel workbook with multiple sheets */
  const exportExcel = () => {
    if (!results) return; // Skip if no results available

    // Prepare patient profile data
    const patientData = [
      { Field: "Patient Name", Value: `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}` },
      { Field: "Age", Value: userProfile?.age || "N/A" },
      { Field: "Gender", Value: userProfile?.gender || "N/A" },
      { Field: "Assessment Date", Value: new Date().toLocaleDateString() }
    ];

    // Prepare input regimen data (medications and symptoms)
    const inputData = results.drugs.map((d, i) => ({
      "Medication Name": d,
      "Symptom": results.symptoms[i] || ""
    }));

    // Prepare predictions data (vitamin deficiencies and risks)
    const vitData = results.predictions.map(v => ({
      "Target Vitamin": v.name,
      "Vitamin Key": v.vitamin,
      "Description": v.description,
      "Risk Percentage": `${v.risk_percentage}%`,
      "Reactions Causes By": v.contributing_pairs.join(" | "),
      "Suggested Dietary Replacements": v.foods.join(", ")
    }));

    // Create new workbook
    const wb = XLSX.utils.book_new();

    // Add patient profile sheet
    const wsPatient = XLSX.utils.json_to_sheet(patientData);
    XLSX.utils.book_append_sheet(wb, wsPatient, "Patient Profile");

    // Add input regimen sheet
    const wsInput = XLSX.utils.json_to_sheet(inputData);
    XLSX.utils.book_append_sheet(wb, wsInput, "Input Regimen");

    // Add predictions sheet
    const wsVits = XLSX.utils.json_to_sheet(vitData.length > 0 ? vitData : [{ Message: "No vulnerabilities detected by Model" }]);
    XLSX.utils.book_append_sheet(wb, wsVits, "Predictions");

    // Download Excel file
    XLSX.writeFile(wb, "vitamin_assessment_report.xlsx");
  };

  /* ================= RENDER / JSX ================= */
  return (
    <main className={styles.pageContainer}>
      {/* Background decorative element */}
      <div className={styles.backgroundDecoration}></div>

      {/* ===== PAGE HEADER WITH TITLE AND ICON ===== */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Activity color="#0ea5e9" size={28} /> {/* Activity icon */}
          <h1 className={styles.pageTitle}>
            Vitamin Predictor
          </h1>
        </div>
      </header>

      {/* ===== HERO BANNER WITH INTRO TEXT ===== */}
      <div className={styles.heroSection}>
        <h2 className={styles.heroTitle}>
          Drug-Induced <span className={styles.highlightText}>Vitamin Deficiency</span>
        </h2>
        <p className={styles.heroSubtitle}>
          Enter your medications and symptoms — our ML model will analyze all
          drug pair combinations to predict possible systemic vitamin depletions.
        </p>
      </div>

      {/* ===== PATIENT PROFILE CARD (shown only if user logged in) ===== */}
      {user && (
        <div className={styles.snapshotCard}>
          {/* Card header with patient avatar and title */}
          <div className={styles.snapshotHeader}>
            <div className={styles.snapshotIconWrap}>
              {/* Display user profile photo or default user icon */}
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="avatar" className={styles.snapshotAvatarImg} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.snapshotIcon}>
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h2 className={styles.snapshotTitle}>Patient Snapshot</h2>
              <p className={styles.snapshotSubtitle}>Your profile details from account</p>
            </div>
          </div>

          {/* Grid layout displaying patient information fields */}
          <div className={styles.snapshotGrid}>
            {/* First Name Field */}
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>First Name</label>
              <div className={styles.snapshotValue}>
                {userProfile?.firstName || <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>

            {/* Last Name Field */}
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Last Name</label>
              <div className={styles.snapshotValue}>
                {userProfile?.lastName || <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>

            {/* Age Field */}
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Age</label>
              <div className={styles.snapshotValue}>
                {userProfile?.age
                  ? <>{userProfile.age} <span className={styles.snapshotUnit}>years</span></>
                  : <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>

            {/* Gender Field */}
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Gender</label>
              <div className={styles.snapshotValue}>
                {userProfile?.gender
                  ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)
                  : <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN TWO-COLUMN LAYOUT ===== */}
      <div className={styles.mainLayout}>
        {/* ===== LEFT COLUMN: MEDICATION INPUTS ===== */}
        <section ref={drugsContainerRef} className={styles.card}>
          {/* Card header with title and validation hint */}
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              Medications <span className={styles.subText}>({validDrugs.length} inputted)</span>
            </h3>
            <span className={styles.subText}>Min 2 required</span>
          </div>

          {/* List of medication input fields */}
          <div className={styles.drugList}>
            {drugs.map((drug, i) => (
              <div key={i} className={styles.drugInputRow}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Medication name input with autocomplete dropdown */}
                  <div className={styles.drugInputWrapper} style={{ flex: 1 }}>
                    <label className={styles.inputLabel}>Medication {i + 1}</label>
                    <input
                      className={styles.textInput}
                      placeholder="Type drug name..."
                      value={drug}
                      onChange={(e) => {
                        updateDrug(i, e.target.value);
                        searchDrugs(e.target.value, i); // Trigger autocomplete search
                        setActiveDrugDrop(i); // Show dropdown
                      }}
                      onFocus={() => {
                        // Show dropdown if suggestions exist
                        if (drugSuggestions[i] && drugSuggestions[i].length > 0)
                          setActiveDrugDrop(i);
                      }}
                    />
                    {/* Dropdown list of drug suggestions */}
                    {activeDrugDrop === i && drugSuggestions[i] && drugSuggestions[i].length > 0 && (
                      <ul className={styles.suggestionsList}>
                        {drugSuggestions[i].map((d) => (
                          <li
                            key={d}
                            className={styles.suggestionItem}
                            onClick={() => {
                              updateDrug(i, d); // Select suggestion
                              setActiveDrugDrop(null); // Close dropdown
                            }}
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Row of dosage fields: dosage (mg), quantity, duration (weeks) */}
                  <div className={styles.dosageRow}>
                    {/* Dosage amount input */}
                    <div className={styles.dosageField}>
                      <label className={styles.inputLabel}>Dosage (mg)</label>
                      <input
                        className={styles.textInput}
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={drugDosages[i]?.dosage_mg ?? ""}
                        onChange={(e) => updateDosage(i, "dosage_mg", e.target.value)}
                      />
                    </div>
                    
                    {/* Daily quantity input */}
                    <div className={styles.dosageField}>
                      <label className={styles.inputLabel}>Quantity</label>
                      <input
                        className={styles.textInput}
                        type="number"
                        min="1"
                        placeholder="e.g. 2"
                        value={drugDosages[i]?.quantity ?? ""}
                        onChange={(e) => updateDosage(i, "quantity", e.target.value)}
                      />
                    </div>
                    
                    {/* Duration in weeks input */}
                    <div className={styles.dosageField}>
                      <label className={styles.inputLabel}>Duration (weeks)</label>
                      <input
                        className={styles.textInput}
                        type="number"
                        min="0"
                        placeholder="e.g. 4"
                        value={drugDosages[i]?.duration_weeks ?? ""}
                        onChange={(e) => updateDosage(i, "duration_weeks", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Remove button (only shown if more than 5 medications) */}
                {drugs.length > 5 && (
                  <button
                    onClick={() => removeDrug(i)}
                    className={styles.removeBtn}
                    title="Remove drug"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Button to add more medication fields */}
          <button onClick={addDrug} className={styles.addDrugBtn}>
            <Plus size={16} /> Add Another Medication
          </button>

          {/* Summary statistics showing drug count, pairs to be analyzed, and selected symptoms */}
          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>Analysis Summary</p>
            <div className={styles.summaryGrid}>
              {/* Drug count */}
              <div>
                <p className={`${styles.summaryValue} ${styles.blue}`}>{validDrugs.length}</p>
                <p className={styles.summaryLabel}>Drugs</p>
              </div>
              
              {/* Number of drug pair combinations to be analyzed */}
              <div>
                <p className={`${styles.summaryValue} ${styles.green}`}>
                  {validDrugs.length >= 2 ? (validDrugs.length * (validDrugs.length - 1)) / 2 : 0}
                </p>
                <p className={styles.summaryLabel}>Pairs Analyzed</p>
              </div>
              
              {/* Selected symptom count */}
              <div>
                <p className={`${styles.summaryValue} ${styles.purple}`}>{selectedSymptoms.length}</p>
                <p className={styles.summaryLabel}>Symptoms</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== RIGHT COLUMN: SYMPTOM SELECTION ===== */}
        <section className={styles.card}>
          {/* Card header with symptom count */}
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              Symptoms <span className={styles.subText}>({selectedSymptoms.length} selected)</span>
            </h3>
          </div>

          {/* Symptom search/filter input */}
          <div className={styles.drugInputWrapper}>
            <input
              className={styles.textInput}
              placeholder="Search symptoms..."
              value={symptomSearch}
              onChange={(e) => setSymptomSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "1rem", top: "1.1rem" }} />
          </div>

          {/* Tags showing selected symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className={styles.symptomTags}>
              {selectedSymptoms.map((s) => (
                <span
                  key={s}
                  className={styles.symptomTag}
                  onClick={() => toggleSymptom(s)} // Click to deselect
                >
                  {s} <span className={styles.symptomTagRemove}>×</span>
                </span>
              ))}
            </div>
          )}

          {/* Available symptoms list (filtered by search) */}
          <div className={styles.availableSymptoms}>
            {filteredSymptoms.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                {allSymptoms.length === 0 ? "Loading symptoms..." : "No matching symptoms"}
              </p>
            ) : (
              <div>
                {filteredSymptoms.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)} // Click to select
                    className={styles.availableSymptomBtn}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Error message display (shown if validation or API error occurs) */}
      {error && (
        <div className={styles.errorBox}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      {/* Action buttons: Predict and Reset */}
      <div className={styles.actionsContainer}>
        {/* Primary prediction button */}
        <button
          onClick={handlePredict}
          disabled={loading} // Disable while loading
          className={styles.predictBtn}
        >
          {loading ? (
            <>
              {/* Loading spinner and message */}
              <svg className={styles.spinner} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing Pair Combinations...
            </>
          ) : (
            <>
              <Beaker size={20} />
              Predict Deficiency Risks
            </>
          )}
        </button>
        
        {/* Reset button to clear all inputs */}
        <button onClick={handleReset} className={styles.resetBtn}>
          <RotateCcw size={18} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Reset Options
        </button>
      </div>

      {/* ===== RESULTS SECTION (shown after prediction completes) ===== */}
      {results !== null && (
        <section className={styles.resultsSection}>
          {/* Results header with title and export buttons */}
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderTop}>
              {/* Title and subtitle showing vulnerability count and analysis summary */}
              <div>
                <h3 className={styles.resultsTitle}>
                  {results.predictions.length > 0 ? (
                    <>Predicted Vulnerabilities ({results.predictions.length})</>
                  ) : (
                    "No Specific Vulnerabilities Detected"
                  )}
                </h3>
                <p className={styles.resultsSubtitle}>
                  Analysis complete for {results.total_pairs_analyzed} permutation(s) among {results.drugs.length} active prescriptions.
                </p>
              </div>

              {/* Export buttons for PDF and Excel formats */}
              <div className={styles.exportControls}>
                <button onClick={exportPDF} className={styles.exportPdfBtn} title="Export to PDF">
                  <FileText size={18} />
                  <span>PDF</span>
                </button>
                <button onClick={exportExcel} className={styles.exportExcelBtn} title="Export to Excel">
                  <FileSpreadsheet size={18} />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Message shown when no vulnerabilities are detected */}
          {results.predictions.length === 0 && (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              Based on the provided regimen and symptom presentation, the model predicts low risk of immediate vitamin depletion interactions.
            </p>
          )}

          {/* Grid of vitamin deficiency cards (one card per predicted vitamin) */}
          <div className={styles.vitaminsGrid}>
            {results.predictions.map((v) => (
              <div key={v.vitamin} className={styles.vitaminCard}>
                {/* Card header with vitamin icon and name */}
                <div className={styles.vitaminHeader}>
                  <div className={styles.vitaminIcon}>{v.icon}</div>
                  <div>
                    <h4 className={styles.vitaminName}>{v.name}</h4>
                    <span className={styles.vitaminBadge}>{v.vitamin}</span>
                  </div>
                </div>

                {/* Description of vitamin's clinical role */}
                <p className={styles.vitaminDesc}>{v.description}</p>

                {/* Risk percentage visualization with color-coded bar */}
                <div className={styles.riskSection}>
                  <div className={styles.riskLabelRow}>
                    <span className={styles.riskLabel}>Deficiency Risk</span>
                    <span className={styles.riskValue}>{v.risk_percentage}%</span>
                  </div>
                  {/* Animated progress bar showing risk level */}
                  <div className={styles.riskBarTrack}>
                    <div
                      className={styles.riskBarFill}
                      style={{
                        width: `${v.risk_percentage}%`,
                        // Color gradient changes based on risk level: red (high), orange (moderate), yellow (elevated)
                        background:
                          v.risk_percentage >= 80
                            ? "linear-gradient(90deg,#ef4444,#b91c1c)"
                            : v.risk_percentage >= 60
                            ? "linear-gradient(90deg,#f97316,#ea580c)"
                            : "linear-gradient(90deg,#eab308,#ca8a04)",
                      }}
                    />
                  </div>
                  {/* Clinical recommendation based on risk level */}
                  <p className={styles.riskNote}>
                    {v.risk_percentage >= 80
                      ? "⚠️ High risk — immediate medical consultation recommended"
                      : v.risk_percentage >= 60
                      ? "🔶 Moderate risk — monitor closely"
                      : "🟡 Elevated risk — dietary adjustment advised"}
                  </p>
                </div>

                {/* Show drug combinations causing this deficiency if any */}
                {v.contributing_pairs && v.contributing_pairs.length > 0 && (
                  <div className={styles.dataSection}>
                    <p className={styles.dataLabel}>Causing Combinations</p>
                    <div className={styles.tagGroup}>
                      {v.contributing_pairs.map((pair) => (
                        <span key={pair} className={styles.causeTag}>{pair}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show recommended dietary sources for this vitamin */}
                {v.foods && v.foods.length > 0 && (
                  <div className={styles.dataSection}>
                    <p className={styles.dataLabel}>Recommended Dietary Sources</p>
                    <div className={styles.tagGroup}>
                      {v.foods.map((food) => (
                        <span key={food} className={styles.foodTag}>{food}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed breakdown showing each drug pair and associated vitamin effects */}
          {results.pair_details && results.pair_details.length > 0 && (
            <div className={styles.breakdownCard}>
              <h4 className={styles.breakdownTitle}>Pair-by-Pair Breakdown</h4>
              <div className={styles.breakdownList}>
                {results.pair_details.map((p, i) => (
                  <div key={i} className={styles.breakdownItem}>
                    {/* Shows the two drugs in each combination */}
                    <span className={styles.breakdownPair}>
                      {p.drug1} <span className={styles.breakdownPlus}>+</span> {p.drug2}
                    </span>
                    {/* Vitamins affected by this specific drug pair */}
                    <div className={styles.breakdownVitamins}>
                      {p.vitamins.map((vit) => (
                        <span key={vit} className={styles.breakdownVitTag}>{vit}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import styles from "./page.module.css";
import { Plus, X, Search, Beaker, RotateCcw, Activity, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/* ================= TYPES ================= */

type DrugDetail = {
  name: string;
  dosage: string;   // mg
  qty: string;      // tablets / units
  duration: string; // days
};

type VitaminResult = {
  vitamin: string;
  name: string;
  description: string;
  foods: string[];
  icon: string;
  contributing_pairs: string[];
  risk_percentage: number;
};

type PairDetail = {
  drug1: string;
  drug2: string;
  vitamins: string[];
};

type PredictionResponse = {
  predictions: VitaminResult[];
  drugs: string[];
  symptoms: string[];
  predicted_vitamins: string[];
  pair_details: PairDetail[];
  total_pairs_analyzed: number;
  overall_risk_percentage: number;
};

/* ================= API BASE ================= */
const API = "http://localhost:5000/api/vitamin-deficiency";

/* ================= RISK COLOUR ================= */
function riskColor(pct: number): string {
  if (pct >= 80) return "#ef4444";
  if (pct >= 60) return "#f97316";
  if (pct >= 45) return "#eab308";
  return "#10b981";
}

function riskLabel(pct: number): string {
  if (pct >= 80) return "Critical";
  if (pct >= 60) return "High";
  if (pct >= 45) return "Moderate";
  return "Low";
}

/* ================= COMPONENT ================= */

const EMPTY_DRUG: DrugDetail = { name: "", dosage: "", qty: "", duration: "" };

export default function VitaminDeficiencyPage() {
  const { user, userProfile } = useAuth();

  /* ---- drug detail rows ---- */
  const [drugRows, setDrugRows] = useState<DrugDetail[]>([
    { ...EMPTY_DRUG },
    { ...EMPTY_DRUG },
    { ...EMPTY_DRUG },
    { ...EMPTY_DRUG },
    { ...EMPTY_DRUG },
  ]);
  const [drugSuggestions, setDrugSuggestions] = useState<Record<number, string[]>>({});
  const [activeDrugDrop, setActiveDrugDrop] = useState<number | null>(null);

  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");

  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const drugsContainerRef = useRef<HTMLDivElement>(null);

  /* ---- load symptoms ---- */
  useEffect(() => {
    fetch(`${API}/symptoms`)
      .then((r) => r.json())
      .then((d) => setAllSymptoms(d.items || []))
      .catch(() => {});
  }, []);

  /* ---- fetch saved assessment ---- */
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/assessment?userId=${user.uid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.inputDrugs) {
          const saved: DrugDetail[] = (data.inputDrugs as string[]).map((name, i) => {
            const detail = (data.drugDetails || [])[i] || {};
            return {
              name,
              dosage: String(detail.dosage || ""),
              qty: String(detail.qty || ""),
              duration: String(detail.duration || ""),
            };
          });
          if (saved.length < 5) {
            while (saved.length < 5) saved.push({ ...EMPTY_DRUG });
          }
          setDrugRows(saved);
          setSelectedSymptoms(data.inputSymptoms || []);
        }
      })
      .catch(() => {});
  }, [user]);

  /* ---- close dropdowns ---- */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (drugsContainerRef.current && !drugsContainerRef.current.contains(e.target as Node)) {
        setActiveDrugDrop(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ---- drug autocomplete ---- */
  const searchDrugs = useCallback(async (query: string, index: number) => {
    if (query.length < 1) {
      setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await fetch(`${API}/drugs?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setDrugSuggestions((prev) => ({ ...prev, [index]: data.items || [] }));
    } catch {
      setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  }, []);

  /* ---- update a field on a drug row ---- */
  const updateRow = (index: number, field: keyof DrugDetail, value: string) => {
    setDrugRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDrug = () => setDrugRows((prev) => [...prev, { ...EMPTY_DRUG }]);

  const removeDrug = (index: number) => {
    if (drugRows.length <= 5) return;
    setDrugRows((prev) => prev.filter((_, i) => i !== index));
    setDrugSuggestions({});
    setActiveDrugDrop(null);
  };

  /* ---- symptom toggle ---- */
  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const filteredSymptoms = allSymptoms.filter(
    (s) => s.toLowerCase().includes(symptomSearch.toLowerCase()) && !selectedSymptoms.includes(s)
  );

  const validRows = drugRows.filter((r) => r.name.trim().length > 0);

  /* ---- submit ---- */
  const handlePredict = async () => {
    if (validRows.length < 2) return setError("Please enter at least 2 drug names");
    if (selectedSymptoms.length === 0) return setError("Please select at least one symptom");

    setError("");
    setLoading(true);
    setResults(null);

    const drugNames = validRows.map((r) => r.name.trim());
    const drugDetails = validRows.map((r) => ({
      dosage: parseFloat(r.dosage) || 0,
      qty: parseFloat(r.qty) || 1,
      duration: parseFloat(r.duration) || 0,
    }));

    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          drugs: drugNames,
          symptoms: selectedSymptoms,
          drugDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Prediction failed"); return; }
      setResults(data as PredictionResponse);
    } catch {
      setError("Server error — make sure the backend is running");
    } finally {
      setLoading(false);
    }
  };

  /* ---- reset ---- */
  const handleReset = () => {
    setDrugRows([{ ...EMPTY_DRUG }, { ...EMPTY_DRUG }, { ...EMPTY_DRUG }, { ...EMPTY_DRUG }, { ...EMPTY_DRUG }]);
    setSelectedSymptoms([]);
    setResults(null);
    setError("");
    setDrugSuggestions({});
  };

  /* ---- PDF export ---- */
  const exportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Vitamin Deficiency Assessment Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Patient: ${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`, 14, 30);
    doc.text(`Age: ${userProfile?.age || "N/A"}   |   Gender: ${userProfile?.gender || "N/A"}`, 14, 36);
    doc.setFontSize(14);
    doc.text("1. Input Medications & Symptoms", 14, 48);
    autoTable(doc, {
      startY: 53,
      head: [["Medication", "Dosage (mg)", "Qty", "Duration (days)", "Symptoms"]],
      body: validRows.map((r, i) => [r.name, r.dosage || "-", r.qty || "-", r.duration || "-", results.symptoms[i] || ""]),
      theme: "grid",
      headStyles: { fillColor: [14, 165, 233] },
    });
    let finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(14);
    doc.text("2. Predicted Vitamin Depletions", 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [["Vitamin", "Risk %", "Description", "Causing Pair", "Diet Sources"]],
      body: results.predictions.length > 0
        ? results.predictions.map((v) => [v.name, `${v.risk_percentage}%`, v.description, v.contributing_pairs.join(", "), v.foods.join(", ")])
        : [["None", "-", "No vulnerabilities detected", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { cellPadding: 4, fontSize: 9 },
    });
    doc.save("vitamin_assessment_report.pdf");
  };

  /* ---- Excel export ---- */
  const exportExcel = () => {
    if (!results) return;
    const wb = XLSX.utils.book_new();
    const wsPatient = XLSX.utils.json_to_sheet([
      { Field: "Patient Name", Value: `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}` },
      { Field: "Age", Value: userProfile?.age || "N/A" },
      { Field: "Gender", Value: userProfile?.gender || "N/A" },
      { Field: "Assessment Date", Value: new Date().toLocaleDateString() },
    ]);
    XLSX.utils.book_append_sheet(wb, wsPatient, "Patient Profile");

    const wsInput = XLSX.utils.json_to_sheet(validRows.map((r) => ({
      "Medication": r.name, "Dosage (mg)": r.dosage || "-",
      "Quantity": r.qty || "-", "Duration (days)": r.duration || "-",
    })));
    XLSX.utils.book_append_sheet(wb, wsInput, "Input Regimen");

    const wsVits = XLSX.utils.json_to_sheet(
      results.predictions.length > 0
        ? results.predictions.map((v) => ({
            "Vitamin": v.name, "Risk %": `${v.risk_percentage}%`,
            "Description": v.description,
            "Causing Pairs": v.contributing_pairs.join(" | "),
            "Diet Sources": v.foods.join(", "),
          }))
        : [{ Message: "No vulnerabilities detected" }]
    );
    XLSX.utils.book_append_sheet(wb, wsVits, "Predictions");
    XLSX.writeFile(wb, "vitamin_assessment_report.xlsx");
  };

  /* ================= RENDER ================= */
  return (
    <main className={styles.pageContainer}>
      <div className={styles.backgroundDecoration}></div>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Activity color="#0ea5e9" size={28} />
          <h1 className={styles.pageTitle}>Vitamin Predictor</h1>
        </div>
      </header>

      {/* HERO */}
      <div className={styles.heroSection}>
        <h2 className={styles.heroTitle}>
          Drug-Induced <span className={styles.highlightText}>Vitamin Deficiency</span>
        </h2>
        <p className={styles.heroSubtitle}>
          Enter your medications with dosage &amp; duration — our ML model will analyse all drug pair combinations and calculate vitamin depletion risk percentages.
        </p>
      </div>

      {/* PATIENT SNAPSHOT */}
      {user && (
        <div className={styles.snapshotCard}>
          <div className={styles.snapshotHeader}>
            <div className={styles.snapshotIconWrap}>
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
          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>First Name</label>
              <div className={styles.snapshotValue}>{userProfile?.firstName || <span className={styles.snapshotEmpty}>Not set</span>}</div>
            </div>
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Last Name</label>
              <div className={styles.snapshotValue}>{userProfile?.lastName || <span className={styles.snapshotEmpty}>Not set</span>}</div>
            </div>
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Age</label>
              <div className={styles.snapshotValue}>
                {userProfile?.age ? <>{userProfile.age} <span className={styles.snapshotUnit}>years</span></> : <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>
            <div className={styles.snapshotField}>
              <label className={styles.snapshotLabel}>Gender</label>
              <div className={styles.snapshotValue}>
                {userProfile?.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : <span className={styles.snapshotEmpty}>Not set</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className={styles.mainLayout}>
        {/* LEFT: DRUG INPUTS */}
        <section ref={drugsContainerRef} className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              Medications <span className={styles.subText}>({validRows.length} inputted)</span>
            </h3>
            <span className={styles.subText}>Min 2 required</span>
          </div>

          <div className={styles.drugList}>
            {drugRows.map((row, i) => (
              <div key={i} className={styles.drugCard}>
                {/* Drug name row */}
                <div className={styles.drugNameRow}>
                  <div className={styles.drugInputWrapper} style={{ flex: 1 }}>
                    <label className={styles.inputLabel}>Medication {i + 1}</label>
                    <input
                      className={styles.textInput}
                      placeholder="Type drug name..."
                      value={row.name}
                      onChange={(e) => {
                        updateRow(i, "name", e.target.value);
                        searchDrugs(e.target.value, i);
                        setActiveDrugDrop(i);
                      }}
                      onFocus={() => {
                        if (drugSuggestions[i]?.length > 0) setActiveDrugDrop(i);
                      }}
                    />
                    {activeDrugDrop === i && drugSuggestions[i]?.length > 0 && (
                      <ul className={styles.suggestionsList}>
                        {drugSuggestions[i].map((d) => (
                          <li
                            key={d}
                            className={styles.suggestionItem}
                            onClick={() => { updateRow(i, "name", d); setActiveDrugDrop(null); }}
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {drugRows.length > 5 && (
                    <button onClick={() => removeDrug(i)} className={styles.removeBtn} title="Remove drug">
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Dosage / Qty / Duration row */}
                <div className={styles.drugMetaRow}>
                  <div className={styles.metaField}>
                    <label className={styles.inputLabel}>Dosage (mg)</label>
                    <input
                      className={styles.metaInput}
                      type="number"
                      min="0"
                      placeholder="e.g. 500"
                      value={row.dosage}
                      onChange={(e) => updateRow(i, "dosage", e.target.value)}
                    />
                  </div>
                  <div className={styles.metaField}>
                    <label className={styles.inputLabel}>Quantity</label>
                    <input
                      className={styles.metaInput}
                      type="number"
                      min="1"
                      placeholder="e.g. 2"
                      value={row.qty}
                      onChange={(e) => updateRow(i, "qty", e.target.value)}
                    />
                  </div>
                  <div className={styles.metaField}>
                    <label className={styles.inputLabel}>Duration (days)</label>
                    <input
                      className={styles.metaInput}
                      type="number"
                      min="0"
                      placeholder="e.g. 30"
                      value={row.duration}
                      onChange={(e) => updateRow(i, "duration", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addDrug} className={styles.addDrugBtn}>
            <Plus size={16} /> Add Another Medication
          </button>

          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>Analysis Summary</p>
            <div className={styles.summaryGrid}>
              <div>
                <p className={`${styles.summaryValue} ${styles.blue}`}>{validRows.length}</p>
                <p className={styles.summaryLabel}>Drugs</p>
              </div>
              <div>
                <p className={`${styles.summaryValue} ${styles.green}`}>
                  {validRows.length >= 2 ? (validRows.length * (validRows.length - 1)) / 2 : 0}
                </p>
                <p className={styles.summaryLabel}>Pairs Analyzed</p>
              </div>
              <div>
                <p className={`${styles.summaryValue} ${styles.purple}`}>{selectedSymptoms.length}</p>
                <p className={styles.summaryLabel}>Symptoms</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: SYMPTOMS */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              Symptoms <span className={styles.subText}>({selectedSymptoms.length} selected)</span>
            </h3>
          </div>

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

          {selectedSymptoms.length > 0 && (
            <div className={styles.symptomTags}>
              {selectedSymptoms.map((s) => (
                <span key={s} className={styles.symptomTag} onClick={() => toggleSymptom(s)}>
                  {s} <span className={styles.symptomTagRemove}>×</span>
                </span>
              ))}
            </div>
          )}

          <div className={styles.availableSymptoms}>
            {filteredSymptoms.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                {allSymptoms.length === 0 ? "Loading symptoms..." : "No matching symptoms"}
              </p>
            ) : (
              <div>
                {filteredSymptoms.map((s) => (
                  <button key={s} onClick={() => toggleSymptom(s)} className={styles.availableSymptomBtn}>
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      <div className={styles.actionsContainer}>
        <button onClick={handlePredict} disabled={loading} className={styles.predictBtn}>
          {loading ? (
            <>
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
        <button onClick={handleReset} className={styles.resetBtn}>
          <RotateCcw size={18} style={{ marginRight: "0.5rem", display: "inline-block", verticalAlign: "middle" }} />
          Reset
        </button>
      </div>

      {/* RESULTS */}
      {results !== null && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderTop}>
              <div>
                <h3 className={styles.resultsTitle}>
                  {results.predictions.length > 0
                    ? <>Predicted Vulnerabilities ({results.predictions.length})</>
                    : "No Specific Vulnerabilities Detected"}
                </h3>
                <p className={styles.resultsSubtitle}>
                  Analysis complete for {results.total_pairs_analyzed} permutation(s) among {results.drugs.length} active prescriptions.
                  {results.overall_risk_percentage > 0 && (
                    <> Overall risk score: <strong style={{ color: riskColor(results.overall_risk_percentage) }}>{results.overall_risk_percentage}%</strong></>
                  )}
                </p>
              </div>
              <div className={styles.exportControls}>
                <button onClick={exportPDF} className={styles.exportPdfBtn} title="Export to PDF">
                  <FileText size={18} /><span>PDF</span>
                </button>
                <button onClick={exportExcel} className={styles.exportExcelBtn} title="Export to Excel">
                  <FileSpreadsheet size={18} /><span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {results.predictions.length === 0 && (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              Based on the provided regimen and symptom presentation, the model predicts low risk of immediate vitamin depletion interactions.
            </p>
          )}

          <div className={styles.vitaminsGrid}>
            {results.predictions.map((v) => {
              const pct = v.risk_percentage ?? 0;
              const color = riskColor(pct);
              return (
                <div key={v.vitamin} className={styles.vitaminCard}>
                  <div className={styles.vitaminHeader}>
                    <div className={styles.vitaminIcon}>{v.icon}</div>
                    <div>
                      <h4 className={styles.vitaminName}>{v.name}</h4>
                      <span className={styles.vitaminBadge}>{v.vitamin}</span>
                    </div>
                  </div>

                  {/* ── Risk Percentage Bar ── */}
                  <div className={styles.riskBarWrapper}>
                    <div className={styles.riskBarHeader}>
                      <span className={styles.riskBarLabel}>Deficiency Risk</span>
                      <span className={styles.riskBarPct} style={{ color }}>
                        {pct}% — <span style={{ fontWeight: 600 }}>{riskLabel(pct)}</span>
                      </span>
                    </div>
                    <div className={styles.riskBarTrack}>
                      <div
                        className={styles.riskBarFill}
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>

                  <p className={styles.vitaminDesc}>{v.description}</p>

                  {v.contributing_pairs?.length > 0 && (
                    <div className={styles.dataSection}>
                      <p className={styles.dataLabel}>Causing Combinations</p>
                      <div className={styles.tagGroup}>
                        {v.contributing_pairs.map((pair) => (
                          <span key={pair} className={styles.causeTag}>{pair}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {v.foods?.length > 0 && (
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
              );
            })}
          </div>

          {results.pair_details?.length > 0 && (
            <div className={styles.breakdownCard}>
              <h4 className={styles.breakdownTitle}>Pair-by-Pair Breakdown</h4>
              <div className={styles.breakdownList}>
                {results.pair_details.map((p, i) => (
                  <div key={i} className={styles.breakdownItem}>
                    <span className={styles.breakdownPair}>
                      {p.drug1} <span className={styles.breakdownPlus}>+</span> {p.drug2}
                    </span>
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

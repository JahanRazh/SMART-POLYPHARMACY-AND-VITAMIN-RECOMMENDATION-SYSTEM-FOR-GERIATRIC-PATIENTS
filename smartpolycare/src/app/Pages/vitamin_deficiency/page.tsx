"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import styles from "./page.module.css";
import { Plus, X, Search, Beaker, RotateCcw, Activity } from "lucide-react";

/* ================= TYPES ================= */

type VitaminResult = {
  vitamin: string;
  name: string;
  description: string;
  foods: string[];
  icon: string;
  contributing_pairs: string[];
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
};

/* ================= API BASE ================= */
const API = "http://localhost:5000/api/vitamin-deficiency";

/* ================= COMPONENT ================= */

export default function VitaminDeficiencyPage() {
  const { user } = useAuth();
  /* ---- state ---- */
  const [drugs, setDrugs] = useState<string[]>(["", "", "", "", ""]);
  const [drugSuggestions, setDrugSuggestions] = useState<Record<number, string[]>>({});
  const [activeDrugDrop, setActiveDrugDrop] = useState<number | null>(null);

  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");

  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const drugsContainerRef = useRef<HTMLDivElement>(null);

  /* ---- load symptoms on mount ---- */
  useEffect(() => {
    fetch(`${API}/symptoms`)
      .then((r) => r.json())
      .then((d) => setAllSymptoms(d.items || []))
      .catch(() => { });
  }, []);

  /* ---- fetch saved assessment ---- */
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/assessment?userId=${user.uid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.inputDrugs) {
          setDrugs(data.inputDrugs);
          setSelectedSymptoms(data.inputSymptoms || []);
        }
      })
      .catch(() => { });
  }, [user]);

  /* ---- close dropdowns on outside click ---- */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        drugsContainerRef.current &&
        !drugsContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDrugDrop(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ---- drug autocomplete ---- */
  const searchDrugs = useCallback(
    async (query: string, index: number) => {
      if (query.length < 1) {
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
        return;
      }
      try {
        const res = await fetch(
          `${API}/drugs?q=${encodeURIComponent(query)}&limit=10`
        );
        const data = await res.json();
        setDrugSuggestions((prev) => ({ ...prev, [index]: data.items || [] }));
      } catch {
        setDrugSuggestions((prev) => ({ ...prev, [index]: [] }));
      }
    },
    []
  );

  /* ---- drug list management ---- */
  const updateDrug = (index: number, value: string) => {
    const updated = [...drugs];
    updated[index] = value;
    setDrugs(updated);
  };

  const addDrug = () => {
    setDrugs([...drugs, ""]);
  };

  const removeDrug = (index: number) => {
    if (drugs.length <= 2) return; // minimum 2
    setDrugs(drugs.filter((_, i) => i !== index));
    setDrugSuggestions({});
    setActiveDrugDrop(null);
  };

  /* ---- symptom toggle ---- */
  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  /* ---- filtered symptoms for display ---- */
  const filteredSymptoms = allSymptoms.filter(
    (s) =>
      s.toLowerCase().includes(symptomSearch.toLowerCase()) &&
      !selectedSymptoms.includes(s)
  );

  /* ---- count valid drugs ---- */
  const validDrugs = drugs.filter((d) => d.trim().length > 0);

  /* ---- submit prediction ---- */
  const handlePredict = async () => {
    if (validDrugs.length < 2) return setError("Please enter at least 2 drugs");
    if (selectedSymptoms.length === 0)
      return setError("Please select at least one symptom");

    setError("");
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          drugs: validDrugs,
          symptoms: selectedSymptoms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Prediction failed");
        return;
      }

      setResults(data as PredictionResponse);
    } catch {
      setError("Server error — make sure the backend is running");
    } finally {
      setLoading(false);
    }
  };

  /* ---- reset ---- */
  const handleReset = () => {
    setDrugs(["", "", "", "", ""]);
    setSelectedSymptoms([]);
    setResults(null);
    setError("");
    setDrugSuggestions({});
  };

  /* ================= RENDER ================= */
  return (
    <main className={styles.pageContainer}>
      <div className={styles.backgroundDecoration}></div>

      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Activity color="#0ea5e9" size={28} />
          <h1 className={styles.pageTitle}>
            Vitamin Predictor
          </h1>
        </div>
      </header>

      {/* ===== HERO BANNER ===== */}
      <div className={styles.heroSection}>
        <h2 className={styles.heroTitle}>
          Drug-Induced <span className={styles.highlightText}>Vitamin Deficiency</span>
        </h2>
        <p className={styles.heroSubtitle}>
          Enter your medications and symptoms — our ML model will analyze all
          drug pair combinations to predict possible systemic vitamin depletions.
        </p>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className={styles.mainLayout}>
        {/* ===== LEFT: DRUG INPUTS ===== */}
        <section ref={drugsContainerRef} className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              Medications <span className={styles.subText}>({validDrugs.length} inputted)</span>
            </h3>
            <span className={styles.subText}>Min 2 required</span>
          </div>

          <div className={styles.drugList}>
            {drugs.map((drug, i) => (
              <div key={i} className={styles.drugInputRow}>
                <div className={styles.drugInputWrapper} style={{ flex: 1 }}>
                  <label className={styles.inputLabel}>Medication {i + 1}</label>
                  <input
                    className={styles.textInput}
                    placeholder="Type drug name..."
                    value={drug}
                    onChange={(e) => {
                      updateDrug(i, e.target.value);
                      searchDrugs(e.target.value, i);
                      setActiveDrugDrop(i);
                    }}
                    onFocus={() => {
                      if (drugSuggestions[i] && drugSuggestions[i].length > 0)
                        setActiveDrugDrop(i);
                    }}
                  />
                  {activeDrugDrop === i && drugSuggestions[i] && drugSuggestions[i].length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {drugSuggestions[i].map((d) => (
                        <li
                          key={d}
                          className={styles.suggestionItem}
                          onClick={() => {
                            updateDrug(i, d);
                            setActiveDrugDrop(null);
                          }}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {drugs.length > 2 && (
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

          <button onClick={addDrug} className={styles.addDrugBtn}>
            <Plus size={16} /> Add Another Medication
          </button>

          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>Analysis Summary</p>
            <div className={styles.summaryGrid}>
              <div>
                <p className={`${styles.summaryValue} ${styles.blue}`}>{validDrugs.length}</p>
                <p className={styles.summaryLabel}>Drugs</p>
              </div>
              <div>
                <p className={`${styles.summaryValue} ${styles.green}`}>
                  {validDrugs.length >= 2 ? (validDrugs.length * (validDrugs.length - 1)) / 2 : 0}
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

        {/* ===== RIGHT: SYMPTOMS ===== */}
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
                <span
                  key={s}
                  className={styles.symptomTag}
                  onClick={() => toggleSymptom(s)}
                >
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
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
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

      {error && (
        <div className={styles.errorBox}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      <div className={styles.actionsContainer}>
        <button
          onClick={handlePredict}
          disabled={loading}
          className={styles.predictBtn}
        >
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
          <RotateCcw size={18} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Reset Options
        </button>
      </div>

      {/* ===== RESULTS ===== */}
      {results !== null && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
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

          {results.predictions.length === 0 && (
            <p style={{ textAlign: "center", color: "#64748b" }}>
              Based on the provided regimen and symptom presentation, the model predicts low risk of immediate vitamin depletion interactions.
            </p>
          )}

          <div className={styles.vitaminsGrid}>
            {results.predictions.map((v) => (
              <div key={v.vitamin} className={styles.vitaminCard}>
                <div className={styles.vitaminHeader}>
                  <div className={styles.vitaminIcon}>{v.icon}</div>
                  <div>
                    <h4 className={styles.vitaminName}>{v.name}</h4>
                    <span className={styles.vitaminBadge}>{v.vitamin}</span>
                  </div>
                </div>

                <p className={styles.vitaminDesc}>{v.description}</p>

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

          {results.pair_details && results.pair_details.length > 0 && (
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

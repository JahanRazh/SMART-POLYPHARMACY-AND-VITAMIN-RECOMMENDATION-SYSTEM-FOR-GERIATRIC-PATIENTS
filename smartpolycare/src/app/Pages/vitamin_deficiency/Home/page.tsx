"use client";

import Link from "next/link";
import { Activity, Pill, ShieldPlus, ArrowRight, Info, HeartPulse } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.pageContainer}>
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>

      <div className={styles.contentWrapper}>
        <div className={styles.heroTag}>
          <Activity className={styles.heroTagIcon} />
          <span>Advanced AI Predictive Analysis</span>
        </div>

        <h1 className={styles.heroTitle}>
          Medicine & <span className={styles.highlightText}>Vitamin Deficiency</span> Checker
        </h1>

        <p className={styles.heroSubtitle}>
          A proactive healthcare tool specifically designed for patients taking multiple medications.
          Analyze your polypharmacy risks and instantly identify potential vitamin and mineral
          depletions based on your current prescriptions and symptoms.
        </p>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <Pill size={32} />
            </div>
            <h3 className={styles.cardTitle}>Medication Analysis</h3>
            <p className={styles.cardText}>
              Input your complete list of medications to identify known interactions
              that could cause systematic nutrient reduction over time.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <HeartPulse size={32} />
            </div>
            <h3 className={styles.cardTitle}>Symptom Tracking</h3>
            <p className={styles.cardText}>
              Correlate your physical symptoms with potential vitamin deficiencies
              driven by overlapping medical treatments and prescriptions.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <ShieldPlus size={32} />
            </div>
            <h3 className={styles.cardTitle}>Proactive Care</h3>
            <p className={styles.cardText}>
              Receive personalized insights to discuss with your healthcare provider
              before critical vitamin deficiencies impact your health.
            </p>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Link href="../vitamin_deficiency" className={styles.linkItem}>
            <button className={styles.primaryBtn}>
              Enter Patient Details
              <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

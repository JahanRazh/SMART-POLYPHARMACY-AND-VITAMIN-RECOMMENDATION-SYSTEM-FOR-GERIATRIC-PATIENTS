import Link from "next/link";

export default function Home() {
  return (
    <main style={styles.container}>
      <h1 style={styles.title}>
        Medicine & Vitamin Deficiency Checker
      </h1>

      <p style={styles.description}>
        This system helps patients who take multiple medicines
        (polypharmacy) to identify possible vitamin deficiencies
        based on their medicines and symptoms.
      </p>

      <div style={styles.buttons}>
        <Link href="/about" style={styles.link}>
          <button style={styles.secondaryBtn}>
            About This System
          </button>
        </Link>

        <Link href="/Pages/ppInputTaker" style={styles.link}>
          <button style={styles.primaryBtn}>
            Enter Patient Medicine Details
          </button>
        </Link>
      </div>
    </main>
  );
}


const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fbfd",
    textAlign: "center",
  },
  title: {
    fontSize: "2.4rem",
    fontWeight: "700",
    color: "#0f172a",
    maxWidth: "700px",
    marginBottom: "20px",
  },
  description: {
    fontSize: "1.15rem",
    lineHeight: "1.7",
    color: "#334155",
    maxWidth: "700px",
    marginBottom: "50px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    maxWidth: "420px",
  },
  link: {
    textDecoration: "none",
  },
  primaryBtn: {
    width: "100%",
    padding: "18px",
    fontSize: "1.2rem",
    fontWeight: "600",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "1.05rem",
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

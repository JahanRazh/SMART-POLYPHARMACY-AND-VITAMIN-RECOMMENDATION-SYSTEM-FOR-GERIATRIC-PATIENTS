"use client";

import Link from "next/link";

const clinicalTools = [
    { label: "Polypharmacy Risk Assessment", href: "/Pages/Polypharmacy/Homepage" },
    { label: "Vitamin Deficiency Analysis", href: "/Pages/vitamin_deficiency" },
    { label: "Drug Interaction Checker", href: "/Pages/Polypharmacy/Polyform" },
    { label: "Lifestyle Advice", href: "/Pages/LifestyleAdvice" },
    { label: "Patient Management", href: "/Pages/patients" },
];

const resources = [
    { label: "About SmartPolyCare", href: "/Pages/About" },
    { label: "Meal Plan Providers", href: "/Pages/MealPlanProviders" },
    { label: "Medication Forms", href: "/Pages/medicationSubmitForm" },
    { label: "Patient Advice", href: "/Pages/patientAdvice" },
];

const references = [
    {
        label: "WHO — Polypharmacy in Elderly",
        href: "https://www.who.int/publications/i/item/9789241515627",
    },
    {
        label: "NIH — Vitamin D & Aging",
        href: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
    },
    {
        label: "PubMed — Drug Interactions",
        href: "https://pubmed.ncbi.nlm.nih.gov/?term=polypharmacy+elderly",
    },
    {
        label: "MedlinePlus — Medications",
        href: "https://medlineplus.gov/druginfo/meds/",
    },
    {
        label: "CDC — Healthy Aging",
        href: "https://www.cdc.gov/aging/index.html",
    },
];

function FooterLink({
    href,
    children,
    external = false,
}: {
    href: string;
    children: React.ReactNode;
    external?: boolean;
}) {
    const sharedStyle: React.CSSProperties = {
        color: "#94a3b8",
        fontSize: "0.85rem",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "color 0.2s ease",
        paddingBottom: "2px",
        lineHeight: 1.5,
    };

    const dot = (
        <span
            style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: external
                    ? "linear-gradient(135deg,#0ea5e9,#6366f1)"
                    : "linear-gradient(135deg,#0d9488,#0ea5e9)",
                flexShrink: 0,
            }}
        />
    );

    const externalIcon = (
        <svg
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            style={{ opacity: 0.5, flexShrink: 0 }}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
        </svg>
    );

    const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.color = external ? "#38bdf8" : "#5eead4";
    };
    const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.color = "#94a3b8";
    };

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={sharedStyle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
            >
                {dot}
                {children}
                {externalIcon}
            </a>
        );
    }

    return (
        <Link
            href={href}
            style={sharedStyle}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {dot}
            {children}
        </Link>
    );
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            style={{
                color: "#e2e8f0",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "20px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            {children}
        </h3>
    );
}

export default function Footer() {
    return (
        <footer
            style={{
                background: "linear-gradient(180deg, #0f172a 0%, #080f1e 100%)",
                color: "#fff",
            }}
        >
            {/* Gradient top accent bar */}
            <div
                style={{
                    height: "3px",
                    background:
                        "linear-gradient(90deg, #0d9488 0%, #0ea5e9 45%, #6366f1 100%)",
                }}
            />

            {/* Main grid */}
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "52px 24px 36px",
                }}
            >
                <div
                    className="footer-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.6fr 1fr 1fr 1.1fr",
                        gap: "40px",
                    }}
                >
                    {/* ── Brand column ── */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "18px",
                            }}
                        >
                            <div
                                style={{
                                    width: "42px",
                                    height: "42px",
                                    background:
                                        "linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)",
                                    borderRadius: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 0 18px rgba(13,148,136,0.35)",
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="white"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <span
                                    style={{
                                        display: "block",
                                        fontSize: "1.15rem",
                                        fontWeight: 800,
                                        color: "#f8fafc",
                                        letterSpacing: "-0.01em",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    SmartPolyCare
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.6rem",
                                        color: "#0d9488",
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Geriatric Health Intelligence
                                </span>
                            </div>
                        </div>

                        <p
                            style={{
                                color: "#94a3b8",
                                fontSize: "0.85rem",
                                lineHeight: 1.75,
                                maxWidth: "260px",
                                marginBottom: "20px",
                            }}
                        >
                            An AI-powered platform for geriatric polypharmacy management and
                            vitamin deficiency detection — empowering clinicians with
                            intelligent, evidence-based insights.
                        </p>

                        {/* Research badges */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {["AI-Powered", "Clinical Grade"].map(
                                (badge) => (
                                    <span
                                        key={badge}
                                        style={{
                                            padding: "3px 10px",
                                            borderRadius: "20px",
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            background: "rgba(13,148,136,0.12)",
                                            color: "#5eead4",
                                            border: "1px solid rgba(13,148,136,0.22)",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {badge}
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* ── Clinical Tools ── */}
                    <div>
                        <FooterColumnTitle>Clinical Tools</FooterColumnTitle>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {clinicalTools.map((item) => (
                                <li key={item.href} style={{ marginBottom: "11px" }}>
                                    <FooterLink href={item.href}>{item.label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Resources ── */}
                    <div>
                        <FooterColumnTitle>Resources</FooterColumnTitle>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {resources.map((item) => (
                                <li key={item.href} style={{ marginBottom: "11px" }}>
                                    <FooterLink href={item.href}>{item.label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── References ── */}
                    <div>
                        <FooterColumnTitle>Research References</FooterColumnTitle>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {references.map((item) => (
                                <li key={item.href} style={{ marginBottom: "11px" }}>
                                    <FooterLink href={item.href} external>
                                        {item.label}
                                    </FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div
                    style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        marginTop: "44px",
                        paddingTop: "24px",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <p style={{ color: "#475569", fontSize: "0.78rem", margin: 0 }}>
                        © {new Date().getFullYear()}{" "}
                        <span style={{ color: "#0d9488", fontWeight: 600 }}>
                            SmartPolyCare
                        </span>{" "}
                        · SLIIT Faculty of Computing Research Project · AI-powered geriatric
                        care platform.
                    </p>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                        {[
                            { label: "Privacy Policy", href: "/Pages/About" },
                            { label: "Terms of Service", href: "/Pages/About" },
                            { label: "Contact", href: "/Pages/About" },
                        ].map((link) => (
                            <FooterLink key={link.label} href={link.href}>
                                <span style={{ fontSize: "0.78rem" }}>{link.label}</span>
                            </FooterLink>
                        ))}
                    </div>
                </div>
            </div>

            {/* Responsive grid tweak */}
            <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </footer>
    );
}

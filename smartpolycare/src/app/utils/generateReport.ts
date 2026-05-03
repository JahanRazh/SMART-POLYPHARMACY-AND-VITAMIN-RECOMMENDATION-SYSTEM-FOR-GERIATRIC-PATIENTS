import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DailyRecommendation = { day: number; recommendation: string };
type TwoWeekAdvice = {
  week_1: DailyRecommendation[];
  week_2: DailyRecommendation[];
  summary: string;
  generated_date?: string;
  expires_date?: string;
  inputs?: { emotion: string; mental_health_level: string; polypharmacy_risk: string };
};

const VITAMIN_LAB_TESTS: Record<string, { test: string; description: string; why?: string }> = {
  D: { test: '25-Hydroxy Vitamin D (25(OH)D)', description: 'Bone pain, weakness, fatigue', why: 'Best indicator of overall Vitamin D status' },
  B12: { test: 'Serum Vitamin B12', description: 'Nerve problems, anemia, memory issues', why: 'More accurate (if borderline): Methylmalonic Acid (MMA), Homocysteine' },
  Folate: { test: 'Serum Folate (or RBC Folate)', description: 'Anemia, fatigue' },
  B1: { test: 'Whole blood Thiamine or Thiamine Pyrophosphate', description: 'Nerve and heart issues' },
  B6: { test: 'Plasma Pyridoxal-5-Phosphate (PLP)', description: 'Skin issues, anemia, confusion' },
  B7: { test: 'Serum Biotin (rare)', description: 'Hair loss, dermatitis' },
  A: { test: 'Serum Retinol', description: 'Night blindness, dry eyes' },
  E: { test: 'Serum Alpha-Tocopherol', description: 'Nerve and muscle damage' },
  K: { test: 'Prothrombin Time (PT/INR)', description: 'Bleeding problems' },
  C: { test: 'Plasma/Serum Ascorbic Acid', description: 'Measures ascorbic acid level' },
};

// Color constants
const TEAL = [13, 148, 136] as const;    // header bg
const WHITE = [255, 255, 255] as const;
const DARK = [31, 41, 55] as const;
const GRAY = [107, 114, 128] as const;
const LIGHT_BG = [240, 253, 250] as const;

function fmtDate(d?: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function addSectionHeader(doc: jsPDF, y: number, title: string): number {
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(...TEAL);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 10, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 18, y + 7);
  doc.setTextColor(...DARK);
  return y + 16;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); return 20; }
  return y;
}

function addFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pages}`, pw / 2, ph - 8, { align: 'center' });
    doc.text('SmartPolyCare — Confidential Patient Report', 14, ph - 8);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, ph - 12, pw - 14, ph - 12);
  }
}

export function generatePatientReport(
  advice: TwoWeekAdvice,
  vitaminAssessment: any,
  psychometricScores?: { gds15: number; gad7: number; mmas8: number; iadl: number } | null,
  patientEmail?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── Title Banner ──
  doc.setFillColor(...TEAL);
  doc.roundedRect(10, y, pw - 20, 28, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Health Report', pw / 2, y + 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Polypharmacy & Vitamin Recommendation System', pw / 2, y + 19, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, y + 25, { align: 'center' });
  y += 35;

  // ── Patient meta ──
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  if (patientEmail) doc.text(`Patient: ${patientEmail}`, 14, y);
  doc.text(`Plan: ${fmtDate(advice.generated_date)} — ${fmtDate(advice.expires_date)}`, pw - 14, y, { align: 'right' });
  y += 8;

  // ═══════════════════ SECTION 1: Profile Overview ═══════════════════
  y = addSectionHeader(doc, y, '1. Patient Profile Overview');

  const profileData = [
    ['Detected Emotion', advice.inputs?.emotion || 'Not detected'],
    ['Mental Health Level', advice.inputs?.mental_health_level || 'Not assessed'],
    ['Polypharmacy Risk', advice.inputs?.polypharmacy_risk || 'Unknown'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value']],
    body: profileData,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [...TEAL], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [...DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_BG] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ═══════════════════ SECTION 2: Psychometric Scores ════════════════
  if (psychometricScores) {
    y = ensureSpace(doc, y, 40);
    y = addSectionHeader(doc, y, '2. Psychometric Assessment Scores');

    const scoreRows = [
      ['GDS-15 (Depression)', `${psychometricScores.gds15}/15`, psychometricScores.gds15 <= 4 ? 'Normal' : psychometricScores.gds15 <= 8 ? 'Mild' : psychometricScores.gds15 <= 11 ? 'Moderate' : 'Severe'],
      ['GAD-7 (Anxiety)', `${psychometricScores.gad7}/21`, psychometricScores.gad7 <= 4 ? 'Minimal' : psychometricScores.gad7 <= 9 ? 'Mild' : psychometricScores.gad7 <= 14 ? 'Moderate' : 'Severe'],
      ['MMAS-8 (Medication Adherence)', `${psychometricScores.mmas8}/8`, psychometricScores.mmas8 >= 8 ? 'High' : psychometricScores.mmas8 >= 6 ? 'Medium' : 'Low'],
      ['IADL (Functional Independence)', `${psychometricScores.iadl}/8`, psychometricScores.iadl >= 8 ? 'Independent' : psychometricScores.iadl >= 6 ? 'Mild Impairment' : psychometricScores.iadl >= 4 ? 'Moderate' : 'Severe'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Scale', 'Score', 'Severity']],
      body: scoreRows,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [...TEAL], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [...DARK] },
      alternateRowStyles: { fillColor: [...LIGHT_BG] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ═══════════════════ SECTION 3: Lab Tests ══════════════════════════
  const sectionNum = psychometricScores ? 3 : 2;
  y = ensureSpace(doc, y, 40);
  y = addSectionHeader(doc, y, `${sectionNum}. Recommended Lab Tests (Vitamin Deficiencies)`);

  const preds = vitaminAssessment?.predictions || [];
  if (preds.length === 0) {
    doc.setFontSize(10); doc.setTextColor(...GRAY);
    doc.text('No specific vitamin deficiencies detected requiring lab testing.', 18, y + 2);
    y += 10;
  } else {
    const labRows = preds.map((pred: any) => {
      const info = VITAMIN_LAB_TESTS[pred.vitamin];
      return info ? [pred.name || `Vitamin ${pred.vitamin}`, info.test, info.description] : null;
    }).filter(Boolean);

    autoTable(doc, {
      startY: y,
      head: [['Deficiency', 'Recommended Test', 'Linked Symptoms']],
      body: labRows,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [59, 130, 246], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [...DARK] },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 65 } },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8); doc.setTextColor(...GRAY);
    doc.text('* Please present these recommendations to your physician before undergoing any tests.', 14, y);
    y += 8;
  }

  // ═══════════════════ SECTION 4: Polypharmacy Advice ════════════════
  const risk = (advice.inputs?.polypharmacy_risk || '').toLowerCase();
  const isVeryHigh = risk.includes('very high');
  const isHigh = !isVeryHigh && risk.includes('high');

  if (isHigh || isVeryHigh) {
    y = ensureSpace(doc, y, 50);
    y = addSectionHeader(doc, y, `${sectionNum + 1}. Polypharmacy Safety Advice (${isVeryHigh ? 'Very High' : 'High'} Risk)`);

    const advices = isVeryHigh
      ? [
          ['Urgent medication review', 'Immediate evaluation by a doctor to reduce unnecessary drugs.'],
          ['Avoid non-prescribed substances', 'No OTC drugs, supplements, or herbal remedies unless approved.'],
          ['Close monitoring', 'Lab tests (liver, kidney, electrolytes) and clinical follow-ups regularly.'],
          ['Simplify regimen', 'Use lowest effective doses and reduce complexity.'],
          ['Watch for warning signs', 'Seek help for confusion, severe weakness, reduced urine, or yellowing of skin.'],
        ]
      : [
          ['Review medications regularly', 'Schedule doctor/pharmacist review for necessity, duplication, interactions.'],
          ['Avoid self-medication', 'Do not take OTC drugs or supplements without approval.'],
          ['Monitor health routinely', 'Check liver, kidney, BP, and blood sugar every 3-6 months.'],
          ['Watch for side effects', 'Report dizziness, fatigue, nausea, or confusion immediately.'],
          ['Maintain healthy lifestyle', 'Stay hydrated, limit salt/alcohol, follow a balanced diet.'],
        ];

    autoTable(doc, {
      startY: y,
      head: [['Recommendation', 'Details']],
      body: advices,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: isVeryHigh ? [220, 38, 38] : [234, 88, 12], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [...DARK] },
      alternateRowStyles: { fillColor: isVeryHigh ? [254, 242, 242] : [255, 247, 237] },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ═══════════════════ SECTION 5: Plan Overview ══════════════════════
  const planSection = (isHigh || isVeryHigh) ? sectionNum + 2 : sectionNum + 1;
  y = ensureSpace(doc, y, 30);
  y = addSectionHeader(doc, y, `${planSection}. 2-Week Personalized Health Plan`);

  // Summary
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  doc.text('Plan Summary:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  const summaryLines = doc.splitTextToSize(advice.summary || 'No summary available.', pw - 32);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 4.5 + 6;

  // Week 1
  y = ensureSpace(doc, y, 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEAL);
  doc.text('Week 1 (Days 1-7)', 14, y);
  y += 5;

  const week1Rows = (advice.week_1 || []).map(d => [`Day ${d.day}`, d.recommendation]);
  if (week1Rows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Day', 'Recommendation']],
      body: week1Rows,
      theme: 'striped',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [...TEAL], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [...DARK], cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Week 2
  y = ensureSpace(doc, y, 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEAL);
  doc.text('Week 2 (Days 8-14)', 14, y);
  y += 5;

  const week2Rows = (advice.week_2 || []).map(d => [`Day ${d.day}`, d.recommendation]);
  if (week2Rows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Day', 'Recommendation']],
      body: week2Rows,
      theme: 'striped',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [...TEAL], textColor: [...WHITE], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [...DARK], cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Disclaimer ──
  y = ensureSpace(doc, y, 25);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, pw - 28, 18, 2, 2, 'F');
  doc.setFontSize(8); doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Disclaimer:', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'These recommendations are non-medical lifestyle advice. Always consult your healthcare provider before making significant changes, especially given your medication profile.';
  const discLines = doc.splitTextToSize(disclaimer, pw - 40);
  doc.text(discLines, 18, y + 10);

  // ── Footer on all pages ──
  addFooters(doc);

  // ── Save ──
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`SmartPolyCare_Report_${dateStr}.pdf`);
}

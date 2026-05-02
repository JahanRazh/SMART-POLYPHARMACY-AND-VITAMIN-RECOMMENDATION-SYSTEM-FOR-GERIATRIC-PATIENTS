import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) return admin;
  const candidates = [
    path.resolve(process.cwd(), "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "..", "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "..", "..", "server", "serviceAccountKey.json"),
  ];
  let keyPath: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) { keyPath = p; break; }
  }
  if (!keyPath) throw new Error(`Firebase service account not found. Checked: ${candidates.join(", ")}`);
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
  return admin;
}

/** ── GDS-15 Scoring ──────────────────────────────────────────────────
 *  Questions where "Yes" = 1 point (depression indicator):
 *  Q2,3,4,6,8,9,10,12,14,15 (1-indexed as in the questionnaire)
 *  Questions where "No" = 1 point:
 *  Q1,5,7,11,13
 */
const GDS15_YES_SCORE_INDICES = [1, 2, 3, 5, 7, 8, 9, 11, 13, 14]; // 0-indexed
const GDS15_NO_SCORE_INDICES  = [0, 4, 6, 10, 12];                  // 0-indexed

function scoreGDS15(gda15: Record<number, string>): number {
  let score = 0;
  for (const idx of GDS15_YES_SCORE_INDICES) {
    if (gda15[idx] === "Yes") score++;
  }
  for (const idx of GDS15_NO_SCORE_INDICES) {
    if (gda15[idx] === "No") score++;
  }
  return Math.min(score, 15);
}

/** ── GAD-7 Scoring ───────────────────────────────────────────────────
 *  "Not at all" = 0, "Several days" = 1, "More than half the days" = 2,
 *  "Nearly every day" = 3
 */
const GAD7_OPTION_MAP: Record<string, number> = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

function scoreGAD7(gad7: Record<number, string>): number {
  let score = 0;
  for (let i = 0; i < 7; i++) {
    score += GAD7_OPTION_MAP[gad7[i]] ?? 0;
  }
  return Math.min(score, 21);
}

/** ── MMAS-8 Scoring ─────────────────────────────────────────────────
 *  Q1–Q7 (Yes/No): "No" = 1 point (adherent), "Yes" = 0 for most.
 *  Exception: Q5 is reverse-scored ("Yes" = 1 point).
 *  Q8 frequency: Never/Rarely=1, Once in a while=0.75, Sometimes=0.5,
 *                Usually=0.25, All the time=0
 *  Total max = 8
 */
const MARS_Q8_MAP: Record<string, number> = {
  "Never/Rarely": 1,
  "Once in a while": 0.75,
  "Sometimes": 0.5,
  "Usually": 0.25,
  "All the time": 0,
};

function scoreMMAS8(mars: Record<number, string>, mars8: string): number {
  let score = 0;
  for (let i = 0; i < 7; i++) {
    if (i === 4) {
      // Q5 is reverse: "Yes" means they DID take it → adherent
      score += mars[i] === "Yes" ? 1 : 0;
    } else {
      score += mars[i] === "No" ? 1 : 0;
    }
  }
  score += MARS_Q8_MAP[mars8] ?? 0;
  return Math.round(Math.min(score, 8) * 100) / 100;
}

/** ── IADL Scoring ───────────────────────────────────────────────────
 *  8 domains. First option in each group = 1 (independent), rest = 0.
 *  Max = 8.
 */
const IADL_FIRST_OPTIONS: string[] = [
  "Operates telephone on own initiative-looks up and dials numbers, etc.",
  "Takes care of all shopping needs independently",
  "Plans, prepares and serves adequate meals independently",
  "Maintains house alone or with occasional assistance (e.g. \"heavy work domestic help\")",
  "Does personal laundry completely",
  "Travels independently on public transportation or drives own car",
  "Is responsible for taking medication in correct dosages at correct time",
  "Manages financial matters independently (budgets, writes checks, pays rent, bills, goes to bank), collects and keeps track of income",
];

function scoreIADL(iadl: Record<number, string>): number {
  let score = 0;
  for (let i = 0; i < 8; i++) {
    if (iadl[i] === IADL_FIRST_OPTIONS[i]) score++;
  }
  return score;
}

// ── GET: fetch assessment history for a user (by email) ─────────────
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  try {
    const adminSdk = initFirebaseAdmin();
    const db = adminSdk.firestore();
    const docId = String(email).toLowerCase().trim()
      .replaceAll("@", "_at_").replaceAll(".", "_");

    const snap = await db
      .collection("patient_assessment")
      .doc(docId)
      .collection("assessments")
      .orderBy("timestamp", "asc")
      .get();

    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ assessments: entries });
  } catch (err: any) {
    console.error("assessment_history GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: save a new scored assessment snapshot ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, questionnaire } = body;
    if (!email || !questionnaire) {
      return NextResponse.json({ error: "email and questionnaire required" }, { status: 400 });
    }

    const { gda15, gad7, mars, mars8, iadl } = questionnaire;

    const gds15_score  = scoreGDS15(gda15  || {});
    const gad7_score   = scoreGAD7(gad7    || {});
    const mmas8_score  = scoreMMAS8(mars   || {}, mars8 || "");
    const iadl_score   = scoreIADL(iadl    || {});

    const adminSdk = initFirebaseAdmin();
    const db = adminSdk.firestore();
    const docId = String(email).toLowerCase().trim()
      .replaceAll("@", "_at_").replaceAll(".", "_");

    await db
      .collection("patient_assessment")
      .doc(docId)
      .collection("assessments")
      .add({
        timestamp: new Date().toISOString(),
        gds15_score,
        gad7_score,
        mmas8_score,
        iadl_score,
        createdAt: adminSdk.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true, gds15_score, gad7_score, mmas8_score, iadl_score });
  } catch (err: any) {
    console.error("assessment_history POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

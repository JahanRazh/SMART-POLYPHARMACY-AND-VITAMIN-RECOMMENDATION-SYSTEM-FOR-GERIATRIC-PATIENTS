import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin;
  const candidates = [
    path.resolve(process.cwd(), "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "..", "server", "serviceAccountKey.json"),
  ];
  let keyPath: string | null = null;
  for (const p of candidates) { if (fs.existsSync(p)) { keyPath = p; break; } }
  if (!keyPath) throw new Error(`Firebase service account not found. Checked: ${candidates.join(", ")}`);
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8")) as any) });
  return admin;
}

// ── POST  /api/save_lifestyle_data  ──────────────────────────────────────────
// Saves the full lifestyle results snapshot for a user.
// Body: { email, week_1, week_2, summary, generated_date, expires_date,
//         inputs, polypharmacy_advices, lab_tests, vitamin_deficiencies,
//         psychometric_scores? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const adminSdk = initAdmin();
    const db = adminSdk.firestore();

    const docId = String(email).toLowerCase().trim()
      .replaceAll("@", "_at_").replaceAll(".", "_");

    const record = {
      email:                String(email).toLowerCase().trim(),
      week_1:               body.week_1               ?? [],
      week_2:               body.week_2               ?? [],
      summary:              body.summary              ?? "",
      generated_date:       body.generated_date       ?? new Date().toISOString(),
      expires_date:         body.expires_date         ?? "",
      inputs:               body.inputs               ?? {},
      polypharmacy_advices: body.polypharmacy_advices ?? [],
      lab_tests:            body.lab_tests            ?? [],
      vitamin_deficiencies: body.vitamin_deficiencies ?? [],
      psychometric_scores:  body.psychometric_scores  ?? null,
      saved_at:             new Date().toISOString(),
      serverTimestamp:      adminSdk.firestore.FieldValue.serverTimestamp(),
    };

    // Store latest snapshot in lifestyle_results/{docId}
    await db.collection("lifestyle_results").doc(docId).set(record, { merge: false });

    // Also append to history sub-collection for full history
    await db
      .collection("lifestyle_results")
      .doc(docId)
      .collection("history")
      .add(record);

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error("save_lifestyle_data POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GET  /api/save_lifestyle_data?email=...  ──────────────────────────────────
// Returns the latest snapshot for the user.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  try {
    const adminSdk = initAdmin();
    const db = adminSdk.firestore();

    const docId = String(email).toLowerCase().trim()
      .replaceAll("@", "_at_").replaceAll(".", "_");

    const snap = await db.collection("lifestyle_results").doc(docId).get();
    if (!snap.exists) return NextResponse.json({ data: null });

    const data = snap.data();
    // Remove server-side-only fields before sending
    if (data) delete data.serverTimestamp;
    return NextResponse.json({ data: data ?? null });
  } catch (err: any) {
    console.error("save_lifestyle_data GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

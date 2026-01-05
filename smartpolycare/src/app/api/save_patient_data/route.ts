import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { NextResponse } from "next/server";

// Force Node.js runtime for this API route because `firebase-admin` is not
// compatible with the Edge runtime. Next.js app-router defaults to Edge.
export const runtime = "nodejs";

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) return admin;

  // Try to locate the service account JSON by checking upwards from the
  // current working directory. This allows running Next.js from the
  // `smartpolycare` folder while the service key lives at repo root
  // `server/serviceAccountKey.json`.
  const candidates = [
    path.resolve(process.cwd(), "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "..", "server", "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "..", "..", "server", "serviceAccountKey.json"),
  ];

  let keyPath: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      keyPath = p;
      break;
    }
  }

  if (!keyPath) {
    throw new Error(
      `Firebase service account not found. Checked paths: ${candidates.join(", ")}`
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });

  return admin;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const adminSdk = initFirebaseAdmin();
    const db = adminSdk.firestore();

    // Persist incoming payload as a new patient_assessment document
    const payload = {
      ...body,
      createdAt: adminSdk.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("patient_assessment").add(payload as any);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err: any) {
    // Log and return a helpful error
    // Note: server console logs appear in the Next.js terminal
    console.error("/api/save_patient_data error:", err);
    const message = err?.message || String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

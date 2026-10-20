# db.py
import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore

def get_db():
    """Initialize Firestore client once and reuse."""
    if not firebase_admin._apps:
        cred = None

        # 1. Check if raw JSON or base64 string is provided in environment variables
        raw_key = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
        if raw_key:
            try:
                # Try JSON string directly
                key_dict = json.loads(raw_key)
                cred = credentials.Certificate(key_dict)
                print("🔑 Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_KEY (JSON)")
            except Exception:
                try:
                    # Try base64 decoding
                    decoded = base64.b64decode(raw_key).decode("utf-8")
                    key_dict = json.loads(decoded)
                    cred = credentials.Certificate(key_dict)
                    print("🔑 Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_KEY (Base64)")
                except Exception as e:
                    print(f"⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: {e}")

        # 2. Check if custom path is set in env
        if not cred:
            custom_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if custom_path and os.path.exists(custom_path):
                cred = credentials.Certificate(custom_path)
                print(f"🔑 Loaded Firebase credentials from path: {custom_path}")

        # 3. Fallback to local serviceAccountKey.json
        if not cred:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            default_path = os.path.join(current_dir, "serviceAccountKey.json")
            if os.path.exists(default_path):
                cred = credentials.Certificate(default_path)
                print(f"🔑 Loaded Firebase credentials from local file: {default_path}")

        if not cred:
            raise FileNotFoundError(
                "❌ Firebase credentials not found! Please set FIREBASE_SERVICE_ACCOUNT_KEY env var "
                "or place serviceAccountKey.json in the server folder."
            )

        firebase_admin.initialize_app(cred)

        # ✅ Connection check at startup
        try:
            db = firestore.client()
            db.collection("test").limit(1).get()
            print("✅ Firebase connected successfully!")
        except Exception as e:
            print("❌ Firebase connection test warning:", e)

    return firestore.client()
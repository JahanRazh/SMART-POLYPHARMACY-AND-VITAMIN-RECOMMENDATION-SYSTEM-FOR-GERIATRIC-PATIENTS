import os
from db import get_db
from datetime import datetime

def test_db():
    print("Testing Firebase/Firestore...")
    try:
        db = get_db()
        test_data = {
            "test": True,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Testing write from antigravity"
        }
        doc_ref = db.collection('test_antigravity').document()
        doc_ref.set(test_data)
        print(f"✅ Success! Document written with ID: {doc_ref.id}")
        
        # Try a real collection used in the app
        meal_ref = db.collection('meal_plans').document()
        meal_ref.set({
            "userId": "test_user",
            "createdAt": datetime.utcnow().isoformat(),
            "status": "testing"
        })
        print(f"✅ Success! Meal plan test write ID: {meal_ref.id}")
        meal_ref.delete()
        print("✅ Cleanup: Deleted test meal plan.")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_db()

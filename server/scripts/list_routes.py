import os
import sys

# Ensure parent folder (server) is on sys.path when executing this script from scripts/
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

try:
    from app import app

    routes = []
    for rule in app.url_map.iter_rules():
        methods = ",".join(sorted(rule.methods))
        routes.append(f"{rule.rule}  [{methods}]")

    print("Registered routes:\n")
    for r in sorted(routes):
        print(r)
except Exception as e:
    import traceback
    print("Error while importing app or listing routes:")
    traceback.print_exc()

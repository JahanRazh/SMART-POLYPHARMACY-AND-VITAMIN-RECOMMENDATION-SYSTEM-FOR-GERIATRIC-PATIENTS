import os

# Render automatically provides $PORT (default 10000 on Render).
# If a custom PORT is set in Render Environment Variables (e.g. 5000),
# Gunicorn will bind to that port.
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

workers = 1
threads = 4
timeout = 120
accesslog = "-"
errorlog = "-"

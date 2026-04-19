import os
import re
import pickle
import traceback
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load model & vectorizer ───────────────────────────────────────────────────
def load_artifacts():
    model_path = os.path.join(BASE_DIR, "model.pkl")
    vec_path   = os.path.join(BASE_DIR, "vectorizer.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"model.pkl not found at {model_path}")
    if not os.path.exists(vec_path):
        raise FileNotFoundError(f"vectorizer.pkl not found at {vec_path}")
    model = pickle.load(open(model_path, "rb"))
    vec   = pickle.load(open(vec_path,   "rb"))
    return model, vec

try:
    MODEL, VECTORIZER = load_artifacts()
    MODEL_LOADED = True
    print("[ShieldAI] model.pkl + vectorizer.pkl loaded OK.")
except Exception as e:
    MODEL, VECTORIZER = None, None
    MODEL_LOADED = False
    print(f"[ShieldAI] WARNING: {e}")

# ── Text pre-processing (mirrors train.py exactly) ───────────────────────────
def preprocess(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r'<.*?>', '', text)          # strip HTML tags
    text = re.sub(r'[^a-zA-Z]', ' ', text)    # keep letters only
    return text

# ── Phishing signal heuristics (extra indicators for the UI) ─────────────────
PHISHING_PATTERNS = [
    (r'http[s]?://(?:\d{1,3}\.){3}\d{1,3}',        "IP-based URL"),
    (r'(verify|confirm|update).{0,20}(account|password|detail)', "Account verification request"),
    (r'(urgent|immediate|action required|suspended|locked)', "Urgency language"),
    (r'(click here|click below|click the link)',     "Generic click-here link"),
    (r'(bank|paypal|amazon|netflix|apple).{0,30}(login|signin|account)', "Brand impersonation"),
    (r'(dear (customer|user|valued))',               "Generic salutation"),
    (r'(win|won|winner|prize|reward|gift card)',     "Prize/reward lure"),
    (r'(social security|ssn|tax refund)',            "Sensitive info request"),
    (r'(login|signin).{0,10}(below|here|now)',       "Login prompt"),
    (r'[a-z0-9\-]+\.(xyz|tk|ml|ga|cf|gq|top|buzz|click|link)/', "Suspicious TLD"),
]

SAFE_SIGNALS = [
    (r'unsubscribe',                 "Unsubscribe option present"),
    (r'(regards|sincerely|thanks)',  "Professional sign-off"),
    (r'(meeting|schedule|agenda)',   "Business communication"),
    (r'(invoice|receipt|order)',     "Legitimate transaction"),
]

def extract_indicators(text: str, label: int) -> list:
    indicators = []
    lower = text.lower()
    if label == 1:
        for pattern, name in PHISHING_PATTERNS:
            if re.search(pattern, lower):
                indicators.append(name)
    else:
        for pattern, name in SAFE_SIGNALS:
            if re.search(pattern, lower):
                indicators.append(name)
    return indicators[:6]  # cap at 6 tags

# ── Core predict function ─────────────────────────────────────────────────────
def predict(text: str) -> dict:
    if not MODEL_LOADED:
        return {"error": "model.pkl or vectorizer.pkl not found. Run train.py first."}
    try:
        cleaned = preprocess(text)
        X       = VECTORIZER.transform([cleaned])
        label   = int(MODEL.predict(X)[0])
        proba   = MODEL.predict_proba(X)[0]
        score   = float(proba[1])          # probability of class 1 (phishing)
        indicators = extract_indicators(text, label)
        return {
            "label":      "phishing" if label == 1 else "safe",
            "score":      round(score, 4),
            "confidence": round(max(proba) * 100, 1),
            "indicators": indicators,
        }
    except Exception:
        return {"error": traceback.format_exc()}

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/scan", methods=["POST"])
def scan():
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "No text provided."}), 400
    return jsonify(predict(text))

@app.route("/api/status")
def status():
    return jsonify({
        "model_loaded":   MODEL_LOADED,
        "model_path":     os.path.join(BASE_DIR, "model.pkl"),
        "vectorizer_path":os.path.join(BASE_DIR, "vectorizer.pkl"),
    })

@app.route("/api/retrain", methods=["POST"])
def retrain():
    """Re-run train.py so you can drop new CSVs into /data and retrain live."""
    import subprocess, sys
    train_script = os.path.join(BASE_DIR, "train.py")
    if not os.path.exists(train_script):
        return jsonify({"error": "train.py not found."}), 404
    try:
        result = subprocess.run(
            [sys.executable, train_script],
            cwd=BASE_DIR,
            capture_output=True, text=True, timeout=300
        )
        # Reload artifacts after training
        global MODEL, VECTORIZER, MODEL_LOADED
        MODEL, VECTORIZER = load_artifacts()
        MODEL_LOADED = True
        return jsonify({
            "status": "retrained",
            "stdout": result.stdout[-3000:],
            "stderr": result.stderr[-1000:],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n  ShieldAI Phishing Detector")
    print("  ──────────────────────────")
    print("  Drop CSV training data into the  /data  folder")
    print("  Open http://localhost:5000\n")
    app.run(debug=True, port=5000)

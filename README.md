# ShieldAI — Phishing Detector

Full-stack phishing detection website powered by your trained MultinomialNB + TF-IDF model.

## Folder structure

```
phishing-detector/
├── app.py               ← Flask server
├── train.py             ← Your training script (unchanged)
├── model.pkl            ← Trained Naive Bayes model
├── vectorizer.pkl       ← Fitted TF-IDF vectorizer
├── requirements.txt
├── data/                ← PUT YOUR CSV FILES HERE
│   └── (empty — add your CSV training data here)
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/
        ├── webgl.js     ← WebGL threat map animation
        └── app.js       ← Frontend logic
```

## Quick start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the server
```bash
python app.py
```

### 3. Open browser
```
http://localhost:5000
```

## Adding training data

1. Copy your CSV files into the `/data` folder
2. Your CSVs must have a `label` column (spam/phishing/1 = phishing, ham/legitimate/0 = safe)
3. And at least one text column: `text_combined`, `subject`+`body`, `body`, or `message`
4. Click **Retrain model** in the website — it runs `train.py`, saves new pkl files, and reloads live

## How the model is called (app.py)

```python
text  → preprocess() → vectorizer.transform() → model.predict() + predict_proba()
     → { label, score, confidence, indicators }
```

The preprocessing mirrors `train.py` exactly:
- lowercase
- strip HTML tags
- keep letters only (remove numbers/punctuation)

## API endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Website |
| `/api/scan` | POST | `{"text": "..."}` → `{"label", "score", "confidence", "indicators"}` |
| `/api/status` | GET | Check if model.pkl is loaded |
| `/api/retrain` | POST | Run train.py and reload model live |

<h1 align="center">VexaAI — Email Phishing Detector</h1>

<p align="center">
AI-powered email phishing detection system built with Flask and Machine Learning.
</p>

<p align="center">
Detect suspicious emails instantly using NLP and a trained classification model.
</p>

---

<h2>Overview</h2>

<p>
VexaAI is a phishing detection web application focused specifically on <b>emails</b>.  
It analyzes email content and predicts whether the message is <b>Safe</b> or a <b>Phishing Attempt</b>.
</p>

<p>
The project uses <b>TF-IDF Vectorization</b> with a <b>Multinomial Naive Bayes</b> model to identify common phishing language patterns such as urgency, fake links, credential theft attempts, impersonation, and suspicious requests.
</p>

---

<h2>Features</h2>

<ul>
<li>Email content phishing detection</li>
<li>Real-time prediction results</li>
<li>Confidence score display</li>
<li>Modern responsive UI</li>
<li>Model retraining support</li>
<li>Fast Flask backend</li>
<li>Practical cybersecurity project</li>
</ul>

---

<h2>Tech Stack</h2>

<ul>
<li><b>Frontend:</b> HTML, CSS, JavaScript</li>
<li><b>Backend:</b> Python, Flask</li>
<li><b>Machine Learning:</b> Scikit-learn</li>
<li><b>Model:</b> Multinomial Naive Bayes</li>
<li><b>Vectorization:</b> TF-IDF</li>
</ul>

---

<h2>Project Structure</h2>

<pre>
VexaAI-PhisingDetector/
│── app.py
│── train.py
│── model.pkl
│── vectorizer.pkl
│── requirements.txt
│── templates/
│   └── index.html
│── static/
│   ├── css/
│   └── js/
</pre>

---

<h2>Installation</h2>

<h3>1. Clone Repository</h3>

<pre>
git clone https://github.com/ayaanable/VexaAI-PhisingDetector.git
cd VexaAI-PhisingDetector
</pre>

<h3>2. Install Requirements</h3>

<pre>
pip install -r requirements.txt
</pre>

<h3>3. Run Server</h3>

<pre>
python app.py
</pre>

<h3>4. Open Browser</h3>

<pre>
http://localhost:5000
</pre>

---

<h2>API Endpoints</h2>

<table>
<tr>
<th>Endpoint</th>
<th>Method</th>
<th>Description</th>
</tr>

<tr>
<td>/</td>
<td>GET</td>
<td>Main web interface</td>
</tr>

<tr>
<td>/api/scan</td>
<td>POST</td>
<td>Analyze email text</td>
</tr>

<tr>
<td>/api/status</td>
<td>GET</td>
<td>Check model status</td>
</tr>

<tr>
<td>/api/retrain</td>
<td>POST</td>
<td>Retrain model using dataset</td>
</tr>
</table>

---

<h2>How It Works</h2>

<pre>
Email Content
     ↓
Text Cleaning
     ↓
TF-IDF Vectorization
     ↓
Naive Bayes Model
     ↓
Safe / Phishing Prediction
</pre>

---

<h2>Common Threats Detected</h2>

<ul>
<li>Fake password reset emails</li>
<li>Bank verification scams</li>
<li>Urgent account suspension warnings</li>
<li>Credential harvesting attempts</li>
<li>Impersonation emails</li>
<li>Suspicious payment requests</li>
</ul>

---

<h2>Future Improvements</h2>

<ul>
<li>Email header analysis</li>
<li>Sender reputation scoring</li>
<li>Attachment scanning</li>
<li>URL extraction and checking</li>
<li>Cloud deployment</li>
</ul>

---


<p align="center">
Built for cybersecurity learning and phishing awareness.
</p>

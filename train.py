import pandas as pd
import os
import re
import nltk
from nltk.corpus import stopwords
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score
import pickle

# Download stopwords
nltk.download('stopwords')

folder_path = "data"
all_data = []

# 📁 LOAD DATA
for file in os.listdir(folder_path):
    if file.endswith(".csv"):
        df = pd.read_csv(os.path.join(folder_path, file))

        print(f"\n📂 Processing: {file}")

        # TEXT HANDLING
        if 'text_combined' in df.columns:
            df['text'] = df['text_combined']
        elif 'subject' in df.columns and 'body' in df.columns:
            df['text'] = df['subject'].fillna('') + " " + df['body'].fillna('')
        elif 'body' in df.columns:
            df['text'] = df['body']
        elif 'message' in df.columns:
            df['text'] = df['message']
        else:
            continue

        # LABEL HANDLING
        if 'label' not in df.columns:
            continue

        df = df[['text', 'label']].dropna()

        # 🔥 FIX LABELS (IMPORTANT)
        df['label'] = df['label'].astype(str).str.lower()

        df['label'] = df['label'].replace({
            'spam': 1,
            'phishing': 1,
            'fraud': 1,
            'yes': 1,
            'true': 1,
            '1': 1,
            'ham': 0,
            'legitimate': 0,
            'no': 0,
            'false': 0,
            '0': 0
        })

        # Convert to numeric
        df['label'] = pd.to_numeric(df['label'], errors='coerce')

        all_data.append(df)

# MERGE DATA
data = pd.concat(all_data, ignore_index=True)

# REMOVE INVALID LABELS
data = data[data['label'].isin([0, 1])]
data['label'] = data['label'].astype(int)

print("\n📊 Total rows before sampling:", len(data))

# 🔥 REDUCE DATA FOR SPEED
data = data.sample(30000, random_state=42)

print("📉 Using rows for training:", len(data))

# 🧹 FAST CLEANING
print("🧹 Cleaning text...")

data['text'] = data['text'].astype(str)
data['text'] = data['text'].str.lower()
data['text'] = data['text'].str.replace(r'<.*?>', '', regex=True)
data['text'] = data['text'].str.replace(r'[^a-zA-Z]', ' ', regex=True)

print("✅ Cleaning done")

# SPLIT
print("✂ Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    data['text'], data['label'], test_size=0.2, random_state=42
)

# TF-IDF
print("🔢 Applying TF-IDF...")
vectorizer = TfidfVectorizer(max_features=2000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# TRAIN
print("🤖 Training model...")
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# EVALUATE
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)

print("\n✅ Accuracy:", accuracy)

# SAVE MODEL
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("🎉 Model trained and saved successfully!")
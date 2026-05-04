# 🚨 AI Fraud Shield

Real-Time Fraud Detection System using Machine Learning

---

## 💡 Overview

AI Fraud Shield is a real-time fraud detection system designed to identify and prevent suspicious financial transactions before they are completed.

It combines **Machine Learning (Isolation Forest)** with a **rule-based fallback system** to ensure high reliability and continuous operation.

---

## ⚠️ Problem Statement

With the rapid growth of digital payments, fraud detection often happens **after** the transaction is completed, leading to:

* Financial losses
* Reduced user trust

---

## 🚀 Solution

The system evaluates every transaction in real-time and assigns a **risk score (0–100):**

* **0 – 39** → ✅ Approved
* **40 – 79** → 🔐 OTP Verification
* **80 – 100** → ⛔ Blocked

---

## 🧠 Key Features

* ⚡ Real-time transaction monitoring
* 🤖 Machine learning-based anomaly detection
* 🔐 OTP-based verification for suspicious activity
* 🛡️ Rule-based fallback system
* 📊 Dashboard with analytics
* 🧪 Transaction simulator

---

## 🏗️ System Architecture

```
Frontend (Dashboard & Simulator)
        ↓
Node.js Backend (API + Decision Engine)
        ↓
Python FastAPI (ML Model - Isolation Forest)
        ↓
Risk Score → Decision → Response
```

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* JavaScript
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Machine Learning

* Python
* FastAPI
* Scikit-learn (Isolation Forest)
* Pandas

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/shravaninigudge20/AI_Fraud_Shield.git
cd AI_Fraud_Shield
```

---

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

---

### 3. ML Engine Setup

```bash
cd ml-engine
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 4. Run Frontend

Open `index.html` in browser
(or use Live Server)

---

## 🔮 Future Improvements

* Integration with real-world datasets
* WebSocket-based real-time updates
* Model retraining pipeline
* Cloud deployment (AWS / Docker)

---

## 🌟 Impact

This system can be used in:

* 🏦 Banking systems
* 💳 UPI / Payment platforms
* 🛒 E-commerce fraud detection

---

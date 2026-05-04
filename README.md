# AI Fraud Shield

A simple real-time fraud detection system built using Node.js, SQLite, and Vite.

---

## Features

* Detects risky transactions
* Generates fraud risk score
* Shows results on dashboard
* Uses AI logic for analysis

---

## Tech Stack

* Frontend: Vite, HTML, CSS
* Backend: Node.js, Express
* Database: SQLite

---

## Installation

```bash
npm install
```

---

## Run Project

```bash
npm run dev:full
```

Open in browser:
http://localhost:5173

---

## API

POST /api/scan

Example:

```json
{
  "amount": 12000,
  "location": "India",
  "frequency": 25,
  "ip": "192.168.1.1"
}
```

---

## Note

* Make sure AI backend is running at:
  http://127.0.0.1:8000/predict

---

## Author

Shravani Nigudge

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Initialize Database connection and create tables if they don't exist
async function initDB() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            amount TEXT,
            location TEXT,
            riskScore INTEGER,
            decision TEXT,
            reasons TEXT
        );
        CREATE TABLE IF NOT EXISTS dashboard_stats (
            key TEXT PRIMARY KEY,
            value INTEGER
        );
        CREATE TABLE IF NOT EXISTS engine_settings (
            key TEXT PRIMARY KEY,
            value INTEGER
        );
        CREATE TABLE IF NOT EXISTS analytics_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hour TEXT,
            activeScans INTEGER,
            flagged INTEGER
        );
    `);

    // Seed Data
    const statRows = await db.get('SELECT COUNT(*) as count FROM dashboard_stats');
    if (statRows.count === 0) {
        console.log("Seeding fresh SQLite Database with initial mock data...");
        
        await db.exec(`
            INSERT INTO dashboard_stats (key, value) VALUES 
            ('totalTransactions', 1284042),
            ('fraudDetected', 1429),
            ('safeTransactions', 1282613),
            ('alertsTriggered', 42);

            INSERT INTO engine_settings (key, value) VALUES 
            ('strictnessLevel', 85),
            ('alertOnBulk', 1);

            INSERT INTO analytics_data (hour, activeScans, flagged) VALUES 
            ('02:00 AM', 8500, 45),
            ('04:00 AM', 6200, 32),
            ('06:00 AM', 10200, 90),
            ('08:00 AM', 15200, 180),
            ('10:00 AM', 18400, 220),
            ('12:00 PM', 48500, 14205),
            ('02:00 PM', 22100, 410),
            ('04:00 PM', 16100, 195),
            ('06:00 PM', 14200, 150),
            ('Live Ops', 0, 0);

            INSERT INTO transactions (id, timestamp, amount, location, riskScore, decision, reasons) VALUES 
            ('#TRX-990231', '14:22:01', '$12,400.00', 'London, UK', 82, 'BLOCKED', '["HIGH_VALUE_TX", "VELOCITY_ALERT"]'),
            ('#TRX-990232', '14:18:45', '$42.10', 'Tokyo, JP', 4, 'APPROVED', '[]'),
            ('#TRX-990233', '14:15:30', '$890.00', 'Mumbai, IN', 55, 'FLAGGED', '["ELEVATED_VELOCITY"]')
        `);
    }
}

// Neural Engine Scan API (Now integrates with Python AI Model)
app.post('/api/scan', async (req, res) => {
    let { amount, location, device, frequency, ip } = req.body;
    let riskScore = 15;
    let reasons = [];
    let decision = "APPROVED";

    const numAmount = Number(amount) || 0;
    const numFreq = Number(frequency) || 0;

    // --- REAL IP GEOLOCATION TRACKING ---
    if (ip && ip !== "192.168.1.1" && ip !== "0.0.0.0") {
        try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country`, {
                signal: AbortSignal.timeout(2000)
            });
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.status === "success" && geoData.country) {
                    location = geoData.country; 
                    reasons.push("IP_GEO_TRACED");
                }
            }
        } catch(e) {
            console.warn("Geolocation API tracking failed or timed out.");
        }
    }

    try {
        const aiResponse = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: numAmount, frequency: numFreq }),
            signal: AbortSignal.timeout(3000)
        });

        if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            riskScore = aiData.riskScore;
            if (aiData.reasons) {
                aiData.reasons.forEach(r => reasons.push(r));
            }
            reasons.push("AI_MODE_ACTIVE");
        } else {
            throw new Error("AI Backend returned error");
        }
    } catch (err) {
        if (numAmount > 10000) { riskScore += 35; reasons.push("HIGH_VALUE_TX"); }
        if (numAmount > 50000) { riskScore += 20; reasons.push("CRITICAL_VALUE"); }
        if (numFreq > 50) { riskScore += 30; reasons.push("VELOCITY_ALERT"); }
        else if (numFreq > 20) { riskScore += 15; reasons.push("ELEVATED_VELOCITY"); }
    }

    const riskyLocations = ["Russia", "Nigeria", "North Korea"];
    if (riskyLocations.includes(location)) { riskScore += 45; reasons.push("HIGH_RISK_GEO"); }
    
    if (ip && (ip.startsWith("192.") || ip.startsWith("10."))) {
        riskScore += 15; reasons.push("VPN_DETECTED");
    }

    // Fetch strictness settings
    const settingsRow = await db.get("SELECT value FROM engine_settings WHERE key = 'strictnessLevel'");
    const strictnessLevel = settingsRow ? settingsRow.value : 85;

    let strictnessPenalty = (strictnessLevel - 85) / 2;
    riskScore += strictnessPenalty;
    riskScore = Math.min(Math.max(riskScore, 0), 100);

    if (riskScore > 80) decision = "BLOCKED";
    else if (riskScore > 40) decision = "FLAGGED";
    else decision = "APPROVED";

    const trx = {
        id: "#TRX-" + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toLocaleTimeString(),
        amount: "$" + numAmount.toLocaleString(undefined, {minimumFractionDigits: 2}),
        location: location || "Unknown",
        riskScore,
        decision,
        reasons
    };

    // DB INSERTIONS
    try {
        await db.run(
            `INSERT INTO transactions (id, timestamp, amount, location, riskScore, decision, reasons) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [trx.id, trx.timestamp, trx.amount, trx.location, trx.riskScore, trx.decision, JSON.stringify(trx.reasons)]
        );

        await db.run(`UPDATE dashboard_stats SET value = value + 1 WHERE key = 'totalTransactions'`);
        if (decision === "BLOCKED") await db.run(`UPDATE dashboard_stats SET value = value + 1 WHERE key = 'fraudDetected'`);
        else await db.run(`UPDATE dashboard_stats SET value = value + 1 WHERE key = 'safeTransactions'`);
        if (decision === "FLAGGED") await db.run(`UPDATE dashboard_stats SET value = value + 1 WHERE key = 'alertsTriggered'`);

        const currentBucket = await db.get(`SELECT id FROM analytics_data ORDER BY id DESC LIMIT 1`);
        if (currentBucket) {
            await db.run(`UPDATE analytics_data SET activeScans = activeScans + 1 WHERE id = ?`, [currentBucket.id]);
            if (decision === "BLOCKED" || decision === "FLAGGED") {
                await db.run(`UPDATE analytics_data SET flagged = flagged + 1 WHERE id = ?`, [currentBucket.id]);
            }
        }
    } catch(dbErr) {
        console.error("DB Error on save:", dbErr);
    }

    setTimeout(() => res.json(trx), 300);
});

// Resolve OTP Modal Action
app.post('/api/transactions/:id/resolve', async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; 
    
    try {
        const trx = await db.get(`SELECT * FROM transactions WHERE id = ?`, [`#${id}`]);
        if (trx && trx.decision === "FLAGGED") {
            await db.run(`UPDATE transactions SET decision = ? WHERE id = ?`, [action, `#${id}`]);
            
            if (action === "BLOCKED") {
                await db.run(`UPDATE dashboard_stats SET value = value - 1 WHERE key = 'safeTransactions'`);
                await db.run(`UPDATE dashboard_stats SET value = value + 1 WHERE key = 'fraudDetected'`);
            }
            
            trx.decision = action;
            res.json({ success: true, trx });
        } else {
            res.status(404).json({ success: false, msg: "Not found or not flagged" });
        }
    } catch(e) {
        res.status(500).json({ success: false });
    }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    const rows = await db.all("SELECT key, value FROM dashboard_stats");
    const statsObj = {};
    rows.forEach(r => statsObj[r.key] = r.value);
    res.json(statsObj);
});

// Recent Transactions
app.get('/api/transactions/recent', async (req, res) => {
    const rows = await db.all("SELECT * FROM transactions ORDER BY rowid DESC LIMIT 50");
    const formatted = rows.map(r => ({
        ...r,
        reasons: JSON.parse(r.reasons)
    }));
    res.json(formatted);
});

// Analytics Chart Data
app.get('/api/dashboard/analytics', async (req, res) => {
    const rows = await db.all("SELECT hour, activeScans, flagged FROM analytics_data ORDER BY id ASC");
    res.json(rows);
});

// Get Settings
app.get('/api/settings', async (req, res) => {
    const rows = await db.all("SELECT key, value FROM engine_settings");
    const settingsObj = {};
    rows.forEach(r => {
        if(r.key === 'strictnessLevel') settingsObj.strictnessLevel = r.value;
        if(r.key === 'alertOnBulk') settingsObj.alertOnBulk = Boolean(r.value);
    });
    res.json(settingsObj);
});

// Update Settings
app.post('/api/settings', async (req, res) => {
    const { strictnessLevel, alertOnBulk } = req.body;
    if (strictnessLevel !== undefined) {
        await db.run(`UPDATE engine_settings SET value = ? WHERE key = 'strictnessLevel'`, [Number(strictnessLevel)]);
    }
    if (alertOnBulk !== undefined) {
        await db.run(`UPDATE engine_settings SET value = ? WHERE key = 'alertOnBulk'`, [alertOnBulk ? 1 : 0]);
    }
    res.json({ success: true });
});

const PORT = 3000;
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Neural Engine Backend running with SQLite on port ${PORT}`);
    });
}).catch(e => {
    console.error("Failed to initialize database:", e);
});

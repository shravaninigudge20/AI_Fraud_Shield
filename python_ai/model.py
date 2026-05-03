import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class FraudDetectionModel:
    def __init__(self):
        self.model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        self.is_trained = False
        self._train_dummy_model()

    def _train_dummy_model(self):
        # We generate synthetic data directly
        np.random.seed(42)
        
        # Normal subset
        normal_amount = np.random.normal(loc=100, scale=50, size=900)
        normal_freq = np.random.normal(loc=2, scale=1, size=900)
        
        # Outlier subset
        fraud_amount = np.random.normal(loc=5000, scale=2000, size=100)
        fraud_freq = np.random.normal(loc=20, scale=10, size=100)
        
        amounts = np.concatenate([normal_amount, fraud_amount])
        freqs = np.concatenate([normal_freq, fraud_freq])
        
        amounts = np.abs(amounts)
        freqs = np.abs(freqs)
        
        X = np.column_stack((amounts, freqs))
        
        self.model.fit(X)
        self.is_trained = True
        print("Isolation Forest Model Trained on Synthetic Data.")

    def predict_risk(self, amount: float, frequency: int) -> dict:
        if not self.is_trained:
            return {"riskScore": 50, "decision": "FLAGGED", "reasons": ["MODEL_NOT_READY"]}
            
        X_test = np.array([[amount, frequency]])
        prediction = self.model.predict(X_test)[0] 
        score = self.model.decision_function(X_test)[0]
        
        # Inverse mapping: lower score = higher risk
        base_risk = 50 - (score * 150)
        risk_score = int(np.clip(base_risk, 0, 100))
        
        reasons = []
        if prediction == -1:
            reasons.append("AI_ANOMALY_DETECTED")
            
        if amount > 10000:
            reasons.append("HIGH_VALUE_TX")
            risk_score = max(risk_score, 75)
            
        if frequency > 20:
            reasons.append("ELEVATED_VELOCITY")
            risk_score = max(risk_score, 50)

        if risk_score > 80:
            decision = "BLOCKED"
        elif risk_score > 40:
            decision = "FLAGGED"
        else:
            decision = "APPROVED"

        return {
            "riskScore": risk_score,
            "decision": decision,
            "reasons": reasons
        }

fraud_model = FraudDetectionModel()

from fastapi import FastAPI
from pydantic import BaseModel
from model import fraud_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Fraud Engine", description="Isolation Forest based fraud detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    amount: float
    frequency: int

@app.post("/predict")
def predict_fraud(transaction: Transaction):
    result = fraud_model.predict_risk(transaction.amount, transaction.frequency)
    return result

@app.get("/health")
def health_check():
    return {"status": "ok", "model_trained": fraud_model.is_trained}

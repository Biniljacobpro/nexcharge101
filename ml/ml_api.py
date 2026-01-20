"""
FastAPI service for energy consumption prediction

This service loads a pre-trained ML model and exposes it via HTTP API
for the Node.js route planner service to consume.

The service is designed to be:
1. Stateful at startup (loads model into memory)
2. Stateless during operation (no session data)
3. Container-ready (can run in Docker)
4. Production-ready (includes error handling and logging)
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EV Energy Consumption Prediction API",
    description="API for predicting energy consumption for EV route segments",
    version="1.0.0"
)

# Global variable to hold the loaded model
model = None
MODEL_PATH = "energy_model.pkl"

class EnergyPredictionRequest(BaseModel):
    """
    Request model for energy consumption prediction
    """
    distance: float  # Distance in kilometers
    elevation_gain: float  # Elevation gain in meters
    vehicle_efficiency: float  # Vehicle efficiency rating
    battery_capacity: float  # Battery capacity in kWh

class EnergyPredictionResponse(BaseModel):
    """
    Response model for energy consumption prediction
    """
    predicted_energy_kwh: float  # Predicted energy consumption in kWh

@app.on_event("startup")
async def load_model():
    """
    Load the trained model into memory at startup
    """
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
        else:
            logger.warning(f"Model file {MODEL_PATH} not found. Creating a simple fallback model.")
            # Create a simple fallback model for demonstration
            from sklearn.dummy import DummyRegressor
            import numpy as np
            model = DummyRegressor(strategy="mean")
            # Fit with dummy data
            X_dummy = np.array([[50, 100, 0.2, 60]] * 10)  # 10 samples of dummy data
            y_dummy = np.array([12.5] * 10)  # 12.5 kWh as dummy target
            model.fit(X_dummy, y_dummy)
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

@app.get("/")
async def root():
    """
    Health check endpoint
    """
    return {"message": "EV Energy Consumption Prediction API is running"}

@app.get("/health")
async def health_check():
    """
    Detailed health check endpoint
    """
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

@app.post("/predict-energy", response_model=EnergyPredictionResponse)
async def predict_energy(request: EnergyPredictionRequest):
    """
    Predict energy consumption for a route segment
    
    This endpoint uses the loaded ML model to predict energy consumption
    based on route segment features.
    
    Args:
        request (EnergyPredictionRequest): Request containing route segment features
        
    Returns:
        EnergyPredictionResponse: Predicted energy consumption in kWh
        
    Raises:
        HTTPException: If model prediction fails
    """
    try:
        # Validate input
        if request.distance <= 0:
            raise HTTPException(status_code=400, detail="Distance must be positive")
            
        if request.battery_capacity <= 0:
            raise HTTPException(status_code=400, detail="Battery capacity must be positive")
            
        # Prepare features for prediction
        # Note: The order of features must match the training data
        features = [[
            request.distance,
            request.elevation_gain,
            request.vehicle_efficiency,
            request.battery_capacity
        ]]
        
        # Make prediction
        prediction = model.predict(features)
        
        # Extract the predicted value (model.predict returns an array)
        predicted_energy = float(prediction[0])
        
        # Ensure prediction is non-negative
        predicted_energy = max(0, predicted_energy)
        
        logger.info(f"Prediction made: {predicted_energy:.2f} kWh for inputs: {request.dict()}")
        
        return EnergyPredictionResponse(predicted_energy_kwh=predicted_energy)
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch", response_model=Dict[str, Any])
async def predict_batch(requests: list[EnergyPredictionRequest]):
    """
    Predict energy consumption for multiple route segments
    
    This endpoint allows batch prediction for efficiency.
    
    Args:
        requests (List[EnergyPredictionRequest]): List of requests containing route segment features
        
    Returns:
        Dict: Dictionary containing list of predictions
        
    Raises:
        HTTPException: If model prediction fails
    """
    try:
        predictions = []
        
        for req in requests:
            # Validate input
            if req.distance <= 0:
                raise HTTPException(status_code=400, detail="Distance must be positive")
                
            if req.battery_capacity <= 0:
                raise HTTPException(status_code=400, detail="Battery capacity must be positive")
                
            # Prepare features for prediction
            features = [[
                req.distance,
                req.elevation_gain,
                req.vehicle_efficiency,
                req.battery_capacity
            ]]
            
            # Make prediction
            prediction = model.predict(features)
            predicted_energy = float(prediction[0])
            predicted_energy = max(0, predicted_energy)
            
            predictions.append({
                "predicted_energy_kwh": predicted_energy
            })
        
        logger.info(f"Batch prediction made for {len(predictions)} segments")
        
        return {"predictions": predictions}
        
    except Exception as e:
        logger.error(f"Error during batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Run the API server
    uvicorn.run(
        "ml_api:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=os.environ.get("DEV_MODE", False)
    )
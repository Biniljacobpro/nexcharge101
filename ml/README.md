# EV Energy Consumption Prediction Service

This directory contains the Python machine learning service for predicting energy consumption in electric vehicle route planning.

## Components

1. **Training Script** (`train_energy_model.py`): Trains the energy consumption prediction model
2. **API Service** (`ml_api.py`): FastAPI service that serves the trained model
3. **Model File** (`energy_model.pkl`): Serialized trained model (generated after training)
4. **Requirements** (`requirements.txt`): Python dependencies

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Train the model:
   ```bash
   python train_energy_model.py
   ```

3. Run the API service:
   ```bash
   python ml_api.py
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn ml_api:app --host 0.0.0.0 --port 8000
   ```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health check
- `POST /predict-energy` - Predict energy consumption for a single route segment
- `POST /predict-batch` - Predict energy consumption for multiple route segments

## Model Details

The service uses a Random Forest Regressor to predict energy consumption based on:
- Distance (km)
- Elevation gain (meters)
- Vehicle efficiency
- Battery capacity (kWh)

## Environment Variables

- `PORT` - Port to run the service on (default: 8000)
- `DEV_MODE` - Enable hot reloading (default: False)

## Container Deployment

The service is designed to be container-ready. A typical Dockerfile would be:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "ml_api.py"]
```
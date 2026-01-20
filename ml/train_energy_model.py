"""
Train energy consumption prediction model for EV route planning

This script trains a machine learning model to predict energy consumption
for electric vehicle route segments based on:
- Distance
- Elevation gain
- Vehicle efficiency
- Battery capacity

Algorithm progression:
1. Linear Regression (baseline)
2. Random Forest Regressor (final model)

Random Forest is chosen because:
1. It handles non-linear relationships well
2. It's robust to outliers in the data
3. It provides feature importance metrics
4. It generalizes well to unseen data
5. It doesn't require extensive hyperparameter tuning
6. It's interpretable compared to more complex models
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import sys
import os

# Add the parent directory to the path to import utils if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def load_sample_data():
    """
    Generate sample training data for demonstration purposes.
    
    In a real implementation, this would load actual historical data from:
    - Vehicle telematics systems
    - Charging session logs
    - Route tracking data
    - Weather conditions
    - Traffic patterns
    """
    np.random.seed(42)  # For reproducible results
    
    # Generate synthetic data
    n_samples = 10000
    
    # Features
    distance = np.random.uniform(1, 200, n_samples)  # km
    elevation_gain = np.random.uniform(-100, 500, n_samples)  # meters
    vehicle_efficiency = np.random.uniform(0.1, 0.3, n_samples)  # kWh/km
    battery_capacity = np.random.uniform(40, 100, n_samples)  # kWh
    
    # Create realistic energy consumption based on features
    # Base consumption: distance * efficiency
    base_consumption = distance * vehicle_efficiency * battery_capacity / 60
    
    # Add elevation effect (positive for uphill, negative for downhill)
    elevation_effect = elevation_gain * 0.0002 * battery_capacity / 60
    
    # Add some noise to make it more realistic
    noise = np.random.normal(0, 1, n_samples)
    
    # Final energy consumption
    energy_consumption = base_consumption + elevation_effect + noise
    
    # Ensure no negative values
    energy_consumption = np.maximum(energy_consumption, 0)
    
    # Create DataFrame
    data = pd.DataFrame({
        'distance': distance,
        'elevation_gain': elevation_gain,
        'vehicle_efficiency': vehicle_efficiency,
        'battery_capacity': battery_capacity,
        'energy_consumption': energy_consumption
    })
    
    return data

def train_linear_regression(X_train, X_test, y_train, y_test):
    """
    Train a linear regression baseline model
    """
    print("Training Linear Regression model...")
    
    # Create and train the model
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = lr_model.predict(X_test)
    
    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Linear Regression Results:")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE: {mae:.4f}")
    print(f"  R²: {r2:.4f}")
    
    return lr_model, {'rmse': rmse, 'mae': mae, 'r2': r2}

def train_random_forest(X_train, X_test, y_train, y_test):
    """
    Train a Random Forest regression model
    """
    print("Training Random Forest model...")
    
    # Create and train the model
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = rf_model.predict(X_test)
    
    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Random Forest Results:")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE: {mae:.4f}")
    print(f"  R²: {r2:.4f}")
    
    # Print feature importance
    feature_names = ['distance', 'elevation_gain', 'vehicle_efficiency', 'battery_capacity']
    importances = rf_model.feature_importances_
    feature_importance = list(zip(feature_names, importances))
    feature_importance.sort(key=lambda x: x[1], reverse=True)
    
    print("Feature Importance:")
    for feature, importance in feature_importance:
        print(f"  {feature}: {importance:.4f}")
    
    return rf_model, {'rmse': rmse, 'mae': mae, 'r2': r2}

def main():
    print("Loading training data...")
    data = load_sample_data()
    
    print(f"Dataset shape: {data.shape}")
    print(f"Features: {list(data.columns[:-1])}")
    print(f"Target: {data.columns[-1]}")
    
    # Prepare features and target
    X = data[['distance', 'elevation_gain', 'vehicle_efficiency', 'battery_capacity']]
    y = data['energy_consumption']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Train baseline model
    lr_model, lr_metrics = train_linear_regression(X_train, X_test, y_train, y_test)
    
    # Train Random Forest model
    rf_model, rf_metrics = train_random_forest(X_train, X_test, y_train, y_test)
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Linear Regression R²: {lr_metrics['r2']:.4f}")
    print(f"Random Forest R²: {rf_metrics['r2']:.4f}")
    
    # Select the best model (based on R² score)
    if rf_metrics['r2'] > lr_metrics['r2']:
        print("\nSelecting Random Forest as the final model")
        final_model = rf_model
        model_name = "Random Forest"
    else:
        print("\nSelecting Linear Regression as the final model")
        final_model = lr_model
        model_name = "Linear Regression"
    
    # Save the final model
    model_path = "energy_model.pkl"
    joblib.dump(final_model, model_path)
    print(f"\nFinal model saved to {model_path}")
    
    # Test the saved model
    loaded_model = joblib.load(model_path)
    test_prediction = loaded_model.predict([[50, 100, 0.2, 60]])  # 50km, 100m elevation, 0.2 efficiency, 60kWh battery
    print(f"\nTest prediction for sample input: {test_prediction[0]:.2f} kWh")

if __name__ == "__main__":
    main()
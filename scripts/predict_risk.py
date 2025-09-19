#!/usr/bin/env python3

"""
AI Risk Prediction Script (Python)
Loads trained risk model and makes risk predictions
"""

import os
import json
import numpy as np
from datetime import datetime, timedelta

def load_risk_model():
    """Load the trained risk model"""
    model_path = os.environ.get('MODEL_OUTPUT_PATH', 'risk_model.json')

    if not os.path.exists(model_path):
        # Return default structure if no model exists
        return {
            'model_weights': {
                'drawdown_threshold': 4.0,
                'cluster_size_weight': 0.3,
                'time_to_expiry_weight': 0.2,
                'pnl_volatility_weight': 0.5,
                'historical_patterns': 5,
                'confidence_score': 0.75
            },
            'risk_thresholds': {
                'high': 4.0,
                'medium': 2.0,
                'low': 1.0
            },
            'sample_predictions': []
        }

    try:
        with open(model_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading risk model: {e}", file=__import__('sys').stderr)
        return None

def generate_mock_positions():
    """Generate mock position data for risk assessment"""
    positions = []

    # Create some positions with potential risk
    base_date = datetime.now()
    risk_end_date = base_date + timedelta(days=30)

    # High-risk cluster
    for i in range(8):  # 8 positions in risky cluster
        position = {
            'id': f'pos_high_{i}',
            'endDate': risk_end_date.strftime('%Y-%m-%d'),
            'entryPrice': np.random.uniform(0.1, 1.0),
            'shares': np.random.randint(50, 200),
            'pnl': np.random.uniform(-500, -50),  # All negative PnL
            'status': 'open'
        }
        positions.append(position)

    # Low-risk cluster
    safe_end_date = base_date + timedelta(days=90)
    for i in range(3):  # 3 positions in safe cluster
        position = {
            'id': f'pos_low_{i}',
            'endDate': safe_end_date.strftime('%Y-%m-%d'),
            'entryPrice': np.random.uniform(0.1, 1.0),
            'shares': np.random.randint(10, 50),
            'pnl': np.random.uniform(-20, 50),  # Mixed PnL
            'status': 'open'
        }
        positions.append(position)

    return positions

def assess_cluster_risk(positions, model_weights):
    """Assess risk for position clusters"""

    # Group positions by end date
    clusters = {}
    for position in positions:
        end_date = position['endDate']
        if end_date not in clusters:
            clusters[end_date] = []
        clusters[end_date].append(position)

    risk_assessments = []

    for end_date, cluster_positions in clusters.items():
        # Calculate cluster metrics
        total_value = sum(p['entryPrice'] * p['shares'] for p in cluster_positions)
        total_pnl = sum(p['pnl'] for p in cluster_positions)
        cluster_size = len(cluster_positions)

        # Calculate drawdown percentage
        if total_value > 0:
            drawdown_pct = abs(total_pnl) / total_value if total_pnl < 0 else 0
        else:
            drawdown_pct = 0

        # Assess risk level
        if drawdown_pct > model_weights.get('drawdown_threshold', 4.0):
            risk_level = 'high'
            severity = 'high'
        elif drawdown_pct > 2.0:
            risk_level = 'medium'
            severity = 'medium'
        else:
            risk_level = 'low'
            severity = 'low'

        risk_assessments.append({
            'end_date': end_date,
            'cluster_size': cluster_size,
            'drawdown_percentage': round(drawdown_pct * 100, 2),
            'total_value': round(total_value, 2),
            'total_pnl': round(total_pnl, 2),
            'risk_level': risk_level,
            'severity': severity
        })

    return risk_assessments

def generate_risk_prediction(risk_assessments, model_weights):
    """Generate overall risk prediction"""

    if not risk_assessments:
        return {
            'alert': False,
            'message': '',
            'severity': 'low',
            'metrics': {
                'maxDrawdown': 0,
                'drawdownDate': None,
                'clusterSize': 0,
                'totalExposure': 0,
                'maxSinglePosition': 0,
                'concentrationRisk': 0,
                'threshold': 4.0
            },
            'recommendations': []
        }

    # Find highest risk assessment
    high_risk_assessments = [ra for ra in risk_assessments if ra['risk_level'] == 'high']

    if high_risk_assessments:
        # Use the highest risk cluster
        max_risk = max(high_risk_assessments, key=lambda x: x['drawdown_percentage'])

        alert = True
        message = ".2f"
        severity = max_risk['severity']
        max_drawdown = max_risk['drawdown_percentage']

        recommendations = [
            "Consider reducing position sizes in clustered markets",
            "Monitor markets ending in the same time period",
            "Diversify across different market categories",
            "Consider taking partial profits if positions are profitable"
        ]
    else:
        alert = False
        message = ""
        severity = "low"
        max_drawdown = max([ra['drawdown_percentage'] for ra in risk_assessments]) if risk_assessments else 0

        recommendations = [
            "Risk levels are within acceptable ranges",
            "Continue monitoring position clusters",
            "Consider gradual position sizing increases"
        ]

    # Calculate additional metrics
    total_exposure = sum(ra['total_value'] for ra in risk_assessments)
    max_cluster_size = max([ra['cluster_size'] for ra in risk_assessments]) if risk_assessments else 0
    concentration_risk = (max_cluster_size / len(risk_assessments)) * 100 if risk_assessments else 0

    return {
        'alert': alert,
        'message': message,
        'severity': severity,
        'metrics': {
            'maxDrawdown': max_drawdown,
            'drawdownDate': max_risk['end_date'] if high_risk_assessments else None,
            'clusterSize': max_cluster_size,
            'totalExposure': round(total_exposure, 2),
            'maxSinglePosition': max([ra['total_value'] for ra in risk_assessments]) if risk_assessments else 0,
            'concentrationRisk': round(concentration_risk, 2),
            'threshold': model_weights.get('drawdown_threshold', 4.0)
        },
        'recommendations': recommendations
    }

def main():
    """Main risk prediction function"""

    print("🛡️  Starting AI Risk Prediction")
    print("=" * 50)

    # Load risk model
    model_data = load_risk_model()
    if not model_data:
        print("❌ Failed to load risk model, using defaults")
        model_data = {
            'model_weights': {
                'drawdown_threshold': 4.0,
                'cluster_size_weight': 0.3,
                'time_to_expiry_weight': 0.2,
                'pnl_volatility_weight': 0.5,
                'historical_patterns': 5,
                'confidence_score': 0.75
            }
        }

    # Generate mock positions for assessment
    positions = generate_mock_positions()
    print(f"✅ Generated {len(positions)} positions for risk assessment")

    # Assess cluster risks
    risk_assessments = assess_cluster_risk(positions, model_data.get('model_weights', {}))
    print(f"✅ Analyzed {len(risk_assessments)} position clusters")

    # Generate overall risk prediction
    prediction = generate_risk_prediction(risk_assessments, model_data.get('model_weights', {}))

    if prediction['alert']:
        print(f"🚨 HIGH RISK ALERT: {prediction['message']}")
        print(f"   Severity: {prediction['severity']}")
        print(f"   Max Drawdown: {prediction['metrics']['maxDrawdown']}%")
    else:
        print("✅ Risk levels are within acceptable ranges")

    # Output JSON result
    print("\n📊 Risk Prediction Results:")
    print(json.dumps(prediction, indent=2))

if __name__ == "__main__":
    main()

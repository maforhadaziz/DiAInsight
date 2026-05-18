import pickle
import numpy as np
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# Load the trained model
model_path = 'pickel_model.pkl'
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print(f"Model loaded. Expects {model.n_features_in_} features.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict diabetes based on 7 input features (pedigree removed).
    Expected JSON:
    {
        "pregnancies": float,
        "glucose": float,
        "blood_pressure": float,
        "skin_thickness": float,
        "insulin": float,
        "bmi": float,
        "age": float
    }
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        # 7 features — pedigree excluded
        features = [
            float(data.get('pregnancies', 0)),
            float(data.get('glucose', 0)),
            float(data.get('blood_pressure', 0)),
            float(data.get('skin_thickness', 0)),
            float(data.get('insulin', 0)),
            float(data.get('bmi', 0)),
            float(data.get('age', 0))
        ]

        features_array = np.array([features])
        prediction = model.predict(features_array)[0]

        try:
            probability = model.predict_proba(features_array)[0]
            confidence = float(max(probability)) * 100
        except Exception:
            confidence = None

        result = {
            'prediction': int(prediction),
            'prediction_text': 'Diabetes Detected' if prediction == 1 else 'No Diabetes Detected',
            'confidence': confidence,
            'inputs': {
                'pregnancies':    features[0],
                'glucose':        features[1],
                'blood_pressure': features[2],
                'skin_thickness': features[3],
                'insulin':        features[4],
                'bmi':            features[5],
                'age':            features[6]
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/info', methods=['GET'])
def info():
    return jsonify({
        'model_type': 'KNN Diabetes Prediction Model',
        'features': ['Pregnancies', 'Glucose', 'Blood Pressure',
                     'Skin Thickness', 'Insulin', 'BMI', 'Age']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

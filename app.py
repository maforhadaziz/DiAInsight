import pickle
import numpy as np
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# ── Scaler parameters (Pima Indians Diabetes dataset stats) ──
# These match exactly what was used when the KNN model was trained in Colab
SCALER_MEAN = np.array([3.845, 120.89, 69.10, 20.54, 79.80, 31.99, 33.24])
SCALER_STD  = np.array([3.369,  31.97, 19.35, 15.95, 115.24,  7.88, 11.76])

# Features where 0 is medically impossible — replace with column mean
# (Pregnancies and Age can legitimately be low, so they are excluded)
# Index: 0=preg, 1=glucose, 2=bp, 3=skin, 4=insulin, 5=bmi, 6=age
ZERO_REPLACE_MEAN = {
    1: 120.89,   # Glucose
    2: 69.10,    # Blood Pressure
    3: 20.54,    # Skin Thickness
    4: 79.80,    # Insulin
    5: 31.99,    # BMI
}

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
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        # 7 features — diabetes pedigree excluded
        raw = np.array([[
            float(data.get('pregnancies', 0)),
            float(data.get('glucose', 0)),
            float(data.get('blood_pressure', 0)),
            float(data.get('skin_thickness', 0)),
            float(data.get('insulin', 0)),
            float(data.get('bmi', 0)),
            float(data.get('age', 0))
        ]])

        # Replace 0 with column mean for fields where 0 is medically impossible
        for idx, mean_val in ZERO_REPLACE_MEAN.items():
            if raw[0][idx] == 0:
                raw[0][idx] = mean_val

        # Scale exactly as done during training
        scaled = (raw - SCALER_MEAN) / SCALER_STD

        prediction = model.predict(scaled)[0]

        try:
            probability = model.predict_proba(scaled)[0]
            confidence = float(max(probability)) * 100
        except Exception:
            confidence = None

        result = {
            'prediction': int(prediction),
            'prediction_text': 'Diabetes Detected' if prediction == 1 else 'No Diabetes Detected',
            'confidence': confidence,
            'patient_name': data.get('patient_name', '').strip(),
            'inputs': {
                'pregnancies':    float(raw[0][0]),
                'glucose':        float(raw[0][1]),
                'blood_pressure': float(raw[0][2]),
                'skin_thickness': float(raw[0][3]),
                'insulin':        float(raw[0][4]),
                'bmi':            float(raw[0][5]),
                'age':            float(raw[0][6])
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

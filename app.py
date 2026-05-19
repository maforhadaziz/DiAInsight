import pickle
import numpy as np
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# ── Load model bundle (model + scaler saved together from Colab) ──
# If model_bundle.pkl exists, use it (scaler included — no hardcoded values needed)
# Falls back to pickel_model.pkl with hardcoded scaler if bundle not found

model  = None
scaler = None

BUNDLE_PATH = 'model_bundle.pkl'
LEGACY_PATH = 'pickel_model.pkl'

# Fields where 0 is medically impossible — replaced with column mean
# Only used in legacy mode (when no scaler is available in the bundle)
LEGACY_MEAN = np.array([3.845, 120.89, 69.10, 20.54, 79.80, 31.99, 33.24])
LEGACY_STD  = np.array([3.369,  31.97, 19.35, 15.95, 115.24,  7.88, 11.76])
LEGACY_ZERO_REPLACE = {1: 120.89, 2: 69.10, 3: 20.54, 4: 79.80, 5: 31.99}

if os.path.exists(BUNDLE_PATH):
    try:
        with open(BUNDLE_PATH, 'rb') as f:
            bundle = pickle.load(f)
        model  = bundle['model']
        scaler = bundle['scaler']
        print(f"Bundle loaded. Model expects {model.n_features_in_} features. Scaler included.")
    except Exception as e:
        print(f"Error loading bundle: {e}")

if model is None and os.path.exists(LEGACY_PATH):
    try:
        with open(LEGACY_PATH, 'rb') as f:
            model = pickle.load(f)
        print(f"Legacy model loaded. Expects {model.n_features_in_} features. Using hardcoded scaler.")
    except Exception as e:
        print(f"Error loading legacy model: {e}")

if model is None:
    print("WARNING: No model file found.")


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

        if scaler is not None:
            # ── Bundle mode: scaler handles everything automatically ──
            # Replace 0 with NaN then use scaler's mean for imputation
            zero_cols = [1, 2, 3, 4, 5]  # glucose, bp, skin, insulin, bmi
            for col in zero_cols:
                if raw[0][col] == 0:
                    raw[0][col] = scaler.mean_[col]
            scaled = scaler.transform(raw)
        else:
            # ── Legacy mode: hardcoded scaler values ──
            for idx, mean_val in LEGACY_ZERO_REPLACE.items():
                if raw[0][idx] == 0:
                    raw[0][idx] = mean_val
            scaled = (raw - LEGACY_MEAN) / LEGACY_STD

        prediction = model.predict(scaled)[0]

        try:
            probability = model.predict_proba(scaled)[0]
            confidence  = float(max(probability)) * 100
        except Exception:
            confidence = None

        result = {
            'prediction':      int(prediction),
            'prediction_text': 'Diabetes Detected' if prediction == 1 else 'No Diabetes Detected',
            'confidence':      confidence,
            'patient_name':    data.get('patient_name', '').strip(),
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
    mode = 'bundle (scaler included)' if scaler is not None else 'legacy (hardcoded scaler)'
    return jsonify({
        'model_type': 'KNN Diabetes Prediction Model',
        'mode': mode,
        'features': ['Pregnancies', 'Glucose', 'Blood Pressure',
                     'Skin Thickness', 'Insulin', 'BMI', 'Age']
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

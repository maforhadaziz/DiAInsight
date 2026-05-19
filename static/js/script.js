/**
 * DiabetesPred — Flask-served script
 * Prediction comes from pickel_model.pkl via /predict endpoint
 */
window.__dpLoaded = true;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    if (!form) return;
    form.addEventListener('submit', handleFormSubmit);
    form.querySelectorAll('input[required]').forEach(inp => {
        inp.addEventListener('input', () => {
            inp.classList.remove('error');
            document.getElementById('errorSection').classList.add('hidden');
        });
    });
    initTheme();
});

async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const data = Object.fromEntries(new FormData(e.target));
    showLoading();
    try {
        await animateLoadingSteps();
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        let result;
        try { result = await response.json(); }
        catch { throw new Error('Server returned an unexpected response. Make sure Flask is running.'); }
        if (!response.ok) throw new Error(result.error || 'Prediction failed.');
        displayResult(result);
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

function animateLoadingSteps() {
    return new Promise(resolve => {
        const steps = ['step1', 'step2', 'step3'];
        let i = 0;
        steps.forEach(id => { const el = document.getElementById(id); if (el) el.className = 'step'; });
        const tick = () => {
            if (i > 0) { const p = document.getElementById(steps[i-1]); if (p) p.className = 'step done'; }
            if (i < steps.length) { const c = document.getElementById(steps[i]); if (c) c.className = 'step active'; i++; setTimeout(tick, 550); }
            else resolve();
        };
        tick();
    });
}

function validateForm() {
    const inputs = document.getElementById('predictionForm').querySelectorAll('input[required]');
    let ok = true;
    inputs.forEach(inp => {
        if (inp.type === 'text') {
            if (inp.value.trim() === '') { inp.classList.add('error'); ok = false; }
            else inp.classList.remove('error');
        } else {
            const v = parseFloat(inp.value);
            if (inp.value.trim() === '' || isNaN(v) || v < 0) { inp.classList.add('error'); ok = false; }
            else inp.classList.remove('error');
        }
    });
    if (!ok) showError('Please fill in all fields with valid values.');
    return ok;
}

// ── Health Tips (ADA / WHO clinical thresholds) ──
function buildTips(inp, isPositive) {
    const tips = [];
    const g = +inp.glucose, bp = +inp.blood_pressure, bmi = +inp.bmi,
          age = +inp.age, ins = +inp.insulin, sk = +inp.skin_thickness, preg = +inp.pregnancies;

    if (g >= 126)      tips.push({icon:'🩸',cat:'Glucose',lvl:'high', text:`Fasting glucose ${g} mg/dL is in the diabetic range (≥126 mg/dL per ADA). Discuss an HbA1c test with your doctor immediately. Eliminate sugary drinks, white bread, and processed carbs.`});
    else if (g >= 100) tips.push({icon:'🩸',cat:'Glucose',lvl:'warn', text:`Glucose ${g} mg/dL is pre-diabetic (100–125 mg/dL). Reduce refined carbohydrates, increase dietary fibre, and aim for 150 min of moderate exercise per week to prevent progression.`});
    else               tips.push({icon:'🩸',cat:'Glucose',lvl:'good', text:`Glucose ${g} mg/dL is normal (<100 mg/dL). Maintain it by choosing whole grains, vegetables, and limiting added sugars to <25 g/day (WHO guideline).`});

    if (bp >= 90)      tips.push({icon:'💓',cat:'Blood Pressure',lvl:'high', text:`Diastolic BP ${bp} mmHg is Stage 2 hypertension. Reduce sodium to <1500 mg/day, avoid alcohol, exercise daily, and consult your doctor — medication may be needed.`});
    else if (bp >= 80) tips.push({icon:'💓',cat:'Blood Pressure',lvl:'warn', text:`Diastolic BP ${bp} mmHg is elevated. Follow the DASH diet (fruits, vegetables, low-fat dairy, whole grains) and reduce processed food and caffeine.`});
    else               tips.push({icon:'💓',cat:'Blood Pressure',lvl:'good', text:`Blood pressure (${bp} mmHg diastolic) is healthy. Keep it up with regular aerobic activity and a low-sodium diet.`});

    if (bmi >= 30)     tips.push({icon:'⚖️',cat:'BMI',lvl:'high', text:`BMI ${bmi.toFixed(1)} is obese (≥30). Even a 5–10% weight reduction significantly lowers diabetes risk. Target a 500 kcal/day deficit through diet and exercise combined.`});
    else if (bmi >= 25)tips.push({icon:'⚖️',cat:'BMI',lvl:'warn', text:`BMI ${bmi.toFixed(1)} is overweight (25–29.9). Focus on portion control, increase fibre intake, and add 30 min of brisk walking daily to reach a healthy BMI of 18.5–24.9.`});
    else               tips.push({icon:'⚖️',cat:'BMI',lvl:'good', text:`BMI ${bmi.toFixed(1)} is in the healthy range (18.5–24.9). Maintain it with regular physical activity and a nutrient-dense, balanced diet.`});

    if (ins > 166)     tips.push({icon:'💉',cat:'Insulin',lvl:'high', text:`Insulin ${ins} μU/mL is very high, strongly suggesting insulin resistance. Avoid high-glycaemic foods, increase physical activity, and discuss treatment options with your doctor.`});
    else if (ins > 25) tips.push({icon:'💉',cat:'Insulin',lvl:'warn', text:`Insulin ${ins} μU/mL is above the normal fasting range (2–25 μU/mL). Reduce refined carbs, increase soluble fibre (oats, legumes, vegetables), and exercise regularly.`});
    else if (ins > 0)  tips.push({icon:'💉',cat:'Insulin',lvl:'good', text:`Insulin ${ins} μU/mL is within the normal fasting range. Maintain insulin sensitivity with regular exercise and a low-glycaemic diet.`});

    if (sk >= 35)      tips.push({icon:'📏',cat:'Body Fat',lvl:'warn', text:`Triceps skinfold ${sk} mm suggests higher body fat. Add strength training 2–3×/week alongside cardio — muscle mass improves insulin sensitivity and glucose uptake.`});
    if (age >= 45)     tips.push({icon:'🎂',cat:'Age Risk',lvl:'warn', text:`At age ${age}, diabetes risk increases. The ADA recommends screening every 3 years from age 45. Annual HbA1c checks are advisable if you have additional risk factors.`});
    if (preg >= 4)     tips.push({icon:'🤰',cat:'Pregnancy History',lvl:'warn', text:`${preg} pregnancies raises gestational diabetes history risk. Maintain a healthy weight, monitor glucose regularly, and discuss screening frequency with your doctor.`});

    if (isPositive) {
        tips.push({icon:'🥗',cat:'Diet Plan',lvl:'action', text:'Follow a diabetes-friendly plate: ½ non-starchy vegetables, ¼ lean protein, ¼ whole grains. Avoid sugary beverages entirely. Limit total carbs to 45–60 g per meal (ADA recommendation).'});
        tips.push({icon:'🏃',cat:'Exercise',lvl:'action', text:'ADA recommends 150 min/week of moderate aerobic activity plus 2 resistance training sessions. Start with 10-min walks after each meal — this alone reduces post-meal glucose spikes.'});
        tips.push({icon:'🩺',cat:'See a Doctor',lvl:'action', text:'Schedule an HbA1c test. HbA1c ≥6.5% confirms diabetes. Early treatment prevents complications: neuropathy, retinopathy, nephropathy, and cardiovascular disease.'});
    } else {
        tips.push({icon:'🥗',cat:'Prevention Diet',lvl:'action', text:'The Mediterranean diet reduces diabetes risk by up to 30% (NEJM study). Focus on olive oil, fish, legumes, whole grains, fruits, and vegetables. Limit red meat and processed foods.'});
        tips.push({icon:'🏃',cat:'Stay Active',lvl:'action', text:'Regular physical activity improves insulin sensitivity. Aim for 30 min of moderate exercise 5 days/week. Even daily walking significantly reduces long-term diabetes risk.'});
    }
    return tips;
}

function renderTips(tips) {
    const colors = {high:'#ef4444',warn:'#f59e0b',good:'#10b981',action:'#6366f1'};
    const labels = {high:'High Risk',warn:'Caution',good:'Healthy',action:'Action'};
    return tips.map(t => {
        const c = colors[t.lvl]||'#6366f1', l = labels[t.lvl]||'Tip';
        return `<div class="tip-card" style="border-left-color:${c}">
            <div class="tip-header">
                <span class="tip-icon">${t.icon}</span>
                <span class="tip-cat">${t.cat}</span>
                <span class="tip-badge" style="background:${c}22;color:${c}">${l}</span>
            </div>
            <p class="tip-text">${t.text}</p>
        </div>`;
    }).join('');
}

function displayResult(r) {
    const pos = r.prediction === 1;
    const cls = pos ? 'positive' : 'negative';
    const emoji = pos ? '⚠️' : '✅';
    const title = r.prediction_text || (pos ? 'Diabetes Detected' : 'No Diabetes Detected');
    const sub = pos ? 'Your health data indicates elevated diabetes risk.' : 'Your health data shows no significant diabetes risk.';
    const name = r.patient_name || '';
    const nameDisplay = name ? `<span style="font-size:15px;font-weight:500;opacity:.8;display:block;margin-bottom:6px;">Patient: <strong>${name}</strong></span>` : '';
    const now = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});

    let confHTML = '';
    if (r.confidence != null) {
        const pct = Math.round(r.confidence);
        confHTML = `<div class="confidence-block">
            <div class="confidence-header"><span class="confidence-label">Model Confidence</span><span class="confidence-value">${pct}%</span></div>
            <div class="confidence-bar"><div class="confidence-fill" id="confFill" style="width:0%"></div></div>
        </div>`;
    }

    const tipsHTML = r.inputs ? `<div class="tips-section">
        <div class="tips-header">
            <span class="tips-icon">💡</span>
            <div><h3 class="tips-title">Personalised Health Tips</h3><p class="tips-sub">Based on your submitted health values</p></div>
        </div>
        <div class="tips-grid">${renderTips(buildTips(r.inputs, pos))}</div>
    </div>` : '';

    const printHeader = `<div class="print-header" style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6366f1;">
        <h1 style="font-size:22px;font-weight:800;color:#6366f1;margin-bottom:4px;">DiAInsight — Diabetes Risk Report</h1>
        <p style="font-size:13px;color:#555;">Patient: <strong>${name}</strong> &nbsp;|&nbsp; Date: ${now}</p>
    </div>`;

    document.getElementById('result').innerHTML = `
        ${printHeader}
        <div class="result-card ${cls}">
            ${nameDisplay}
            <span class="result-emoji">${emoji}</span>
            <h2 class="result-title">${title}</h2>
            <p class="result-subtitle">${sub}</p>
            ${confHTML}
            <div class="result-disclaimer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span><strong>Important:</strong> For educational purposes only — not a medical diagnosis. Consult a qualified healthcare professional.</span>
            </div>
        </div>${tipsHTML}`;

    hideError();
    document.getElementById('predictionForm').closest('.form-card').style.display = 'none';
    const rs = document.getElementById('resultSection');
    rs.classList.remove('hidden');
    rs.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (r.confidence != null) {
        requestAnimationFrame(() => setTimeout(() => {
            const f = document.getElementById('confFill');
            if (f) f.style.width = Math.round(r.confidence) + '%';
        }, 120));
    }
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('errorSection').classList.add('hidden');
}
function hideLoading() { document.getElementById('loading').classList.add('hidden'); }

function showError(msg) {
    document.getElementById('errorMessage').textContent = msg;
    document.getElementById('errorSection').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('errorSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideError() { document.getElementById('errorSection').classList.add('hidden'); }

function resetForm() {
    const form = document.getElementById('predictionForm');
    form.reset();
    form.querySelectorAll('input').forEach(i => i.classList.remove('error'));
    ['resultSection','errorSection','loading'].forEach(id => document.getElementById(id).classList.add('hidden'));
    const fc = form.closest('.form-card');
    if (fc) { fc.style.display = ''; fc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function clearForm() {
    const form = document.getElementById('predictionForm');
    form.reset();
    form.querySelectorAll('input').forEach(i => i.classList.remove('error'));
    hideError();
}

function initTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggle');
    if (localStorage.getItem('dp-theme') === 'light') html.classList.add('light');
    if (btn) btn.addEventListener('click', () => {
        html.classList.toggle('light');
        localStorage.setItem('dp-theme', html.classList.contains('light') ? 'light' : 'dark');
    });
}

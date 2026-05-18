# API উদাহরণ এবং পরীক্ষা গাইড

আপনার ডায়াবেটিস প্রেডিকশন API এর সাথে কীভাবে কাজ করতে হয় তার বিস্তারিত উদাহরণ।

## এপিআই এন্ডপয়েন্ট সারাংশ

| মেথড | URL | উদ্দেশ্য | প্যারামিটার |
|--------|-----|---------|----------|
| `GET` | `/` | HTML পেজ রেন্ডার করে | কোনো নেই |
| `POST` | `/predict` | পূর্বাভাস দেয় | JSON বডিতে 8টি ফিচার |
| `GET` | `/info` | মডেল তথ্য রিটার্ন করে | কোনো নেই |

---

## 1. পূর্বাভাস এপিআই (`POST /predict`)

### এপিআই বিবরণ

**URL:** `/predict`  
**মেথড:** `POST`  
**কন্টেন্ট টাইপ:** `application/json`

### রিকোয়েস্ট ফর্ম্যাট

```json
{
  "pregnancies": <সংখ্যা>,      // গর্ভধারণের সংখ্যা (0-17)
  "glucose": <সংখ্যা>,           // ফাস্টিং ব্লাড গ্লুকোজ (0-200)
  "blood_pressure": <সংখ্যা>,    // ডায়াস্টোলিক ব্লাড প্রেশার (0-122)
  "skin_thickness": <সংখ্যা>,    // ত্রিসেপস ত্বক ফোল্ড পুরুত্ব (0-99)
  "insulin": <সংখ্যা>,           // ২-ঘণ্টা সিরাম ইনসুলিন (0-846)
  "bmi": <সংখ্যা>,               // বডি মাস ইন্ডেক্স (0-67.1)
  "diabetes_pedigree": <সংখ্যা>, // পারিবারিক ইতিহাস স্কোর (0-2.42)
  "age": <সংখ্যা>                // বছরে বয়স (21-81)
}
```

### প্রতিক্রিয়া ফর্ম্যাট

#### সফল পূর্বাভাস (HTTP 200):
```json
{
  "prediction": 1,
  "prediction_text": "ডায়াবেটিস আছে",
  "confidence": 87.5
}
```

#### ত্রুটি প্রতিক্রিয়া (HTTP 400):
```json
{
  "error": "ত্রুটি বার্তা"
}
```

---

## 2. উদাহরণ রিকোয়েস্ট

### উদাহরণ 1: ডায়াবেটিস ঝুঁকিতে সম্ভাব্য ব্যক্তি

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 6,
    "glucose": 148,
    "blood_pressure": 72,
    "skin_thickness": 35,
    "insulin": 0,
    "bmi": 33.6,
    "diabetes_pedigree": 0.627,
    "age": 50
  }'
```

**প্রত্যাশিত প্রতিক্রিয়া:**
```json
{
  "prediction": 1,
  "prediction_text": "ডায়াবেটিস আছে",
  "confidence": 85.2
}
```

### উদাহরণ 2: স্বাস্থ্যকর ব্যক্তি

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 1,
    "glucose": 85,
    "blood_pressure": 66,
    "skin_thickness": 29,
    "insulin": 0,
    "bmi": 26.6,
    "diabetes_pedigree": 0.351,
    "age": 31
  }'
```

**প্রত্যাশিত প্রতিক্রিয়া:**
```json
{
  "prediction": 0,
  "prediction_text": "ডায়াবেটিস নেই",
  "confidence": 92.1
}
```

### উদাহরণ 3: সীমান্তরেখা কেস

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 2,
    "glucose": 120,
    "blood_pressure": 70,
    "skin_thickness": 28,
    "insulin": 100,
    "bmi": 27.5,
    "diabetes_pedigree": 0.36,
    "age": 45
  }'
```

**প্রত্যাশিত প্রতিক্রিয়া:**
```json
{
  "prediction": 0,
  "prediction_text": "ডায়াবেটিস নেই",
  "confidence": 55.3
}
```

---

## 3. প্রোগ্রামিং ভাষা দ্বারা উদাহরণ

### Python

```python
import requests
import json

# এপিআই এন্ডপয়েন্ট
url = "http://localhost:5000/predict"

# পেশেন্ট ডেটা
patient_data = {
    "pregnancies": 6,
    "glucose": 148,
    "blood_pressure": 72,
    "skin_thickness": 35,
    "insulin": 0,
    "bmi": 33.6,
    "diabetes_pedigree": 0.627,
    "age": 50
}

# API রিকোয়েস্ট পাঠান
response = requests.post(url, json=patient_data)

# প্রতিক্রিয়া প্রসেস করুন
if response.status_code == 200:
    result = response.json()
    print(f"পূর্বাভাস: {result['prediction_text']}")
    print(f"আত্মবিশ্বাস: {result['confidence']}%")
else:
    print(f"ত্রুটি: {response.json()}")
```

### JavaScript (Fetch API)

```javascript
const patientData = {
  pregnancies: 6,
  glucose: 148,
  blood_pressure: 72,
  skin_thickness: 35,
  insulin: 0,
  bmi: 33.6,
  diabetes_pedigree: 0.627,
  age: 50
};

fetch('http://localhost:5000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(patientData)
})
.then(response => response.json())
.then(data => {
  console.log('পূর্বাভাস:', data.prediction_text);
  console.log('আত্মবিশ্বাস:', data.confidence + '%');
})
.catch(error => console.error('ত্রুটি:', error));
```

### cURL

```bash
# বেসিক সিনট্যাক্স
curl -X POST [URL] \
  -H "Content-Type: application/json" \
  -d '[JSON_DATA]'

# সম্পূর্ণ উদাহরণ
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 6,
    "glucose": 148,
    "blood_pressure": 72,
    "skin_thickness": 35,
    "insulin": 0,
    "bmi": 33.6,
    "diabetes_pedigree": 0.627,
    "age": 50
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### PHP

```php
<?php
$data = array(
    'pregnancies' => 6,
    'glucose' => 148,
    'blood_pressure' => 72,
    'skin_thickness' => 35,
    'insulin' => 0,
    'bmi' => 33.6,
    'diabetes_pedigree' => 0.627,
    'age' => 50
);

$options = array(
    'http' => array(
        'header' => "Content-Type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data),
    ),
);

$context = stream_context_create($options);
$response = file_get_contents('http://localhost:5000/predict', false, $context);
$result = json_decode($response, true);

echo "পূর্বাভাস: " . $result['prediction_text'] . "\n";
echo "আত্মবিশ্বাস: " . $result['confidence'] . "%\n";
?>
```

### Node.js (Axios)

```javascript
const axios = require('axios');

const patientData = {
  pregnancies: 6,
  glucose: 148,
  blood_pressure: 72,
  skin_thickness: 35,
  insulin: 0,
  bmi: 33.6,
  diabetes_pedigree: 0.627,
  age: 50
};

axios.post('http://localhost:5000/predict', patientData)
  .then(response => {
    console.log('পূর্বাভাস:', response.data.prediction_text);
    console.log('আত্মবিশ্বাস:', response.data.confidence + '%');
  })
  .catch(error => console.error('ত্রুটি:', error.message));
```

---

## 4. ত্রুটি পরিচালনা

### সাধারণ ত্রুটি এবং সমাধান

#### ত্রুটি 1: অবৈধ JSON

**রিকোয়েস্ট:**
```json
{
  "pregnancies": "six"  // সংখ্যার বদলে স্ট্রিং
}
```

**প্রতিক্রিয়া (HTTP 400):**
```json
{
  "error": "could not convert string to float: 'six'"
}
```

**সমাধান:** সমস্ত মূল্য সংখ্যায় পাঠান

#### ত্রুটি 2: অনুপস্থিত ক্ষেত্র

**রিকোয়েস্ট:**
```json
{
  "pregnancies": 6,
  "glucose": 148
  // অন্যান্য ক্ষেত্র অনুপস্থিত
}
```

**প্রতিক্রিয়া (HTTP 400):**
```json
{
  "error": "'blood_pressure' field is missing"
}
```

**সমাধান:** সমস্ত 8টি ক্ষেত্র অন্তর্ভুক্ত করুন

#### ত্রুটি 3: নেতিবাচক মূল্য

**রিকোয়েস্ট:**
```json
{
  "pregnancies": -5
}
```

**প্রতিক্রিয়া (HTTP 400):**
```json
{
  "error": "Input values must be non-negative"
}
```

**সমাধান:** শুধুমাত্র ইতিবাচক মূল্য ব্যবহার করুন

---

## 5. পরীক্ষা ডেটা সেট

### বিভিন্ন পরিস্থিতির জন্য নমুনা ডেটা

#### পরীক্ষা ডেটা 1 - উচ্চ ঝুঁকি
```json
{
  "pregnancies": 8,
  "glucose": 187,
  "blood_pressure": 70,
  "skin_thickness": 40,
  "insulin": 120,
  "bmi": 36.8,
  "diabetes_pedigree": 0.859,
  "age": 55
}
```
**প্রত্যাশিত ফলাফল:** ডায়াবেটিস আছে (উচ্চ সম্ভাবনা)

#### পরীক্ষা ডেটা 2 - নিম্ন ঝুঁকি
```json
{
  "pregnancies": 0,
  "glucose": 72,
  "blood_pressure": 60,
  "skin_thickness": 20,
  "insulin": 0,
  "bmi": 21.5,
  "diabetes_pedigree": 0.12,
  "age": 25
}
```
**প্রত্যাশিত ফলাফল:** ডায়াবেটিস নেই (উচ্চ সম্ভাবনা)

#### পরীক্ষা ডেটা 3 - মাঝারি ঝুঁকি
```json
{
  "pregnancies": 3,
  "glucose": 110,
  "blood_pressure": 68,
  "skin_thickness": 26,
  "insulin": 50,
  "bmi": 28.2,
  "diabetes_pedigree": 0.32,
  "age": 42
}
```
**প্রত্যাশিত ফলাফল:** অনিশ্চিত (মাঝারি সম্ভাবনা)

---

## 6. অনলাইন টেস্টিং টুল

### Postman এ পরীক্ষা করুন

1. **Postman খুলুন** (যদি না থাকে তাহলে ডাউনলোড করুন: https://www.postman.com/downloads/)
2. **নতুন রিকোয়েস্ট তৈরি করুন**
3. **মেথড:** POST নির্বাচন করুন
4. **URL:** `http://localhost:5000/predict` পেস্ট করুন
5. **Body** ট্যাবে যান
6. **raw** নির্বাচন করুন এবং **JSON** বেছে নিন
7. উপরোক্ত JSON ডেটা পেস্ট করুন
8. **Send** বাটনে ক্লিক করুন

### অনলাইন cURL টেস্টার

- [reqbin.com](https://reqbin.com) তে যান
- POST রিকোয়েস্ট তৈরি করুন
- URL এবং JSON বডি যোগ করুন

---

## 7. ব্যাচ পরীক্ষা করুন

### একাধিক রোগীর পূর্বাভাস দেওয়া

```python
import requests

# একাধিক রোগী
patients = [
    {"pregnancies": 6, "glucose": 148, "blood_pressure": 72, "skin_thickness": 35, "insulin": 0, "bmi": 33.6, "diabetes_pedigree": 0.627, "age": 50},
    {"pregnancies": 1, "glucose": 85, "blood_pressure": 66, "skin_thickness": 29, "insulin": 0, "bmi": 26.6, "diabetes_pedigree": 0.351, "age": 31},
    {"pregnancies": 2, "glucose": 120, "blood_pressure": 70, "skin_thickness": 28, "insulin": 100, "bmi": 27.5, "diabetes_pedigree": 0.36, "age": 45},
]

url = "http://localhost:5000/predict"

for i, patient in enumerate(patients, 1):
    response = requests.post(url, json=patient)
    result = response.json()
    print(f"রোগী {i}: {result['prediction_text']} (আত্মবিশ্বাস: {result['confidence']}%)")
```

**আউটপুট:**
```
রোগী 1: ডায়াবেটিস আছে (আত্মবিশ্বাস: 85.2%)
রোগী 2: ডায়াবেটিস নেই (আত্মবিশ্বাস: 92.1%)
রোগী 3: ডায়াবেটিস নেই (আত্মবিশ্বাস: 60.5%)
```

---

## 8. পারফরম্যান্স বেঞ্চমার্ক

### প্রতিক্রিয়া সময় পরীক্ষা

```bash
# সময় সহ প্রতিক্রিয়া পান
time curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 6,
    "glucose": 148,
    "blood_pressure": 72,
    "skin_thickness": 35,
    "insulin": 0,
    "bmi": 33.6,
    "diabetes_pedigree": 0.627,
    "age": 50
  }'
```

**প্রত্যাশিত:**
- স্থানীয়: < 100ms
- Render: < 500ms

---

## 9. ইন্টিগ্রেশন উদাহরণ

### আপনার অ্যাপ্লিকেশনে এপিআই ব্যবহার করুন

#### দৃশ্যকল্প 1: মোবাইল অ্যাপ

```swift
// Swift (iOS)
let url = URL(string: "https://your-app.onrender.com/predict")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

let data = try JSONEncoder().encode(patientData)
request.httpBody = data

URLSession.shared.dataTask(with: request) { data, response, error in
    let result = try JSONDecoder().decode(PredictionResult.self, from: data!)
    print(result.prediction_text)
}.resume()
```

#### দৃশ্যকল্প 2: ওয়েব অ্যাপ্লিকেশন

```html
<form id="patientForm">
  <input type="number" id="glucose" placeholder="গ্লুকোজ">
  <!-- অন্যান্য ইনপুট -->
  <button type="submit">পূর্বাভাস দিন</button>
</form>

<script>
document.getElementById('patientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const response = await fetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data))
  });
  const result = await response.json();
  alert(result.prediction_text);
});
</script>
```

---

## 10. নিরাপত্তা বিবেচনা

### API ব্যবহারের সময়

```
✅ সর্বদা HTTPS ব্যবহার করুন (Render স্বয়ংক্রিয়ভাবে প্রদান করে)
✅ সংবেদনশীল ডেটা এনক্রিপ্ট করুন
✅ ইনপুট যাচাই করুন ক্লায়েন্ট-সাইডে
✅ হার সীমাবদ্ধতা প্রয়োগ করুন

❌ অপ্রয়োজনীয় ডেটা লগ করবেন না
❌ API কী প্রকাশ করবেন না
❌ প্রোডাকশনে ডিবাগ মোড চালু করবেন না
```

---

**প্রস্তুত আপনার API পরীক্ষা করতে? আরম্ভ করুন উপরোক্ত উদাহরণ দিয়ে! 🚀**

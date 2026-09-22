import requests

url = "http://127.0.0.1:5000/api/analyze"

data = {
    "resume_text": "Python Java SQL machine learning data analysis",
    "jobs": [
        "We are looking for a Python developer with SQL and machine learning skills"
    ]
}

response = requests.post(url, data=data)

print("Status:", response.status_code)
print("Response:")
print(response.json())
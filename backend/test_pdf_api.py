import requests

url = "http://127.0.0.1:5000/api/analyze"

job1 = """
We are looking for a Python Developer with strong Python programming,
SQL, Flask, REST API, Git, and database skills. Knowledge of React,
JavaScript and problem solving is preferred.
"""

job2 = """
We are looking for a Machine Learning Engineer with knowledge of
Python, NumPy, Pandas, Scikit-learn, machine learning, NLP,
data analysis and SQL. Experience with ML projects is preferred.
"""

with open("sample_resume.pdf", "rb") as resume_file:

    files = {
        "resume": resume_file
    }

    data = [
        ("jobs", job1),
        ("jobs", job2)
    ]

    response = requests.post(
        url,
        files=files,
        data=data
    )

print("Status:", response.status_code)
print("Response:")
print(response.json())
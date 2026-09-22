from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from pypdf import PdfReader
# Load spaCy English NLP model
nlp = spacy.load("en_core_web_sm")

# -----------------------------
# SKILL DATABASE
# -----------------------------
SKILLS = [
    # Programming Languages
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "javascript",
    "typescript",
    "go",
    "ruby",
    "php",

    # Web Development
    "html",
    "css",
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "flask",
    "django",
    "rest api",

    # Databases
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "oracle",
    "sqlite",

    # Data Science
    "numpy",
    "pandas",
    "scipy",
    "matplotlib",
    "seaborn",
    "data analysis",
    "data visualization",
    "statistics",
    "excel",
    "power bi",
    "tableau",

    # Machine Learning / AI
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "nlp",
    "natural language processing",
    "computer vision",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "opencv",

    # ML Concepts
    "linear regression",
    "logistic regression",
    "decision tree",
    "random forest",
    "support vector machine",
    "clustering",
    "k-means",
    "neural networks",
    "transformers",
    "generative ai",
    "large language models",

    # Cloud / DevOps
    "aws",
    "azure",
    "google cloud",
    "docker",
    "kubernetes",

    # Development Tools
    "git",
    "github",
    "gitlab",
    "jupyter",
    "vs code",

    # Other
    "data structures",
    "algorithms",
    "object oriented programming",
    "oop",
    "problem solving"
]

def extract_skills(text):
    text = text.lower()

    found_skills = []

    for skill in SKILLS:
        if skill in text:
            found_skills.append(skill)

    return sorted(set(found_skills))
def generate_interview_questions(skills):
    questions = []

    question_bank = {

        "python": [
            "What are the key features of Python?",
            "What is the difference between a list, tuple, set, and dictionary in Python?",
            "What is the difference between mutable and immutable objects in Python?",
            "What are Python functions and how are they defined?",
            "What is exception handling in Python?",
            "What is the difference between a shallow copy and a deep copy?",
            "What are list comprehensions in Python?",
            "What is the difference between a Python module and a package?",
            "How does Python handle memory management?",
            "What are decorators in Python?"
        ],

        "java": [
            "What are the main principles of Object-Oriented Programming in Java?",
            "What is the difference between == and equals() in Java?",
            "What is the difference between a class and an object?",
            "What is inheritance in Java?",
            "What is method overloading and method overriding?",
            "What is encapsulation in Java?",
            "What is abstraction in Java?",
            "What is the difference between an interface and an abstract class?",
            "What are constructors in Java?",
            "What is exception handling in Java?"
        ],

        "sql": [
            "What is the difference between WHERE and HAVING in SQL?",
            "Explain the different types of SQL JOINs.",
            "What is a primary key?",
            "What is a foreign key?",
            "What is the difference between DELETE, DROP, and TRUNCATE?",
            "What is normalization in databases?",
            "What is a subquery in SQL?",
            "What is the difference between GROUP BY and ORDER BY?",
            "What are aggregate functions in SQL?",
            "What is an index and why is it used?"
        ],

        "machine learning": [
            "What is machine learning?",
            "What is the difference between supervised and unsupervised learning?",
            "What is overfitting and how can you prevent it?",
            "What is underfitting?",
            "What is the difference between classification and regression?",
            "What is a training dataset and a testing dataset?",
            "What is cross-validation?",
            "What is feature engineering?",
            "What is the purpose of a confusion matrix?",
            "What is hyperparameter tuning?"
        ],

        "nlp": [
            "What are the main steps in a Natural Language Processing pipeline?",
            "What is the difference between stemming and lemmatization?",
            "What is tokenization?",
            "What are stop words?",
            "What is text preprocessing?",
            "What is TF-IDF?",
            "What is sentiment analysis?",
            "What is named entity recognition?",
            "What is cosine similarity in NLP?",
            "What are word embeddings?"
        ],

        "numpy": [
            "What is NumPy and why is it used in machine learning?",
            "What is the difference between a NumPy array and a Python list?",
            "What are the dimensions of a NumPy array?",
            "What is the shape of a NumPy array?",
            "How do you create a NumPy array?",
            "What is array slicing in NumPy?",
            "How do you reshape a NumPy array?",
            "What is broadcasting in NumPy?",
            "How can you perform mathematical operations on NumPy arrays?",
            "How do you find the mean, maximum, and minimum of an array?"
        ],

        "pandas": [
            "What is Pandas used for in data analysis?",
            "How would you handle missing values using Pandas?",
            "What is a Pandas DataFrame?",
            "What is a Pandas Series?",
            "How do you read a CSV file using Pandas?",
            "How do you filter rows in a DataFrame?",
            "What is the difference between loc and iloc?",
            "How do you remove duplicate values in Pandas?",
            "How do you group data using groupby()?",
            "How do you merge two DataFrames?"
        ],

        "scikit-learn": [
            "What is Scikit-learn and what are some algorithms it provides?",
            "How do you split a dataset into training and testing data?",
            "What is StandardScaler in Scikit-learn?",
            "What is a pipeline in Scikit-learn?",
            "How do you train a machine learning model using Scikit-learn?",
            "How do you evaluate a classification model?",
            "What is GridSearchCV?",
            "What is RandomizedSearchCV?",
            "How do you handle categorical features in Scikit-learn?",
            "How do you save a trained Scikit-learn model?"
        ],

        "data analysis": [
            "What are the main steps involved in data analysis?",
            "How do you identify and handle missing or inconsistent data?",
            "What is Exploratory Data Analysis?",
            "What is data cleaning?",
            "What is the difference between structured and unstructured data?",
            "How do you identify outliers in a dataset?",
            "What is data visualization?",
            "Why are descriptive statistics important?",
            "How do you identify relationships between variables?",
            "What tools can be used for data analysis?"
        ],

        "flask": [
            "What is Flask and why is it used in Python web development?",
            "How do you create a REST API using Flask?",
            "What is a Flask route?",
            "What is the purpose of jsonify() in Flask?",
            "How do you handle POST requests in Flask?",
            "How do you receive JSON data in Flask?",
            "What is Flask-CORS?",
            "How can Flask connect with a database?",
            "How do you handle errors in a Flask application?",
            "How can a Flask application be deployed?"
        ],

        "react": [
            "What is React and what are its main advantages?",
            "What is the difference between props and state in React?",
            "What are React components?",
            "What is JSX?",
            "What is the useState hook?",
            "What is the useEffect hook?",
            "How do you handle events in React?",
            "How do you render lists in React?",
            "What is conditional rendering?",
            "How does React communicate with a backend API?"
        ],

        "javascript": [
            "What is the difference between let, const, and var?",
            "What is the difference between == and === in JavaScript?",
            "What are JavaScript functions?",
            "What is an arrow function?",
            "What is the DOM?",
            "What are promises in JavaScript?",
            "What is async/await?",
            "What is an array in JavaScript?",
            "What is the difference between null and undefined?",
            "What is event handling in JavaScript?"
        ],

        "git": [
            "What is Git and why is it used in software development?",
            "What is the difference between git pull and git fetch?",
            "What is a Git repository?",
            "What is a Git commit?",
            "What is a Git branch?",
            "How do you create a new branch?",
            "What is a merge conflict?",
            "How do you resolve a merge conflict?",
            "What is the difference between git merge and git rebase?",
            "How do you push code to GitHub?"
        ]
    }

    # Add questions based on matched skills
    for skill in skills:
        if skill in question_bank:
            questions.extend(question_bank[skill])

    # Remove duplicate questions
    questions = list(dict.fromkeys(questions))

    # Guarantee at least 10 questions
    fallback_questions = [
        "Explain a project where you used the skills required for this job.",
        "How would you approach solving a new technical problem?",
        "How do you debug an error in your code?",
        "How do you test your solution before deployment?",
        "How do you improve the performance of an application?",
        "How do you keep your technical skills up to date?",
        "Describe a challenging technical problem you solved.",
        "How would you explain your technical solution to a non-technical person?",
        "What development practices do you follow when writing code?",
        "How would you design a solution for a real-world problem?"
    ]

    for question in fallback_questions:
        if question not in questions:
            questions.append(question)

        if len(questions) >= 10:
            break

    return questions[:10]

app = Flask(__name__)
CORS(app)


# -----------------------------
# NLP PREPROCESSING
# -----------------------------
def preprocess_text(text):
    doc = nlp(text.lower())

    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and token.is_alpha
    ]

    return " ".join(tokens)


# -----------------------------
# PDF TEXT EXTRACTION
# -----------------------------
def extract_pdf_text(file):
    reader = PdfReader(file)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# -----------------------------
# ANALYZE RESUME + JOBS
# -----------------------------
@app.route("/api/analyze", methods=["POST"])
def analyze():

    resume_text = request.form.get("resume_text", "")
    job_descriptions = request.form.getlist("jobs")

    # Check resume PDF
    resume_file = request.files.get("resume")

    if resume_file:
        resume_text = extract_pdf_text(resume_file)

    # Validation
    if not resume_text.strip():
        return jsonify({
        "error": "Resume is required"
    }), 400

    if not job_descriptions:
        return jsonify({
            "error": "At least one Job Description is required"
    }), 400

    # -----------------------------
    # NLP PROCESSING
    # -----------------------------

    clean_resume = preprocess_text(resume_text)

    resume_skills = extract_skills(resume_text)

    clean_jobs = [
        preprocess_text(job)
        for job in job_descriptions
    ]

    # Combine documents
    documents = [clean_resume] + clean_jobs

    # TF-IDF
    vectorizer = TfidfVectorizer()

    tfidf_matrix = vectorizer.fit_transform(documents)

    # Cosine similarity
    similarities = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:]
    ).flatten()

    # -----------------------------
    # RESULTS
    # -----------------------------

    results = []

    for i, score in enumerate(similarities):

        job_skills = extract_skills(job_descriptions[i])

        matched_skills = [
            skill for skill in job_skills
            if skill in resume_skills
        ]

        missing_skills = [
            skill for skill in job_skills
            if skill not in resume_skills
        ]

        # Calculate skill match percentage
        if len(job_skills) > 0:
            skill_score = (
                len(matched_skills) / len(job_skills)
            ) * 100
        else:
            skill_score = 0

        # TF-IDF text similarity percentage
        text_score = float(score * 100)

        # Hybrid final score
        final_score = (
            (skill_score * 0.60) +
            (text_score * 0.40)
        )

        results.append({
            "job_index": i + 1,
            "match_score": round(final_score, 2),
            "skill_match": round(skill_score, 2),
            "text_similarity": round(text_score, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        })

       # -----------------------------
    # GENERATE INTERVIEW QUESTIONS
    # FOR EACH JOB
    # -----------------------------

    for result in results:

        result["interview_questions"] = generate_interview_questions(
            result["matched_skills"]
        )

    # Highest match
    best_job = max(
        results,
        key=lambda x: x["match_score"]
    )

    return jsonify({
        "results": results,
        "best_match": best_job
    })


# -----------------------------
# TEST ROUTE
# -----------------------------
@app.route("/")
def home():
    return jsonify({
        "message": "AI Resume Analyzer Backend is running!"
    })


# -----------------------------
# START SERVER
# -----------------------------
if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from pypdf import PdfReader
import os
import re
import json

# Load spaCy English NLP model
nlp = spacy.load("en_core_web_sm")


# =========================================================
# SKILL DATABASE
# =========================================================

SKILLS = [
    # Programming Languages
    "python", "java", "c", "c++", "c#", "javascript",
    "typescript", "go", "ruby", "php",

    # Web Development
    "html", "css", "react", "angular", "vue", "node.js",
    "express", "flask", "django", "rest api",

    # Databases
    "sql", "mysql", "postgresql", "mongodb", "oracle", "sqlite",

    # Data Science
    "numpy", "pandas", "scipy", "matplotlib", "seaborn",
    "data analysis", "data visualization", "statistics",
    "excel", "power bi", "tableau",

    # Machine Learning / AI
    "machine learning", "deep learning", "artificial intelligence",
    "nlp", "natural language processing", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "opencv",

    # ML Concepts
    "linear regression", "logistic regression", "decision tree",
    "random forest", "support vector machine", "clustering",
    "k-means", "neural networks", "transformers",
    "generative ai", "large language models",

    # Cloud / DevOps
    "aws", "azure", "google cloud", "docker", "kubernetes",

    # Development Tools
    "git", "github", "gitlab", "jupyter", "vs code",

    # Other
    "data structures", "algorithms",
    "object oriented programming", "oop", "problem solving"
]


# =========================================================
# SKILL EXTRACTION
# =========================================================

def extract_skills(text):
    text = text.lower()

    found_skills = []

    for skill in SKILLS:

        # Special handling for C
        # Prevents detecting "c" inside words such as:
        # cybersecurity, academic, etc.
        if skill == "c":
            if re.search(r"(?<![a-z0-9])c(?![a-z0-9])", text):
                found_skills.append(skill)

        else:
            pattern = (
                r"(?<![a-z0-9])"
                + re.escape(skill)
                + r"(?![a-z0-9])"
            )

            if re.search(pattern, text):
                found_skills.append(skill)

    return sorted(set(found_skills))


# =========================================================
# GEMINI AI
# =========================================================

GEMINI_MODEL = "gemini-3.8-flash"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

try:
    from google import genai

    gemini_client = (
        genai.Client(api_key=GEMINI_API_KEY)
        if GEMINI_API_KEY
        else None
    )

except Exception:
    gemini_client = None


# =========================================================
# FALLBACK AI CONTENT
# =========================================================

def fallback_ai_content(
    resume_text,
    job_description,
    matched_skills,
    missing_skills
):

    matched = matched_skills[:]
    missing = missing_skills[:]

    questions = []

    # Questions based on matched skills
    for skill in matched[:4]:
        questions.append(
            f"How have you used {skill} in your projects or coursework?"
        )

    # Questions based on missing skills
    for skill in missing[:3]:
        questions.append(
            f"What do you understand about {skill}, and how would you apply it in this role?"
        )

    # Job-specific questions
    questions.extend([
        "Describe a project from your resume that is most relevant to this role.",
        "How would you approach a technical problem related to this job?",
        "Describe a situation where you had to debug or improve a solution.",
        "How would you test your solution before delivering it?",
        "Why are you interested in this particular role?"
    ])

    # Remove duplicates
    questions = list(dict.fromkeys(questions))

    fallback_questions = [
        "Explain how you would learn a new technology required for this role.",
        "Describe a technical challenge you faced and how you solved it.",
        "How would you explain your technical solution to a non-technical person?",
        "What would you do if your first approach to a problem did not work?"
    ]

    for question in fallback_questions:

        if len(questions) >= 10:
            break

        if question not in questions:
            questions.append(question)

    suggestions = []

    if matched:
        suggestions.append(
            "Highlight your experience with "
            + ", ".join(matched[:4])
            + " in the skills and project sections."
        )

    if missing:
        suggestions.append(
            "If you genuinely have experience with "
            + ", ".join(missing[:4])
            + ", add it clearly to your resume; otherwise, consider developing these skills."
        )

    suggestions.extend([
        "Describe projects using clear actions, technologies, and measurable results where possible.",
        "Keep the resume focused on experience that is relevant to this specific job.",
        "Add links to relevant projects or GitHub repositories if available."
    ])

    project_suggestion = (
        "Highlight the project from your resume that most closely demonstrates "
        + (
            ", ".join(matched[:3])
            if matched
            else "the requirements of this role"
        )
        + "."
    )

    return {
        "interview_questions": questions[:10],
        "resume_suggestions": suggestions[:5],
        "project_suggestion": project_suggestion
    }


# =========================================================
# GEMINI CONTENT GENERATOR
# =========================================================

def generate_ai_content(
    resume_text,
    job_description,
    matched_skills,
    missing_skills
):

    # If Gemini is unavailable, use fallback
    if gemini_client is None:

        return fallback_ai_content(
            resume_text,
            job_description,
            matched_skills,
            missing_skills
        )

    prompt = f"""
You are an expert technical recruiter and interview coach.

Analyze THIS candidate for THIS SPECIFIC job.

CANDIDATE RESUME:
{resume_text[:12000]}

JOB DESCRIPTION:
{job_description[:10000]}

MATCHED SKILLS:
{", ".join(matched_skills) if matched_skills else "None"}

MISSING SKILLS:
{", ".join(missing_skills) if missing_skills else "None"}

Generate exactly:

1. 10 interview questions
2. 5 resume improvement suggestions
3. 1 project suggestion

INTERVIEW QUESTION RULES:

- Make the questions specific to THIS job description.
- Do not use generic questions when the JD provides enough detail.
- Include questions based on important technologies and skills in the JD.
- Include questions based on the candidate's actual resume and projects.
- Include 2 scenario-based questions relevant to this role.
- Include 1 or 2 behavioral questions relevant to this role.
- If a skill is missing from the resume, you may ask a question that tests that skill.
- Never claim the candidate has a skill that is only present in the JD.
- Do not repeat questions.

RESUME SUGGESTION RULES:

- Make every suggestion specific to THIS job.
- Tell the candidate which genuine matched skills or projects to highlight.
- Identify useful missing skills to develop or add only if genuinely possessed.
- Suggest relevant resume content, keywords, project emphasis, or measurable results.
- Never tell the candidate to falsely claim a skill or experience.
- Do not give the same generic suggestions for every job.

PROJECT SUGGESTION:

- Suggest which type of existing project from the resume should be emphasized for THIS job.
- Do not invent a project the candidate did not mention.

Return ONLY valid JSON in this exact structure:

{{
  "interview_questions": [
    "question 1",
    "question 2",
    "question 3",
    "question 4",
    "question 5",
    "question 6",
    "question 7",
    "question 8",
    "question 9",
    "question 10"
  ],
  "resume_suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3",
    "suggestion 4",
    "suggestion 5"
  ],
  "project_suggestion": "one concise project suggestion"
}}
"""

    try:

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )

        raw = (response.text or "").strip()

        # Remove Markdown code fences if Gemini adds them
        if raw.startswith("```"):

            raw = re.sub(
                r"^```(?:json)?\s*",
                "",
                raw
            )

            raw = re.sub(
                r"\s*```$",
                "",
                raw
            )

        data = json.loads(raw)

        questions = data.get(
            "interview_questions",
            []
        )

        suggestions = data.get(
            "resume_suggestions",
            []
        )

        project_suggestion = data.get(
            "project_suggestion",
            ""
        )

        questions = [
            str(q).strip()
            for q in questions
            if str(q).strip()
        ][:10]

        suggestions = [
            str(s).strip()
            for s in suggestions
            if str(s).strip()
        ][:5]

        if (
            len(questions) < 10
            or not suggestions
            or not project_suggestion
        ):
            raise ValueError(
                "Gemini returned incomplete analysis"
            )

        return {
            "interview_questions": questions,
            "resume_suggestions": suggestions,
            "project_suggestion": str(
                project_suggestion
            ).strip()
        }

    except Exception as e:

        print(
            "Gemini generation failed:",
            e
        )

        return fallback_ai_content(
            resume_text,
            job_description,
            matched_skills,
            missing_skills
        )


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

CORS(app)


# =========================================================
# NLP PREPROCESSING
# =========================================================

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


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_text(file):

    reader = PdfReader(file)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# =========================================================
# ANALYZE RESUME + JOBS
# =========================================================

@app.route("/api/analyze", methods=["POST"])
def analyze():

    resume_text = request.form.get(
        "resume_text",
        ""
    )

    job_descriptions = request.form.getlist(
        "jobs"
    )

    # Resume PDF
    resume_file = request.files.get(
        "resume"
    )

    if resume_file:

        resume_text = extract_pdf_text(
            resume_file
        )

    # Validate resume
    if not resume_text.strip():

        return jsonify({
            "error": "Resume is required"
        }), 400

    # Validate jobs
    if not job_descriptions:

        return jsonify({
            "error": "At least one Job Description is required"
        }), 400

    # =====================================================
    # NLP PROCESSING
    # =====================================================

    clean_resume = preprocess_text(
        resume_text
    )

    resume_skills = extract_skills(
        resume_text
    )

    clean_jobs = [
        preprocess_text(job)
        for job in job_descriptions
    ]

    # Combine resume + JDs
    documents = [
        clean_resume
    ] + clean_jobs

    # TF-IDF
    vectorizer = TfidfVectorizer()

    tfidf_matrix = vectorizer.fit_transform(
        documents
    )

    # Cosine similarity
    similarities = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:]
    ).flatten()

    # =====================================================
    # RESULTS
    # =====================================================

    results = []

    for i, score in enumerate(similarities):

        job_skills = extract_skills(
            job_descriptions[i]
        )

        matched_skills = [
            skill
            for skill in job_skills
            if skill in resume_skills
        ]

        missing_skills = [
            skill
            for skill in job_skills
            if skill not in resume_skills
        ]

        # Skill match percentage
        if len(job_skills) > 0:

            skill_score = (
                len(matched_skills)
                / len(job_skills)
            ) * 100

        else:

            skill_score = 0

        # TF-IDF similarity
        text_score = float(
            score * 100
        )

        # Final score
        final_score = (
            (skill_score * 0.60)
            + (text_score * 0.40)
        )

        results.append({

            "job_index": i + 1,

            "match_score": round(
                final_score,
                2
            ),

            "skill_match": round(
                skill_score,
                2
            ),

            "text_similarity": round(
                text_score,
                2
            ),

            "matched_skills":
                matched_skills,

            "missing_skills":
                missing_skills
        })

    # =====================================================
    # AI CONTENT FOR EACH JOB
    # =====================================================

    for result in results:

        job_index = (
            result["job_index"] - 1
        )

        ai_content = generate_ai_content(

            resume_text,

            job_descriptions[
                job_index
            ],

            result[
                "matched_skills"
            ],

            result[
                "missing_skills"
            ]
        )

        result[
            "interview_questions"
        ] = ai_content[
            "interview_questions"
        ]

        result[
            "resume_suggestions"
        ] = ai_content[
            "resume_suggestions"
        ]

        result[
            "project_suggestion"
        ] = ai_content[
            "project_suggestion"
        ]

    # =====================================================
    # BEST MATCH
    # =====================================================

    best_job = max(
        results,
        key=lambda x: x["match_score"]
    )

    return jsonify({

        "results":
            results,

        "best_match":
            best_job
    })


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/")
def home():

    return jsonify({
        "message":
            "AI Resume Analyzer Backend is running!"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )

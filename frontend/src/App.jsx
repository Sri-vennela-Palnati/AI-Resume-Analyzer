import { useState } from "react";

/* =====================================================
   STATIC TEMPLATES (frontend-only "smart" content)
   These are NOT derived from real NLP analysis of the
   resume — they're keyword-matched templates based on
   the job title. Good enough for a polished UI, but if
   you want these to reflect the *actual* resume text,
   the backend needs to return that data instead.
===================================================== */

const PROJECT_HINTS = [
  { keywords: ["nlp", "language"], text: "Projects involving NLP, text classification, sentiment analysis, or chatbot development." },
  { keywords: ["machine learning", "ml engineer", "ai"], text: "Projects involving model training, evaluation, or deployment pipelines." },
  { keywords: ["data analyst", "data scientist", "data"], text: "Projects involving data cleaning, analysis, dashboards, or visualization." },
  { keywords: ["python", "backend", "developer"], text: "Projects involving Python, APIs, data processing or machine learning." },
];

const DEFAULT_PROJECT_HINT =
  "Projects that clearly demonstrate hands-on experience relevant to this role.";

function getProjectHint(jobTitle) {
  const title = (jobTitle || "").toLowerCase();
  const match = PROJECT_HINTS.find((hint) =>
    hint.keywords.some((kw) => title.includes(kw))
  );
  return match ? match.text : DEFAULT_PROJECT_HINT;
}

const RESUME_SUGGESTION_TEMPLATES = [
  'Quantify project results where possible (e.g., "processed 50,000+ records").',
  "Clearly mention technologies used in each project description.",
  "Add Git/GitHub links if available.",
  "Describe the dataset and evaluation approach for any data-related projects.",
];

/* =====================================================
   HELPER: build a "Why This Score?" explanation
   Built entirely from matched_skills / missing_skills
   that the backend already returns — this part reflects
   real data, just phrased as a sentence.
===================================================== */

function buildWhyScoreText(jobTitle, result) {
  const matched = result.matched_skills || [];
  const missing = result.missing_skills || [];

  const matchedPhrase =
    matched.length > 0
      ? matched.slice(0, 4).join(", ")
      : "the core skills listed for this role";

  if (missing.length === 0) {
    return `Your resume strongly matches the requirements for ${jobTitle}, covering ${matchedPhrase}. No key skills appear to be missing.`;
  }

  const missingPhrase = missing.slice(0, 3).join(", ");
  const verb = missing.length === 1 ? "is" : "are";

  return `Your resume shows strong alignment with ${jobTitle} through skills like ${matchedPhrase}. The score is reduced because ${missingPhrase} ${verb} not clearly demonstrated in your resume.`;
}

/* =====================================================
   HELPER: aggregate summary stats across all job results
   (all real data — no fabrication)
===================================================== */

function computeSummary(resultsData, getJobTitle) {
  if (!resultsData || !resultsData.results) return null;

  const jobResults = resultsData.results;

  const matchedSet = new Set();
  const missingSet = new Set();

  jobResults.forEach((r) => {
    (r.matched_skills || []).forEach((s) => matchedSet.add(s));
    (r.missing_skills || []).forEach((s) => missingSet.add(s));
  });

  const best = resultsData.best_match;

  return {
    bestMatchTitle: best ? getJobTitle(best.job_index) : "-",
    bestMatchScore: best ? best.match_score : 0,
    jobsAnalyzed: jobResults.length,
    skillsMatched: matchedSet.size,
    skillsMissing: missingSet.size,
  };
}

/* =====================================================
   SUB-COMPONENT: Summary cards row
===================================================== */

function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div style={styles.summaryGrid}>
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Best Match</div>
        <div style={styles.summaryValueLarge}>{summary.bestMatchTitle}</div>
        <div style={styles.summarySubtext}>{summary.bestMatchScore}% Match</div>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Jobs Analyzed</div>
        <div style={styles.summaryValue}>{summary.jobsAnalyzed}</div>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Skills Matched</div>
        <div style={{ ...styles.summaryValue, color: "#16a34a" }}>
          {summary.skillsMatched}
        </div>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Skills Missing</div>
        <div style={{ ...styles.summaryValue, color: "#dc2626" }}>
          {summary.skillsMissing}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SUB-COMPONENT: Compare Your Job Matches table
===================================================== */

function CompareTable({ resultsData, getJobTitle }) {
  if (!resultsData || !resultsData.results) return null;

  return (
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>Compare Your Job Matches</h2>
      <p style={styles.smallText}>
        Side-by-side comparison across all analyzed jobs.
      </p>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Job</th>
              <th style={styles.th}>Match Score</th>
              <th style={styles.th}>Skill Match</th>
              <th style={styles.th}>Missing Skills</th>
            </tr>
          </thead>
          <tbody>
            {resultsData.results.map((r) => (
              <tr key={r.job_index}>
                <td style={styles.td}>{getJobTitle(r.job_index)}</td>
                <td style={styles.td}>
                  <span style={styles.scorePill}>{r.match_score}%</span>
                </td>
                <td style={styles.td}>{r.skill_match}%</td>
                <td style={styles.td}>{(r.missing_skills || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =====================================================
   SUB-COMPONENT: Skills to Highlight / Develop
   + Projects to Highlight + Resume Content Suggestions
===================================================== */

function ImprovementSection({ jobTitle, jobIndex, result }) {
  const highlightSkills = (result.matched_skills || []).slice(0, 4);
  const developSkills = (result.missing_skills || []).slice(0, 3);

  return (
    <div style={styles.improvementCard}>
      <div style={styles.improvementHeader}>
        <span style={styles.jobBadge}>For Job {jobIndex}</span>
        <h3 style={{ margin: 0 }}>{jobTitle}</h3>
      </div>

      <div style={styles.improvementRow}>
        <div style={styles.highlightBox}>
          <div style={styles.improvementBoxTitle}>📈 Skills to Highlight</div>
          <div style={styles.skills}>
            {highlightSkills.length > 0 ? (
              highlightSkills.map((skill) => (
                <span key={skill} style={styles.skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.emptyText}>No standout matched skills</span>
            )}
          </div>
        </div>

        <div style={styles.developBox}>
          <div style={styles.improvementBoxTitle}>💡 Skills to Develop</div>
          <div style={styles.skills}>
            {developSkills.length > 0 ? (
              developSkills.map((skill) => (
                <span key={skill} style={styles.developSkill}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.emptyText}>No major gaps found</span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.projectsBox}>
        <div style={styles.improvementBoxTitle}>🎯 Projects to Highlight</div>
        <p style={{ margin: 0, color: "#344054" }}>
          {getProjectHint(jobTitle)}
        </p>
      </div>

      <div style={styles.suggestionsBox}>
        <div style={styles.improvementBoxTitle}>📄 Resume Content Suggestions</div>
        <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
          {RESUME_SUGGESTION_TEMPLATES.map((tip, i) => (
            <li key={i} style={{ marginBottom: "6px", color: "#344054" }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <p style={styles.noteText}>
        Note: Only highlight skills you genuinely possess. Do not add skills
        you do not have.
      </p>
    </div>
  );
}

/* =====================================================
   SUB-COMPONENT: Interview questions, split into
   Technical / Project categories, collapsible.
   NOTE: the backend returns one flat list of 10
   questions — this just splits that list. It is not a
   real technical-vs-project classification unless the
   backend is updated to tag questions by category.
===================================================== */

function InterviewQuestions({ questions }) {
  const [openSection, setOpenSection] = useState("technical");

  if (!questions || questions.length === 0) return null;

  const technical = questions.slice(0, 6);
  const project = questions.slice(6);

  const toggle = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div style={styles.jobInterviewBox}>
      <h4 style={{ marginTop: 0 }}>🎤 Interview Questions</h4>

      {technical.length > 0 && (
        <div style={styles.questionCategory}>
          <button
            style={styles.categoryHeader}
            onClick={() => toggle("technical")}
          >
            <span>
              <span style={styles.categoryBadgeT}>T</span>
              Technical Questions ({technical.length})
            </span>
            <span>{openSection === "technical" ? "▲" : "▼"}</span>
          </button>

          {openSection === "technical" && (
            <ol style={{ marginTop: "10px" }}>
              {technical.map((q, i) => (
                <li key={i} style={styles.question}>
                  {q}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {project.length > 0 && (
        <div style={styles.questionCategory}>
          <button
            style={styles.categoryHeader}
            onClick={() => toggle("project")}
          >
            <span>
              <span style={styles.categoryBadgeP}>P</span>
              Project Questions ({project.length})
            </span>
            <span>{openSection === "project" ? "▲" : "▼"}</span>
          </button>

          {openSection === "project" && (
            <ol style={{ marginTop: "10px" }}>
              {project.map((q, i) => (
                <li key={i} style={styles.question}>
                  {q}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   MAIN APP
===================================================== */

function App() {
  const [resume, setResume] = useState(null);

  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "",
      description: "",
    },
  ]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showHistory, setShowHistory] = useState(false);
const [history, setHistory] = useState(() => {
  try {
    const savedHistory = localStorage.getItem("careerfit_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
});

  const addJob = () => {
    setJobs([
      ...jobs,
      {
        id: Date.now(),
        title: `Job ${jobs.length + 1}`,
        description: "",
      },
    ]);
  };

  const removeJob = (id) => {
    if (jobs.length === 1) return;
    setJobs(jobs.filter((job) => job.id !== id));
  };

  const updateJobTitle = (id, value) => {
    setJobs(
      jobs.map((job) => (job.id === id ? { ...job, title: value } : job))
    );
  };

  const updateJob = (id, value) => {
    setJobs(
      jobs.map((job) =>
        job.id === id ? { ...job, description: value } : job
      )
    );
  };

  const analyzeJobs = async () => {
    setError("");
    setResults(null);

    if (!resume) {
      setError("Please upload your resume PDF.");
      return;
    }

    const emptyJob = jobs.find((job) => !job.description.trim());

    if (emptyJob) {
      setError(`Please enter the Job Description for ${emptyJob.title}.`);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", resume);
    jobs.forEach((job) => {
      formData.append("jobs", job.description);
    });

    try {
      const response = await fetch("https://ai-resume-analyzer-s0ll.onrender.com/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResults(data);

      const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        results: data,
        jobs: jobs.map((job) => ({
          title: job.title,
          description: job.description,
        })),
      };

      setHistory((prev) => {
        const updatedHistory = [historyItem, ...prev];
        localStorage.setItem(
          "careerfit_history",
          JSON.stringify(updatedHistory)
        );
        return updatedHistory;
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Make sure Flask is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = (id) => {
    setHistory((prev) => {
      const updatedHistory = prev.filter((item) => item.id !== id);
      localStorage.setItem(
        "careerfit_history",
        JSON.stringify(updatedHistory)
      );
      return updatedHistory;
    });
  };

  const getJobTitle = (jobIndex) => {
  return jobs[jobIndex - 1]?.title || `Job ${jobIndex}`;
};

const getHistoryJobTitle = (historyItem, jobIndex) => {
  return (
    historyItem.jobs?.[jobIndex - 1]?.title ||
    `Job ${jobIndex}`
  );
};

  const summary = results ? computeSummary(results, getJobTitle) : null;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>CareerFit AI</h1>
          <p style={styles.tagline}>
            AI-Powered Resume & Job Description Analyzer
          </p>
        </div>

        <button
          style={styles.historyButton}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Close History" : "History"}
        </button>
      </header>

      <main style={styles.container}>
        <section style={styles.hero}>
          <h2 style={styles.heroTitle}>
            Find How Well Your Resume Matches Jobs
          </h2>
          <p style={styles.heroText}>
            Upload your resume, add one or more job descriptions, and get
            detailed AI-powered matching results.
          </p>
        </section>

        {/* RESUME UPLOAD */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>1. Upload Your Resume</h2>
          <div style={styles.uploadBox}>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
            />
            {resume && (
              <p style={styles.fileName}>Selected: {resume.name}</p>
            )}
          </div>
        </section>

        {/* JOB DESCRIPTIONS */}
        <section style={styles.card}>
          <div style={styles.jobHeader}>
            <div>
              <h2 style={styles.sectionTitle}>2. Add Job Descriptions</h2>
              <p style={styles.smallText}>
                Add one or as many job descriptions as you want.
              </p>
            </div>
            <button style={styles.addButton} onClick={addJob}>
              + Add Another Job
            </button>
          </div>

          {jobs.map((job, index) => (
            <div key={job.id} style={styles.jobBox}>
              <div style={styles.jobBoxHeader}>
                <h3 style={styles.jobHeading}>Job {index + 1}</h3>
                {jobs.length > 1 && (
                  <button
                    style={styles.removeButton}
                    onClick={() => removeJob(job.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={job.title}
                onChange={(e) => updateJobTitle(job.id, e.target.value)}
                placeholder="Enter Job Title"
                style={styles.jobTitleInput}
              />

              <textarea
                value={job.description}
                onChange={(e) => updateJob(job.id, e.target.value)}
                placeholder="Paste the Job Description here..."
                style={styles.textarea}
              />
            </div>
          ))}
        </section>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={styles.analyzeButton}
          onClick={analyzeJobs}
          disabled={loading}
        >
          {loading ? "Analyzing Resume..." : "Analyze All Jobs"}
        </button>

        {/* HISTORY */}
        {showHistory && history.length > 0 && (
          <section style={styles.historySection}>
            <div style={styles.historyHeader}>
              <h2 style={styles.resultsTitle}>Analysis History</h2>
              <button
                style={styles.clearHistoryButton}
                onClick={() => {
                  localStorage.removeItem("careerfit_history");
                  setHistory([]);
                }}
              >
                Clear History
              </button>
            </div>

            <div style={styles.historyGrid}>
              {history.map((item) => (
                <div key={item.id} style={styles.historyCard}>
                  <h3>Resume Analysis</h3>
                  <p style={styles.historyDate}>{item.date}</p>
                  <p>
                    <strong>Best Match:</strong>{" "}
                    s?.{getHistoryJobTitle(
  item,
  item.results.best_match?.job_index
)}
                  </p>
                  <p>
                    <strong>Match Score:</strong>{" "}
                    {item.results.best_match?.match_score}%
                  </p>

                  <div style={styles.historyButtons}>
                    <button
                      style={styles.viewHistoryButton}
                      onClick={() => {
  setResults(item.results);

  if (item.jobs) {
    setJobs(
      item.jobs.map((job, index) => ({
        id: Date.now() + index,
        title: job.title,
        description: job.description,
      }))
    );
  }

  setShowHistory(false);
}}
                    >
                      View Analysis
                    </button>

                    <button
                      style={styles.deleteHistoryButton}
                      onClick={() => deleteHistoryItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showHistory && history.length === 0 && (
          <section style={styles.emptyHistory}>
            <h3>No Analysis History</h3>
            <p>Your completed resume analyses will appear here.</p>
          </section>
        )}

        {/* RESULTS */}
        {results && (
          <section style={styles.resultsSection}>
            <h2 style={styles.resultsTitle}>Analysis Results</h2>

            {/* SUMMARY CARDS */}
            <SummaryCards summary={summary} />

            {/* BEST MATCH */}
            {results.best_match && (
              <div style={styles.bestMatch}>
                <h3>Best Matching Job</h3>
                <div style={styles.bestJobName}>
                  {getJobTitle(results.best_match.job_index)}
                </div>
                <div style={styles.score}>
                  {results.best_match.match_score}%
                </div>
                <p>
                  This job has the highest overall match score among the
                  analyzed jobs.
                </p>
              </div>
            )}

            <h3 style={styles.subTitle}>Job-by-Job Comparison</h3>

            <div style={styles.resultsGrid}>
              {results.results.map((result) => {
                const jobTitle = getJobTitle(result.job_index);

                return (
                  <div key={result.job_index} style={styles.resultCard}>
                    <h3 style={styles.jobResultTitle}>{jobTitle}</h3>
                    <p style={styles.jobNumber}>Job {result.job_index}</p>

                    <div style={styles.scoreCircle}>
                      <span>{result.match_score}%</span>
                    </div>

                    <div style={styles.scoreDetails}>
                      <div style={styles.metric}>
                        <div style={styles.metricTop}>
                          <span>Skill Match</span>
                          <strong>{result.skill_match}%</strong>
                        </div>
                        <div style={styles.progressBackground}>
                          <div
                            style={{
                              ...styles.progressBar,
                              width: `${result.skill_match}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div style={styles.metric}>
                        <div style={styles.metricTop}>
                          <span>Text Similarity</span>
                          <strong>{result.text_similarity}%</strong>
                        </div>
                        <div style={styles.progressBackground}>
                          <div
                            style={{
                              ...styles.progressBar,
                              width: `${result.text_similarity}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* MATCHED SKILLS */}
                    <div style={styles.skillSection}>
                      <strong>Matched Skills</strong>
                      <div style={styles.skills}>
                        {result.matched_skills?.length > 0 ? (
                          result.matched_skills.map((skill) => (
                            <span key={skill} style={styles.skill}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={styles.emptyText}>
                            No matched skills
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MISSING SKILLS */}
                    <div style={styles.skillSection}>
                      <strong>Missing Skills</strong>
                      <div style={styles.skills}>
                        {result.missing_skills?.length > 0 ? (
                          result.missing_skills.map((skill) => (
                            <span key={skill} style={styles.missingSkill}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={styles.emptyText}>
                            No missing skills
                          </span>
                        )}
                      </div>
                    </div>

                    {/* WHY THIS SCORE */}
                    <div style={styles.whyScoreBox}>
                      <strong>ℹ️ Why This Score?</strong>
                      <p style={{ margin: "8px 0 0" }}>
                        {buildWhyScoreText(jobTitle, result)}
                      </p>
                    </div>

                    {/* INTERVIEW QUESTIONS (categorized) */}
                    <InterviewQuestions
                      questions={result.interview_questions}
                    />

                    {/* RESUME IMPROVEMENT (legacy simple list, if backend sends it) */}
                    {result.resume_suggestions &&
                      result.resume_suggestions.length > 0 && (
                        <div style={styles.suggestionBox}>
                          <h4>💡 Resume Improvement Suggestions</h4>
                          <ul>
                            {result.resume_suggestions.map(
                              (suggestion, index) => (
                                <li key={index} style={styles.suggestion}>
                                  {suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* COMPARE TABLE */}
            <CompareTable resultsData={results} getJobTitle={getJobTitle} />

            {/* HOW TO IMPROVE YOUR RESUME */}
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>How to Improve Your Resume</h2>
              {results.results.map((result) => (
                <ImprovementSection
                  key={result.job_index}
                  jobTitle={getJobTitle(result.job_index)}
                  jobIndex={result.job_index}
                  result={result}
                />
              ))}
            </section>

            {/* DISCLAIMER */}
            <div style={styles.disclaimer}>
              Match scores are based on skill keyword comparison and text
              similarity. They do not predict whether a candidate will be
              hired. Final hiring decisions depend on interviews,
              experience, cultural fit, and many other factors.
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p>CareerFit AI • AI Resume & Job Matching System</p>
      </footer>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  header: {
    background: "linear-gradient(135deg, #172554, #4f46e5)",
    color: "white",
    padding: "28px 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
    boxSizing: "border-box",
  },

  logo: { margin: 0, fontSize: "30px" },

  tagline: {
    margin: "8px 0 0",
    opacity: 0.9,
    fontSize: "16px",
    maxWidth: "700px",
    lineHeight: "1.5",
  },

  historyButton: {
    border: "none",
    background: "white",
    color: "#2563eb",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  container: {
    width: "92%",
    maxWidth: "1100px",
    margin: "40px auto",
    boxSizing: "border-box",
  },

  hero: { textAlign: "center", marginBottom: "35px", padding: "0 10px" },

  heroTitle: {
    fontSize: "clamp(26px, 5vw, 36px)",
    lineHeight: "1.2",
    marginBottom: "15px",
    color: "#172033",
  },

  heroText: {
    color: "#667085",
    fontSize: "16px",
    lineHeight: "1.6",
    maxWidth: "700px",
    margin: "0 auto",
  },

  card: {
    background: "white",
    color: "#172033",
    padding: "28px",
    borderRadius: "15px",
    marginBottom: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.07)",
  },

  sectionTitle: { marginTop: 0, fontSize: "22px", color: "#172033" },

  smallText: { color: "#667085", fontSize: "14px", lineHeight: "1.5" },

  uploadBox: {
    border: "2px dashed #9ca3af",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    background: "#fafafa",
  },

  fileName: { color: "#2563eb", fontWeight: "bold" },

  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  addButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  jobBox: {
    border: "1px solid #e5e7eb",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
    background: "#ffffff",
  },

  jobBoxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  jobHeading: { margin: 0, color: "#172033" },

  jobTitleInput: {
    width: "100%",
    marginTop: "15px",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    color: "#172033",
    background: "#ffffff",
  },

  removeButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    minHeight: "180px",
    marginTop: "12px",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    resize: "vertical",
    fontSize: "15px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#172033",
    fontFamily: "Arial, Helvetica, sans-serif",
    lineHeight: "1.5",
  },

  analyzeButton: {
    display: "block",
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    padding: "17px",
    borderRadius: "10px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    margin: "30px 0",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
  },

  historySection: { marginTop: "40px", marginBottom: "30px" },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  historyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  historyCard: {
    background: "white",
    padding: "22px",
    borderRadius: "12px",
    boxShadow: "0 5px 18px rgba(0,0,0,0.07)",
  },

  historyDate: { color: "#667085", fontSize: "14px" },

  historyButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  viewHistoryButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  deleteHistoryButton: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  clearHistoryButton: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  emptyHistory: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    marginTop: "30px",
    boxShadow: "0 5px 18px rgba(0,0,0,0.07)",
  },

  resultsSection: { marginTop: "40px" },

  resultsTitle: {
    fontSize: "30px",
    textAlign: "center",
    color: "#172033",
    marginBottom: "25px",
  },

  /* SUMMARY CARDS */
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "30px",
  },

  summaryCard: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 5px 18px rgba(0,0,0,0.06)",
  },

  summaryLabel: { color: "#667085", fontSize: "14px", marginBottom: "8px" },

  summaryValue: { fontSize: "28px", fontWeight: "bold", color: "#172033" },

  summaryValueLarge: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#172033",
  },

  summarySubtext: { color: "#667085", fontSize: "13px", marginTop: "4px" },

  bestMatch: {
    background: "linear-gradient(135deg, #ecfdf5, #eff6ff)",
    padding: "30px",
    borderRadius: "15px",
    textAlign: "center",
    marginBottom: "30px",
  },

  bestJobName: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#172033",
    marginTop: "10px",
  },

  score: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#2563eb",
    margin: "10px",
  },

  subTitle: { fontSize: "22px", color: "#172033" },

  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },

  resultCard: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    boxShadow: "0 5px 18px rgba(0,0,0,0.07)",
  },

  jobResultTitle: {
    textAlign: "center",
    color: "#172033",
    marginBottom: "4px",
    fontSize: "21px",
  },

  jobNumber: {
    textAlign: "center",
    color: "#667085",
    fontSize: "13px",
    marginTop: 0,
  },

  scoreCircle: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    margin: "20px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    fontSize: "25px",
    fontWeight: "bold",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
  },

  scoreDetails: { marginTop: "15px" },

  metric: { marginBottom: "16px" },

  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    fontSize: "14px",
  },

  progressBackground: {
    width: "100%",
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #7c3aed)",
    borderRadius: "10px",
  },

  skillSection: { marginTop: "18px" },

  skills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "8px",
  },

  skill: {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "13px",
  },

  missingSkill: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "13px",
  },

  developSkill: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "13px",
  },

  emptyText: { color: "#667085", fontSize: "13px" },

  whyScoreBox: {
    marginTop: "18px",
    padding: "16px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#1e3a8a",
  },

  /* INTERVIEW QUESTIONS */
  jobInterviewBox: {
    marginTop: "22px",
    padding: "18px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  questionCategory: { marginTop: "10px" },

  categoryHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#172033",
  },

  categoryBadgeT: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    lineHeight: "20px",
    textAlign: "center",
    borderRadius: "6px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    marginRight: "8px",
  },

  categoryBadgeP: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    lineHeight: "20px",
    textAlign: "center",
    borderRadius: "6px",
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: "12px",
    marginRight: "8px",
  },

  question: { marginBottom: "10px", lineHeight: "1.5", color: "#344054" },

  suggestionBox: {
    marginTop: "18px",
    padding: "18px",
    background: "#f5f3ff",
    borderRadius: "12px",
    borderLeft: "4px solid #7c3aed",
  },

  suggestion: { marginBottom: "10px", lineHeight: "1.5", color: "#344054" },

  /* COMPARE TABLE */
  tableWrapper: { overflowX: "auto", marginTop: "10px" },

  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },

  th: {
    textAlign: "left",
    padding: "12px",
    color: "#667085",
    fontSize: "12px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e5e7eb",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#172033",
  },

  scorePill: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "bold",
  },

  /* IMPROVEMENT SECTION */
  improvementCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "20px",
  },

  improvementHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },

  jobBadge: {
    background: "#f1f5f9",
    color: "#334155",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  improvementRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "14px",
  },

  highlightBox: {
    background: "#ecfdf5",
    padding: "16px",
    borderRadius: "10px",
  },

  developBox: {
    background: "#fffbeb",
    padding: "16px",
    borderRadius: "10px",
  },

  projectsBox: {
    background: "#eff6ff",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "14px",
  },

  suggestionsBox: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "10px",
  },

  improvementBoxTitle: { fontWeight: "bold", marginBottom: "10px" },

  noteText: {
    fontStyle: "italic",
    color: "#667085",
    fontSize: "13px",
    marginTop: "4px",
  },

  disclaimer: {
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    color: "#667085",
    fontSize: "13px",
    lineHeight: "1.6",
    marginTop: "20px",
    boxShadow: "0 5px 18px rgba(0,0,0,0.05)",
  },

  footer: {
    textAlign: "center",
    padding: "30px",
    color: "#667085",
    borderTop: "1px solid #e5e7eb",
  },
};

export default App;

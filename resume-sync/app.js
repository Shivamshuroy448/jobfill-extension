// ResumeSync AI — App Logic (Direct LaTeX & 1-Click Overleaf Sync)

const EXACT_BASE_RESUME = {
  personal: {
    name: "SHIVAMSHU ROY",
    line1: 'Buffalo, NY, USA | <a href="mailto:velamakannishivamshuroy@gmail.com" class="tex-link">velamakannishivamshuroy@gmail.com</a>',
    line2: '<a href="https://shivamshuroy.is-a.dev" target="_blank" class="tex-link">shivamshuroy.is-a.dev</a> | <a href="https://linkedin.com/in/shivamshuroy" target="_blank" class="tex-link">linkedin.com/in/shivamshuroy</a> | <a href="https://github.com/Shivamshuroy448" target="_blank" class="tex-link">github.com/Shivamshuroy448</a> | <a href="https://medium.com/@shivamshuroy" target="_blank" class="tex-link">medium.com/@shivamshuroy</a>'
  },
  education: [
    {
      institution: "State University of New York at Buffalo",
      location: "Buffalo, NY",
      degree: "Master of Science in Engineering Science (Data Science)",
      dates: "Aug 2026 – Expected December 2027"
    },
    {
      institution: "Bennett University",
      location: "Greater Noida, India",
      degree: 'Bachelor of Technology in Computer Science (Data Science)   CGPA: 8.93 / 10.0',
      dates: "2020 – 2024"
    }
  ],
  skills: [
    { label: "Languages", value: "Python, SQL, R, Java, C++, JavaScript, HTML/CSS" },
    { label: "ML & Deep Learning", value: "PyTorch, TensorFlow, Scikit-Learn, Time-Series (Holt-Winters, ARIMA), XGBoost, NLP, LLMs" },
    { label: "Data & Cloud", value: "Google BigQuery, PostgreSQL, MySQL, Firebase, FastAPI, Flask, Docker, ETL Pipelines" },
    { label: "Analytics & Tools", value: "Tableau, Power BI, Statistical Modeling, EDA, Git/GitHub, Linux/Bash, Jupyter" },
    { label: "Relevant Coursework", value: "Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems" }
  ],
  experience: [
    {
      role: "Data Scientist",
      company: "Nxtwave Disruptive Technologies",
      dates: "Dec 2024 – Feb 2026",
      location: "Hyderabad, India",
      bullets: [
        "Architected end-to-end ETL data pipelines using SQL, BigQuery, and Python, automating cross-functional reporting across operational teams and reducing manual data processing latency by 40% across primary student databases.",
        "Designed interactive enterprise analytics dashboards querying 500K+ transactional student records; adopted across 4 major business departments, reducing cross-functional reporting cycles and operational turnaround by 35%.",
        "Built automated data validation and anomaly detection workflows using Google Apps Script and REST APIs, eliminating multi-team discrepancies and cutting executive report turnaround time from 2 days to near real-time."
      ]
    },
    {
      role: "Data Science Intern",
      company: "Tata Consultancy Services (TCS)",
      dates: "May 2024 – Aug 2024",
      location: "Hyderabad, India",
      bullets: [
        "Developed Python-based automated Exploratory Data Analysis (EDA) pipelines and statistical verification scripts, standardizing data hygiene protocols and decreasing data cleaning and feature preparation time by 30%.",
        "Implemented scalable data transformation workflows and BI visualization reports in Tableau, enabling comprehensive real-time operational KPI tracking and performance monitoring across multi-disciplinary engineering teams."
      ]
    }
  ],
  research: [
    {
      title: "Stock Market Forecasting Using Advanced Time Series Analysis",
      latexLinks: "\\hfill \\href{https://doi.org/10.1109/CVMI59938.2023.10465177}{[IEEE Xplore Link]}",
      linkHtml: "[IEEE Xplore Link]",
      subtitle: "Published \\& Presented at the IEEE International Conference on Computer Vision and Machine Intelligence (CVMI-2023)",
      bullets: [
        "Formulated optimized Holt-Winters exponential smoothing and adaptive moving average models for financial market index forecasting, achieving enhanced trend projection accuracy and superior fit over baseline architectures.",
        "Engineered specialized parameter optimization algorithms to minimize forecast error metrics (RMSE and MAE), significantly boosting forecasting stability and predictive precision across volatile historical financial markets."
      ]
    }
  ],
  projects: [
    {
      id: "checkmatelab",
      title: "CheckmateLab – Browser-Based Chess Engine \\& Analytics",
      cleanTitle: "CheckmateLab – Browser Chess Engine & Analytics",
      latexLinks: "\\hfill \\href{https://github.com/Shivamshuroy448/checkmatelab}{[GitHub]} $\\vert$ \\href{https://checkmatelab.vercel.app}{[Live Demo]}",
      linkHtml: "[GitHub] | [Live Demo]",
      angle: "Full-Stack ML & WebAssembly",
      bullets: [
        "Engineered a client-side chess evaluation dashboard integrating Stockfish 16 NNUE via WebAssembly, delivering real-time positional depth evaluations, dynamic win probabilities, and opening book detection in the browser.",
        "Implemented dynamic move accuracy scoring algorithms and integrated Firebase OAuth authentication to calculate, analyze, and persist real-time player ELO ratings and game history progression across active user sessions."
      ]
    },
    {
      id: "clearhire",
      title: "ClearHire AI – Intelligent Application \\& Ghosting Risk Tracker",
      cleanTitle: "ClearHire AI – Ghosting Risk Tracker",
      latexLinks: "\\hfill \\href{https://github.com/Shivamshuroy448/clearhireai}{[GitHub]}",
      linkHtml: "[GitHub]",
      angle: "Predictive Analytics & NLP",
      bullets: [
        "Developed an AI job application intelligence engine featuring Gmail OAuth synchronization to automatically parse recruiter correspondence, classify interview progression stages, and track application pipelines end-to-end.",
        "Formulated a predictive ”Ghosting Risk” scoring algorithm analyzing company response velocity, status change frequency, and historical response patterns to trigger automated, context-aware follow-up email notifications."
      ]
    },
    {
      id: "greengrid",
      title: "Green Grid AI – Geospatial EV Charging Demand Prediction",
      cleanTitle: "Green Grid AI – EV Demand Prediction",
      latexLinks: "\\hfill \\href{https://github.com/Shivamshuroy448/greengridai}{[GitHub]}",
      linkHtml: "[GitHub]",
      angle: "ML Regression & Spatial Modeling",
      bullets: [
        "Built machine learning regression models (Random Forest, Gradient Boosting) achieving an $R^2$ score of 0.88 to forecast municipal EV charging infrastructure demand and spatial utilization across 17,000+ spatial data records.",
        "Engineered automated data validation and outlier filtration routines, ensuring high predictive consistency and minimal feature noise across distributed telemetry sensors."
      ]
    }
  ]
};

// State
let isAiTailored = false;
let aiTailoredMeta = null;
let activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
let currentJDAnalysis = null;

// Keyword Dictionary
const KEYWORD_DICTIONARY = [
  { phrase: "Master's degree", key: "master" },
  { phrase: "Bachelor's degree", key: "bachelor" },
  { phrase: "Data Science", key: "data science" },
  { phrase: "Computer Science", key: "computer science" },
  { phrase: "Statistics", key: "statistics" },
  { phrase: "Mathematics", key: "mathematics" },
  { phrase: "Analytics", key: "analytics" },
  { phrase: "Actuarial Science", key: "actuarial" },
  { phrase: "SQL", key: "sql" },
  { phrase: "Python", key: "python" },
  { phrase: "R", key: " r " },
  { phrase: "Power BI", key: "power bi" },
  { phrase: "Tableau", key: "tableau" },
  { phrase: "BigQuery", key: "bigquery" },
  { phrase: "statistical methods", key: "statistical methods" },
  { phrase: "data analysis techniques", key: "data analysis techniques" },
  { phrase: "data analysis", key: "data analysis" },
  { phrase: "data visualization", key: "data visualization" },
  { phrase: "analytical and problem-solving skills", key: "analytical and problem-solving" },
  { phrase: "problem-solving skills", key: "problem-solving" },
  { phrase: "attention to detail", key: "attention to detail" },
  { phrase: "organizational skills", key: "organizational skills" },
  { phrase: "written and verbal communication", key: "written and verbal communication" },
  { phrase: "collaborative team environment", key: "collaborative" },
  { phrase: "team environment", key: "team environment" },
  { phrase: "work independently", key: "work independently" },
  { phrase: "passion for working with data", key: "passion for working with data" },
  { phrase: "imputation / data hygiene", key: "imputation" },
  { phrase: "anomaly detection", key: "anomaly detection" },
  { phrase: "HIPAA / privacy governance", key: "hipaa" },
  { phrase: "time-series forecasting", key: "time-series" },
  { phrase: "predictive modeling", key: "predictive modeling" },
  { phrase: "telemetry", key: "telemetry" },
  { phrase: "Bioinformatics", key: "bioinformatics" },
  { phrase: "Genomics", key: "genomic" },
  { phrase: "Life Sciences", key: "life science" },
  { phrase: "Next-Generation Sequencing", key: "sequencing" },
  { phrase: "Data Harmonization", key: "harmonization" },
  { phrase: "Agile Setting", key: "agile" },
  { phrase: "Technical Documentation", key: "technical documentation" },
  { phrase: "Precision Oncology", key: "oncology" }
];

const SAMPLE_JDS = [
  {
    company: "Amazon",
    role: "Data Scientist Intern",
    text: `Amazon – Data Scientist Intern (Summer 2027)

Basic Qualifications:
- Currently pursuing a Bachelor's or Master's degree in Data Science, Computer Science, Statistics, Mathematics, or related field.
- Strong analytical and problem-solving skills with a passion for working with data.
- Knowledge of statistical modeling and data analysis techniques.
- Experience with SQL and programming languages such as Python or R.
- Experience with data visualization tools such as Power BI, Tableau, or similar platforms.
- Ability to work collaboratively in a cross-functional team environment.`
  },
  {
    company: "Capital One",
    role: "Machine Learning Engineer Intern",
    text: `Capital One – Machine Learning Engineer Intern (Summer 2027)

Responsibilities:
- Build, train, and validate predictive machine learning models using Python, PyTorch, and Scikit-Learn.
- Engineer scalable ETL data pipelines to process large transactional financial datasets.
- Develop real-time inference microservices using FastAPI, Docker, and REST APIs.
- Collaborate with engineering teams to design interactive Tableau/Power BI performance dashboards.

Requirements:
- Enrolled in MS or BS in Computer Science, Data Science, or Machine Learning.
- Strong proficiency in SQL, PostgreSQL, BigQuery, and Python.
- Understanding of data hygiene, cross-validation, and statistical anomaly detection.`
  },
  {
    company: "Labcorp",
    role: "Bioinformatics & Genomics Data Intern",
    text: `Labcorp – Bioinformatics & Genomics Data Intern

Job Responsibilities:
- Support development and evaluation of bioinformatics pipelines and internal tooling.
- Contribute to technical documentation and learn development processes in an agile setting.
- Familiarize yourself with genomics results and aid in harmonization of genomic results for precision oncology products.
- Build automated data validation, missing-value imputation, and anomaly detection routines for high-throughput sequencing data.

Minimum Qualifications:
- Current enrollment in a Bachelor’s or Master's degree program in Life Sciences, Data Science, Bioinformatics, or Computer Science.

Preferred Qualifications:
- Experience with data analysis in Python, SQL, or R.
- Working knowledge of Next-Generation Sequencing data, harmonization, and statistical modeling.`
  },
  {
    company: "Finta",
    role: "Data & Automation Engineer Intern",
    text: `Finta (YC W23) – Data & Automation Engineer Intern

About Finta:
Finta is building accounting on autopilot for startups. We automate bookkeeping, tax filings, and runway tracking.

What You'll Do:
- Engineer automated ETL pipelines to parse and categorize financial transactions from banking APIs (Stripe, Mercury, Brex).
- Build automated anomaly detection and data validation routines to flag accounting discrepancies.
- Develop responsive dashboard interfaces querying transactional financial records.
- Integrate LLMs and machine learning classification to automate ledger categorization and receipt parsing.

Qualifications:
- Solid programming background in Python, SQL, and JavaScript.
- Experience with cloud databases, automated workflows, and REST APIs.`
  },
  {
    company: "Cardinal Health",
    role: "Healthcare Data Scientist Intern (Clinical Analytics & Telemetry)",
    text: `Cardinal Health – Healthcare Data Scientist Intern (Clinical Analytics & Telemetry)

About Cardinal Health:
Cardinal Health is a Fortune 15 healthcare services and products company delivering logistics, clinical telemetry solutions, and pharmaceutical supply chain analytics to thousands of hospital systems.

Key Responsibilities:
- Build and evaluate statistical time-series forecasting models to predict hospital supply utilization, patient telemetry demand, and claims volume.
- Engineer automated data validation, missing-value imputation, and anomaly detection pipelines for noisy clinical and transactional datasets.
- Partner with cross-functional clinical teams to design interactive Tableau and Power BI performance monitoring dashboards.
- Enforce strict HIPAA data governance and privacy protocols across all data processing workflows.

Qualifications:
- Currently enrolled in a Bachelor's or Master's degree in Data Science, Computer Science, Statistics, Biomedical Informatics, or related field.
- Strong proficiency in SQL, Python, BigQuery, and statistical data analysis.
- Understanding of data hygiene, time-series forecasting, regression, and anomaly detection.
- Strong written and verbal communication skills in a collaborative team environment.`
  }
];

let sampleJdIndex = 0;
const SAMPLE_JD = SAMPLE_JDS[0].text;

function showToastFeedback(msg, duration = 4000) {
  const existing = document.getElementById("resumesync-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "resumesync-toast";
  toast.className = "toast-feedback";
  toast.innerHTML = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function getResumeSearchableText(res) {
  const parts = [
    res.personal.name,
    res.education.map(e => `${e.institution} ${e.degree} ${e.location}`).join(" "),
    res.skills.map(s => `${s.label}: ${s.value}`).join(" "),
    res.experience.map(e => `${e.role} ${e.company} ${e.bullets.join(" ")}`).join(" "),
    res.research.map(r => `${r.title} ${r.subtitle} ${r.bullets.join(" ")}`).join(" "),
    res.projects.map(p => `${p.title} ${p.bullets.join(" ")}`).join(" ")
  ];
  return parts.join(" ").toLowerCase();
}

function analyzeJobDescription(jdText) {
  if (!jdText || jdText.trim().length === 0) {
    return { totalFound: 0, matched: [], missing: [], score: 0 };
  }

  const lowerJD = " " + jdText.toLowerCase() + " ";
  const resumeText = getResumeSearchableText(activeResume);

  const matched = [];
  const missing = [];

  KEYWORD_DICTIONARY.forEach(item => {
    let foundInJD = false;
    if (item.key === " r ") {
      foundInJD = /\b(r|r programming|language r)\b/i.test(lowerJD);
    } else {
      foundInJD = lowerJD.includes(item.key.toLowerCase());
    }

    if (foundInJD) {
      let inResume = false;
      if (item.key === " r ") {
        inResume = /\b(r|r programming)\b/i.test(resumeText);
      } else      if (item.phrase === "Statistics") {
        inResume = resumeText.includes("statistics") || resumeText.includes("statistical");
      } else if (item.phrase === "Mathematics") {
        inResume = resumeText.includes("mathematics") || resumeText.includes("math");
      } else if (item.phrase === "Actuarial Science") {
        inResume = resumeText.includes("actuarial") || (resumeText.includes("data science") && resumeText.includes("master"));
      } else if (item.phrase === "written and verbal communication") {
        inResume = resumeText.includes("written") && (resumeText.includes("verbal communication") || resumeText.includes("verbal") || resumeText.includes("communication"));
      } else if (item.phrase === "collaborative team environment") {
        inResume = (resumeText.includes("collaborative") || resumeText.includes("collaboration")) && (resumeText.includes("team") || resumeText.includes("teamwork"));
      } else if (item.phrase === "team environment") {
        inResume = resumeText.includes("team");
      } else if (item.phrase === "analytical and problem-solving skills" || item.phrase === "problem-solving skills") {
        inResume = resumeText.includes("analytical") || resumeText.includes("problem-solving");
      } else if (item.phrase === "work independently") {
        inResume = resumeText.includes("independent");
      } else if (item.phrase === "passion for working with data") {
        inResume = resumeText.includes("passion");
      } else if (item.phrase === "attention to detail") {
        inResume = resumeText.includes("detail");
      } else if (item.phrase === "organizational skills") {
        inResume = resumeText.includes("organization") || resumeText.includes("organizational");
      } else if (item.phrase === "Data Harmonization") {
        inResume = resumeText.includes("harmonization") || resumeText.includes("imputation");
      } else if (item.phrase === "Agile Setting") {
        inResume = resumeText.includes("agile") || resumeText.includes("scrum") || resumeText.includes("cross-functional");
      } else if (item.phrase === "Technical Documentation") {
        inResume = resumeText.includes("documentation") || resumeText.includes("technical") || resumeText.includes("reporting");
      } else {
        inResume = resumeText.includes(item.key.toLowerCase());
      }

      if (inResume) {
        matched.push(item.phrase);
      } else {
        missing.push(item.phrase);
      }
    }
  });

  const total = matched.length + missing.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return {
    totalFound: total,
    matched: Array.from(new Set(matched)),
    missing: Array.from(new Set(missing)),
    score
  };
}

// Dynamic Project Rephraser & Ordering Engine
// Reorders and tailors project bullet points using specific JD keywords and domain phrasing,
// while strictly maintaining immutable metrics (17,000+ records, R^2 = 0.88, Stockfish 16 NNUE via WASM) and 1-page constraints.
function optimizeProjectsForJD(jdText) {
  if (!jdText || !jdText.trim()) {
    return JSON.parse(JSON.stringify(EXACT_BASE_RESUME.projects));
  }

  const lowerJD = jdText.toLowerCase();

  // Clone base projects
  const projects = JSON.parse(JSON.stringify(EXACT_BASE_RESUME.projects));
  const greengrid = projects.find(p => p.id === "greengrid");
  const clearhire = projects.find(p => p.id === "clearhire");
  const checkmatelab = projects.find(p => p.id === "checkmatelab");

  // Domain signals
  const isBioHealth = /bioinformatics|genomic|life science|oncology|sequencing|healthcare|biomedical|clinical|labcorp|cardinal health|cvs/i.test(lowerJD);
  const isFintech = /fintech|trading|financial|quant|banking|bloomberg|capital one|stripe|ledger|accounting|finta|reconciliation|runway/i.test(lowerJD);
  const isDataEng = /etl|data engineer|pipeline|distributed|warehouse|big data|spark|kafka|fastapi|docker|ingestion/i.test(lowerJD);
  const isAIML = /deep learning|machine learning|llm|nlp|neural|computer vision|transformers|pytorch|tensorflow/i.test(lowerJD);

  // Keyword signals
  const hasHarmonization = /harmoniz/i.test(lowerJD);
  const hasImputation = /imputation|missing[- ]value/i.test(lowerJD);
  const hasAnomaly = /anomaly|outlier/i.test(lowerJD);
  const hasDocs = /technical documentation|documentation/i.test(lowerJD);
  const hasAgile = /agile|scrum/i.test(lowerJD);
  const hasTooling = /internal tooling|tooling/i.test(lowerJD);

  // 1. Green Grid AI Adaptation
  if (greengrid) {
    if (isBioHealth) {
      greengrid.angle = "Predictive Modeling & Data Validation";
      const harmPhrase = hasHarmonization
        ? "supporting automated data harmonization across high-throughput datasets"
        : "ensuring predictive consistency across high-throughput sensor telemetry";
      greengrid.bullets[0] = `Built machine learning regression models (Random Forest, Gradient Boosting) achieving an $R^2$ score of 0.88 to forecast complex spatial utilization and demand across 17,000+ data records, ${harmPhrase}.`;
      
      const validationPhrase = hasImputation
        ? "automated data validation, missing-value imputation, and anomaly detection routines"
        : (hasAnomaly ? "automated data validation and anomaly detection routines" : "automated data validation and outlier filtration routines");
      const docPhrase = hasDocs ? "maintaining data hygiene and comprehensive technical documentation" : "maintaining high data hygiene and pipeline integrity";
      greengrid.bullets[1] = `Engineered ${validationPhrase} for distributed telemetry sensors, ${docPhrase}.`;
    } else if (isFintech) {
      greengrid.angle = "Quantitative ML & Predictive Modeling";
      greengrid.bullets[0] = `Built predictive machine learning models (Random Forest, Gradient Boosting) achieving an $R^2$ score of 0.88 to forecast municipal infrastructure demand and quantitative utilization metrics across 17,000+ spatial data records.`;
      greengrid.bullets[1] = `Engineered automated data validation, statistical anomaly detection, and outlier filtration routines, ensuring data hygiene and minimal feature noise across continuous telemetry streams.`;
    } else if (isDataEng) {
      greengrid.angle = "Data Pipelines & Telemetry ETL";
      greengrid.bullets[0] = `Built scalable data pipelines and machine learning regression models achieving an $R^2$ score of 0.88 to process and forecast demand patterns across 17,000+ spatial telemetry records.`;
      greengrid.bullets[1] = `Engineered automated ETL validation, data hygiene, and outlier filtration routines, delivering high pipeline reliability and fault tolerance across distributed telemetry nodes.`;
    } else {
      let b0 = `Built machine learning regression models (Random Forest, Gradient Boosting) achieving an $R^2$ score of 0.88 to forecast municipal EV charging infrastructure demand and spatial utilization across 17,000+ spatial data records.`;
      let b1 = `Engineered automated data validation and outlier filtration routines, ensuring high predictive consistency and minimal feature noise across distributed telemetry sensors.`;
      if (hasHarmonization && !b0.includes("harmonization")) {
        b0 = b0.replace("spatial data records.", "spatial data records, aiding automated data harmonization.");
      }
      if (hasImputation && !b1.includes("imputation")) {
        b1 = b1.replace("data validation and outlier filtration", "data validation, missing-value imputation, and outlier filtration");
      }
      greengrid.bullets[0] = b0;
      greengrid.bullets[1] = b1;
    }
  }

  // 2. ClearHire AI Adaptation
  if (clearhire) {
    if (isBioHealth) {
      clearhire.angle = "Pipeline Automation & Workflow Tooling";
      const agilePhrase = hasAgile ? "in an agile setting" : "end-to-end";
      const toolPhrase = hasTooling ? "internal workflow tooling" : "intelligence pipeline";
      clearhire.bullets[0] = `Developed an automated ${toolPhrase} featuring OAuth synchronization to parse complex multi-stage correspondence, classify progression stages, and track lifecycle pipelines ${agilePhrase}.`;
      clearhire.bullets[1] = `Formulated a predictive anomaly and risk-scoring algorithm analyzing event velocity and historical response patterns to trigger automated, context-aware notifications and telemetry reports.`;
    } else if (isFintech) {
      clearhire.angle = "Predictive Analytics & Event Tracking";
      clearhire.bullets[0] = `Developed an automated application tracking and reconciliation pipeline featuring OAuth synchronization to parse transactional communications, classify lifecycle stages, and monitor event workflows end-to-end.`;
      clearhire.bullets[1] = `Formulated a predictive risk-scoring algorithm analyzing communication velocity, status change frequency, and historical patterns to trigger automated, context-aware follow-up notifications.`;
    } else if (isDataEng) {
      clearhire.angle = "API Ingestion & Event-Driven Pipelines";
      clearhire.bullets[0] = `Developed an asynchronous data ingestion engine and workflow pipeline featuring OAuth synchronization to parse unstructured correspondence, extract key entities, and track workflows end-to-end.`;
      clearhire.bullets[1] = `Formulated a predictive latency scoring algorithm evaluating communication velocity and state transition frequency to orchestrate automated, event-driven notification alerts.`;
    } else if (isAIML) {
      clearhire.angle = "NLP & Predictive Classification";
      clearhire.bullets[0] = `Developed an NLP job application intelligence engine featuring Gmail OAuth synchronization to automatically parse recruiter correspondence, classify interview progression stages, and track application pipelines end-to-end.`;
      clearhire.bullets[1] = `Formulated a predictive ”Ghosting Risk” scoring algorithm analyzing company response velocity, status change frequency, and historical response patterns to trigger automated, context-aware follow-up email notifications.`;
    } else {
      let b0 = `Developed an AI job application intelligence engine featuring Gmail OAuth synchronization to automatically parse recruiter correspondence, classify interview progression stages, and track application pipelines end-to-end.`;
      let b1 = `Formulated a predictive ”Ghosting Risk” scoring algorithm analyzing company response velocity, status change frequency, and historical response patterns to trigger automated, context-aware follow-up email notifications.`;
      if (hasAgile && !b0.includes("agile")) {
        b0 = b0.replace("pipelines end-to-end.", "pipelines end-to-end in an agile setting.");
      }
      if (hasTooling && !b0.includes("tooling")) {
        b0 = b0.replace("intelligence engine", "intelligence engine and internal tooling");
      }
      clearhire.bullets[0] = b0;
      clearhire.bullets[1] = b1;
    }
  }

  // 3. CheckmateLab Adaptation
  if (checkmatelab) {
    if (isBioHealth) {
      checkmatelab.angle = "High-Performance Client-Side Tooling";
      checkmatelab.bullets[0] = `Engineered high-performance client-side analytical tooling and evaluation dashboards integrating Stockfish 16 NNUE via WebAssembly, delivering real-time depth evaluations, dynamic probabilities, and data visualization in the browser.`;
      checkmatelab.bullets[1] = `Implemented dynamic move accuracy scoring algorithms and integrated Firebase OAuth authentication to calculate, analyze, and persist real-time metrics and historical telemetry data across active user sessions.`;
    } else if (isFintech) {
      checkmatelab.angle = "Real-Time Decision Modeling & WASM";
      checkmatelab.bullets[0] = `Engineered a client-side decision engine integrating Stockfish 16 NNUE via WebAssembly, delivering real-time positional depth evaluations, dynamic win probabilities, and algorithmic trend analysis in the browser.`;
      checkmatelab.bullets[1] = `Implemented dynamic accuracy scoring models and integrated Firebase OAuth authentication to calculate, analyze, and persist real-time rating progressions and historical trajectories across user sessions.`;
    } else if (isDataEng) {
      checkmatelab.angle = "Distributed Client Systems & Firebase";
      checkmatelab.bullets[0] = `Engineered a responsive client-side analytics platform integrating Stockfish 16 NNUE via WebAssembly, delivering low-latency evaluations, client-side caching, and interactive visual telemetry.`;
      checkmatelab.bullets[1] = `Implemented scalable scoring algorithms and integrated cloud persistence with Firebase OAuth to manage and synchronize real-time player ratings and session progression with minimal latency.`;
    } else {
      checkmatelab.bullets[0] = `Engineered a client-side chess evaluation dashboard integrating Stockfish 16 NNUE via WebAssembly, delivering real-time positional depth evaluations, dynamic win probabilities, and opening book detection in the browser.`;
      checkmatelab.bullets[1] = `Implemented dynamic move accuracy scoring algorithms and integrated Firebase OAuth authentication to calculate, analyze, and persist real-time player ELO ratings and game history progression across active user sessions.`;
    }
  }

  // 4. Project Ordering based on JD Relevance
  let orderedProjects = [checkmatelab, clearhire, greengrid];

  if (isBioHealth || isDataEng) {
    // Green Grid AI (#1 regression, 17k records, data hygiene) -> ClearHire (#2 tooling, pipelines) -> CheckmateLab
    orderedProjects = [greengrid, clearhire, checkmatelab];
  } else if (isAIML) {
    // ClearHire (#1 NLP classification) -> Green Grid (#2 ML regression) -> CheckmateLab (#3 NNUE WASM)
    orderedProjects = [clearhire, greengrid, checkmatelab];
  } else if (isFintech) {
    // Green Grid (#1 quant demand forecasting) -> ClearHire (#2 risk scoring) -> CheckmateLab (#3 probability engine)
    orderedProjects = [greengrid, clearhire, checkmatelab];
  }

  return orderedProjects.filter(Boolean);
}

// 1-Click Sync & Optimize — Locks exact base skills and ONLY adds extras if needed by the JD,
// and tailors project bullet points to match the JD's industry and requirements.
function syncAndOptimizeResume(missingKeywords, jdText) {
  const lowerJD = (jdText || "").toLowerCase();
  const synced = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));

  // Dynamically tailor, rephrase, and reorder projects based on the JD
  synced.projects = optimizeProjectsForJD(jdText);
  synced.research = JSON.parse(JSON.stringify(EXACT_BASE_RESUME.research));
  synced.experience = JSON.parse(JSON.stringify(EXACT_BASE_RESUME.experience));
  synced.education = JSON.parse(JSON.stringify(EXACT_BASE_RESUME.education));

  // 1. Languages: EXACT BASE (do not change or reorder): Python, SQL, R, Java, C++, JavaScript, HTML/CSS
  const langEntry = synced.skills.find(s => s.label === "Languages");
  if (langEntry) {
    langEntry.value = "Python, SQL, R, Java, C++, JavaScript, HTML/CSS";
    const extraLangs = [];
    if (/\b(golang|go)\b/i.test(lowerJD) && !langEntry.value.includes("Go")) extraLangs.push("Go");
    if (/\brust\b/i.test(lowerJD)) extraLangs.push("Rust");
    if (/\bscala\b/i.test(lowerJD)) extraLangs.push("Scala");
    if (extraLangs.length > 0) langEntry.value += ", " + extraLangs.join(", ");
  }

  // 2. ML & Deep Learning: EXACT BASE: PyTorch, TensorFlow, Scikit-Learn, Time-Series (Holt-Winters, ARIMA), XGBoost, NLP, LLMs
  const mlEntry = synced.skills.find(s => s.label === "ML & Deep Learning");
  if (mlEntry) {
    mlEntry.value = "PyTorch, TensorFlow, Scikit-Learn, Time-Series (Holt-Winters, ARIMA), XGBoost, NLP, LLMs";
    const extraML = [];
    if (lowerJD.includes("keras")) extraML.push("Keras");
    if (lowerJD.includes("langchain")) extraML.push("LangChain");
    if (extraML.length > 0) mlEntry.value += ", " + extraML.join(", ");
  }

  // 3. Data & Cloud: EXACT BASE: Google BigQuery, PostgreSQL, MySQL, Firebase, FastAPI, Flask, Docker, ETL Pipelines
  const dataEntry = synced.skills.find(s => s.label === "Data & Cloud");
  if (dataEntry) {
    dataEntry.value = "Google BigQuery, PostgreSQL, MySQL, Firebase, FastAPI, Flask, Docker, ETL Pipelines";
    const extraData = [];
    if (lowerJD.includes("aws")) extraData.push("AWS");
    if (lowerJD.includes("snowflake")) extraData.push("Snowflake");
    if (lowerJD.includes("spark")) extraData.push("Apache Spark");
    if (extraData.length > 0) dataEntry.value += ", " + extraData.join(", ");
  }

  // 4. Analytics & Tools: EXACT BASE: Tableau, Power BI, Statistical Modeling, EDA, Git/GitHub, Linux/Bash, Jupyter
  // Append extras only if needed by JD
  const toolsEntry = synced.skills.find(s => s.label === "Analytics & Tools");
  if (toolsEntry) {
    toolsEntry.value = "Tableau, Power BI, Statistical Modeling, EDA, Git/GitHub, Linux/Bash, Jupyter";
    const extraTools = [];
    const hasStatMethods = lowerJD.includes("statistical methods") || lowerJD.includes("statistical");
    const hasDataAnalysis = lowerJD.includes("data analysis") || lowerJD.includes("data analysis techniques");
    const hasDataViz = lowerJD.includes("data visualization") || lowerJD.includes("visualization");

    if (hasStatMethods && !toolsEntry.value.toLowerCase().includes("statistical methods")) {
      extraTools.push("Statistical Methods");
    }
    if (hasDataAnalysis && !toolsEntry.value.toLowerCase().includes("data analysis")) {
      extraTools.push("Data Analysis Techniques");
    }
    if (hasDataViz && !toolsEntry.value.toLowerCase().includes("data visualization")) {
      extraTools.push("Data Visualization");
    }
    if (lowerJD.includes("imputation") || lowerJD.includes("hygiene")) {
      extraTools.push("Data Imputation Protocols");
    }
    if (lowerJD.includes("hipaa")) {
      extraTools.push("HIPAA Privacy Protocols");
    }
    if (lowerJD.includes("harmonization") || lowerJD.includes("bioinformatics") || lowerJD.includes("genomic")) {
      extraTools.push("Data Harmonization");
    }
    if (extraTools.length > 0) {
      toolsEntry.value += ", " + extraTools.join(", ");
    }
  }

  // 5. Relevant Coursework: EXACT BASE: Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems
  let courseEntry = synced.skills.find(s => s.label === "Relevant Coursework" || s.label === "Coursework");
  if (!courseEntry) {
    courseEntry = { label: "Relevant Coursework", value: "" };
    synced.skills.push(courseEntry);
  }
  courseEntry.label = "Relevant Coursework";
  courseEntry.value = "Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems";
  const extraCourses = [];
  if ((lowerJD.includes("statistic") || lowerJD.includes("probability")) && !courseEntry.value.includes("Statistics")) {
    extraCourses.push("Probability & Statistics");
  }
  if ((lowerJD.includes("math") || lowerJD.includes("calculus") || lowerJD.includes("linear algebra")) && !courseEntry.value.includes("Mathematics")) {
    extraCourses.push("Mathematics");
  }
  if (lowerJD.includes("actuarial") && !courseEntry.value.includes("Actuarial")) {
    extraCourses.push("Actuarial Analytics");
  }
  if (extraCourses.length > 0) {
    courseEntry.value += ", " + extraCourses.join(", ");
  }

  // 6. Core Competencies: Only add line if JD requires soft skills / behavioral
  const compList = [];
  if (lowerJD.includes("analytical") || lowerJD.includes("problem-solving")) {
    compList.push("Analytical Problem-Solving");
  }
  if (lowerJD.includes("collaborat") || lowerJD.includes("team")) {
    compList.push("Team Collaboration");
  }
  if (lowerJD.includes("communication")) {
    compList.push("Written & Verbal Communication");
  }
  if (lowerJD.includes("attention to detail")) {
    compList.push("Attention to Detail");
  }
  if (lowerJD.includes("organizational")) {
    compList.push("Organizational Skills");
  }
  if (lowerJD.includes("independently")) {
    compList.push("Work Independently");
  }
  if (lowerJD.includes("passion for working with data") || lowerJD.includes("passion")) {
    compList.push("Passion for Working with Data");
  }
  if (lowerJD.includes("agile") || lowerJD.includes("scrum")) {
    compList.push("Agile / Scrum Collaboration");
  }
  if (lowerJD.includes("technical documentation") || lowerJD.includes("documentation")) {
    compList.push("Technical Documentation");
  }

  let compEntry = synced.skills.find(s => s.label === "Core Competencies");
  if (compList.length > 0) {
    if (!compEntry) {
      synced.skills.push({ label: "Core Competencies", value: compList.join(", ") });
    } else {
      compEntry.value = compList.join(", ");
    }
  } else if (compEntry) {
    synced.skills = synced.skills.filter(s => s.label !== "Core Competencies");
  }

  return synced;
}

// LaTeX special characters escaper (preserves existing backslashes for commands)
function escapeLatex(text) {
  if (!text) return "";
  let s = text.replace(/(?<!\\)%/g, "\\%");
  s = s.replace(/(?<!\\)&/g, "\\&");
  return s;
}

// LaTeX Code Generator (Matching exact roy.tex + resume.cls in Overleaf, guaranteed 1 page)
function generateLaTeX(res) {
  const eduSection = `\\begin{rSection}{EDUCATION}
{\\bf State University of New York at Buffalo} \\hfill \\textit{Buffalo, NY}\\\\
Master of Science in Engineering Science (Data Science) \\hfill Aug 2026 -- Expected December 2027

\\vspace{1pt}
{\\bf Bennett University} \\hfill \\textit{Greater Noida, India}\\\\
Bachelor of Technology in Computer Science (Data Science) \\hspace{0.3cm} {\\bf CGPA: 8.93 / 10.0} \\hfill 2020 -- 2024
\\end{rSection}`;

  const skillsSection = `\\begin{rSection}{TECHNICAL SKILLS}
\\footnotesize
${res.skills.map(s => `\\textbf{${escapeLatex(s.label)}:} ${escapeLatex(s.value)} \\\\`).join("\n")}
\\normalsize
\\end{rSection}`;

  const expItems = (res.experience || []).map(exp => {
    const bulletsLatex = (exp.bullets || []).map(b => `  \\item ${escapeLatex(b)}`).join("\n");
    return `\\textbf{${escapeLatex(exp.role)}} \\hfill ${exp.dates}\\\\
\\textbf{${escapeLatex(exp.company)}} \\hfill \\textit{${escapeLatex(exp.location)}}
\\begin{itemize}
${bulletsLatex}
\\end{itemize}`;
  }).join("\n\n");

  const expSection = `\\begin{rSection}{PROFESSIONAL EXPERIENCE}

${expItems}

\\end{rSection}`;

  const researchItems = (res.research || []).map(r => {
    const bulletsLatex = (r.bullets || []).map(b => `  \\item ${escapeLatex(b)}`).join("\n");
    const linkStr = r.latexLinks || (r.linkHtml ? `\\hfill ${r.linkHtml}` : "");
    return `\\textbf{${escapeLatex(r.title)}} ${linkStr}\\\\
\\textit{${escapeLatex(r.subtitle)}}
\\begin{itemize}
${bulletsLatex}
\\end{itemize}`;
  }).join("\n\n");

  const researchSection = `\\begin{rSection}{PUBLICATIONS \\& RESEARCH}

${researchItems}

\\end{rSection}`;

  const projectItems = (res.projects || []).map(p => {
    const bulletsLatex = (p.bullets || []).map(b => `  \\item ${escapeLatex(b)}`).join("\n");
    const linkStr = p.latexLinks || "";
    return `\\textbf{${escapeLatex(p.title)}} ${linkStr}
\\begin{itemize}
${bulletsLatex}
\\end{itemize}`;
  }).join("\n\n");

  const projectsSection = `\\begin{rSection}{PROJECTS}

${projectItems}

\\end{rSection}`;

  return `\\documentclass[11pt]{resume} % Use the custom resume.cls style with reduced font size

\\usepackage[left=0.35in,top=0.18in,right=0.35in,bottom=0.18in]{geometry}
\\usepackage{setspace}
\\setstretch{0.82}

\\usepackage{titlesec}
\\titlespacing{\\section}{0pt}{*0.06}{*0.06}

\\usepackage{enumitem}
\\setitemize{noitemsep,topsep=0.4pt,parsep=0pt,partopsep=0pt,leftmargin=12pt}

\\usepackage{xcolor}
\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    urlcolor=blue,
    citecolor=blue
}

\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}} 
\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}

\\name{SHIVAMSHU ROY}

\\address{Buffalo, NY, USA $\\vert$ \\href{mailto:velamakannishivamshuroy@gmail.com}{velamakannishivamshuroy@gmail.com}} 
\\address{\\href{https://shivamshuroy.is-a.dev}{shivamshuroy.is-a.dev} $\\vert$ \\href{https://www.linkedin.com/in/shivamshuroy/}{linkedin.com/in/shivamshuroy} $\\vert$ \\href{https://github.com/Shivamshuroy448}{github.com/Shivamshuroy448} $\\vert$ \\href{https://shivamshuroy.medium.com/}{medium.com/@shivamshuroy}}

\\begin{document}

%----------------------------------------------------------------------------------------
%	EDUCATION SECTION
%----------------------------------------------------------------------------------------
${eduSection}
\\vspace{-9.5pt}

%----------------------------------------------------------------------------------------
% TECHNICAL SKILLS (Linear ATS-Proof Format)
%----------------------------------------------------------------------------------------
${skillsSection}
\\vspace{-9.5pt}

%----------------------------------------------------------------------------------------
% EXPERIENCE
%----------------------------------------------------------------------------------------
${expSection}
\\vspace{-9.5pt}

%----------------------------------------------------------------------------------------
% PUBLICATIONS & RESEARCH
%----------------------------------------------------------------------------------------
${researchSection}
\\vspace{-9.5pt}

%----------------------------------------------------------------------------------------
% PROJECTS
%----------------------------------------------------------------------------------------
${projectsSection}

\\end{document}
`;
}

// Generate just the Technical Skills section for Overleaf
function generateSkillsSectionLaTeX(res) {
  return `%----------------------------------------------------------------------------------------
% TECHNICAL SKILLS (Linear ATS-Proof Format)
%----------------------------------------------------------------------------------------
\\begin{rSection}{TECHNICAL SKILLS}
\\footnotesize
${res.skills.map(s => `\\textbf{${escapeLatex(s.label)}:} ${escapeLatex(s.value)} \\\\`).join("\n")}
\\normalsize
\\end{rSection}`;
}

// Reset Resume to Master Baseline
function resetResumeToBase() {
  activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
  updateUI();
  showToastFeedback("🔄 Restored Shivamshu's original baseline resume!");
}

function updateUI() {
  const jdInput = document.getElementById("jd-input");
  const jdText = jdInput ? jdInput.value : "";

  if (jdText && jdText.trim()) {
    // 1-Click dynamic synchronization: tailors skills & reorders/rephrases projects to JD
    activeResume = syncAndOptimizeResume([], jdText);
  } else {
    activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
  }

  currentJDAnalysis = analyzeJobDescription(jdText);

  // Auto-detect company name if user has not manually edited one
  const companyInput = document.getElementById("company-input");
  if (companyInput && !(companyInput.dataset && companyInput.dataset.userEdited)) {
    const detected = detectCompanyFromJD(jdText);
    if (detected) {
      setTargetCompany(detected, "auto");
    } else if (!companyInput.value.trim()) {
      setTargetCompany("", "ready");
    }
  }

  // Update Target Role / Company Status Pill in JD header
  const rolePill = document.getElementById("role-detected-pill");
  const rolePillText = document.getElementById("role-detected-text");
  if (rolePill && rolePillText) {
    if (jdText && jdText.trim()) {
      const lower = jdText.toLowerCase();
      let domain = null;
      if (/bioinformatics|genomic|life science|oncology|sequencing|clinical/i.test(lower)) {
        domain = "Bioinformatics & Genomics";
      } else if (/fintech|trading|quant|ledger|accounting|finta/i.test(lower)) {
        domain = "Quantitative & Financial Analytics";
      } else if (/deep learning|machine learning|llm|nlp|neural/i.test(lower)) {
        domain = "Machine Learning & AI";
      } else if (/etl|data engineer|pipeline|distributed|spark|warehouse/i.test(lower)) {
        domain = "Data Engineering & Pipelines";
      } else if (/data analyst|tableau|power bi|business intelligence/i.test(lower)) {
        domain = "Data Analytics & BI";
      } else if (/data scientist/i.test(lower)) {
        domain = "Data Science";
      }
      const comp = companyInput && companyInput.value.trim();
      const label = domain ? (comp ? `${domain} (${comp})` : domain) : (comp ? `Target: ${comp}` : "Tailored Profile");
      rolePill.style.display = "inline-flex";
      rolePill.className = "role-detected-pill tailored";
      rolePillText.textContent = `🎯 Tailored: ${label}`;
      rolePill.title = "Skills and project bullets tailored for this role";
    } else {
      rolePill.style.display = "none";
    }
  }

  const scoreBadge = document.getElementById("match-score-badge");
  const scoreBar = document.getElementById("score-bar-fill");
  const matchedCount = document.getElementById("matched-count");
  const missingCount = document.getElementById("missing-count");

  scoreBadge.textContent = `${currentJDAnalysis.score}% Match`;
  scoreBar.style.width = `${currentJDAnalysis.score}%`;
  matchedCount.textContent = `${currentJDAnalysis.matched.length} keywords matched`;
  missingCount.textContent = `${currentJDAnalysis.missing.length} keywords missing`;

  if (currentJDAnalysis.score >= 80) {
    scoreBadge.classList.add("high");
  } else {
    scoreBadge.classList.remove("high");
  }

  const missingList = document.getElementById("missing-keywords-list");
  if (currentJDAnalysis.missing.length === 0) {
    missingList.innerHTML = jdText.trim()
      ? `<span class="empty-hint" style="color:#34d399;">🎉 100% Match! Skills &amp; projects aligned to JD.</span>`
      : `<span class="empty-hint">Paste a job description to detect missing keywords.</span>`;
  } else {
    missingList.innerHTML = currentJDAnalysis.missing.map(kw => `
      <span class="kw-badge kw-missing">
        <span>+</span>
        <span>${kw}</span>
      </span>
    `).join("");
  }

  const matchedList = document.getElementById("matched-keywords-list");
  if (currentJDAnalysis.matched.length === 0) {
    matchedList.innerHTML = `<span class="empty-hint">No matched keywords yet.</span>`;
  } else {
    matchedList.innerHTML = currentJDAnalysis.matched.map(kw => `
      <span class="kw-badge kw-matched">
        <span>✓</span>
        <span>${kw}</span>
      </span>
    `).join("");
  }

  const latexOutput = document.getElementById("latex-output");
  if (latexOutput) {
    latexOutput.value = generateLaTeX(activeResume);
  }
}

const POPULAR_COMPANIES = [
  "Amazon", "Google", "Microsoft", "Meta", "Apple", "Bloomberg", "Netflix", "Uber", "Lyft", "Airbnb",
  "Capital One", "Cardinal Health", "CVS Health", "UnitedHealth", "Elevance", "Pfizer",
  "Labcorp", "Merck", "Cytiva", "Quest Diagnostics", "Novartis", "Roche", "AbbVie", "Gilead", "Regeneron",
  "Bristol Myers Squibb", "AstraZeneca", "Amgen", "Moderna", "Illumina", "Thermo Fisher", "Humana", "Cigna", "Medtronic", "Epic",
  "JPMorgan", "Goldman Sachs", "Morgan Stanley", "Bank of America", "Citi", "Wells Fargo",
  "Tesla", "Stripe", "Snowflake", "Databricks", "ByteDance", "TikTok", "NVIDIA", "Salesforce", "Oracle",
  "Adobe", "PayPal", "Spotify", "Palantir", "DoorDash", "Robinhood", "Coinbase", "Snap", "Pinterest",
  "Walmart", "Target", "Cisco", "Intel", "Wayfair", "Etsy", "Fidelity", "Vanguard", "BlackRock",
  "Citadel", "Two Sigma", "Jane Street", "Hudson River Trading", "D.E. Shaw", "Millennium",
  "NxtWave", "TCS", "Infosys", "Wipro", "IBM", "Accenture", "Deloitte", "EY", "PwC", "KPMG"
];

function detectCompanyFromJD(jdText) {
  if (!jdText || !jdText.trim()) return "";
  for (const comp of POPULAR_COMPANIES) {
    const regex = new RegExp(`\\b${comp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, "i");
    if (regex.test(jdText)) {
      return comp;
    }
  }
  const patternMatch = jdText.match(/\b(?:at|about|join)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)\b/);
  if (patternMatch && patternMatch[1]) {
    const candidate = patternMatch[1].trim();
    const commonStops = ["the", "our", "a", "an", "this", "all", "your", "we", "us", "any", "sql", "python", "data", "engineering", "internship", "work"];
    if (!commonStops.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return "";
}

function setTargetCompany(companyName, source = "manual") {
  const cleanName = (companyName || "").trim();
  const displayCompany = cleanName || "General";
  
  // 1. Update Input field
  const companyInput = document.getElementById("company-input");
  if (companyInput && companyInput.value !== cleanName) {
    companyInput.value = cleanName;
  }
  
  // 2. Update Clear button visibility
  const btnClearCompany = document.getElementById("btn-clear-company");
  if (btnClearCompany) {
    btnClearCompany.style.display = cleanName ? "inline-flex" : "none";
  }

  // 3. Update Folder Destination preview
  const destFolderName = document.getElementById("dest-company-name");
  if (destFolderName) {
    destFolderName.textContent = displayCompany;
  }

  // 4. Update Top Navbar Pill
  const navCompanyName = document.getElementById("nav-company-name");
  if (navCompanyName) {
    navCompanyName.textContent = displayCompany;
  }

  // 5. Update Status badge & Detect badge
  const statusBadge = document.getElementById("company-status-badge");
  const detectBadge = document.getElementById("company-detect-badge");
  if (source === "auto") {
    if (statusBadge) {
      statusBadge.textContent = "🎯 Auto-detected";
      statusBadge.style.color = "#34d399";
    }
    if (detectBadge) {
      detectBadge.textContent = "Auto-detected";
      detectBadge.style.display = "inline-block";
    }
  } else if (source === "chip") {
    if (statusBadge) {
      statusBadge.textContent = "✓ Selected";
      statusBadge.style.color = "#38bdf8";
    }
    if (detectBadge) detectBadge.style.display = "none";
  } else if (cleanName) {
    if (statusBadge) {
      statusBadge.textContent = "✏️ Custom";
      statusBadge.style.color = "#38bdf8";
    }
    if (detectBadge) detectBadge.style.display = "none";
  } else {
    if (statusBadge) {
      statusBadge.textContent = "📁 Ready";
      statusBadge.style.color = "#94a3b8";
    }
    if (detectBadge) detectBadge.style.display = "none";
  }

  // 6. Highlight active quick chip if matches
  document.querySelectorAll(".company-chip").forEach(chip => {
    if (chip.dataset.company && chip.dataset.company.toLowerCase() === cleanName.toLowerCase()) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  // 7. Update Button text dynamically
  const btnSyncMain = document.getElementById("btn-sync-overleaf-main");
  const btnDownloadMain = document.getElementById("btn-download-resume-main");
  const btnDownloadTop = document.getElementById("btn-download-resume-top");

  if (btnSyncMain && !(btnSyncMain.dataset && btnSyncMain.dataset.syncing)) {
    btnSyncMain.innerHTML = `<span class="sync-icon">⚡</span><span>Sync, Overleaf &amp; Save to resumes/${displayCompany}/</span>`;
  }
  if (btnDownloadMain && !(btnDownloadMain.dataset && btnDownloadMain.dataset.downloading)) {
    btnDownloadMain.innerHTML = `<span>📥 Download PDF (${displayCompany})</span>`;
  }
  if (btnDownloadTop && !(btnDownloadTop.dataset && btnDownloadTop.dataset.downloading)) {
    btnDownloadTop.innerHTML = `<span>📥 Download PDF (${displayCompany})</span>`;
  }

  // 8. Inform target company history (debounced if user is actively typing)
  if (source === "manual") {
    debouncedNotifyBridge(displayCompany);
  } else {
    saveTargetCompany(displayCompany);
  }
}

let bridgeNotifyTimer = null;
function debouncedNotifyBridge(company) {
  clearTimeout(bridgeNotifyTimer);
  bridgeNotifyTimer = setTimeout(() => {
    saveTargetCompany(company);
  }, 400);
}

function saveTargetCompany(company) {
  if (!company || company.toLowerCase() === "general") return;
  try {
    const list = JSON.parse(localStorage.getItem("resumesync_companies") || "[]");
    if (!list.includes(company)) {
      list.unshift(company);
      localStorage.setItem("resumesync_companies", JSON.stringify(list.slice(0, 10)));
    }
  } catch (e) {}
  renderTargetCompanies();
}

function renderTargetCompanies() {
  try {
    const list = JSON.parse(localStorage.getItem("resumesync_companies") || "[]");
    const sec = document.getElementById("existing-folders-section");
    const container = document.getElementById("existing-folders-list");
    if (sec && container) {
      if (list.length > 0) {
        sec.style.display = "block";
        container.innerHTML = list.map(c => `
          <button type="button" class="company-chip chip-existing" data-company="${c}">🏢 ${c}</button>
        `).join("");
        container.querySelectorAll(".company-chip").forEach(btn => {
          btn.addEventListener("click", () => {
            setTargetCompany(btn.dataset.company, "manual");
          });
        });
      } else {
        sec.style.display = "none";
      }
    }
  } catch (e) {}
}

function openFolderInFinder() {
  const companyInput = document.getElementById("company-input");
  const company = (companyInput ? companyInput.value.trim() : "") || "General";
  alert(`Target employer: ${company}\n\nDownloaded files from Chrome are saved directly to your Downloads folder without any background daemons.`);
}

function fetchExistingFolders() {
  renderTargetCompanies();
}

// Function to trigger 1-click sync to Overleaf
async function pushToOverleaf(keepCurrentActiveResume = false) {
  const jdInput = document.getElementById("jd-input");
  const jdText = jdInput.value;
  if (!jdText.trim()) {
    alert("Please paste a job description first.");
    return;
  }

  const companyInput = document.getElementById("company-input");
  const companyName = (companyInput ? companyInput.value.trim() : "") || "General";

  // 1. Sync skills only if not already tailored by AI
  if (!keepCurrentActiveResume) {
    activeResume = syncAndOptimizeResume(currentJDAnalysis ? currentJDAnalysis.missing : [], jdText);
    updateUI();
  }

  const fullLatex = generateLaTeX(activeResume);

  // 2. Always copy full LaTeX to clipboard immediately
  let clipboardCopied = false;
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(fullLatex);
      clipboardCopied = true;
    } catch (clipErr) {
      console.warn("Clipboard copy skipped/blocked:", clipErr);
    }
  }

  // Fallback copy using hidden textarea if navigator.clipboard failed
  if (!clipboardCopied) {
    try {
      const ta = document.createElement("textarea");
      ta.value = fullLatex;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      clipboardCopied = true;
    } catch (e) {}
  }

  // 3. Send message to Chrome Extension with ACK handshake
  let extensionConnected = false;
  let extensionHandled = false;

  const extPromise = new Promise((resolve) => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === "RESUMESYNC_ACK") {
        extensionConnected = true;
      }
      if (e.data.type === "RESUMESYNC_RESULT") {
        window.removeEventListener("message", handler);
        resolve(e.data.result?.success || false);
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "RESUMESYNC_TO_OVERLEAF", latex: fullLatex }, "*");

    // Check if extension acknowledged within 2500ms.
    setTimeout(() => {
      if (!extensionConnected) {
        window.removeEventListener("message", handler);
        resolve(false);
      }
    }, 2500);

    // Hard timeout for extension injection
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve(false);
    }, 8000);
  });

  extensionHandled = await extPromise;

  // 4. If extension didn't handle it, open Overleaf tab directly in browser
  if (!extensionHandled) {
    window.open("https://www.overleaf.com/project/69787f4c07ea46326eb8587e", "_blank");
    showToastFeedback(
      `📋 <strong>Tailored LaTeX Copied to Clipboard!</strong><br>` +
      `In Overleaf: Press <strong>Cmd+A</strong> then <strong>Cmd+V</strong> to paste, then click <strong>Recompile</strong>.`,
      8000
    );
  } else {
    showToastFeedback(
      `✓ <strong>LaTeX Code Injected & Recompiled in Overleaf!</strong><br>` +
      `Check your Overleaf tab to preview the compiled PDF.`,
      6000
    );
  }

  // 5. Update Button Feedback
  const btnMain = document.getElementById("btn-sync-overleaf-main");
  const btnTop = document.getElementById("btn-sync-overleaf-top");

  const successMsg = extensionHandled
    ? "✓ Injected & Recompiled in Overleaf!"
    : "✓ LaTeX Copied! Switched to Overleaf";

  if (btnMain) {
    const orig = btnMain.innerHTML;
    btnMain.innerHTML = `<span class="sync-icon">✓</span><span>${successMsg}</span>`;
    setTimeout(() => { btnMain.innerHTML = orig; }, 4000);
  }

  if (btnTop) {
    const orig = btnTop.innerHTML;
    btnTop.innerHTML = `<span>✓</span><span>${successMsg}</span>`;
    setTimeout(() => { btnTop.innerHTML = orig; }, 4000);
  }

  saveTargetCompany(companyName);
}

// Function to download resume PDF
async function downloadResumePDF() {
  const btnMain = document.getElementById("btn-download-resume-main");
  const btnTop = document.getElementById("btn-download-resume-top");

  const setBtnText = (html) => {
    if (btnMain) btnMain.innerHTML = html;
    if (btnTop) btnTop.innerHTML = html;
  };

  const origMain = btnMain ? btnMain.innerHTML : "";
  const origTop = btnTop ? btnTop.innerHTML : "";

  setBtnText(`<span>⏳</span><span>Downloading PDF...</span>`);

  const companyInput = document.getElementById("company-input");
  const companyName = (companyInput ? companyInput.value.trim() : "") || "General";

  // 1. Listen for extension download confirmation
  let handledByExtension = false;
  const downloadHandler = (e) => {
    if (e.data && e.data.type === "RESUMESYNC_DOWNLOAD_RESULT") {
      handledByExtension = true;
      window.removeEventListener("message", downloadHandler);
      showToastFeedback(`📥 <strong>Downloading PDF from Overleaf!</strong><br>Check your Downloads folder for <code>roy.pdf</code>.`);
      setBtnText(`<span>✓</span><span>PDF Downloaded!</span>`);
    }
  };
  window.addEventListener("message", downloadHandler);

  // 2. Trigger Overleaf PDF download via extension relay
  window.postMessage({ type: "RESUMESYNC_DOWNLOAD_PDF" }, "*");

  // 3. Fallback: If extension is not active or Overleaf tab is closed
  setTimeout(() => {
    window.removeEventListener("message", downloadHandler);
    if (!handledByExtension) {
      // Open Overleaf tab directly so user can download
      setBtnText(`<span>📥</span><span>Opening Overleaf...</span>`);
      showToastFeedback(
        `📄 <strong>Overleaf Tab Not Detected</strong><br>` +
        `Opening Overleaf project to compile and download your resume PDF...`,
        6000
      );
      window.open("https://www.overleaf.com/project/69787f4c07ea46326eb8587e", "_blank");
    }
    setTimeout(() => {
      if (btnMain) btnMain.innerHTML = origMain;
      if (btnTop) btnTop.innerHTML = origTop;
    }, 3500);
  }, 2000);

  saveTargetCompany(companyName);
}

// Function to download .tex source file directly
function downloadTexFile() {
  const companyInput = document.getElementById("company-input");
  const companyName = (companyInput ? companyInput.value.trim() : "") || "General";
  const code = generateLaTeX(activeResume);
  const blob = new Blob([code], { type: "text/x-tex;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Shivamshu_Roy_Resume_${companyName}.tex`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


document.addEventListener("DOMContentLoaded", () => {
  const jdInput = document.getElementById("jd-input");
  const companyInput = document.getElementById("company-input");
  const btnClearCompany = document.getElementById("btn-clear-company");
  const btnOpenFolder = document.getElementById("btn-open-folder");
  const btnLoadExample = document.getElementById("btn-load-example");
  const btnClearJD = document.getElementById("btn-clear-jd");
  const btnSyncMain = document.getElementById("btn-sync-overleaf-main");
  const btnSyncTop = document.getElementById("btn-sync-overleaf-top");
  const btnDownloadMain = document.getElementById("btn-download-resume-main");
  const btnDownloadTop = document.getElementById("btn-download-resume-top");
  const btnDownloadTex = document.getElementById("btn-download-tex");
  const btnCopyLatex = document.getElementById("btn-copy-latex");
  const btnCopySkills = document.getElementById("btn-copy-skills");
  const btnReset = document.getElementById("btn-reset-resume");

  // Company input manual change
  if (companyInput) {
    companyInput.addEventListener("input", () => {
      companyInput.dataset.userEdited = "true";
      setTargetCompany(companyInput.value, "manual");
    });
  }

  // Clear company button
  if (btnClearCompany) {
    btnClearCompany.addEventListener("click", () => {
      if (companyInput) {
        companyInput.value = "";
        delete companyInput.dataset.userEdited;
      }
      setTargetCompany("", "ready");
    });
  }

  // Quick select company chips
  document.querySelectorAll(".quick-companies .company-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const comp = chip.dataset.company;
      if (companyInput) companyInput.dataset.userEdited = "true";
      setTargetCompany(comp, "chip");
    });
  });

  // Open in Finder
  if (btnOpenFolder) {
    btnOpenFolder.addEventListener("click", openFolderInFinder);
  }

  // Fetch already existing folders from ~/Desktop/resumes
  fetchExistingFolders();

  jdInput.addEventListener("input", () => {
    if (isAiTailored) {
      activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
    }
    isAiTailored = false;
    aiTailoredMeta = null;
    updateUI();
  });
  jdInput.addEventListener("paste", () => {
    if (isAiTailored) {
      activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
    }
    isAiTailored = false;
    aiTailoredMeta = null;
    setTimeout(() => updateUI(), 50);
  });

  btnLoadExample.addEventListener("click", () => {
    const sample = SAMPLE_JDS[sampleJdIndex % SAMPLE_JDS.length];
    sampleJdIndex++;
    jdInput.value = sample.text;
    if (companyInput) {
      delete companyInput.dataset.userEdited;
    }
    activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
    isAiTailored = false;
    aiTailoredMeta = null;
    updateUI();
    setTargetCompany(sample.company, "auto");
    showToastFeedback(`📋 Loaded Sample: <strong>${sample.company} (${sample.role})</strong>`);
  });

  // JD File Upload & Parsing (.pdf, .docx, .txt, .md)
  async function parseJdFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    showToastFeedback(`⏳ Reading <strong>${file.name}</strong>...`);

    try {
      let extractedText = "";

      if (name.endsWith(".pdf")) {
        if (typeof pdfjsLib === "undefined") {
          throw new Error("PDF parser loading. Please retry in a second.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pagesText = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pagesText.push(content.items.map(item => item.str).join(" "));
        }
        extractedText = pagesText.join("\n\n");
      } else if (name.endsWith(".docx")) {
        if (typeof mammoth === "undefined") {
          throw new Error("DOCX parser loading. Please retry in a second.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        // Plain text, markdown, etc.
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No readable text found in this file.");
      }

      jdInput.value = extractedText.trim();
      if (companyInput) delete companyInput.dataset.userEdited;
      activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
      isAiTailored = false;
      aiTailoredMeta = null;
      updateUI();
      showToastFeedback(`✓ Imported <strong>${file.name}</strong> (${extractedText.length} characters)!`);
    } catch (err) {
      console.error(err);
      alert(`Could not read file: ${err.message}\n\nTip: You can open the file and copy-paste the text directly into the box.`);
    }
  }

  const jdFileInput = document.getElementById("jd-file-input");
  if (jdFileInput) {
    jdFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        parseJdFile(e.target.files[0]);
        jdFileInput.value = "";
      }
    });
  }

  // Drag-and-Drop support over JD input
  jdInput.addEventListener("dragover", (e) => {
    e.preventDefault();
    jdInput.classList.add("drag-active");
  });
  jdInput.addEventListener("dragleave", (e) => {
    e.preventDefault();
    jdInput.classList.remove("drag-active");
  });
  jdInput.addEventListener("drop", (e) => {
    e.preventDefault();
    jdInput.classList.remove("drag-active");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseJdFile(e.dataTransfer.files[0]);
    }
  });

  btnClearJD.addEventListener("click", () => {
    jdInput.value = "";
    if (companyInput) {
      delete companyInput.dataset.userEdited;
      setTargetCompany("", "ready");
    }
    resetResumeToBase();
    showToastFeedback(`🗑 Cleared Job Description`);
  });

  if (btnSyncMain) btnSyncMain.addEventListener("click", pushToOverleaf);
  if (btnSyncTop) btnSyncTop.addEventListener("click", pushToOverleaf);
  if (btnDownloadMain) btnDownloadMain.addEventListener("click", async () => {
    await downloadResumePDF();
    fetchExistingFolders();
  });
  if (btnDownloadTop) btnDownloadTop.addEventListener("click", async () => {
    await downloadResumePDF();
    fetchExistingFolders();
  });
  if (btnDownloadTex) btnDownloadTex.addEventListener("click", downloadTexFile);

  btnReset.addEventListener("click", () => {
    resetResumeToBase();
  });

  btnCopyLatex.addEventListener("click", () => {
    const code = generateLaTeX(activeResume);
    navigator.clipboard.writeText(code).then(() => {
      const orig = btnCopyLatex.textContent;
      btnCopyLatex.textContent = "✓ Copied Entire LaTeX!";
      setTimeout(() => { btnCopyLatex.textContent = orig; }, 2000);
    });
  });

  btnCopySkills.addEventListener("click", () => {
    const code = generateSkillsSectionLaTeX(activeResume);
    navigator.clipboard.writeText(code).then(() => {
      const orig = btnCopySkills.textContent;
      btnCopySkills.textContent = "✓ Copied Skills Block!";
      setTimeout(() => { btnCopySkills.textContent = orig; }, 2000);
    });
  });


  // Direct Browser & Extension Status (Zero Daemons)
  const pill = document.getElementById("overleaf-status-pill");
  if (pill) {
    pill.className = "status-pill ready";
    pill.innerHTML = `⚡ Overleaf Sync Ready`;
    pill.title = "Direct browser & extension sync ready. No background daemons needed.";
  }

  // Initial load
  activeResume = JSON.parse(JSON.stringify(EXACT_BASE_RESUME));
  jdInput.value = SAMPLE_JD;
  updateUI();
  setTargetCompany("Amazon", "auto");
  renderTargetCompanies();
});

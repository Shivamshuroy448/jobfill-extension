// JobFill AI — AI Screening & Essay Question Copilot Engine
// Provides high-impact, tailored answers for open-ended questions based on Shivamshu Roy's verified background
// Hybrid: Zero-latency offline semantic synthesis + optional direct Gemini API integration

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.JobFillAI = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const CANDIDATE_PROFILE = {
    name: "Shivamshu Roy",
    fullName: "Shivamshu Roy Velamakanni",
    degree: "Master of Science in Engineering Science (Data Science)",
    university: "State University of New York at Buffalo (SUNY Buffalo)",
    gpa: "3.85 / 4.0",
    undergrad: "Bachelor of Technology in Computer Science (Data Science) from Bennett University (Times Group, 8.93 / 10.0)",
    currentStatus: "Graduate Student in Data Science at SUNY Buffalo",
    visa: "F-1 Student Visa, eligible for Curricular Practical Training (CPT) and 3-year STEM OPT extension; requires future sponsorship",
    roles: [
      {
        company: "Nxtwave Disruptive Technologies",
        title: "Data Scientist",
        dates: "Dec 2024 – Feb 2026",
        highlights: "Built enterprise ETL pipelines using SQL, BigQuery, and Python; engineered analytics dashboards across 4 business departments; cut manual data processing latency by 40%."
      },
      {
        company: "Tata Consultancy Services (TCS)",
        title: "Data Science Intern",
        dates: "May 2024 – Aug 2024",
        highlights: "Developed automated Exploratory Data Analysis (EDA) pipelines in Python and reporting dashboards in Tableau, reducing data cleaning turnaround by 30%."
      },
      {
        company: "National Informatics Center (NIC)",
        title: "Python Trainee",
        dates: "Feb 2024 – May 2024",
        highlights: "Contributed to biometric computer vision pipelines with OpenCV and built Flask microservices."
      }
    ],
    projects: [
      {
        name: "CheckmateLab",
        type: "Chess AI Engine & Platform",
        desc: "Integrated Stockfish 16 NNUE for deep position evaluation, custom accuracy scoring algorithms, opening book detection, and Firebase/OAuth."
      },
      {
        name: "ClearHire AI",
        type: "AI Recruiter Automation",
        desc: "Engineered automated job tracking with Gmail auto-pilot, algorithmic ghosting risk estimation, and context-aware LLM email drafting."
      },
      {
        name: "Green Grid AI",
        type: "Spatial-Temporal ML",
        desc: "Predicted EV charging demand and optimized station placement across 17,280 data records using Scikit-Learn, Pandas, and NumPy."
      },
      {
        name: "IEEE Published Research",
        type: "Time-Series Forecasting",
        desc: "Published in IEEE Xplore (CVMI-2023) optimizing Holt-Winters and Moving Average algorithms for volatile stock time-series."
      }
    ],
    skills: "Python, SQL, R, PyTorch, TensorFlow, Scikit-Learn, BigQuery, PostgreSQL, Tableau, Power BI, Docker, FastAPI, Flask, Git",
    compensation: "$35 - $45 / hour (open & negotiable for internship roles); competitive market rate for full-time",
    relocation: "Yes, fully willing to relocate anywhere across the United States",
    availability: "Available immediately / Summer 2027 internship timeline",
    noticePeriod: "Immediate"
  };

  // Pre-calibrated high quality answers for common categories
  const CALIBRATED_RESPONSES = {
    about_yourself: {
      comprehensive: `I am currently pursuing my Master’s in Engineering Science (Data Science) at the State University of New York at Buffalo, with prior production experience as a Data Scientist at Nxtwave and a Data Science Intern at TCS. Across these roles, I engineered end-to-end data pipelines using SQL, BigQuery, and Python, developed predictive machine learning models, and automated BI reporting dashboards that reduced data turnaround times by 30–40%. Additionally, I published research in IEEE Xplore on predictive time-series forecasting and built scalable ML applications including CheckmateLab (Chess AI) and ClearHire AI. I combine rigorous statistical foundations with strong software engineering to deliver measurable data-driven impact from day one.`,
      concise: `I am a graduate Data Science student at SUNY Buffalo with proven production experience building SQL/BigQuery pipelines and predictive models at Nxtwave and TCS. I am passionate about transforming complex datasets into scalable, high-impact business solutions.`,
      technical: `My technical foundation spans predictive modeling, statistical learning, and distributed data processing. At Nxtwave, I built automated SQL/BigQuery ETL pipelines cutting latency by 40%. At TCS, I developed automated Python EDA frameworks and Tableau dashboards. Beyond production work, I published IEEE research on time-series optimization and built real-time ML systems with PyTorch, Scikit-Learn, and Docker.`
    },
    why_role: {
      comprehensive: `I am applying for this role because it aligns directly with my background in statistical modeling, machine learning, and scalable pipeline development. Having delivered production analytics at Nxtwave and automated EDA workflows at TCS, I thrive on tackling ambiguous, real-world data problems. I want to bring my hands-on experience in Python, SQL, and predictive engineering to your team to build robust data solutions that directly improve business performance.`,
      concise: `This role perfectly matches my background in machine learning and data engineering. Having delivered analytics pipelines at Nxtwave and TCS, I am excited to apply my data science expertise to drive actionable insights for your team.`,
      technical: `I am drawn to this position because of its focus on scalable data science and model deployment. My background includes building BigQuery ETL pipelines, training Scikit-Learn/PyTorch models, and optimizing algorithms (published in IEEE), which will allow me to immediately contribute to your data science workflows.`
    },
    why_company: {
      comprehensive: `I have been following your team's innovative work and commitment to engineering excellence. I am excited about the opportunity to contribute to high-impact data problems at an organization that values data-driven innovation. My background in building automated pipelines at Nxtwave and delivering predictive solutions aligns strongly with your mission, and I would love the chance to grow and contribute here.`,
      concise: `I admire your company's focus on technological innovation and scalable impact. I want to join an engineering-driven environment where I can leverage my data science and analytics skills to solve challenging problems.`,
      technical: `Your organization's emphasis on solving complex problems with data and modern infrastructure makes this an ideal environment for me. With experience across BigQuery, Python ML libraries, and dashboarding, I am eager to help your team scale its analytics capabilities.`
    },
    technical_project: {
      comprehensive: `One of my proudest projects is CheckmateLab, a real-time chess analytics platform powered by the Stockfish 16 NNUE engine. I developed custom algorithms for move accuracy scoring, win-loss probability curves, and automated opening book classification. Architecting the system required optimizing compute latency for deep evaluations while delivering seamless cloud state synchronization with Firebase and OAuth. The platform highlights my ability to take an advanced AI engine and engineer it into an accessible, responsive full-stack application.`,
      concise: `I developed CheckmateLab, an AI chess analysis platform integrating Stockfish 16 NNUE. I built custom algorithms for move accuracy calculations and win-loss probabilities, balancing compute-intensive evaluations with responsive real-time UI performance.`,
      technical: `In CheckmateLab, I integrated the Stockfish 16 NNUE neural network engine with custom Python and JavaScript algorithms for move accuracy scoring, win-loss probabilities, and real-time FEN parsing. I optimized position evaluation latency and managed authentication and cloud storage via Firebase, demonstrating end-to-end ML application engineering.`
    },
    ml_skills: {
      comprehensive: `I have extensive practical experience in data science and machine learning, spanning exploratory analysis, feature engineering, and model deployment. In production at Nxtwave, I built BigQuery analytics pipelines and anomaly detection scripts that cut data latency by 40%. At TCS, I developed Python-based automated EDA routines. Academically, I published an IEEE paper optimizing stock market time-series models and built spatial-temporal ML pipelines for EV charging demand in Green Grid AI. My core toolkit includes Python, SQL, PyTorch, Scikit-Learn, BigQuery, and Tableau.`,
      concise: `I have hands-on experience developing ML models and data pipelines with Python, SQL, Scikit-Learn, PyTorch, and BigQuery. My work includes production analytics at Nxtwave, automated EDA at TCS, and peer-reviewed IEEE research on predictive forecasting.`,
      technical: `My machine learning toolkit includes Python, Scikit-Learn, PyTorch, BigQuery, and SQL. I have experience with regression, classification, clustering, time-series forecasting (ARIMA, Holt-Winters), and spatial-temporal modeling. I focus heavily on rigorous feature validation, cross-validation, and pipeline automation.`
    },
    salary: {
      comprehensive: `$35 - $45 / hour, though I am open and flexible to discuss compensation based on the total internship package and company standards.`,
      concise: `Negotiable / $35 - $45 per hour for internship positions.`,
      technical: `Open / Negotiable in accordance with company standard rates.`
    },
    relocation: {
      comprehensive: `Yes, I am fully willing and excited to relocate anywhere in the United States for this role.`,
      concise: `Yes, willing to relocate.`,
      technical: `Yes, open to relocation.`
    },
    availability: {
      comprehensive: `I am available to start immediately or align with the scheduled internship start date for Summer 2027.`,
      concise: `Available immediately / Summer 2027.`,
      technical: `Immediate availability.`
    },
    notice_period: {
      comprehensive: `Immediate. I can begin onboarding as soon as needed.`,
      concise: `Immediate`,
      technical: `0 days / Immediate`
    },
    sponsorship: {
      comprehensive: `I hold an F-1 student visa and am eligible for Curricular Practical Training (CPT) and a 3-year STEM OPT extension for employment without immediate employer sponsorship. I will require visa sponsorship in the future.`,
      concise: `Eligible for F-1 CPT/STEM OPT; will require future visa sponsorship.`,
      technical: `Authorized under F-1 visa (CPT/STEM OPT eligible); future sponsorship required.`
    },
    heard_about: {
      comprehensive: `Company Careers Portal / LinkedIn`,
      concise: `Company Careers Page`,
      technical: `LinkedIn / Direct Application`
    },
    conflict_interest: {
      comprehensive: `No, I do not have any non-compete agreements or conflicts of interest.`,
      concise: `No`,
      technical: `No`
    }
  };

  // Classify a question label or text
  function classifyQuestion(questionText) {
    if (!questionText) return "about_yourself";
    const text = questionText.toLowerCase().replace(/[*:\s]+$/, "").trim();

    // 1. Sponsorship / Visa
    if (/(require sponsorship|future sponsorship|visa status|work authorization|legally authorized|\bf-?1\b|\bcpt\b|\bopt\b)/i.test(text)) {
      return "sponsorship";
    }

    // 2. Relocation
    if (/(relocate|relocation|open to moving|willing to move|willing to relocate)/i.test(text)) {
      return "relocation";
    }

    // 3. Salary / Compensation
    if (/(salary|compensation|hourly rate|expected pay|desired pay|remuneration|wage|desired compensation)/i.test(text)) {
      return "salary";
    }

    // 4. Availability / Start Date / Notice Period
    if (/(notice period|when can you start|earliest start date|availability|available start date|start date)/i.test(text)) {
      return /(notice)/i.test(text) ? "notice_period" : "availability";
    }

    // 5. Why Company / Organization
    if (
      /(why .* company|why do you want to work (at|for|with)|why us\b|what do you know about us)/i.test(text) ||
      /((why|what interests you|what attracted you|what excites you).*(company|organization|firm|team|join us|work with us))/i.test(text)
    ) {
      return "why_company";
    }

    // 6. Why Role / Position / Internship
    if (
      /(why .* role|why .* position|why data scientist|interest in this job)/i.test(text) ||
      /((why|what interests you|what excites you).*(role|position|internship|job|opportunity))/i.test(text)
    ) {
      return "why_role";
    }

    // 7. Technical Projects / Achievements / Challenges
    if (
      /((describe|tell us about).*(project|challenge|achievement|problem|accomplishment))/i.test(text) ||
      /(challenging.*project|proudest.*project|complex.*project|technical.*challenge|significant.*achievement|difficult.*problem)/i.test(text)
    ) {
      return "technical_project";
    }

    // 8. ML / Data Science / Programming Skills
    if (
      /((experience|skills?|background|proficiency).*(machine learning|data science|python|sql|deep learning|modeling|analytics))/i.test(text) ||
      /((machine learning|data science|python|sql|deep learning|modeling).*(experience|skills?|background|proficiency))/i.test(text)
    ) {
      return "ml_skills";
    }

    // 9. Referral / Source
    if (/(how did you hear|where did you find|referral source|how were you referred)/i.test(text)) {
      return "heard_about";
    }

    // 10. Conflict of Interest / Non-Compete
    if (/(non-compete|conflict of interest|contractual obligation|restrictive covenant)/i.test(text)) {
      return "conflict_interest";
    }

    // 11. About Yourself / Additional Information / Cover letter / Default
    if (/(anything else|tell us about yourself|tell me about yourself|additional information|cover letter|about you|brief bio|additional notes|other comments)/i.test(text)) {
      return "about_yourself";
    }

    return "about_yourself";
  }

  // Generate answer using built-in high-precision semantic knowledge base
  function getBuiltinAnswer(category, style = "comprehensive") {
    const group = CALIBRATED_RESPONSES[category] || CALIBRATED_RESPONSES.about_yourself;
    return group[style] || group.comprehensive || "";
  }

  // Live call to Gemini API if API key is provided
  async function callGeminiApi(apiKey, questionText, jobContext = {}) {
    if (!apiKey) return null;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are helping Shivamshu Roy apply for a ${jobContext.role || "Data Scientist Intern"} position at ${jobContext.company || "the company"}.
Candidate Profile:
- Name: Shivamshu Roy
- Degree: Master of Science in Engineering Science (Data Science) at SUNY Buffalo (GPA 3.85)
- Undergrad: B.Tech in CS (Data Science) from Bennett University (8.93/10)
- Experience:
  1. Data Scientist at Nxtwave: Built SQL/BigQuery ETL pipelines, reduced data processing latency by 40%.
  2. Data Science Intern at TCS: Automated Python EDA pipelines, Tableau KPI dashboards, cut turnaround by 30%.
  3. Python Trainee at NIC: Biometric computer vision with OpenCV, Flask microservices.
- Projects:
  1. CheckmateLab: Chess AI platform with Stockfish 16 NNUE, move accuracy scoring, Firebase/OAuth.
  2. ClearHire AI: AI recruiter automation with Gmail auto-pilot and LLM email drafting.
  3. IEEE Published Research: Time-series forecasting model optimization in IEEE Xplore.
- Skills: Python, SQL, PyTorch, BigQuery, Scikit-Learn, Tableau, Docker.
- Work Auth: F-1 Student Visa (eligible for CPT and STEM OPT, requires future sponsorship).

Job Application Question: "${questionText}"

Instructions:
Provide a compelling, professional, first-person response ("I ...") directly answering the question. Highlight relevant metrics (40% latency reduction, 30% turnaround decrease, IEEE publication) where appropriate. Keep it crisp (under 120 words). Do not include pleasantries like "Dear Hiring Team" or quotation marks around the entire output.`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 250
          }
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : null;
    } catch (err) {
      console.warn("JobFill AI: Gemini API request failed, falling back to built-in knowledge base.", err);
      return null;
    }
  }

  // Unified Classifier & Generator
  async function generateAnswer(questionText, options = {}) {
    const category = classifyQuestion(questionText);
    const style = options.style || "comprehensive";
    const jobContext = options.jobContext || {};

    // 1. Check if Gemini API key exists in storage
    let apiKey = options.apiKey || null;
    if (!apiKey && typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        const stored = await new Promise(r => chrome.storage.local.get(["geminiApiKey"], r));
        apiKey = stored?.geminiApiKey || null;
      } catch (e) {
        apiKey = null;
      }
    }

    // 2. If API key present, try Gemini
    if (apiKey) {
      const liveAnswer = await callGeminiApi(apiKey, questionText, jobContext);
      if (liveAnswer) {
        return {
          answer: liveAnswer,
          category,
          source: "gemini",
          alternatives: {
            comprehensive: getBuiltinAnswer(category, "comprehensive"),
            concise: getBuiltinAnswer(category, "concise"),
            technical: getBuiltinAnswer(category, "technical")
          }
        };
      }
    }

    // 3. Fallback to built-in high-precision synthesis
    return {
      answer: getBuiltinAnswer(category, style),
      category,
      source: "builtin",
      alternatives: {
        comprehensive: getBuiltinAnswer(category, "comprehensive"),
        concise: getBuiltinAnswer(category, "concise"),
        technical: getBuiltinAnswer(category, "technical")
      }
    };
  }

  // Scan current DOM for open-ended questions and textareas
  function scanPageQuestions() {
    const results = [];
    const textareas = Array.from(document.querySelectorAll("textarea, input[type='text']:not([id*='name' i]):not([id*='email' i]):not([id*='phone' i]):not([id*='address' i]):not([id*='city' i]):not([id*='zip' i]):not([id*='state' i])"));

    for (const el of textareas) {
      if (el.disabled || el.readOnly || (el.offsetParent === null && el.getClientRects().length === 0)) continue;

      // Extract label
      let labelText = "";
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) labelText = lbl.innerText || lbl.textContent || "";
      }
      if (!labelText) {
        const parentLabel = el.closest("label");
        if (parentLabel) labelText = parentLabel.innerText || parentLabel.textContent || "";
      }
      if (!labelText) {
        const wrapper = el.closest("div[class*='field' i], div[class*='group' i], div[class*='question' i], .vdl-form-group, li");
        if (wrapper) {
          const lbl = wrapper.querySelector("label, span[class*='label' i], div[class*='label' i], p");
          if (lbl) labelText = lbl.innerText || lbl.textContent || "";
        }
      }
      if (!labelText) {
        labelText = el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || "";
      }

      const cleanLabel = (labelText || "").replace(/[*:\s]+$/, "").trim();

      // Check if this looks like a screening question or open-ended prompt
      const isQuestion = cleanLabel.length > 8 ||
                         /\?$/.test(cleanLabel) ||
                         el.tagName === "TEXTAREA" ||
                         /(why|tell|describe|experience|interest|explain|how|what|anything|share|relocate|salary)/i.test(cleanLabel);

      if (isQuestion) {
        const cat = classifyQuestion(cleanLabel);
        results.push({
          element: el,
          id: el.id || el.name || "q_" + results.length,
          label: cleanLabel || "Application Question",
          category: cat,
          currentValue: el.value || "",
          suggestedAnswer: getBuiltinAnswer(cat, "comprehensive"),
          conciseAnswer: getBuiltinAnswer(cat, "concise"),
          technicalAnswer: getBuiltinAnswer(cat, "technical")
        });
      }
    }

    return results;
  }

  return {
    profile: CANDIDATE_PROFILE,
    classifyQuestion,
    getBuiltinAnswer,
    generateAnswer,
    scanPageQuestions
  };
});

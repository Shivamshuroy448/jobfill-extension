// JobFill AI — Default Profile Data for Shivamshu Roy
// Extracted and verified from https://shivamshuroy.is-a.dev/ and resume.pdf

const DEFAULT_PROFILE = {
  personal: {
    firstName: "Shivamshu",
    lastName: "Roy",
    middleName: "",
    preferredName: "Shivamshu",
    fullName: "Shivamshu Roy Velamakanni",
    email: "velamakannishivamshuroy@gmail.com",
    phone: "(716) 247-9102",
    phoneCountryCode: "+1",
    addressLine1: "1200 University Ave",
    addressLine2: "",
    city: "Buffalo",
    state: "New York",
    stateCode: "NY",
    postalCode: "14260",
    country: "United States of America",
    countryCode: "US"
  },
  links: {
    website: "https://shivamshuroy.is-a.dev/",
    portfolio: "https://shivamshuroy.is-a.dev/",
    linkedin: "https://www.linkedin.com/in/shivamshuroy/",
    github: "https://github.com/Shivamshuroy448",
    medium: "https://medium.com/@shivamshuroy",
    twitter: ""
  },
  education: [
    {
      school: "State University of New York at Buffalo",
      schoolAliases: ["SUNY Buffalo", "University at Buffalo", "UB", "Buffalo"],
      degree: "Master of Science",
      degreeType: "Master's Degree",
      fieldOfStudy: "Engineering Science (Data Science)",
      major: "Data Science",
      gpa: "3.85",
      gpaScale: "4.0",
      startMonth: "August",
      startYear: "2026",
      endMonth: "December",
      endYear: "2027",
      isCurrent: true
    },
    {
      school: "Bennett University",
      schoolAliases: ["Bennett", "Times Group"],
      degree: "Bachelor of Technology",
      degreeType: "Bachelor's Degree",
      fieldOfStudy: "Computer Science (Data Science)",
      major: "Computer Science",
      gpa: "8.93",
      gpaScale: "10.0",
      startMonth: "August",
      startYear: "2020",
      endMonth: "May",
      endYear: "2024",
      isCurrent: false
    }
  ],
  experience: [
    {
      company: "Nxtwave Disruptive Technologies",
      title: "Data Scientist",
      location: "Hyderabad, India",
      isCurrent: false,
      startMonth: "December",
      startYear: "2024",
      endMonth: "February",
      endYear: "2026",
      description: "Architected end-to-end ETL data pipelines using SQL, BigQuery, and Python, automating cross-functional reporting across operational teams and reducing manual data processing latency by 40%. Designed interactive enterprise analytics dashboards querying 500K+ transactional student records; adopted across 4 major business departments, reducing cross-functional reporting turnaround by 35%."
    },
    {
      company: "Tata Consultancy Services (TCS)",
      title: "Data Science Intern",
      location: "Hyderabad, India",
      isCurrent: false,
      startMonth: "May",
      startYear: "2024",
      endMonth: "August",
      endYear: "2024",
      description: "Developed Python-based automated Exploratory Data Analysis (EDA) pipelines and statistical verification scripts, standardizing data hygiene protocols and decreasing data cleaning and feature preparation time by 30%. Implemented scalable data transformation workflows and BI visualization reports in Tableau."
    }
  ],
  skills: [
    "Python", "SQL", "R", "Java", "C++", "JavaScript", "PyTorch", "TensorFlow",
    "Scikit-Learn", "Google BigQuery", "PostgreSQL", "MySQL", "Firebase",
    "FastAPI", "Flask", "Docker", "Tableau", "Power BI", "Git/GitHub", "ETL Pipelines"
  ],
  legal: {
    authorizedUS: "Yes",
    requireSponsorship: "Yes",
    futureSponsorship: "Yes",
    visaStatus: "F-1 Student Visa (Eligible for CPT / STEM OPT)",
    currentlyEmployed: "No",
    noticePeriod: "Immediately",
    referralSource: "LinkedIn / Company Careers Site"
  },
  eeo: {
    gender: "Male",
    race: "Asian (not Hispanic or Latino)",
    veteran: "I am not a protected veteran",
    disability: "No, I do not have a disability"
  }
};

// Storage helper functions
function getStoredProfile() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["userProfile"], (result) => {
        if (result && result.userProfile) {
          resolve(result.userProfile);
        } else {
          // Initialize with default
          chrome.storage.local.set({ userProfile: DEFAULT_PROFILE });
          resolve(DEFAULT_PROFILE);
        }
      });
    } else {
      resolve(DEFAULT_PROFILE);
    }
  });
}

function saveStoredProfile(profile) {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ userProfile: profile }, () => {
        resolve(true);
      });
    } else {
      resolve(true);
    }
  });
}

// Export for use across scripts
if (typeof window !== "undefined") {
  window.JobFillProfile = {
    DEFAULT_PROFILE,
    getStoredProfile,
    saveStoredProfile
  };
}

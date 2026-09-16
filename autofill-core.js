// JobFill AI — Core Autofill Engine
// Provides React-piercing value setters, shared DOM helpers, platform routing, and metadata extraction

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.JobFillCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  // Pierce React 15/16/17/18 controlled inputs
  function setNativeValue(element, value) {
    if (!element) return false;
    element.focus();

    const isTextarea = element.tagName === "TEXTAREA";
    const prototype = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (element._valueTracker) {
      element._valueTracker.setValue("");
    }
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    // Dispatch full cascade of events for React, Angular, Vue, and vanilla DOM
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));

    element.classList.add("jobfill-highlight");
    return true;
  }

  // Handle native select or custom combobox
  function setSelectValue(element, textOrValue) {
    if (!element) return false;
    element.focus();

    if (element.tagName === "SELECT") {
      const lower = textOrValue.toLowerCase();
      let matched = false;
      for (let i = 0; i < element.options.length; i++) {
        const optText = element.options[i].text.toLowerCase();
        const optVal = element.options[i].value.toLowerCase();
        if (optText.includes(lower) || optVal.includes(lower) || lower.includes(optText)) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.classList.add("jobfill-highlight");
      return matched;
    }

    return setNativeValue(element, textOrValue);
  }

  // Click radio or checkbox
  function clickElement(el) {
    if (!el) return false;
    el.focus();
    el.click();
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.classList.add("jobfill-highlight");
    return true;
  }

  // Helper: check if element is visible and interactive
  function isFillable(el) {
    if (!el) return false;
    if (el.disabled || el.readOnly) return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }

  // Safely set date input value using insertText and React prototype setter
  function setNativeDateValue(element, dateStr) {
    if (!element || !dateStr) return false;
    element.focus();

    if (element._valueTracker) {
      element._valueTracker.setValue("");
    }

    const prototype = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, "");
    } else {
      element.value = "";
    }
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));

    let insertSuccess = false;
    try {
      element.select();
      insertSuccess = document.execCommand("insertText", false, dateStr);
    } catch (e) {
      insertSuccess = false;
    }

    if (!insertSuccess || element.value !== dateStr) {
      if (element._valueTracker) {
        element._valueTracker.setValue("");
      }
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, dateStr);
      } else {
        element.value = dateStr;
      }
    }

    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

    element.classList.add("jobfill-highlight");
    return true;
  }

  // Format month and year to MM/YYYY
  function formatMMYYYY(monthStr, yearStr) {
    if (!yearStr) return "";
    const monthMap = {
      january: "01", jan: "01", "1": "01", "01": "01",
      february: "02", feb: "02", "2": "02", "02": "02",
      march: "03", mar: "03", "3": "03", "03": "03",
      april: "04", apr: "04", "4": "04", "04": "04",
      may: "05", "5": "05", "05": "05",
      june: "06", jun: "06", "6": "06", "06": "06",
      july: "07", jul: "07", "7": "07", "07": "07",
      august: "08", aug: "08", "8": "08", "08": "08",
      september: "09", sep: "09", sept: "09", "9": "09", "09": "09",
      october: "10", oct: "10", "10": "10",
      november: "11", nov: "11", "11": "11",
      december: "12", dec: "12", "12": "12"
    };
    const m = (monthStr || "").toLowerCase().trim();
    const mm = monthMap[m] || "01";
    return `${mm}/${yearStr.trim()}`;
  }

  function formatYYYYMM(monthStr, yearStr, separator = " - ") {
    if (!yearStr) return "";
    const monthMap = {
      january: "01", jan: "01",
      february: "02", feb: "02",
      march: "03", mar: "03",
      april: "04", apr: "04",
      may: "05",
      june: "06", jun: "06",
      july: "07", jul: "07",
      august: "08", aug: "08",
      september: "09", sep: "09",
      october: "10", oct: "10",
      november: "11", nov: "11",
      december: "12", dec: "12"
    };
    const m = (monthStr || "").toLowerCase().trim();
    const mm = monthMap[m] || "01";
    return `${yearStr.trim()}${separator}${mm}`;
  }

  // Detect current platform
  function detectPlatform() {
    const host = (typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) return "Workday";
    if (host.includes("greenhouse.io")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("ashbyhq.com")) return "Ashby";
    if (host.includes("adp.com") || host.includes("workforcenow.adp.com")) return "ADP";
    if (host.includes("tiktok.com") || host.includes("bytedance.com") || host.includes("feishu.cn")) return "TikTok";
    if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
    if (host.includes("icims.com")) return "iCIMS";
    return "Universal";
  }

  // ==========================================
  // MAIN ROUTER & RUNNER
  // ==========================================
  async function runAutofill(profile) {
    const platform = detectPlatform();
    let filled = [];

    const siteHandlers = (typeof window !== "undefined" && window.JobFillSites) ? window.JobFillSites : {};
    const platformKey = platform.toLowerCase();

    // 1. Run site-specific handler if available
    if (siteHandlers[platformKey] && typeof siteHandlers[platformKey].autofill === "function") {
      try {
        const res = await siteHandlers[platformKey].autofill(profile);
        if (Array.isArray(res)) {
          filled.push(...res);
        }
      } catch (err) {
        console.error(`JobFill AI: Error in ${platform} handler:`, err);
      }
    }

    // 2. Run universal heuristic fallback (unless on Workday, which manages its own composite cards)
    if (platform !== "Workday" && siteHandlers.universal && typeof siteHandlers.universal.autofill === "function") {
      try {
        const uRes = await siteHandlers.universal.autofill(profile);
        if (Array.isArray(uRes)) {
          filled.push(...uRes);
        }
      } catch (err) {
        console.error("JobFill AI: Error in universal handler:", err);
      }
    }

    const uniqueFilled = Array.from(new Set(filled));

    return {
      success: true,
      platform,
      count: uniqueFilled.length,
      fields: uniqueFilled
    };
  }

  // ==========================================
  // JOB METADATA EXTRACTION (FOR SPREADSHEETS)
  // ==========================================
  function cleanCompanyName(raw) {
    if (!raw) return "Unknown Company";
    let c = raw.trim();
    const known = {
      cardinalhealth: "Cardinal Health",
      capitalone: "Capital One",
      jpmorgan: "JPMorgan Chase",
      goldmansachs: "Goldman Sachs",
      bankofamerica: "Bank of America",
      walmart: "Walmart",
      target: "Target",
      cisco: "Cisco Systems",
      datadog: "Datadog",
      stripe: "Stripe",
      netflix: "Netflix",
      uber: "Uber",
      airbnb: "Airbnb",
      salesforce: "Salesforce",
      servicenow: "ServiceNow",
      snowflake: "Snowflake",
      nvidia: "Nvidia",
      palantir: "Palantir",
      microsoft: "Microsoft",
      google: "Google",
      meta: "Meta",
      apple: "Apple",
      amazon: "Amazon",
      bloomberg: "Bloomberg",
      mckesson: "McKesson",
      amerisourcebergen: "Cencora",
      unitedhealth: "UnitedHealth Group",
      cvs: "CVS Health",
      cigna: "The Cigna Group",
      pfizer: "Pfizer",
      johnsonandjohnson: "Johnson & Johnson",
      intel: "Intel",
      amd: "AMD",
      qualcomm: "Qualcomm",
      oracle: "Oracle",
      ibm: "IBM",
      adobe: "Adobe",
      tiktok: "TikTok",
      bytedance: "ByteDance",
      figma: "Figma"
    };

    const key = c.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (known[key]) return known[key];

    // Remove noise words like Inc, Corp, LLC, Careers, Jobs
    c = c.replace(/\b(inc\.?|llc\.?|corp\.?|corporation|careers|jobs|portal)\b/gi, "").trim();
    c = c.replace(/[-_]+/g, " ");

    // CamelCase separation (e.g. CardinalHealth -> Cardinal Health)
    c = c.replace(/([a-z])([A-Z])/g, "$1 $2");

    // Capitalize words
    return c.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  function extractJobMetadata() {
    const url = typeof window !== "undefined" && window.location ? window.location.href : "";
    const host = typeof window !== "undefined" && window.location ? window.location.hostname.toLowerCase() : "";
    let company = "";
    let role = "";

    // 1. Workday
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) {
      const parts = host.split(".");
      if (parts.length > 0 && parts[0] !== "www") {
        company = cleanCompanyName(parts[0]);
      }
      const headerEl = document.querySelector('[data-automation-id*="jobPostingHeader"] h2, [data-automation-id*="jobPostingHeader"], h1, h2');
      if (headerEl) {
        role = (headerEl.innerText || "").trim().split("\n")[0];
      }
      if (!role) {
        const match = url.match(/\/job\/[^/]+\/([^/?#]+)/i);
        if (match && match[1]) {
          role = decodeURIComponent(match[1]).replace(/[-_]+/g, " ").replace(/\d{6,}$/, "").trim();
        }
      }
    }
    // 2. Greenhouse
    else if (host.includes("greenhouse.io")) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) company = cleanCompanyName(pathParts[0]);
      const titleEl = document.querySelector(".app-title, h1.heading, h1");
      if (titleEl) role = (titleEl.innerText || "").trim();
    }
    // 3. Lever
    else if (host.includes("lever.co")) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) company = cleanCompanyName(pathParts[0]);
      const titleEl = document.querySelector(".posting-headline h2, h2, h1");
      if (titleEl) role = (titleEl.innerText || "").trim();
    }
    // 4. Ashby
    else if (host.includes("ashbyhq.com")) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) company = cleanCompanyName(pathParts[0]);
      const titleEl = document.querySelector("h1");
      if (titleEl) role = (titleEl.innerText || "").trim();
    }
    // 5. TikTok / ByteDance
    else if (host.includes("tiktok.com") || host.includes("bytedance.com") || host.includes("feishu.cn")) {
      company = host.includes("tiktok") ? "TikTok" : "ByteDance";
      const h1 = document.querySelector("h1, .position-title, [class*='position-title' i], [class*='title' i]");
      if (h1 && (h1.innerText || "").trim().length > 3) {
        role = (h1.innerText || "").trim().split("\n")[0];
      }
    }
    // 6. ADP Workforce Now
    else if (host.includes("adp.com") || host.includes("workforcenow.adp.com")) {
      const headerEl = document.querySelector(".recruitment-page-header, h1, h2, [class*='jobTitle' i], [class*='title' i]");
      if (headerEl) {
        const hText = (headerEl.innerText || "").trim();
        const m = hText.match(/Applying for\s+(.+)/i);
        role = m ? m[1].trim() : hText;
      }
      const clientEl = document.querySelector(".client-name, [class*='company' i], .logo-container img");
      if (clientEl) {
        company = cleanCompanyName(clientEl.innerText || clientEl.alt || "");
      }
      if (!company) company = "ADP Portal Job";
    }

    // Fallback heuristics for any site
    if (!company) {
      const ogSite = document.querySelector('meta[property="og:site_name"]');
      if (ogSite && ogSite.content) company = cleanCompanyName(ogSite.content);
    }
    if (!company) {
      const docTitle = document.title || "";
      if (docTitle.includes(" at ")) {
        company = cleanCompanyName(docTitle.split(" at ").pop().trim());
      } else if (docTitle.includes(" - ")) {
        const chunks = docTitle.split(" - ");
        company = cleanCompanyName(chunks[chunks.length - 1].trim());
      } else if (docTitle.includes(" | ")) {
        const chunks = docTitle.split(" | ");
        company = cleanCompanyName(chunks[chunks.length - 1].trim());
      }
    }
    if (!company && host) {
      const domainSlug = host.replace(/^www\./, "").split(".")[0];
      company = cleanCompanyName(domainSlug);
    }

    if (!role) {
      const h1 = document.querySelector("h1");
      if (h1 && (h1.innerText || "").trim().length > 3) {
        role = (h1.innerText || "").trim().split("\n")[0];
      } else {
        role = (document.title || "").split(/[-|•]/)[0].trim();
      }
    }

    // Format Date applied: MM/DD/YYYY
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyy = today.getFullYear();
    const dateApplied = `${mm}/${dd}/${yyyy}`;

    let cleanUrl = url;
    try {
      const u = new URL(url);
      u.searchParams.delete("_gl");
      u.searchParams.delete("_ga");
      u.searchParams.delete("pk_vid");
      cleanUrl = u.toString();
    } catch (e) {}

    return {
      company: company || "Unknown Company",
      role: role || "Internship Role",
      dateApplied,
      url: cleanUrl
    };
  }

  return {
    detectPlatform,
    setNativeValue,
    setSelectValue,
    clickElement,
    setNativeDateValue,
    formatMMYYYY,
    formatYYYYMM,
    runAutofill,
    cleanCompanyName,
    extractJobMetadata
  };
});

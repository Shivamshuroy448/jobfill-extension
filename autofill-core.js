// JobFill AI — Core Autofill Engine
// Provides React-piercing value setters and platform-specific adapters

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.JobFillCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  // Pierce React 16+ controlled inputs
  function setNativeValue(element, value) {
    if (!element) return false;
    
    element.focus();
    
    const isTextarea = element.tagName === "TEXTAREA";
    const prototype = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
      
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
    
    // Dispatch full cascade of events for React, Angular, Vue, and vanilla DOM
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
    
    // Visual feedback
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
        if (optText.includes(lower) || optVal.includes(lower)) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.classList.add("jobfill-highlight");
      return matched;
    }
    
    // If it is an input with list or combobox
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

  // Detect current platform
  function detectPlatform() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) return "Workday";
    if (host.includes("greenhouse.io")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("ashbyhq.com")) return "Ashby";
    if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
    if (host.includes("icims.com")) return "iCIMS";
    return "Universal";
  }

  // Helper: query selector with multiple fallback patterns
  function findField(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.disabled && el.offsetParent !== null) return el;
    }
    return null;
  }

  // Helper: query all elements matching
  function findFields(selectors) {
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els && els.length > 0) return Array.from(els);
    }
    return [];
  }

  // ==========================================
  // 1. WORKDAY ADAPTER (*.myworkdayjobs.com)
  // ==========================================
  function autofillWorkday(profile) {
    const filled = [];

    // Personal details via data-automation-id
    const map = [
      { id: "legalNameSection_firstName", val: profile.personal.firstName },
      { id: "legalNameSection_lastName", val: profile.personal.lastName },
      { id: "preferredNameSection_preferredName", val: profile.personal.preferredName },
      { id: "addressSection_addressLine1", val: profile.personal.addressLine1 },
      { id: "addressSection_city", val: profile.personal.city },
      { id: "addressSection_postalCode", val: profile.personal.postalCode },
      { id: "phone-number", val: profile.personal.phone },
      { id: "email", val: profile.personal.email },
      { id: "linkedinQuestion", val: profile.links.linkedin },
      { id: "websiteQuestion", val: profile.links.website },
      { id: "githubQuestion", val: profile.links.github }
    ];

    map.forEach(item => {
      const el = findField([
        `[data-automation-id="${item.id}"] input`,
        `input[data-automation-id="${item.id}"]`,
        `[data-automation-id="${item.id}"]`
      ]);
      if (el && item.val) {
        if (setNativeValue(el, item.val)) filled.push(item.id);
      }
    });

    // Workday Dropdown inputs (Comboboxes)
    // Country / State selection
    const stateEl = findField([
      `[data-automation-id="addressSection_countryRegion"] input`,
      `[data-automation-id="addressSection_countryRegion"]`
    ]);
    if (stateEl) {
      setSelectValue(stateEl, profile.personal.state);
      filled.push("state");
    }

    // Workday Legal / Sponsorship radios
    // Look for questions with "authorized" or "sponsorship"
    const radioContainers = document.querySelectorAll('[data-automation-id*="formLabel"], fieldset, [role="radiogroup"]');
    radioContainers.forEach(container => {
      const text = (container.innerText || "").toLowerCase();
      
      // Question: Are you legally authorized to work in the US? -> Yes
      if (text.includes("authorized to work") || text.includes("legally authorized")) {
        const yesRadio = container.querySelector('input[value*="yes" i], input[data-automation-id*="yes" i], input[id*="yes" i]') ||
                         Array.from(container.querySelectorAll('label, button, input[type="radio"]')).find(l => l.innerText && l.innerText.trim().toLowerCase() === "yes");
        if (yesRadio) {
          clickElement(yesRadio);
          filled.push("authorized-yes");
        }
      }

      // Question: Will you now or in the future require sponsorship? -> Yes (for F-1)
      if (text.includes("require sponsorship") || text.includes("future require sponsorship") || text.includes("visa sponsorship")) {
        const targetVal = profile.legal.requireSponsorship.toLowerCase() === "yes";
        const radio = Array.from(container.querySelectorAll('label, button, input[type="radio"]')).find(l => {
          const t = (l.innerText || l.value || "").trim().toLowerCase();
          return targetVal ? (t === "yes" || t === "true") : (t === "no" || t === "false");
        });
        if (radio) {
          clickElement(radio);
          filled.push("sponsorship-" + (targetVal ? "yes" : "no"));
        }
      }
    });

    // Work Experience Sections in Workday (Supports sequential mapping for multiple roles)
    const expBlocks = document.querySelectorAll('[data-automation-id*="workExperienceSection"], [data-automation-id*="WorkExperience"], fieldset[data-automation-id*="experience"]');
    if (expBlocks && expBlocks.length > 0) {
      expBlocks.forEach((block, idx) => {
        if (profile.experience[idx]) {
          const exp = profile.experience[idx];
          const tEl = block.querySelector('[data-automation-id*="jobTitle"] input, input[data-automation-id*="jobTitle"], [data-automation-id*="title"] input, input[data-automation-id*="title"]');
          const cEl = block.querySelector('[data-automation-id*="company"] input, input[data-automation-id*="company"]');
          const lEl = block.querySelector('[data-automation-id*="location"] input, input[data-automation-id*="location"]');
          const dEl = block.querySelector('[data-automation-id*="roleDescription"] textarea, textarea[data-automation-id*="roleDescription"], textarea[data-automation-id*="description"]');
          if (tEl && setNativeValue(tEl, exp.title)) filled.push(`exp-${idx}-title`);
          if (cEl && setNativeValue(cEl, exp.company)) filled.push(`exp-${idx}-company`);
          if (lEl && setNativeValue(lEl, exp.location)) filled.push(`exp-${idx}-location`);
          if (dEl && setNativeValue(dEl, exp.description)) filled.push(`exp-${idx}-desc`);
        }
      });
    } else {
      // Fallback: Individual experience fields if not grouped into separate section containers
      const titleInputs = Array.from(document.querySelectorAll('[data-automation-id="jobTitle"], input[data-automation-id="jobTitle"], [data-automation-id*="jobTitle"] input'));
      const companyInputs = Array.from(document.querySelectorAll('[data-automation-id="company"], input[data-automation-id="company"], [data-automation-id*="company"] input'));
      const locationInputs = Array.from(document.querySelectorAll('[data-automation-id="location"], input[data-automation-id="location"], [data-automation-id*="location"] input'));
      const descInputs = Array.from(document.querySelectorAll('textarea[data-automation-id*="roleDescription"], textarea[data-automation-id*="description"], [data-automation-id*="roleDescription"] textarea'));

      titleInputs.forEach((el, i) => {
        if (profile.experience[i] && setNativeValue(el, profile.experience[i].title)) filled.push(`exp-${i}-title`);
      });
      companyInputs.forEach((el, i) => {
        if (profile.experience[i] && setNativeValue(el, profile.experience[i].company)) filled.push(`exp-${i}-company`);
      });
      locationInputs.forEach((el, i) => {
        if (profile.experience[i] && setNativeValue(el, profile.experience[i].location)) filled.push(`exp-${i}-location`);
      });
      descInputs.forEach((el, i) => {
        if (profile.experience[i] && setNativeValue(el, profile.experience[i].description)) filled.push(`exp-${i}-desc`);
      });
    }

    // Education in Workday
    const eduBlocks = document.querySelectorAll('[data-automation-id*="educationSection"], [data-automation-id*="Education"], fieldset[data-automation-id*="education"]');
    if (eduBlocks && eduBlocks.length > 0) {
      eduBlocks.forEach((block, idx) => {
        if (profile.education[idx]) {
          const edu = profile.education[idx];
          const sEl = block.querySelector('[data-automation-id*="school"] input, input[data-automation-id*="school"]');
          const dEl = block.querySelector('[data-automation-id*="degree"] input, input[data-automation-id*="degree"]');
          const mEl = block.querySelector('[data-automation-id*="field-of-study"] input, input[data-automation-id*="field-of-study"]');
          const gEl = block.querySelector('[data-automation-id*="gpa"] input, input[data-automation-id*="gpa"]');
          if (sEl && setNativeValue(sEl, edu.school)) filled.push(`edu-${idx}-school`);
          if (dEl && setNativeValue(dEl, edu.degree)) filled.push(`edu-${idx}-degree`);
          if (mEl && setNativeValue(mEl, edu.major)) filled.push(`edu-${idx}-major`);
          if (gEl && setNativeValue(gEl, edu.gpa)) filled.push(`edu-${idx}-gpa`);
        }
      });
    }

    return filled;
  }

  // ==========================================
  // 2. GREENHOUSE ADAPTER (boards.greenhouse.io)
  // ==========================================
  function autofillGreenhouse(profile) {
    const filled = [];

    const map = [
      { sel: ["#first_name", 'input[name="job_application[first_name]"]'], val: profile.personal.firstName, name: "firstName" },
      { sel: ["#last_name", 'input[name="job_application[last_name]"]'], val: profile.personal.lastName, name: "lastName" },
      { sel: ["#email", 'input[name="job_application[email]"]'], val: profile.personal.email, name: "email" },
      { sel: ["#phone", 'input[name="job_application[phone]"]'], val: profile.personal.phone, name: "phone" },
      { sel: ['input[autocomplete="custom-question-linkedin-profile"]', 'input[name*="linkedin" i]'], val: profile.links.linkedin, name: "linkedin" },
      { sel: ['input[autocomplete="custom-question-website"]', 'input[name*="website" i]', 'input[name*="portfolio" i]'], val: profile.links.portfolio, name: "portfolio" },
      { sel: ['input[autocomplete="custom-question-github"]', 'input[name*="github" i]'], val: profile.links.github, name: "github" },
      { sel: ['#job_application_location', 'input[name*="location" i]'], val: profile.personal.city + ", " + profile.personal.stateCode, name: "location" }
    ];

    map.forEach(item => {
      const el = findField(item.sel);
      if (el && item.val) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    });

    return filled;
  }

  // ==========================================
  // 3. LEVER ADAPTER (jobs.lever.co)
  // ==========================================
  function autofillLever(profile) {
    const filled = [];

    const map = [
      { sel: ['input[name="name"]'], val: profile.personal.fullName, name: "fullName" },
      { sel: ['input[name="email"]'], val: profile.personal.email, name: "email" },
      { sel: ['input[name="phone"]'], val: profile.personal.phone, name: "phone" },
      { sel: ['input[name="org"]'], val: profile.education[0].school, name: "org" },
      { sel: ['input[name="urls[LinkedIn]"]', 'input[placeholder*="LinkedIn" i]'], val: profile.links.linkedin, name: "linkedin" },
      { sel: ['input[name="urls[GitHub]"]', 'input[placeholder*="GitHub" i]'], val: profile.links.github, name: "github" },
      { sel: ['input[name="urls[Portfolio]"]', 'input[placeholder*="Portfolio" i]'], val: profile.links.portfolio, name: "portfolio" },
      { sel: ['input[name="urls[Other]"]'], val: profile.links.medium, name: "otherUrl" }
    ];

    map.forEach(item => {
      const el = findField(item.sel);
      if (el && item.val) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    });

    return filled;
  }

  // ==========================================
  // 4. ASHBY ADAPTER (jobs.ashbyhq.com)
  // ==========================================
  function autofillAshby(profile) {
    const filled = [];

    const map = [
      { sel: ['input[name*="name" i]', 'input[autocomplete="name"]'], val: profile.personal.fullName, name: "fullName" },
      { sel: ['input[type="email"]', 'input[name*="email" i]'], val: profile.personal.email, name: "email" },
      { sel: ['input[type="tel"]', 'input[name*="phone" i]'], val: profile.personal.phone, name: "phone" },
      { sel: ['input[placeholder*="LinkedIn" i]', 'input[name*="linkedin" i]'], val: profile.links.linkedin, name: "linkedin" },
      { sel: ['input[placeholder*="GitHub" i]', 'input[name*="github" i]'], val: profile.links.github, name: "github" },
      { sel: ['input[placeholder*="Website" i]', 'input[placeholder*="Portfolio" i]', 'input[name*="website" i]'], val: profile.links.portfolio, name: "website" }
    ];

    map.forEach(item => {
      const el = findField(item.sel);
      if (el && item.val) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    });

    return filled;
  }

  // ==========================================
  // 5. UNIVERSAL HEURISTIC MATCHER
  // ==========================================
  function autofillUniversal(profile) {
    const filled = [];
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select");

    // Definition of patterns for matching fields
    const patterns = [
      {
        field: "firstName",
        regex: /(first[-_\s]?name|given[-_\s]?name|fname)/i,
        val: profile.personal.firstName
      },
      {
        field: "lastName",
        regex: /(last[-_\s]?name|family[-_\s]?name|surname|lname)/i,
        val: profile.personal.lastName
      },
      {
        field: "fullName",
        regex: /^(name|full[-_\s]?name|applicant[-_\s]?name)$/i,
        val: profile.personal.fullName
      },
      {
        field: "email",
        regex: /(email|e-mail|mail)/i,
        val: profile.personal.email
      },
      {
        field: "phone",
        regex: /(phone|mobile|cell|telephone)/i,
        val: profile.personal.phone
      },
      {
        field: "addressLine1",
        regex: /(address[-_\s]?1|street[-_\s]?address|address[-_\s]?line[-_\s]?1)/i,
        val: profile.personal.addressLine1
      },
      {
        field: "city",
        regex: /(city|town|municipality)/i,
        val: profile.personal.city
      },
      {
        field: "state",
        regex: /(state|province|region)/i,
        val: profile.personal.state
      },
      {
        field: "postalCode",
        regex: /(zip|postal[-_\s]?code|pincode)/i,
        val: profile.personal.postalCode
      },
      {
        field: "country",
        regex: /(country|nation)/i,
        val: profile.personal.country
      },
      {
        field: "linkedin",
        regex: /(linkedin)/i,
        val: profile.links.linkedin
      },
      {
        field: "github",
        regex: /(github)/i,
        val: profile.links.github
      },
      {
        field: "portfolio",
        regex: /(portfolio|personal[-_\s]?website|personal[-_\s]?url|homepage)/i,
        val: profile.links.portfolio
      },
      {
        field: "school",
        regex: /(school|university|college|institution)/i,
        val: profile.education[0].school
      },
      {
        field: "degree",
        regex: /(degree|major|field[-_\s]?of[-_\s]?study)/i,
        val: profile.education[0].fieldOfStudy
      },
      {
        field: "gpa",
        regex: /(gpa|grade[-_\s]?point)/i,
        val: profile.education[0].gpa
      },
      {
        field: "jobTitle",
        regex: /(current[-_\s]?title|job[-_\s]?title|most[-_\s]?recent[-_\s]?title|position)/i,
        val: profile.experience[0].title
      },
      {
        field: "company",
        regex: /(current[-_\s]?company|company[-_\s]?name|employer|most[-_\s]?recent[-_\s]?employer|organization)/i,
        val: profile.experience[0].company
      },
      {
        field: "skills",
        regex: /(skills|key[-_\s]?skills|technical[-_\s]?skills)/i,
        val: profile.skills.join(", ")
      }
    ];

    inputs.forEach(el => {
      // Don't overwrite if already filled
      if (el.value && el.value.trim().length > 0) return;

      // Extract all identifying cues
      const id = el.id || "";
      const name = el.name || "";
      const placeholder = el.placeholder || "";
      const autocomplete = el.getAttribute("autocomplete") || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      
      // Look up surrounding label text
      let labelText = "";
      if (el.labels && el.labels.length > 0) {
        labelText = el.labels[0].innerText || "";
      } else {
        const parentLabel = el.closest("label");
        if (parentLabel) labelText = parentLabel.innerText || "";
      }

      const cue = [id, name, placeholder, autocomplete, ariaLabel, labelText].join(" ");

      for (const p of patterns) {
        if (p.regex.test(cue) && p.val) {
          if (el.tagName === "SELECT") {
            if (setSelectValue(el, p.val)) filled.push(p.field);
          } else {
            if (setNativeValue(el, p.val)) filled.push(p.field);
          }
          break;
        }
      }
    });

    return filled;
  }

  // ==========================================
  // MAIN RUNNER
  // ==========================================
  function runAutofill(profile) {
    const platform = detectPlatform();
    let filled = [];

    // Run platform-specific adapter first
    if (platform === "Workday") {
      filled = autofillWorkday(profile);
    } else if (platform === "Greenhouse") {
      filled = autofillGreenhouse(profile);
    } else if (platform === "Lever") {
      filled = autofillLever(profile);
    } else if (platform === "Ashby") {
      filled = autofillAshby(profile);
    }

    // Always run universal heuristic as a safety pass to catch custom questions
    const universalFilled = autofillUniversal(profile);
    const combined = Array.from(new Set([...filled, ...universalFilled]));

    return {
      success: true,
      platform,
      count: combined.length,
      fields: combined
    };
  }

  return {
    detectPlatform,
    setNativeValue,
    setSelectValue,
    clickElement,
    runAutofill
  };
});

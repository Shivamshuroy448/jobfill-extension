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
    const host = (typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) return "Workday";
    if (host.includes("greenhouse.io")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("ashbyhq.com")) return "Ashby";
    if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
    if (host.includes("icims.com")) return "iCIMS";
    if (host.includes("tiktok.com") || host.includes("bytedance.com") || host.includes("feishu.cn")) return "TikTok";
    return "Universal";
  }

  // Helper: check if element is visible and interactive
  function isFillable(el) {
    if (!el) return false;
    if (el.disabled || el.readOnly) return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
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

  // Format month and year to YYYY - MM or YYYY-MM
  function formatYYYYMM(monthStr, yearStr, separator = " - ") {
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
    return `${yearStr.trim()}${separator}${mm}`;
  }

  // Helper: query selector with multiple fallback patterns
  function findField(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isFillable(el)) return el;
    }
    return null;
  }

  // Find input or textarea by checking labels, aria-labels, placeholders, or fallback selectors
  function getInputByLabelOrSelector(container, labelRegex, fallbackSelectors = []) {
    if (!container) return null;

    // 1. Search labels within container
    const labels = Array.from(container.querySelectorAll("label, div[data-automation-id*='formLabel'], span, p, legend"));
    for (const lbl of labels) {
      const text = (lbl.innerText || lbl.textContent || "").trim();
      const cleanText = text.replace(/[*:\s]+$/, "").trim();
      if (cleanText && labelRegex.test(cleanText)) {
        // Method A: htmlFor
        if (lbl.htmlFor) {
          const el = document.getElementById(lbl.htmlFor);
          if (el && isFillable(el)) return el;
        }
        // Method B: Nested input
        const nested = lbl.querySelector("input:not([type='hidden']), textarea, select");
        if (nested && isFillable(nested)) return nested;

        // Method C: Next element sibling (direct neighbor)
        let sibling = lbl.nextElementSibling;
        while (sibling) {
          if (sibling.matches && sibling.matches("input:not([type='hidden']), textarea, select") && isFillable(sibling)) {
            return sibling;
          }
          const nestedSib = sibling.querySelector && sibling.querySelector("input:not([type='hidden']), textarea, select");
          if (nestedSib && isFillable(nestedSib)) return nestedSib;
          // If sibling is another label, stop looking further down siblings
          if (sibling.matches && sibling.matches("label, [class*='label' i]")) break;
          sibling = sibling.nextElementSibling;
        }

        // Method D: Specific parent or field wrapper container (avoiding the entire section card)
        const wrapper = lbl.closest("div[class*='field' i], div[class*='item' i], div[class*='group' i], div[class*='row' i], div[class*='control' i], li, td");
        if (wrapper && wrapper !== container) {
          const candidate = wrapper.querySelector("input:not([type='hidden']), textarea, select");
          if (candidate && isFillable(candidate)) return candidate;
        }
      }
    }

    // 2. Search inputs by aria-label, placeholder, or name
    const allInputs = Array.from(container.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"));
    for (const inp of allInputs) {
      const aria = inp.getAttribute("aria-label") || "";
      const ph = inp.getAttribute("placeholder") || "";
      const name = inp.getAttribute("name") || "";
      if (labelRegex.test(aria) || labelRegex.test(ph) || labelRegex.test(name)) {
        if (isFillable(inp)) return inp;
      }
    }

    // 3. Fallback CSS selectors
    for (const sel of fallbackSelectors) {
      const el = container.querySelector(sel);
      if (el && isFillable(el)) return el;
    }

    return null;
  }

  // Safely set date input value using insertText and React prototype setter without mask corruption
  function setNativeDateValue(element, dateStr) {
    if (!element || !dateStr) return false;

    element.focus();

    // Reset React value tracker if present
    if (element._valueTracker) {
      element._valueTracker.setValue("");
    }

    // 1. Clear existing value cleanly via prototype setter
    const prototype = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, "");
    } else {
      element.value = "";
    }
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));

    // 2. Try document.execCommand('insertText') to simulate native user typing/pasting
    let insertSuccess = false;
    try {
      element.select();
      insertSuccess = document.execCommand("insertText", false, dateStr);
    } catch (e) {
      insertSuccess = false;
    }

    // 3. If execCommand was not effective or didn't set date, set via descriptor
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

    // 4. Dispatch bubbling event cascade
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

    element.classList.add("jobfill-highlight");
    return true;
  }

  // Find the exact ancestor container for a section header without engulfing sibling sections
  function getSectionCard(headerEl, headerRegex) {
    let card = headerEl.parentElement;
    let bestCard = card;
    while (card && card !== document.body) {
      const isCardBoundary = card.matches && card.matches('fieldset, [data-automation-id*="workExperience" i], [data-automation-id*="education" i], [data-automation-id*="panel" i], [data-automation-id*="compositeSubform" i], [role="region"], [role="group"]');

      const headersInCard = Array.from(card.querySelectorAll("h1, h2, h3, h4, h5, h6, legend, div, span, p"))
        .filter(el => {
          const t = (el.innerText || el.textContent || "").trim();
          return headerRegex.test(t);
        });

      const uniqueHeaders = Array.from(new Set(headersInCard.map(h => (h.innerText || "").trim())));
      if (uniqueHeaders.length <= 1) {
        bestCard = card;
        // If this container is an explicit card boundary with at least 2 inputs, stop climbing
        if (isCardBoundary && card.querySelectorAll("input:not([type='hidden']), textarea, select").length >= 2) {
          break;
        }
        // If parent container contains other major sections, stop climbing
        if (card.parentElement && card.parentElement !== document.body) {
          const siblingCards = Array.from(card.parentElement.children).filter(child => child !== card);
          const hasSiblingSection = siblingCards.some(child => {
            const childText = (child.innerText || "").toLowerCase();
            return /(education|work experience|websites|resume|skills|personal information)/.test(childText);
          });
          if (hasSiblingSection && card.querySelectorAll("input:not([type='hidden']), textarea, select").length >= 2) {
            break;
          }
        }
        card = card.parentElement;
      } else {
        break;
      }
    }
    return bestCard;
  }

  // Populate an individual Work Experience card/block
  function fillWorkExperienceBlock(container, exp, filledList, blockPrefix) {
    if (!container || !exp) return;

    // 1. Job Title
    const titleEl = getInputByLabelOrSelector(container, /^(job[-_\s]?title|title|position)$/i, [
      '[data-automation-id*="jobTitle" i] input',
      'input[data-automation-id*="jobTitle" i]',
      '[data-automation-id*="title" i] input',
      'input[data-automation-id*="title" i]',
      'input[name*="title" i]'
    ]);
    if (titleEl && (!titleEl.value || titleEl.value.trim().length === 0)) {
      if (setNativeValue(titleEl, exp.title)) filledList.push(`${blockPrefix}-title`);
    }

    // 2. Company
    const compEl = getInputByLabelOrSelector(container, /^(company|employer|organization|company[-_\s]?name)$/i, [
      '[data-automation-id*="company" i] input',
      'input[data-automation-id*="company" i]',
      'input[name*="company" i]'
    ]);
    if (compEl && (!compEl.value || compEl.value.trim().length === 0)) {
      if (setNativeValue(compEl, exp.company)) filledList.push(`${blockPrefix}-company`);
    }

    // 3. Location
    const locEl = getInputByLabelOrSelector(container, /^(location|city|job[-_\s]?location)$/i, [
      '[data-automation-id*="location" i] input',
      'input[data-automation-id*="location" i]',
      'input[name*="location" i]'
    ]);
    if (locEl && (!locEl.value || locEl.value.trim().length === 0)) {
      if (setNativeValue(locEl, exp.location)) filledList.push(`${blockPrefix}-location`);
    }

    // 4. Currently work here (Checkbox)
    const curCb = container.querySelector('input[type="checkbox"][data-automation-id*="currentlyWorkHere" i]') ||
                  getInputByLabelOrSelector(container, /currently work here/i, ['input[type="checkbox"]']);
    if (curCb && curCb.type === "checkbox") {
      if (exp.isCurrent && !curCb.checked) {
        clickElement(curCb);
        filledList.push(`${blockPrefix}-currentlyWorkHere`);
      } else if (!exp.isCurrent && curCb.checked) {
        clickElement(curCb);
      }
    }

    // 5. From & To Dates (MM/YYYY)
    const dateInputs = Array.from(container.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[data-automation-id*="date" i]')).filter(isFillable);
    const fromVal = formatMMYYYY(exp.startMonth, exp.startYear);
    const toVal = formatMMYYYY(exp.endMonth, exp.endYear);

    if (dateInputs.length >= 2) {
      if (fromVal) {
        setNativeDateValue(dateInputs[0], fromVal);
        filledList.push(`${blockPrefix}-from`);
      }
      if (toVal) {
        setNativeDateValue(dateInputs[1], toVal);
        filledList.push(`${blockPrefix}-to`);
      }
    } else {
      const fromEl = getInputByLabelOrSelector(container, /^(from|start[-_\s]?date|start)$/i, [
        '[data-automation-id*="startDate" i] input',
        'input[data-automation-id*="startDate" i]'
      ]);
      if (fromEl && fromVal) {
        setNativeDateValue(fromEl, fromVal);
        filledList.push(`${blockPrefix}-from`);
      }

      const toEl = getInputByLabelOrSelector(container, /^(to|end[-_\s]?date|end)$/i, [
        '[data-automation-id*="endDate" i] input',
        'input[data-automation-id*="endDate" i]'
      ]);
      if (toEl && toVal) {
        setNativeDateValue(toEl, toVal);
        filledList.push(`${blockPrefix}-to`);
      }
    }

    // 6. Role Description
    const descEl = getInputByLabelOrSelector(container, /(description|responsibilities|summary|duties)/i, [
      'textarea[data-automation-id*="roleDescription" i]',
      'textarea[data-automation-id*="description" i]',
      'textarea'
    ]);
    if (descEl && (!descEl.value || descEl.value.trim().length === 0)) {
      if (setNativeValue(descEl, exp.description)) filledList.push(`${blockPrefix}-description`);
    }
  }

  // Populate an individual Education card/block
  function fillEducationBlock(container, edu, filledList, blockPrefix) {
    if (!container || !edu) return;

    // School
    const schoolEl = getInputByLabelOrSelector(container, /^(school|university|institution|college)$/i, [
      '[data-automation-id*="school" i] input',
      'input[data-automation-id*="school" i]'
    ]);
    if (schoolEl && (!schoolEl.value || schoolEl.value.trim().length === 0)) {
      if (setNativeValue(schoolEl, edu.school)) filledList.push(`${blockPrefix}-school`);
    }

    // Degree
    const degreeEl = getInputByLabelOrSelector(container, /^(degree|degree[-_\s]?type)$/i, [
      '[data-automation-id*="degree" i] input',
      'input[data-automation-id*="degree" i]'
    ]);
    if (degreeEl && (!degreeEl.value || degreeEl.value.trim().length === 0)) {
      if (setNativeValue(degreeEl, edu.degree)) filledList.push(`${blockPrefix}-degree`);
    }

    // Field of Study / Major
    const majorEl = getInputByLabelOrSelector(container, /^(field[-_\s]?of[-_\s]?study|major|area[-_\s]?of[-_\s]?study)$/i, [
      '[data-automation-id*="field-of-study" i] input',
      'input[data-automation-id*="field-of-study" i]'
    ]);
    if (majorEl && (!majorEl.value || majorEl.value.trim().length === 0)) {
      if (setNativeValue(majorEl, edu.major || edu.fieldOfStudy)) filledList.push(`${blockPrefix}-major`);
    }

    // GPA
    const gpaEl = getInputByLabelOrSelector(container, /^(gpa|overall[-_\s]?result|grade[-_\s]?point[-_\s]?average)$/i, [
      '[data-automation-id*="gpa" i] input',
      'input[data-automation-id*="gpa" i]'
    ]);
    if (gpaEl && (!gpaEl.value || gpaEl.value.trim().length === 0)) {
      if (setNativeValue(gpaEl, edu.gpa)) filledList.push(`${blockPrefix}-gpa`);
    }

    // From & To Dates (MM/YYYY)
    const eduDateInputs = Array.from(container.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[data-automation-id*="date" i]')).filter(isFillable);
    const fVal = formatMMYYYY(edu.startMonth, edu.startYear);
    const tVal = formatMMYYYY(edu.endMonth, edu.endYear);

    if (eduDateInputs.length >= 2) {
      if (fVal) { setNativeDateValue(eduDateInputs[0], fVal); filledList.push(`${blockPrefix}-from`); }
      if (tVal) { setNativeDateValue(eduDateInputs[1], tVal); filledList.push(`${blockPrefix}-to`); }
    } else {
      const fromEl = getInputByLabelOrSelector(container, /^(from|start[-_\s]?date)$/i, [
        '[data-automation-id*="startDate" i] input'
      ]);
      if (fromEl && fVal) { setNativeDateValue(fromEl, fVal); filledList.push(`${blockPrefix}-from`); }

      const toEl = getInputByLabelOrSelector(container, /^(to|end[-_\s]?date|expected[-_\s]?graduation)$/i, [
        '[data-automation-id*="endDate" i] input'
      ]);
      if (toEl && tVal) { setNativeDateValue(toEl, tVal); filledList.push(`${blockPrefix}-to`); }
    }
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
      if (el && item.val && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, item.val)) filled.push(item.id);
      }
    });

    // Workday Dropdown inputs (Comboboxes)
    // Country / State selection
    const stateEl = findField([
      `[data-automation-id="addressSection_countryRegion"] input`,
      `[data-automation-id="addressSection_countryRegion"]`
    ]);
    if (stateEl && (!stateEl.value || stateEl.value.trim().length === 0)) {
      setSelectValue(stateEl, profile.personal.state);
      filled.push("state");
    }

    // Workday Legal / Sponsorship radios
    const radioContainers = document.querySelectorAll('[data-automation-id*="formLabel"], fieldset, [role="radiogroup"]');
    radioContainers.forEach(container => {
      const text = (container.innerText || "").toLowerCase();
      
      // Question: Are you legally authorized to work in the US? -> Yes
      if (text.includes("authorized to work") || text.includes("legally authorized")) {
        const yesRadio = container.querySelector('input[value*="yes" i], input[data-automation-id*="yes" i], input[id*="yes" i]') ||
                         Array.from(container.querySelectorAll('label, button, input[type="radio"]')).find(l => l.innerText && l.innerText.trim().toLowerCase() === "yes");
        if (yesRadio && !yesRadio.checked) {
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
        if (radio && !radio.checked) {
          clickElement(radio);
          filled.push("sponsorship-" + (targetVal ? "yes" : "no"));
        }
      }
    });

    // ==========================================
    // WORKDAY EXPERIENCE CARDS & NUMBERED BLOCKS
    // ==========================================
    const expRegex = /^Work Experience(\s*#?\s*\d+)?$/i;
    const allCandidateHeaders = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, legend, div, span, p"));
    const expHeaders = allCandidateHeaders.filter(el => {
      const t = (el.innerText || el.textContent || "").trim();
      if (!expRegex.test(t)) return false;
      const childMatch = el.querySelector("h1, h2, h3, h4, h5, h6, legend, div, span, p");
      if (childMatch && expRegex.test((childMatch.innerText || "").trim())) return false;
      return true;
    });

    if (expHeaders.length > 0) {
      expHeaders.forEach((hdr, idx) => {
        const text = (hdr.innerText || hdr.textContent || "").trim();
        const match = text.match(/Work Experience\s*#?\s*(\d+)/i);
        let roleIdx = idx;
        if (match && match[1]) {
          roleIdx = parseInt(match[1], 10) - 1; // "Work Experience 3" -> index 2 (NIC)
        }

        if (profile.experience[roleIdx]) {
          const card = getSectionCard(hdr, expRegex);
          if (card) {
            fillWorkExperienceBlock(card, profile.experience[roleIdx], filled, `workExperience-${roleIdx + 1}`);
          }
        }
      });
    } else {
      // Fallback: look for [data-automation-id*="workExperience"] containers
      const expBlocks = Array.from(document.querySelectorAll('[data-automation-id*="workExperience" i], [data-automation-id*="WorkExperience" i], fieldset[data-automation-id*="experience" i]'));
      if (expBlocks.length > 0) {
        expBlocks.forEach((block, idx) => {
          if (profile.experience[idx]) {
            fillWorkExperienceBlock(block, profile.experience[idx], filled, `workExperience-${idx + 1}`);
          }
        });
      }
    }

    // ==========================================
    // WORKDAY EDUCATION CARDS & NUMBERED BLOCKS
    // ==========================================
    const eduRegex = /^Education(\s*#?\s*\d+)?$/i;
    const eduHeaders = allCandidateHeaders.filter(el => {
      const t = (el.innerText || el.textContent || "").trim();
      if (!eduRegex.test(t)) return false;
      const childMatch = el.querySelector("h1, h2, h3, h4, h5, h6, legend, div, span, p");
      if (childMatch && eduRegex.test((childMatch.innerText || "").trim())) return false;
      return true;
    });

    if (eduHeaders.length > 0) {
      eduHeaders.forEach((hdr, idx) => {
        const text = (hdr.innerText || hdr.textContent || "").trim();
        const match = text.match(/Education\s*#?\s*(\d+)/i);
        let eduIdx = idx;
        if (match && match[1]) {
          eduIdx = parseInt(match[1], 10) - 1;
        }
        if (profile.education[eduIdx]) {
          const card = getSectionCard(hdr, eduRegex);
          if (card) {
            fillEducationBlock(card, profile.education[eduIdx], filled, `education-${eduIdx + 1}`);
          }
        }
      });
    } else {
      const eduBlocks = Array.from(document.querySelectorAll('[data-automation-id*="educationSection" i], [data-automation-id*="Education" i], fieldset[data-automation-id*="education" i]'));
      eduBlocks.forEach((block, idx) => {
        if (profile.education[idx]) {
          fillEducationBlock(block, profile.education[idx], filled, `education-${idx + 1}`);
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
  // 5. TIKTOK / BYTEDANCE ADAPTER & MULTI-CARD HELPERS
  // ==========================================

  // Helper: check if a container or card is inside an "Internship" section
  function isInsideInternshipSection(container) {
    if (!container) return false;
    let curr = container;
    while (curr && curr !== document.body) {
      const headings = Array.from(curr.querySelectorAll("h1, h2, h3, h4, h5, h6, legend, [class*='title' i], [class*='header' i]"));
      const headingTexts = headings.map(h => (h.innerText || h.textContent || "").trim()).filter(Boolean);

      const hasIntern = headingTexts.some(t => /internship/i.test(t));
      const hasWork = headingTexts.some(t => /(work\s*experience|employment|professional\s*experience)/i.test(t));

      if (hasIntern && !hasWork) return true;
      if (hasWork && !hasIntern) return false;
      if (hasIntern && hasWork) {
        const cRect = container.getBoundingClientRect();
        let closestDist = Infinity;
        let isClosestIntern = false;
        headings.forEach(h => {
          const t = (h.innerText || "").trim();
          const r = h.getBoundingClientRect();
          const dist = Math.abs(r.top - cRect.top);
          if (dist < closestDist) {
            closestDist = dist;
            isClosestIntern = /internship/i.test(t);
          }
        });
        return isClosestIntern;
      }

      // Check preceding siblings
      let prev = curr.previousElementSibling;
      while (prev) {
        const prevText = (prev.innerText || prev.textContent || "").toLowerCase();
        if (prevText.includes("internship") && !prevText.includes("work experience")) return true;
        if (prevText.includes("work experience") && !prevText.includes("internship")) return false;
        prev = prev.previousElementSibling;
      }

      curr = curr.parentElement;
    }
    return false;
  }

  // Find all candidate company inputs across the document
  function findCompanyInputs() {
    const allInputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio'])")).filter(isFillable);
    return allInputs.filter(inp => {
      const ph = inp.getAttribute("placeholder") || "";
      const name = inp.getAttribute("name") || "";
      const id = inp.id || "";
      const aria = inp.getAttribute("aria-label") || "";
      let lblText = "";
      if (inp.labels && inp.labels.length > 0) {
        lblText = inp.labels[0].innerText || "";
      } else {
        const parentLbl = inp.closest("label");
        if (parentLbl) lblText = parentLbl.innerText || "";
      }
      if (!lblText) {
        const wrapper = inp.closest("div[class*='item'], div[class*='field'], div[class*='form'], div");
        if (wrapper) {
          const lblEl = wrapper.querySelector("label, span[class*='label'], div[class*='label']");
          if (lblEl) lblText = lblEl.innerText || "";
        }
      }
      const combined = `${ph} ${name} ${id} ${aria} ${lblText}`.toLowerCase();
      if (combined.includes("school") || combined.includes("university") || combined.includes("college") || combined.includes("institution")) {
        return false;
      }
      return /(company|employer|organization|company[-_\s]?name)/i.test(combined);
    });
  }

  // Find the isolated card container for a given input among sibling inputs
  function getCardForInput(inputEl, allCandidateInputs) {
    let curr = inputEl.parentElement;
    let best = curr;
    while (curr && curr !== document.body) {
      const otherInCurr = allCandidateInputs.some(other => other !== inputEl && curr.contains(other));
      if (otherInCurr) break;
      best = curr;

      const hasMultipleFields = best.querySelectorAll("input:not([type='hidden']), textarea").length >= 2;
      if (hasMultipleFields) {
        const isCardBoundary = curr.matches && curr.matches('[class*="card" i], [class*="item" i], [class*="group" i], [class*="block" i], fieldset, [role="group"]');
        if (isCardBoundary) break;
        if (curr.parentElement && allCandidateInputs.some(other => other !== inputEl && curr.parentElement.contains(other))) {
          break;
        }
      }
      curr = curr.parentElement;
    }
    return best;
  }

  // Match existing company name string to index in profile.experience
  function findAssignedExperience(companyVal, profile) {
    if (!companyVal || !companyVal.trim()) return -1;
    const lower = companyVal.toLowerCase().trim();
    return profile.experience.findIndex(exp => {
      const expComp = exp.company.toLowerCase();
      if (lower.includes(expComp) || expComp.includes(lower)) return true;
      if (/nxtwave/i.test(lower) && /nxtwave/i.test(expComp)) return true;
      if (/(\btcs\b|tata consultancy)/i.test(lower) && /(\btcs\b|tata consultancy)/i.test(expComp)) return true;
      if (/(\bnic\b|national informatics)/i.test(lower) && /(\bnic\b|national informatics)/i.test(expComp)) return true;
      if (/triyas/i.test(lower) && /triyas/i.test(expComp)) return true;
      return false;
    });
  }

  // Multi-card Experience and Internship handler with deduplication and section awareness
  function autofillMultiExperienceUniversal(profile) {
    const filled = [];
    if (!profile.experience || profile.experience.length === 0) return filled;

    const allCompanyInputs = findCompanyInputs();
    if (allCompanyInputs.length === 0) return filled;

    const cards = allCompanyInputs.map(compInp => {
      const card = getCardForInput(compInp, allCompanyInputs);
      const isIntern = isInsideInternshipSection(card) || isInsideInternshipSection(compInp);
      return { compInp, card, isIntern };
    });

    const usedIndices = new Set();

    // Pass 1: Identify existing valid assignments
    cards.forEach(({ compInp, card, isIntern }) => {
      const val = (compInp.value || "").trim();
      if (val) {
        const matchedIdx = findAssignedExperience(val, profile);
        if (matchedIdx !== -1) {
          const exp = profile.experience[matchedIdx];
          const titleInp = getInputByLabelOrSelector(card, /^(title|job[-_\s]?title|position|role)$/i);
          const hasTitle = titleInp && titleInp.value && titleInp.value.trim().length > 0;
          if (isIntern && !exp.isInternship && !hasTitle) {
            // Nxtwave entered erroneously in an internship card without title — skip marking as legitimately used
          } else {
            usedIndices.add(matchedIdx);
          }
        }
      }
    });

    // Pass 2: Fill each card
    cards.forEach(({ compInp, card, isIntern }) => {
      let candidates = profile.experience.filter(e => isIntern ? e.isInternship : !e.isInternship);
      if (candidates.length === 0) candidates = profile.experience;

      const currVal = (compInp.value || "").trim();
      const matchedIdx = findAssignedExperience(currVal, profile);
      const titleInp = getInputByLabelOrSelector(card, /^(title|job[-_\s]?title|position|role)$/i);
      const hasTitle = titleInp && titleInp.value && titleInp.value.trim().length > 0;

      let targetExp = null;

      if (currVal && matchedIdx !== -1) {
        const matchedExp = profile.experience[matchedIdx];
        if (isIntern && !matchedExp.isInternship && !hasTitle) {
          // Replace erroneous Nxtwave with next unassigned internship (NIC, then Triyas)
          targetExp = candidates.find(cand => !usedIndices.has(profile.experience.indexOf(cand)));
        } else {
          targetExp = matchedExp;
        }
      } else if (!currVal) {
        targetExp = candidates.find(cand => !usedIndices.has(profile.experience.indexOf(cand)));
      }

      if (!targetExp) {
        targetExp = profile.experience.find((cand, idx) => !usedIndices.has(idx)) || candidates[0];
      }

      if (targetExp) {
        const expIdx = profile.experience.indexOf(targetExp);
        usedIndices.add(expIdx);

        const prefix = isIntern ? `internship-${expIdx + 1}` : `experience-${expIdx + 1}`;

        // 1. Company Name
        if (!compInp.value || compInp.value.trim() !== targetExp.company) {
          if (setNativeValue(compInp, targetExp.company)) filled.push(`${prefix}-company`);
        }

        // 2. Title
        if (titleInp && (!titleInp.value || titleInp.value.trim().length === 0)) {
          if (setNativeValue(titleInp, targetExp.title)) filled.push(`${prefix}-title`);
        }

        // 3. Start & End Dates
        let dateInputs = [];
        const dateLabels = Array.from(card.querySelectorAll("label, span, div, p")).filter(el => {
          const t = (el.innerText || el.textContent || "").trim();
          return /start\s*(&|and)\s*end\s*date|dates?\s*attended/i.test(t);
        });

        if (dateLabels.length > 0) {
          for (const dLbl of dateLabels) {
            let container = dLbl.closest("div[class*='item' i], div[class*='field' i], div[class*='date' i], div[class*='picker' i]");
            if (container && container !== card) {
              const inps = Array.from(container.querySelectorAll("input:not([type='hidden'])")).filter(inp => isFillable(inp) && inp !== compInp && inp !== titleInp);
              if (inps.length >= 2) {
                dateInputs = inps;
                break;
              }
            }
          }
        }

        if (dateInputs.length < 2) {
          const placeholderDates = Array.from(card.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[placeholder*="Year" i], input[placeholder*="Date" i]'))
            .filter(inp => isFillable(inp) && inp !== compInp && inp !== titleInp);
          if (placeholderDates.length >= 2) {
            dateInputs = placeholderDates;
          }
        }

        if (dateInputs.length < 2) {
          const unusedInputs = Array.from(card.querySelectorAll("input:not([type='hidden']):not([type='checkbox']):not([type='radio'])"))
            .filter(inp => isFillable(inp) && inp !== compInp && inp !== titleInp);
          if (unusedInputs.length >= 2) {
            dateInputs = unusedInputs;
          }
        }

        dateInputs = dateInputs.filter(inp => inp !== compInp && inp !== titleInp);

        if (dateInputs.length >= 2) {
          const ph0 = dateInputs[0].placeholder || "";
          const hasSlash = ph0.includes("/");
          const separator = ph0.includes(" - ") ? " - " : (ph0.includes("-") ? "-" : " - ");

          const startStr = hasSlash ? formatMMYYYY(targetExp.startMonth, targetExp.startYear) : formatYYYYMM(targetExp.startMonth, targetExp.startYear, separator);
          const endStr = hasSlash ? formatMMYYYY(targetExp.endMonth, targetExp.endYear) : formatYYYYMM(targetExp.endMonth, targetExp.endYear, separator);

          if (startStr && (!dateInputs[0].value || dateInputs[0].value.trim().length === 0)) {
            if (setNativeDateValue(dateInputs[0], startStr)) filled.push(`${prefix}-startDate`);
          }
          if (endStr && (!dateInputs[1].value || dateInputs[1].value.trim().length === 0)) {
            if (setNativeDateValue(dateInputs[1], endStr)) filled.push(`${prefix}-endDate`);
          }
        }

        // 4. Description
        const descInp = getInputByLabelOrSelector(card, /^(description|responsibilities|role[-_\s]?description|job[-_\s]?description)$/i, [
          "textarea"
        ]);
        if (descInp && (!descInp.value || descInp.value.trim().length === 0)) {
          if (setNativeValue(descInp, targetExp.description)) filled.push(`${prefix}-description`);
        }
      }
    });

    return filled;
  }

  // Multi-card Education handler
  function autofillMultiEducationUniversal(profile) {
    const filled = [];
    if (!profile.education || profile.education.length === 0) return filled;

    const allInputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio'])")).filter(isFillable);
    const schoolInputs = allInputs.filter(inp => {
      const ph = inp.getAttribute("placeholder") || "";
      const name = inp.getAttribute("name") || "";
      const id = inp.id || "";
      const aria = inp.getAttribute("aria-label") || "";
      let lbl = "";
      if (inp.labels && inp.labels.length > 0) lbl = inp.labels[0].innerText || "";
      else {
        const parentLbl = inp.closest("label");
        if (parentLbl) lbl = parentLbl.innerText || "";
      }
      const combined = `${ph} ${name} ${id} ${aria} ${lbl}`.toLowerCase();
      return /(school|university|institution|college)/i.test(combined);
    });

    if (schoolInputs.length === 0) return filled;

    schoolInputs.forEach((schoolInp, idx) => {
      const edu = profile.education[idx];
      if (!edu) return;

      const card = getCardForInput(schoolInp, schoolInputs);
      const prefix = `education-${idx + 1}`;

      // School
      if (!schoolInp.value || schoolInp.value.trim().length === 0) {
        if (setNativeValue(schoolInp, edu.school)) filled.push(`${prefix}-school`);
      }

      // Degree
      const degInp = getInputByLabelOrSelector(card, /^(degree|degree[-_\s]?level|qualification)$/i, [
        'input[placeholder*="degree" i]',
        'input[name*="degree" i]'
      ]);
      if (degInp && (!degInp.value || degInp.value.trim().length === 0)) {
        if (setNativeValue(degInp, edu.degreeType || edu.degree)) filled.push(`${prefix}-degree`);
      }

      // Major
      const majorInp = getInputByLabelOrSelector(card, /^(major|field[-_\s]?of[-_\s]?study|discipline|area[-_\s]?of[-_\s]?study)$/i, [
        'input[placeholder*="major" i]',
        'input[name*="major" i]'
      ]);
      if (majorInp && (!majorInp.value || majorInp.value.trim().length === 0)) {
        if (setNativeValue(majorInp, edu.major || edu.fieldOfStudy)) filled.push(`${prefix}-major`);
      }

      // GPA
      const gpaInp = getInputByLabelOrSelector(card, /^(gpa|grade|score)$/i, [
        'input[placeholder*="gpa" i]',
        'input[name*="gpa" i]'
      ]);
      if (gpaInp && (!gpaInp.value || gpaInp.value.trim().length === 0)) {
        if (setNativeValue(gpaInp, edu.gpa)) filled.push(`${prefix}-gpa`);
      }

      // Dates
      let dateInputs = [];
      const dateLabels = Array.from(card.querySelectorAll("label, span, div, p")).filter(el => {
        const t = (el.innerText || el.textContent || "").trim();
        return /start\s*(&|and)\s*end\s*date|dates?\s*attended|graduation\s*date/i.test(t);
      });
      if (dateLabels.length > 0) {
        for (const dLbl of dateLabels) {
          let container = dLbl.closest("div[class*='item' i], div[class*='field' i], div[class*='date' i], div[class*='picker' i]");
          if (container && container !== card) {
            const inps = Array.from(container.querySelectorAll("input:not([type='hidden'])")).filter(inp => isFillable(inp) && inp !== schoolInp && inp !== degInp && inp !== majorInp && inp !== gpaInp);
            if (inps.length >= 2) {
              dateInputs = inps;
              break;
            }
          }
        }
      }
      if (dateInputs.length < 2) {
        const placeholderDates = Array.from(card.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[placeholder*="Year" i], input[placeholder*="Date" i]'))
          .filter(inp => isFillable(inp) && inp !== schoolInp && inp !== degInp && inp !== majorInp && inp !== gpaInp);
        if (placeholderDates.length >= 2) dateInputs = placeholderDates;
      }
      if (dateInputs.length < 2) {
        const unused = Array.from(card.querySelectorAll("input:not([type='hidden']):not([type='checkbox']):not([type='radio'])"))
          .filter(inp => isFillable(inp) && inp !== schoolInp && inp !== degInp && inp !== majorInp && inp !== gpaInp);
        if (unused.length >= 2) dateInputs = unused;
      }
      dateInputs = dateInputs.filter(inp => inp !== schoolInp && inp !== degInp && inp !== majorInp && inp !== gpaInp);

      if (dateInputs.length >= 2) {
        const ph0 = dateInputs[0].placeholder || "";
        const hasSlash = ph0.includes("/");
        const separator = ph0.includes(" - ") ? " - " : (ph0.includes("-") ? "-" : " - ");

        const sVal = hasSlash ? formatMMYYYY(edu.startMonth, edu.startYear) : formatYYYYMM(edu.startMonth, edu.startYear, separator);
        const eVal = hasSlash ? formatMMYYYY(edu.endMonth, edu.endYear) : formatYYYYMM(edu.endMonth, edu.endYear, separator);

        if (sVal && (!dateInputs[0].value || dateInputs[0].value.trim().length === 0)) {
          if (setNativeDateValue(dateInputs[0], sVal)) filled.push(`${prefix}-startDate`);
        }
        if (eVal && (!dateInputs[1].value || dateInputs[1].value.trim().length === 0)) {
          if (setNativeDateValue(dateInputs[1], eVal)) filled.push(`${prefix}-endDate`);
        }
      }
    });

    return filled;
  }

  function autofillTikTok(profile) {
    const filled = [];

    // Personal details mapping
    const map = [
      { sel: ['input[placeholder*="first" i]', 'input[name*="first" i]'], val: profile.personal.firstName, name: "firstName" },
      { sel: ['input[placeholder*="last" i]', 'input[name*="last" i]'], val: profile.personal.lastName, name: "lastName" },
      { sel: ['input[placeholder*="name" i]', 'input[name*="name" i]'], val: profile.personal.fullName, name: "fullName" },
      { sel: ['input[type="email"]', 'input[placeholder*="email" i]'], val: profile.personal.email, name: "email" },
      { sel: ['input[type="tel"]', 'input[placeholder*="phone" i]'], val: profile.personal.phone, name: "phone" },
      { sel: ['input[placeholder*="linkedin" i]'], val: profile.links.linkedin, name: "linkedin" },
      { sel: ['input[placeholder*="github" i]'], val: profile.links.github, name: "github" },
      { sel: ['input[placeholder*="website" i]', 'input[placeholder*="portfolio" i]'], val: profile.links.portfolio, name: "portfolio" },
      { sel: ['input[placeholder*="city" i]', 'input[placeholder*="location" i]'], val: `${profile.personal.city}, ${profile.personal.stateCode}`, name: "location" }
    ];

    map.forEach(item => {
      const el = findField(item.sel);
      if (el && item.val && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    });

    // Run multi-experience & multi-education cards
    const expFilled = autofillMultiExperienceUniversal(profile);
    const eduFilled = autofillMultiEducationUniversal(profile);
    filled.push(...expFilled, ...eduFilled);

    // Legal / Authorization / Sponsorship radios
    const radioContainers = document.querySelectorAll("div[class*='item'], div[class*='field'], fieldset, [role='radiogroup']");
    radioContainers.forEach(container => {
      const text = (container.innerText || "").toLowerCase();
      if (text.includes("authorized to work") || text.includes("legally authorized")) {
        const yesEl = Array.from(container.querySelectorAll("label, span, input")).find(l => (l.innerText || l.value || "").trim().toLowerCase() === "yes");
        if (yesEl) clickElement(yesEl);
      }
      if (text.includes("sponsorship")) {
        const yesEl = Array.from(container.querySelectorAll("label, span, input")).find(l => (l.innerText || l.value || "").trim().toLowerCase() === "yes");
        if (yesEl) clickElement(yesEl);
      }
    });

    return filled;
  }

  // ==========================================
  // 6. UNIVERSAL HEURISTIC MATCHER
  // ==========================================
  function autofillUniversal(profile) {
    const filled = [];

    // 1. Process multi-card experience and education first with deduplication and section awareness
    const expFilled = autofillMultiExperienceUniversal(profile);
    const eduFilled = autofillMultiEducationUniversal(profile);
    filled.push(...expFilled, ...eduFilled);

    // 2. Definition of patterns for matching general applicant fields
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
        field: "skills",
        regex: /(skills|key[-_\s]?skills|technical[-_\s]?skills)/i,
        val: profile.skills.join(", ")
      }
    ];

    // Single-field form fallback only if multi-experience/education found no cards
    if (expFilled.length === 0) {
      patterns.push(
        {
          field: "company",
          regex: /(current[-_\s]?company|company[-_\s]?name|employer|most[-_\s]?recent[-_\s]?employer|organization)/i,
          val: profile.experience[0].company
        },
        {
          field: "jobTitle",
          regex: /(current[-_\s]?title|job[-_\s]?title|most[-_\s]?recent[-_\s]?title|position)/i,
          val: profile.experience[0].title
        }
      );
    }
    if (eduFilled.length === 0) {
      patterns.push(
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
        }
      );
    }

    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select");

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
    } else if (platform === "TikTok") {
      filled = autofillTikTok(profile);
    }

    // Run universal heuristic only for non-Workday platforms to protect Workday multi-card state
    if (platform !== "Workday") {
      const universalFilled = autofillUniversal(profile);
      filled = Array.from(new Set([...filled, ...universalFilled]));
    }

    return {
      success: true,
      platform,
      count: filled.length,
      fields: filled
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
      bytedance: "ByteDance"
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

    // 5. Fallback heuristics for any site
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

    // Clean tracking parameters from URL
    let cleanUrl = url;
    try {
      const u = new URL(url);
      u.searchParams.delete("_gl");
      u.searchParams.delete("_ga");
      u.searchParams.delete("pk_vid");
      cleanUrl = u.toString();
    } catch (e) {}

    return {
      company: company || "Cardinal Health",
      role: role || "Data & Analytics Internship",
      dateApplied,
      url: cleanUrl
    };
  }

  return {
    detectPlatform,
    setNativeValue,
    setSelectValue,
    clickElement,
    runAutofill,
    cleanCompanyName,
    extractJobMetadata
  };
});

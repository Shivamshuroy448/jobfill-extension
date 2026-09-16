// JobFill AI — Universal Site Handler (Enhanced & Resilient)
// Generic heuristic form autofiller for any job application or career portal
// (SmartRecruiters, iCIMS, Taleo, JazzHR, BambooHR, ADP, Workday, custom portals)

(function () {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function cleanLabelText(str) {
    if (!str) return "";
    return str
      .replace(/\s*[\(\[]?(required|optional|mandatory|starred)[\)\]]?/gi, "")
      .replace(/^[*:\s\-\u2022]+|[*:\s\-\u2022]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function setNativeValue(el, value) {
    if (!el || value === undefined || value === null) return false;
    el.focus();
    const proto = el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (el._valueTracker) el._valueTracker.setValue("");
    if (desc && desc.set) {
      desc.set.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    el.classList.add("jobfill-highlight");
    return true;
  }

  function isFillable(el) {
    if (!el || el.disabled || el.readOnly) return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }

  // Select option in native <select> supporting state abbreviations & fuzzy names
  function selectNative(el, matchValues) {
    if (!el || el.tagName !== "SELECT") return false;
    const values = Array.isArray(matchValues) ? matchValues : [matchValues];
    const cleanVals = values.filter(Boolean).map(v => v.toLowerCase().trim());

    for (let i = 0; i < el.options.length; i++) {
      const optText = el.options[i].text.toLowerCase().trim();
      const optVal = el.options[i].value.toLowerCase().trim();

      for (const target of cleanVals) {
        if (
          optText === target ||
          optVal === target ||
          optText.startsWith(target) ||
          optText.includes(target) ||
          target.includes(optText) ||
          optText.replace(/[\s\-_]/g, "") === target.replace(/[\s\-_]/g, "")
        ) {
          el.selectedIndex = i;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.classList.add("jobfill-highlight");
          return true;
        }
      }
    }
    return false;
  }

  // Deep & fuzzy input locator
  function getInputByLabelOrSelector(container, labelRegex, fallbackSelectors = []) {
    if (!container) return null;

    // 1. Search all label candidates
    const labels = Array.from(container.querySelectorAll("label, div[data-automation-id*='formLabel'], span[class*='label' i], p[class*='label' i], legend, .vdl-label"));
    for (const lbl of labels) {
      const rawText = (lbl.innerText || lbl.textContent || "").trim();
      const clean = cleanLabelText(rawText);
      if (clean && labelRegex.test(clean)) {
        if (lbl.htmlFor) {
          const el = document.getElementById(lbl.htmlFor);
          if (el && isFillable(el)) return el;
        }
        const nested = lbl.querySelector("input:not([type='hidden']), textarea, select");
        if (nested && isFillable(nested)) return nested;

        let sibling = lbl.nextElementSibling;
        let hops = 0;
        while (sibling && hops < 4) {
          if (sibling.matches && sibling.matches("input:not([type='hidden']), textarea, select") && isFillable(sibling)) {
            return sibling;
          }
          const nestedSib = sibling.querySelector && sibling.querySelector("input:not([type='hidden']), textarea, select");
          if (nestedSib && isFillable(nestedSib)) return nestedSib;
          if (sibling.matches && sibling.matches("label, [class*='label' i]")) break;
          sibling = sibling.nextElementSibling;
          hops++;
        }

        const wrapper = lbl.closest("div[class*='field' i], div[class*='item' i], div[class*='group' i], div[class*='row' i], div[class*='control' i], .vdl-form-group, li, td");
        if (wrapper && wrapper !== container) {
          const candidate = wrapper.querySelector("input:not([type='hidden']), textarea, select");
          if (candidate && isFillable(candidate)) return candidate;
        }
      }
    }

    // 2. Search by input attributes (aria-label, placeholder, name, id)
    const allInputs = Array.from(container.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"));
    for (const inp of allInputs) {
      const aria = cleanLabelText(inp.getAttribute("aria-label") || "");
      const ph = cleanLabelText(inp.getAttribute("placeholder") || "");
      const name = inp.getAttribute("name") || "";
      const id = inp.id || "";
      if (
        (aria && labelRegex.test(aria)) ||
        (ph && labelRegex.test(ph)) ||
        (name && labelRegex.test(name)) ||
        (id && labelRegex.test(id))
      ) {
        if (isFillable(inp)) return inp;
      }
    }

    // 3. Fallback selectors
    for (const sel of fallbackSelectors) {
      const el = container.querySelector(sel);
      if (el && isFillable(el)) return el;
    }

    return null;
  }

  function clickRadioByText(container, text) {
    if (!container) return false;
    const lower = text.toLowerCase().trim();
    const candidates = Array.from(container.querySelectorAll("label, input[type='radio'], [role='radio'], button"));
    for (const cand of candidates) {
      const t = (cand.innerText || cand.value || cand.getAttribute("aria-label") || "").trim().toLowerCase();
      if (t === lower || t.startsWith(lower) || t.includes(lower)) {
        const inp = cand.querySelector("input[type='radio']") || (cand.type === "radio" ? cand : null) ||
                    (cand.htmlFor && document.getElementById(cand.htmlFor)) || cand;
        if (inp) {
          inp.focus();
          inp.click();
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          inp.classList.add("jobfill-highlight");
          return true;
        }
      }
    }
    return false;
  }

  async function autofillUniversal(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;
    const eeo = profile.eeo;
    const legal = profile.legal;

    // 1. Personal fields with resilient patterns
    const personalMapping = [
      { regex: /(first\s*name|given\s*name|forename)/i, val: p.firstName, name: "firstName" },
      { regex: /(last\s*name|family\s*name|surname)/i, val: p.lastName, name: "lastName" },
      { regex: /(full\s*name|legal\s*name|candidate\s*name|^your\s*name$)/i, val: p.fullName || `${p.firstName} ${p.lastName}`, name: "fullName" },
      { regex: /(email|email\s*address|e-mail)/i, val: p.email, name: "email" },
      { regex: /(phone|phone\s*number|mobile|telephone|contact\s*number|cell)/i, val: p.phone, name: "phone" },
      { regex: /(street\s*address|address\s*line\s*1|address\s*1|^address$)/i, val: p.addressLine1, name: "addressLine1" },
      { regex: /(address\s*line\s*2|address\s*2|apt|suite|unit)/i, val: p.addressLine2 || "", name: "addressLine2" },
      { regex: /(city|town|municipality)/i, val: p.city, name: "city" },
      {
        regex: /(state|province|region|state\s*\/\s*territory|state\/province)/i,
        val: p.state,
        matchVariants: [p.state, p.stateCode, `${p.stateCode} - ${p.state}`, `${p.state} (${p.stateCode})`],
        name: "state"
      },
      { regex: /(zip|zip\s*code|postal\s*code|postcode|zip\s*\/\s*postal\s*code)/i, val: p.postalCode, name: "zip" },
      {
        regex: /(country|nation|country\s*\/\s*region)/i,
        val: p.country,
        matchVariants: [p.country, p.countryCode, "United States", "USA", "US", "United States of America"],
        name: "country"
      }
    ];

    for (const item of personalMapping) {
      if (!item.val) continue;
      const el = getInputByLabelOrSelector(document.body, item.regex);
      if (el && (!el.value || el.value.trim().length === 0)) {
        if (el.tagName === "SELECT") {
          const variants = item.matchVariants || [item.val];
          if (selectNative(el, variants)) filled.push(item.name);
        } else {
          if (setNativeValue(el, item.val)) filled.push(item.name);
        }
      }
    }

    await wait(100);

    // 2. Links (LinkedIn, GitHub, Portfolio)
    const linkMapping = [
      { regex: /(linkedin|linked\s*in)/i, val: l.linkedin, name: "linkedin" },
      { regex: /(github|git\s*hub)/i, val: l.github, name: "github" },
      { regex: /(portfolio|personal\s*website|website|blog)/i, val: l.portfolio || l.website, name: "portfolio" }
    ];

    for (const item of linkMapping) {
      if (!item.val) continue;
      const el = getInputByLabelOrSelector(document.body, item.regex);
      if (el && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    }

    await wait(100);

    // 3. Work Authorization & Sponsorship Radios
    const questionContainers = Array.from(document.querySelectorAll("fieldset, [role='radiogroup'], .field, .form-group, .vdl-form-group, div"))
      .filter(el => {
        const text = (el.innerText || "").toLowerCase();
        return /(authorized to work|legally authorized|eligible to work|require sponsorship|future sponsorship|visa sponsorship|now or in the future)/i.test(text);
      });

    for (const container of questionContainers) {
      const text = (container.innerText || "").toLowerCase();
      if (/(authorized to work|legally authorized|eligible to work)/i.test(text)) {
        const target = legal && legal.authorizedUS === "No" ? "no" : "yes";
        if (clickRadioByText(container, target)) filled.push("workAuthorization");
      } else if (/(require sponsorship|future sponsorship|visa sponsorship|now or in the future)/i.test(text)) {
        const target = legal && legal.requireSponsorship === "Yes" ? "yes" : "no";
        if (clickRadioByText(container, target)) filled.push("sponsorship");
      }
    }

    await wait(100);

    // 4. EEO Fields (Gender, Race, Veteran, Disability)
    const allSelects = Array.from(document.querySelectorAll("select"));
    for (const sel of allSelects) {
      const parentText = ((sel.parentElement ? sel.parentElement.innerText : "") + " " + (sel.name || "") + " " + (sel.id || "")).toLowerCase();
      if (/gender/i.test(parentText)) {
        if (selectNative(sel, [eeo.gender || "Male", "Man"])) filled.push("eeo-gender");
      } else if (/(race|ethnicity)/i.test(parentText)) {
        if (selectNative(sel, [eeo.race || "Asian", "Asian (Not Hispanic or Latino)", "Asian (not Hispanic)"])) filled.push("eeo-race");
      } else if (/veteran/i.test(parentText)) {
        if (selectNative(sel, ["not a protected", "not a veteran", "I am not a protected veteran", "No"])) filled.push("eeo-veteran");
      } else if (/disability/i.test(parentText)) {
        if (selectNative(sel, ["don't have", "no, i do not", "No, I Do Not Have A Disability", "No"])) filled.push("eeo-disability");
      }
    }

    await wait(100);

    // 5. AI Question Answering for Open-Ended Textareas & Screening Prompts
    if (typeof window !== "undefined" && window.JobFillAI && typeof window.JobFillAI.scanPageQuestions === "function") {
      try {
        const questions = window.JobFillAI.scanPageQuestions();
        for (const q of questions) {
          if (q.element && (!q.element.value || q.element.value.trim().length === 0)) {
            const generated = await window.JobFillAI.generateAnswer(q.label);
            if (generated && generated.answer) {
              setNativeValue(q.element, generated.answer);
              q.element.classList.add("jobfill-ai-highlight");
              filled.push(`ai-${q.category}`);
            }
          }
        }
      } catch (err) {
        console.warn("JobFill AI: Open-ended question autofill encountered:", err);
      }
    }

    return filled;
  }

  if (typeof window !== "undefined") {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.universal = { autofill: autofillUniversal };
  }
})();

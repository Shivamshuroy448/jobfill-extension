// JobFill AI — ADP Workforce Now Site Driver
// Supports: workforcenow.adp.com (Recruitment & Applicant Portal)

(function () {
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Pierce React controlled inputs and trigger synthetic events
  function setNativeValue(el, value) {
    if (!el) return false;
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

  // Handle ADP's custom vdl-dropdown-list (e.g. PersonalAddress_state)
  async function selectAdpDropdown(dropdownBtnOrInput, targetText) {
    if (!dropdownBtnOrInput) return false;
    dropdownBtnOrInput.focus();
    dropdownBtnOrInput.click();
    await wait(300);

    const lower = targetText.toLowerCase().trim();

    // Look for listbox popup associated with this dropdown
    const listboxId = dropdownBtnOrInput.getAttribute("aria-controls") ||
                      dropdownBtnOrInput.id + "__listbox" ||
                      dropdownBtnOrInput.id + "_listbox";
    let listbox = document.getElementById(listboxId);
    if (!listbox) {
      listbox = document.querySelector("[role='listbox'], .vdl-popup, ul[class*='dropdown']");
    }

    if (listbox) {
      const options = Array.from(listbox.querySelectorAll("[role='option'], li, .vdl-menu-item"));
      for (const opt of options) {
        const text = (opt.innerText || opt.textContent || "").toLowerCase().trim();
        if (text === lower || text.includes(lower) || (lower.length === 2 && text.startsWith(lower))) {
          opt.scrollIntoView({ block: "nearest" });
          opt.click();
          await wait(150);
          dropdownBtnOrInput.classList.add("jobfill-highlight");
          return true;
        }
      }
    }

    // Fallback: try setting value directly and pressing Enter
    if (dropdownBtnOrInput.tagName === "INPUT") {
      setNativeValue(dropdownBtnOrInput, targetText);
      dropdownBtnOrInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      dropdownBtnOrInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      return true;
    }

    return false;
  }

  // Handle React-Select or custom combobox (e.g. Country dropdown)
  async function selectReactSelect(containerOrInput, targetText) {
    if (!containerOrInput) return false;
    const input = containerOrInput.querySelector("input") || containerOrInput;
    input.focus();
    input.click();
    await wait(200);

    setNativeValue(input, targetText);
    await wait(250);

    const menu = document.querySelector(".select__menu, [class*='-menu'], [role='listbox']");
    if (menu) {
      const opts = Array.from(menu.querySelectorAll("[class*='-option'], [role='option'], li"));
      const lower = targetText.toLowerCase();
      for (const opt of opts) {
        const t = (opt.innerText || "").toLowerCase();
        if (t.includes(lower) || lower.includes(t)) {
          opt.click();
          await wait(150);
          return true;
        }
      }
    }

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    return false;
  }

  // Helper to find an input by ADP-specific ID or normalized label
  function getAdpInput(idOrName, labelPatterns = []) {
    // Direct ID check
    let el = document.getElementById(idOrName) || document.querySelector(`[name="${idOrName}"]`);
    if (el) return el;

    // Fuzzy label check
    const labels = Array.from(document.querySelectorAll("label, [class*='label' i], span"));
    for (const lbl of labels) {
      const text = (lbl.innerText || lbl.textContent || "").replace(/[*:\s]+$/, "").trim().toLowerCase();
      for (const pattern of labelPatterns) {
        if (text === pattern || text.startsWith(pattern) || (pattern.length > 5 && text.includes(pattern))) {
          if (lbl.htmlFor) {
            el = document.getElementById(lbl.htmlFor);
            if (el) return el;
          }
          const nested = lbl.querySelector("input, textarea, select, [role='combobox']");
          if (nested) return nested;

          let sibling = lbl.nextElementSibling;
          while (sibling) {
            if (sibling.matches && sibling.matches("input, textarea, select, [role='combobox']")) return sibling;
            const child = sibling.querySelector && sibling.querySelector("input, textarea, select, [role='combobox']");
            if (child) return child;
            if (sibling.matches && sibling.matches("label, [class*='label' i]")) break;
            sibling = sibling.nextElementSibling;
          }
        }
      }
    }
    return null;
  }

  // Click radio or checkbox by label text
  function clickAdpRadio(container, labelText) {
    if (!container) return false;
    const lower = labelText.toLowerCase();
    const options = Array.from(container.querySelectorAll("label, [role='radio'], [role='checkbox'], input[type='radio'], input[type='checkbox']"));
    for (const opt of options) {
      const t = (opt.innerText || opt.value || opt.getAttribute("aria-label") || "").toLowerCase().trim();
      if (t === lower || t.startsWith(lower) || t.includes(lower)) {
        const inp = opt.querySelector("input") || (opt.tagName === "INPUT" ? opt : null) ||
                    (opt.htmlFor && document.getElementById(opt.htmlFor)) || opt;
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

  // Main ADP Autofill Handler
  async function autofillAdp(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;
    const eeo = profile.eeo;
    const legal = profile.legal;

    // 1. Personal Information (Step 1)
    const personalFields = [
      { id: "PersonalAddress_firstName", patterns: ["first name", "given name", "first name*"], val: p.firstName, name: "firstName" },
      { id: "PersonalAddress_middleName", patterns: ["middle name", "middle initial"], val: p.middleName || "", name: "middleName" },
      { id: "PersonalAddress_lastName", patterns: ["last name", "family name", "surname", "last name*"], val: p.lastName, name: "lastName" },
      { id: "PersonalContact_email", patterns: ["personal email", "email address", "email", "email*"], val: p.email, name: "email" },
      { id: "PersonalContact_contactNumber", patterns: ["mobile", "phone number", "phone", "contact number", "mobile*"], val: p.phone, name: "phone" },
      { id: "PersonalAddress_addressLine1", patterns: ["address line 1", "street address", "address", "address line 1*"], val: p.addressLine1, name: "addressLine1" },
      { id: "PersonalAddress_addressLine2", patterns: ["address line 2", "apt", "suite", "unit"], val: p.addressLine2 || "", name: "addressLine2" },
      { id: "PersonalAddress_city", patterns: ["city", "town", "city*"], val: p.city, name: "city" },
      { id: "PersonalAddress_postalCode", patterns: ["postal code", "zip code", "zip", "postal code*"], val: p.postalCode, name: "postalCode" }
    ];

    for (const f of personalFields) {
      if (!f.val) continue;
      const el = getAdpInput(f.id, f.patterns);
      if (el && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, f.val)) filled.push(f.name);
      }
    }

    // State / Territory (vdl-dropdown-list)
    const stateEl = document.getElementById("PersonalAddress_state") ||
                    getAdpInput("PersonalAddress_state", ["state / territory", "state", "province", "state*"]);
    if (stateEl) {
      const stateVal = p.stateCode ? `${p.stateCode} - ${p.state}` : p.state;
      const success = await selectAdpDropdown(stateEl, stateVal);
      if (success) filled.push("state");
    }

    // Country (React-Select or combobox)
    const countryEl = document.getElementById("PersonalAddress_country") ||
                      getAdpInput("PersonalAddress_country", ["country", "country*"]);
    if (countryEl) {
      const success = await selectReactSelect(countryEl, p.country || "United States of America");
      if (success) filled.push("country");
    }

    await wait(200);

    // 2. Screening Questions & Radio/Selects (Step 3 or Single Page)
    const fieldsets = Array.from(document.querySelectorAll("fieldset, [role='group'], [role='radiogroup'], .form-group, .vdl-form-group, div[class*='question' i]"));
    for (const fs of fieldsets) {
      const text = (fs.innerText || "").toLowerCase();

      // Authorized to work in US
      if (/(authorized to work|legally authorized|eligible to work in the united states)/i.test(text)) {
        const val = legal && legal.authorizedUS === "No" ? "no" : "yes";
        if (clickAdpRadio(fs, val)) filled.push("workAuthorization");
      }
      // Require sponsorship
      else if (/(require sponsorship|future sponsorship|visa sponsorship|now or in the future)/i.test(text)) {
        const val = legal && legal.requireSponsorship === "Yes" ? "yes" : "no";
        if (clickAdpRadio(fs, val)) filled.push("sponsorship");
      }
      // Previously employed by this company
      else if (/(previously employed|worked for|former employee)/i.test(text)) {
        if (clickAdpRadio(fs, "no")) filled.push("priorEmployment");
      }
      // 18 years of age or older
      else if (/(18 years of age|at least 18|legal age)/i.test(text)) {
        if (clickAdpRadio(fs, "yes")) filled.push("legalAge");
      }
      // Willing to relocate
      else if (/(willing to relocate|relocation)/i.test(text)) {
        if (clickAdpRadio(fs, "yes")) filled.push("relocation");
      }
    }

    // 3. EEO / Voluntary Self-Identification (Step 4)
    const eeoSelects = Array.from(document.querySelectorAll("select, [role='combobox']"));
    for (const sel of eeoSelects) {
      const parentText = ((sel.closest("div, fieldset") ? sel.closest("div, fieldset").innerText : "") + " " + (sel.id || "")).toLowerCase();
      if (/gender/i.test(parentText)) {
        if (sel.tagName === "SELECT") {
          for (let i = 0; i < sel.options.length; i++) {
            if (/male/i.test(sel.options[i].text) && !/female/i.test(sel.options[i].text)) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
              filled.push("eeo-gender");
              break;
            }
          }
        }
      } else if (/(race|ethnicity)/i.test(parentText)) {
        if (sel.tagName === "SELECT") {
          for (let i = 0; i < sel.options.length; i++) {
            if (/asian/i.test(sel.options[i].text)) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
              filled.push("eeo-race");
              break;
            }
          }
        }
      } else if (/veteran/i.test(parentText)) {
        if (sel.tagName === "SELECT") {
          for (let i = 0; i < sel.options.length; i++) {
            if (/not a protected|not a veteran/i.test(sel.options[i].text)) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
              filled.push("eeo-veteran");
              break;
            }
          }
        }
      } else if (/disability/i.test(parentText)) {
        if (sel.tagName === "SELECT") {
          for (let i = 0; i < sel.options.length; i++) {
            if (/don't have|no, i do not/i.test(sel.options[i].text)) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
              filled.push("eeo-disability");
              break;
            }
          }
        }
      }
    }

    return filled;
  }

  if (typeof window !== "undefined") {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.adp = { autofill: autofillAdp };
  }
})();

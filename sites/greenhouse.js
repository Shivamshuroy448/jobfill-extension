// JobFill AI — Greenhouse Site Handler
// Handles job-boards.greenhouse.io and boards.greenhouse.io
// Key insight: React-Select dropdowns ONLY respond to keyboard ArrowDown+Enter on the focused input

(function () {
  // ── Utility ────────────────────────────────────────────────────────────────
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function setNativeValue(el, value) {
    if (!el) return false;
    el.focus();
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (el._valueTracker) el._valueTracker.setValue('');
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    el.classList.add('jobfill-highlight');
    return true;
  }

  function findField(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && !el.disabled && !el.readOnly) return el;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  // ── React-Select Keyboard Navigator ────────────────────────────────────────
  // The ONLY reliable way to open and select from React-Select on Greenhouse.
  // click() / mousedown events are synthetic and lack the isTrusted flag, so
  // React ignores them. Keyboard events on the focused input work every time.
  async function reactSelectPick(inputId, matchText) {
    const inp = document.getElementById(inputId);
    if (!inp) {
      console.warn(`JobFill: React-Select input #${inputId} not found`);
      return false;
    }

    // Scroll into view — MUST do this or focus fails silently
    inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await wait(150);
    inp.focus();
    await wait(150);

    // Fire ArrowDown to open the dropdown menu
    inp.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true
    }));
    await wait(300); // wait for menu to render

    // Find all rendered option elements
    // They appear as [id^="react-select-{inputId}-option-"]
    const optSelector = `[id^="react-select-${inputId}-option-"]`;
    const opts = Array.from(document.querySelectorAll(optSelector));

    if (opts.length === 0) {
      // Fallback: try the menu-list children
      const menuList = document.querySelector('.select__menu-list');
      if (menuList) {
        const children = Array.from(menuList.children);
        const match = children.findIndex(c =>
          c.textContent.toLowerCase().includes(matchText.toLowerCase())
        );
        if (match >= 0) {
          for (let j = 0; j < match; j++) {
            inp.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true
            }));
            await wait(60);
          }
          inp.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
          }));
          return true;
        }
      }
      // Last resort: just press Enter on whatever is highlighted
      inp.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
      return false;
    }

    // Find the option index matching our text
    const targetIdx = opts.findIndex(o =>
      o.textContent.toLowerCase().includes(matchText.toLowerCase())
    );

    if (targetIdx < 0) {
      // Select first option if no match
      inp.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
      return false;
    }

    // Navigate down to the target (first ArrowDown already moved to index 0)
    for (let j = 0; j < targetIdx; j++) {
      inp.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true
      }));
      await wait(60);
    }

    inp.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
    }));
    await wait(150);
    return true;
  }

  // ── Handle native <select> (non-React) ────────────────────────────────────
  function selectNative(el, matchText) {
    if (!el || el.tagName !== 'SELECT') return false;
    const lower = matchText.toLowerCase();
    for (let i = 0; i < el.options.length; i++) {
      const optText = el.options[i].text.toLowerCase();
      const optVal = el.options[i].value.toLowerCase();
      if (optText.includes(lower) || lower.includes(optText.replace(/[\s-]/g, '')) || optVal.includes(lower)) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.classList.add('jobfill-highlight');
        return true;
      }
    }
    return false;
  }

  // ── Check if element uses React-Select (has .select__input class) ──────────
  function isReactSelect(el) {
    if (!el) return false;
    return el.classList.contains('select__input') ||
           el.closest('.select__control') !== null;
  }

  // ── Smart dropdown handler: native or React-Select ────────────────────────
  async function smartSelect(fieldId, matchText) {
    // First check for a native <select> with this ID or nearby
    const nativeSel = document.getElementById(fieldId);
    if (nativeSel && nativeSel.tagName === 'SELECT') {
      return selectNative(nativeSel, matchText);
    }

    // Check for React-Select input
    const reactInp = document.getElementById(fieldId);
    if (reactInp) {
      return await reactSelectPick(fieldId, matchText);
    }

    // Try finding by name/aria
    const byName = document.querySelector(`select[name*="${fieldId}"]`);
    if (byName) return selectNative(byName, matchText);

    return false;
  }

  // ── Greenhouse Custom Questions helper ─────────────────────────────────────
  // Finds a custom question textarea/input by searching for its label text
  function findCustomQuestion(labelPattern) {
    const labels = Array.from(document.querySelectorAll('label, .field label, .custom-question label'));
    for (const lbl of labels) {
      const txt = (lbl.innerText || lbl.textContent || '').trim();
      if (labelPattern.test(txt)) {
        if (lbl.htmlFor) {
          const el = document.getElementById(lbl.htmlFor);
          if (el) return el;
        }
        // Look for next textarea/input sibling
        let sib = lbl.nextElementSibling;
        while (sib) {
          const el = sib.matches('textarea, input') ? sib : sib.querySelector('textarea, input');
          if (el) return el;
          sib = sib.nextElementSibling;
        }
        // Parent wrapper
        const wrapper = lbl.closest('.field, .custom-field, .form-field, li');
        if (wrapper) {
          const el = wrapper.querySelector('textarea, input:not([type=hidden])');
          if (el) return el;
        }
      }
    }
    return null;
  }

  // ── Radio / Checkbox helper ────────────────────────────────────────────────
  function clickRadioByText(container, text) {
    const labels = Array.from(container.querySelectorAll('label'));
    for (const lbl of labels) {
      const t = (lbl.innerText || lbl.textContent || '').trim().toLowerCase();
      if (t === text.toLowerCase() || t.includes(text.toLowerCase())) {
        const inp = lbl.querySelector('input[type=radio], input[type=checkbox]') ||
                    (lbl.htmlFor && document.getElementById(lbl.htmlFor));
        if (inp) {
          inp.focus();
          inp.click();
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.classList.add('jobfill-highlight');
          return true;
        }
      }
    }
    return false;
  }

  // ── Main Greenhouse autofill entry ─────────────────────────────────────────
  async function autofillGreenhouse(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;
    const eeo = profile.eeo;

    // ── 1. Standard text fields ──────────────────────────────────────────────
    const textFields = [
      { sel: ['#first_name', 'input[name="job_application[first_name]"]'], val: p.firstName, name: 'firstName' },
      { sel: ['#last_name', 'input[name="job_application[last_name]"]'], val: p.lastName, name: 'lastName' },
      { sel: ['#email', 'input[name="job_application[email]"]'], val: p.email, name: 'email' },
      { sel: ['#phone', 'input[name="job_application[phone]"]', 'input[type=tel]'], val: p.phone, name: 'phone' },
      {
        sel: [
          'input[autocomplete="custom-question-linkedin-profile"]',
          'input[id*="linkedin" i]', 'input[name*="linkedin" i]',
          'input[placeholder*="linkedin" i]'
        ],
        val: l.linkedin, name: 'linkedin'
      },
      {
        sel: [
          'input[autocomplete="custom-question-website"]',
          'input[id*="website" i]', 'input[name*="website" i]',
          'input[placeholder*="website" i]', 'input[placeholder*="portfolio" i]'
        ],
        val: l.portfolio, name: 'website'
      },
      {
        sel: [
          'input[autocomplete="custom-question-github"]',
          'input[id*="github" i]', 'input[name*="github" i]'
        ],
        val: l.github, name: 'github'
      }
    ];

    for (const { sel, val, name } of textFields) {
      if (!val) continue;
      const el = findField(sel);
      if (el && (!el.value || el.value.trim() === '')) {
        if (setNativeValue(el, val)) filled.push(name);
      }
    }

    // ── 2. Location (Greenhouse uses a text input that triggers autocomplete) ──
    const locEl = findField(['#job_application_location', 'input[name*="location" i]', 'input[placeholder*="city" i]']);
    if (locEl && (!locEl.value || locEl.value.trim() === '')) {
      setNativeValue(locEl, `${p.city}, ${p.stateCode}`);
      filled.push('location');
    }

    await wait(200);

    // ── 3. Preferred Name custom question ────────────────────────────────────
    const prefNameEl = findCustomQuestion(/preferred[\s-]?name|preferred[\s-]?first[\s-]?name/i);
    if (prefNameEl && (!prefNameEl.value || prefNameEl.value.trim() === '')) {
      setNativeValue(prefNameEl, p.preferredName || p.firstName);
      filled.push('preferredName');
    }

    // ── 4. Pronouns React-Select ─────────────────────────────────────────────
    await wait(100);
    const pronounsEl = document.getElementById('pronouns');
    if (pronounsEl) {
      const done = await reactSelectPick('pronouns', 'he/him/his');
      if (done) filled.push('pronouns');
    }

    // ── 5. How did you hear about us / referral source ───────────────────────
    await wait(100);
    // Try common IDs: q_XXXXXXXX, source, referral_source etc.
    const allSelects = Array.from(document.querySelectorAll('select'));
    for (const sel of allSelects) {
      const lbl = document.querySelector(`label[for="${sel.id}"]`);
      const lblText = (lbl ? lbl.innerText || lbl.textContent : sel.getAttribute('aria-label') || '').toLowerCase();
      if (/(how did you|hear about|referral|source)/i.test(lblText)) {
        const done = selectNative(sel, 'LinkedIn') || selectNative(sel, 'Job Board') || selectNative(sel, 'Website');
        if (done) filled.push('referralSource');
        break;
      }
    }

    // ── 6. Work Authorization ────────────────────────────────────────────────
    await wait(100);
    const authContainers = Array.from(document.querySelectorAll('fieldset, [role=radiogroup], .field, .custom-field, li, div'))
      .filter(c => /(authorized|legally authorized|work authorization|eligible to work)/i.test(c.innerText || ''));
    for (const c of authContainers) {
      const done = clickRadioByText(c, 'yes') || clickRadioByText(c, 'Yes');
      if (done) { filled.push('workAuthorization'); break; }
    }

    // ── 7. Sponsorship ────────────────────────────────────────────────────────
    await wait(100);
    const sponsorContainers = Array.from(document.querySelectorAll('fieldset, [role=radiogroup], .field, .custom-field, li, div'))
      .filter(c => /(sponsor|visa sponsor|require sponsorship)/i.test(c.innerText || ''));
    for (const c of sponsorContainers) {
      const ans = profile.legal && profile.legal.requireSponsorship === 'Yes' ? 'yes' : 'no';
      const done = clickRadioByText(c, ans);
      if (done) { filled.push('sponsorship'); break; }
    }

    // ── 8. Graduation / Degree / Education dropdowns ─────────────────────────
    await wait(100);
    const gradContainers = Array.from(document.querySelectorAll('fieldset, [role=radiogroup], .field, li, div'))
      .filter(c => /(graduation|degree|expected graduation)/i.test(c.innerText || ''));
    for (const c of gradContainers) {
      // Look for React-Select input or native select
      const reactInp = c.querySelector('.select__input');
      const nativeSel = c.querySelector('select');
      if (reactInp && reactInp.id) {
        // "Fall 2027" or "December 2027" — try to match semester format
        const semesterMatch = 'Fall 2027'; // Dec 2027 → Fall semester
        await reactSelectPick(reactInp.id, semesterMatch);
        filled.push('graduation');
        break;
      } else if (nativeSel) {
        selectNative(nativeSel, 'Fall') || selectNative(nativeSel, '2027');
        filled.push('graduation');
        break;
      }
    }

    // ── 9. EEO Fields (React-Select) ─────────────────────────────────────────
    await wait(200);
    const eeoFields = [
      { id: 'gender', match: eeo.gender || 'Male' },
      { id: 'race', match: eeo.race || 'Asian' },
      { id: 'hispanic_ethnicity', match: 'Decline' },
      { id: 'veteran_status', match: 'not a protected' },
      { id: 'disability_status', match: "don't have" }
    ];

    for (const { id, match } of eeoFields) {
      await wait(100);
      const el = document.getElementById(id);
      if (!el) continue;

      // Check if it's a native select or React-Select
      if (el.tagName === 'SELECT') {
        const done = selectNative(el, match);
        if (done) filled.push(id);
      } else if (isReactSelect(el) || el.classList.contains('select__input')) {
        const done = await reactSelectPick(id, match);
        if (done) filled.push(id);
      } else {
        // Try both methods
        const done = selectNative(el, match);
        if (!done) await reactSelectPick(id, match);
        filled.push(id);
      }
    }

    // ── 10. Hub / Location preference (Figma-specific React-Select) ──────────
    await wait(100);
    const hubContainers = Array.from(document.querySelectorAll('.field, li, div'))
      .filter(c => /(preferred hub|preferred location|office location)/i.test(c.innerText || ''));
    for (const c of hubContainers) {
      const reactInp = c.querySelector('.select__input');
      if (reactInp && reactInp.id) {
        await reactSelectPick(reactInp.id, 'New York');
        filled.push('preferredHub');
        break;
      }
    }

    // ── 11. Previously worked here (No) ─────────────────────────────────────
    await wait(100);
    const workedContainers = Array.from(document.querySelectorAll('fieldset, [role=radiogroup], .field, li, div'))
      .filter(c => /(previously worked|worked here before|former employee|worked at)/i.test(c.innerText || ''));
    for (const c of workedContainers) {
      clickRadioByText(c, 'No');
      filled.push('workedBefore');
      break;
    }

    // ── 12. Custom question: cover letter / "Why [Company]?" ─────────────────
    // We skip role-specific essays — user fills those manually
    // But we do fill generic "tell us about yourself" with a short intro
    const tellUsEl = findCustomQuestion(/tell us about yourself|brief introduction|short bio/i);
    if (tellUsEl && (!tellUsEl.value || tellUsEl.value.trim() === '')) {
      const intro = `I'm Shivamshu Roy, a Master's student in Engineering Science (Data Science) at SUNY Buffalo (Dec 2027). I have hands-on experience in machine learning, data pipelines, and full-stack development through roles at NxtWave, TCS, and NIC, plus four published/open-source projects including IEEE research. I'm authorized to work in the US via F-1 CPT/STEM OPT and excited to contribute on day one.`;
      setNativeValue(tellUsEl, intro);
      filled.push('intro');
    }

    return filled;
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.greenhouse = {
      autofill: autofillGreenhouse,
      reactSelectPick,
      setNativeValue,
      findCustomQuestion,
      clickRadioByText,
      wait
    };
  }
})();

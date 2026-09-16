// JobFill AI — Ashby Site Handler (jobs.ashbyhq.com)

(function () {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function setNativeValue(el, value) {
    if (!el) return false;
    el.focus();
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
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
      } catch (e) {}
    }
    return null;
  }

  function clickRadioByText(container, text) {
    if (!container) return false;
    const lower = text.toLowerCase();
    const labels = Array.from(container.querySelectorAll('label, div[role="radio"], button[role="radio"], div'));
    for (const lbl of labels) {
      const t = (lbl.innerText || lbl.textContent || '').trim().toLowerCase();
      if (t === lower || t.startsWith(lower) || t.includes(lower)) {
        const inp = lbl.querySelector('input[type=radio], input[type=checkbox]') ||
                    (lbl.htmlFor && document.getElementById(lbl.htmlFor)) || lbl;
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

  async function autofillAshby(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;

    // 1. Text inputs
    const map = [
      { sel: ['input[name*="name" i]', 'input[autocomplete="name"]', 'input[placeholder*="full name" i]', 'input[id*="name" i]'], val: p.fullName || `${p.firstName} ${p.lastName}`, name: "fullName" },
      { sel: ['input[type="email"]', 'input[name*="email" i]', 'input[placeholder*="email" i]'], val: p.email, name: "email" },
      { sel: ['input[type="tel"]', 'input[name*="phone" i]', 'input[placeholder*="phone" i]'], val: p.phone, name: "phone" },
      { sel: ['input[placeholder*="LinkedIn" i]', 'input[name*="linkedin" i]', 'input[id*="linkedin" i]'], val: l.linkedin, name: "linkedin" },
      { sel: ['input[placeholder*="GitHub" i]', 'input[name*="github" i]', 'input[id*="github" i]'], val: l.github, name: "github" },
      { sel: ['input[placeholder*="Website" i]', 'input[placeholder*="Portfolio" i]', 'input[name*="website" i]', 'input[name*="portfolio" i]'], val: l.portfolio, name: "portfolio" }
    ];

    for (const item of map) {
      if (!item.val) continue;
      const el = findField(item.sel);
      if (el && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    }

    await wait(200);

    // 2. Work Authorization and Sponsorship Radios
    const fieldGroups = Array.from(document.querySelectorAll('fieldset, [role="radiogroup"], [class*="formField" i], [class*="fieldContainer" i], [class*="question" i]'));
    for (const group of fieldGroups) {
      const text = (group.innerText || '').toLowerCase();
      if (/(authorized to work|legally authorized|eligible to work)/i.test(text)) {
        if (clickRadioByText(group, 'yes')) filled.push('workAuthorization');
      } else if (/(require sponsorship|future sponsorship|visa sponsorship)/i.test(text)) {
        const target = profile.legal && profile.legal.requireSponsorship === 'Yes' ? 'yes' : 'no';
        if (clickRadioByText(group, target)) filled.push('sponsorship');
      }
    }

    return filled;
  }

  if (typeof window !== 'undefined') {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.ashby = { autofill: autofillAshby };
  }
})();

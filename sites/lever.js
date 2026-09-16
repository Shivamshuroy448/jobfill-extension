// JobFill AI — Lever Site Handler (jobs.lever.co)

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

  function clickRadioByText(container, text) {
    if (!container) return false;
    const lower = text.toLowerCase();
    const labels = Array.from(container.querySelectorAll('label, .application-field, div'));
    for (const lbl of labels) {
      const t = (lbl.innerText || lbl.textContent || '').trim().toLowerCase();
      if (t === lower || t.startsWith(lower) || t.includes(lower)) {
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

  async function autofillLever(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;
    const eeo = profile.eeo;

    // 1. Standard inputs
    const map = [
      { sel: ['input[name="name"]', '#name', 'input[placeholder*="full name" i]'], val: p.fullName || `${p.firstName} ${p.lastName}`, name: "fullName" },
      { sel: ['input[name="email"]', '#email', 'input[type="email"]'], val: p.email, name: "email" },
      { sel: ['input[name="phone"]', '#phone', 'input[type="tel"]'], val: p.phone, name: "phone" },
      { sel: ['input[name="org"]', 'input[placeholder*="current company" i]'], val: (profile.education && profile.education[0] ? profile.education[0].school : "State University of New York at Buffalo"), name: "org" },
      { sel: ['input[name="urls[LinkedIn]"]', 'input[placeholder*="LinkedIn" i]'], val: l.linkedin, name: "linkedin" },
      { sel: ['input[name="urls[GitHub]"]', 'input[placeholder*="GitHub" i]'], val: l.github, name: "github" },
      { sel: ['input[name="urls[Portfolio]"]', 'input[placeholder*="Portfolio" i]'], val: l.portfolio, name: "portfolio" },
      { sel: ['input[name="urls[Other]"]', 'input[placeholder*="Other" i]'], val: l.medium || l.website, name: "otherUrl" }
    ];

    for (const item of map) {
      if (!item.val) continue;
      const el = findField(item.sel);
      if (el && (!el.value || el.value.trim().length === 0)) {
        if (setNativeValue(el, item.val)) filled.push(item.name);
      }
    }

    await wait(150);

    // 2. Additional Information / Comments (Cover Letter or Summary)
    const commentsEl = findField(['textarea[name="comments"]', 'textarea[placeholder*="additional" i]']);
    if (commentsEl && (!commentsEl.value || commentsEl.value.trim().length === 0)) {
      const summary = `Hi! I'm Shivamshu Roy, Master's student in Engineering Science (Data Science) at SUNY Buffalo (graduating Dec 2027, GPA 3.85). I have experience building data pipelines, ML models, and interactive dashboards at NxtWave, TCS, and NIC, alongside IEEE-published research. I am authorized to work in the US (F-1 / STEM OPT eligible). Portfolio: ${l.portfolio}`;
      if (setNativeValue(commentsEl, summary)) filled.push("comments");
    }

    await wait(150);

    // 3. Custom Questions & Radios (Work auth, sponsorship)
    const customCards = Array.from(document.querySelectorAll('.application-question, .custom-question, .application-field, fieldset, [class*="question" i]'));
    for (const card of customCards) {
      const text = (card.innerText || '').toLowerCase();
      if (/(authorized to work|legally authorized|eligible to work)/i.test(text)) {
        if (clickRadioByText(card, 'yes')) filled.push('workAuthorization');
      } else if (/(require sponsorship|future sponsorship|visa sponsorship)/i.test(text)) {
        const target = profile.legal && profile.legal.requireSponsorship === 'Yes' ? 'yes' : 'no';
        if (clickRadioByText(card, target)) filled.push('sponsorship');
      }
    }

    await wait(150);

    // 4. EEO Fields (Lever dropdowns)
    const selectElements = Array.from(document.querySelectorAll('select'));
    for (const sel of selectElements) {
      const parentText = ((sel.parentElement ? sel.parentElement.innerText : '') + ' ' + (sel.getAttribute('name') || '')).toLowerCase();
      if (/gender/i.test(parentText)) {
        if (selectNative(sel, eeo.gender || 'Male')) filled.push('eeo-gender');
      } else if (/(race|ethnicity)/i.test(parentText)) {
        if (selectNative(sel, eeo.race || 'Asian')) filled.push('eeo-race');
      } else if (/veteran/i.test(parentText)) {
        if (selectNative(sel, 'not a protected') || selectNative(sel, 'not a veteran')) filled.push('eeo-veteran');
      } else if (/disability/i.test(parentText)) {
        if (selectNative(sel, "don't have") || selectNative(sel, "no, i do not")) filled.push('eeo-disability');
      }
    }

    return filled;
  }

  if (typeof window !== 'undefined') {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.lever = { autofill: autofillLever };
  }
})();

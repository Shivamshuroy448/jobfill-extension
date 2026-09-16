// JobFill AI — Workday Site Handler (*.myworkdayjobs.com, *.workday.com)

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
      try { const el = document.querySelector(sel); if (el && !el.disabled) return el; } catch(e){}
    }
    return null;
  }

  function isFillable(el) {
    if (!el || el.disabled || el.readOnly) return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }

  function setSelectValue(el, text) {
    if (!el) return false;
    if (el.tagName === 'SELECT') {
      const lower = text.toLowerCase();
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i].text.toLowerCase();
        if (opt.includes(lower) || lower.includes(opt)) {
          el.selectedIndex = i;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.classList.add('jobfill-highlight');
          return true;
        }
      }
      return false;
    }
    return setNativeValue(el, text);
  }

  function getInputByLabel(container, regex) {
    const labels = Array.from(container.querySelectorAll('label, div[data-automation-id*="formLabel"], legend, span'));
    for (const lbl of labels) {
      const txt = (lbl.innerText || lbl.textContent || '').trim().replace(/[*:\s]+$/, '').trim();
      if (regex.test(txt)) {
        if (lbl.htmlFor) { const el = document.getElementById(lbl.htmlFor); if (el && isFillable(el)) return el; }
        const nested = lbl.querySelector('input:not([type=hidden]), textarea, select');
        if (nested && isFillable(nested)) return nested;
        let sib = lbl.nextElementSibling;
        while (sib) {
          if (sib.matches && sib.matches('input:not([type=hidden]), textarea, select') && isFillable(sib)) return sib;
          const ns = sib.querySelector && sib.querySelector('input:not([type=hidden]), textarea, select');
          if (ns && isFillable(ns)) return ns;
          if (sib.matches && sib.matches('label, [class*="label" i]')) break;
          sib = sib.nextElementSibling;
        }
        const wrapper = lbl.closest('div[class*="field" i], div[class*="item" i], div[class*="row" i], li, fieldset');
        if (wrapper && wrapper !== container) {
          const cand = wrapper.querySelector('input:not([type=hidden]), textarea, select');
          if (cand && isFillable(cand)) return cand;
        }
      }
    }
    const allInputs = Array.from(container.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea, select'));
    for (const inp of allInputs) {
      const aria = inp.getAttribute('aria-label') || '';
      const ph = inp.getAttribute('placeholder') || '';
      const name = inp.getAttribute('name') || '';
      if (regex.test(aria) || regex.test(ph) || regex.test(name)) { if (isFillable(inp)) return inp; }
    }
    return null;
  }

  function formatMMYYYY(month, year) {
    if (!year) return '';
    const m = { january:'01',jan:'01',february:'02',feb:'02',march:'03',mar:'03',april:'04',apr:'04',may:'05',june:'06',jun:'06',july:'07',jul:'07',august:'08',aug:'08',september:'09',sep:'09',october:'10',oct:'10',november:'11',nov:'11',december:'12',dec:'12' };
    const mm = m[(month || '').toLowerCase()] || '01';
    return `${mm}/${year}`;
  }

  function clickRadio(container, textOrValue) {
    const lower = textOrValue.toLowerCase();
    const radios = Array.from(container.querySelectorAll('input[type=radio], label, button[role=radio]'));
    for (const r of radios) {
      const t = ((r.innerText || r.value || r.getAttribute('aria-label') || '')).toLowerCase().trim();
      if (t === lower || t.includes(lower)) {
        r.focus(); r.click(); r.dispatchEvent(new Event('change', { bubbles: true }));
        r.classList.add('jobfill-highlight');
        return true;
      }
    }
    return false;
  }

  function fillExpBlock(container, exp, filled, prefix) {
    const titleEl = getInputByLabel(container, /^(job[\s-]?title|title|position|role)$/i);
    if (titleEl && !titleEl.value.trim()) { if (setNativeValue(titleEl, exp.title)) filled.push(prefix+'-title'); }

    const compEl = getInputByLabel(container, /^(company|employer|organization)$/i);
    if (compEl && !compEl.value.trim()) { if (setNativeValue(compEl, exp.company)) filled.push(prefix+'-company'); }

    const locEl = getInputByLabel(container, /^(location|city|job[\s-]?location)$/i);
    if (locEl && !locEl.value.trim()) { if (setNativeValue(locEl, exp.location)) filled.push(prefix+'-location'); }

    const dates = Array.from(container.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[data-automation-id*="date" i]')).filter(isFillable);
    const fromVal = formatMMYYYY(exp.startMonth, exp.startYear);
    const toVal = formatMMYYYY(exp.endMonth, exp.endYear);
    if (dates.length >= 2) {
      if (fromVal) { setNativeValue(dates[0], fromVal); filled.push(prefix+'-from'); }
      if (toVal) { setNativeValue(dates[1], toVal); filled.push(prefix+'-to'); }
    }

    const descEl = getInputByLabel(container, /(description|responsibilities|summary)/i) || container.querySelector('textarea');
    if (descEl && !descEl.value.trim()) { if (setNativeValue(descEl, exp.description)) filled.push(prefix+'-desc'); }
  }

  function fillEduBlock(container, edu, filled, prefix) {
    const schoolEl = getInputByLabel(container, /^(school|university|institution|college)$/i);
    if (schoolEl && !schoolEl.value.trim()) { if (setNativeValue(schoolEl, edu.school)) filled.push(prefix+'-school'); }

    const degEl = getInputByLabel(container, /^(degree|degree[\s-]?type)$/i);
    if (degEl && !degEl.value.trim()) { if (setNativeValue(degEl, edu.degree || edu.degreeType)) filled.push(prefix+'-degree'); }

    const majorEl = getInputByLabel(container, /^(field[\s-]?of[\s-]?study|major|area)$/i);
    if (majorEl && !majorEl.value.trim()) { if (setNativeValue(majorEl, edu.major || edu.fieldOfStudy)) filled.push(prefix+'-major'); }

    const gpaEl = getInputByLabel(container, /^(gpa|grade[\s-]?point)$/i);
    if (gpaEl && !gpaEl.value.trim()) { if (setNativeValue(gpaEl, edu.gpa)) filled.push(prefix+'-gpa'); }

    const dates = Array.from(container.querySelectorAll('input[placeholder*="YYYY" i], input[placeholder*="MM" i], input[data-automation-id*="date" i]')).filter(isFillable);
    const fv = formatMMYYYY(edu.startMonth, edu.startYear);
    const tv = formatMMYYYY(edu.endMonth, edu.endYear);
    if (dates.length >= 2) {
      if (fv) { setNativeValue(dates[0], fv); filled.push(prefix+'-from'); }
      if (tv) { setNativeValue(dates[1], tv); filled.push(prefix+'-to'); }
    }
  }

  async function autofillWorkday(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;

    // Personal fields by data-automation-id
    const fieldMap = [
      { id: 'legalNameSection_firstName', val: p.firstName },
      { id: 'legalNameSection_lastName', val: p.lastName },
      { id: 'preferredNameSection_preferredName', val: p.preferredName },
      { id: 'addressSection_addressLine1', val: p.addressLine1 },
      { id: 'addressSection_city', val: p.city },
      { id: 'addressSection_postalCode', val: p.postalCode },
      { id: 'phone-number', val: p.phone },
      { id: 'email', val: p.email }
    ];

    for (const { id, val } of fieldMap) {
      if (!val) continue;
      const el = findField([`[data-automation-id="${id}"] input`, `input[data-automation-id="${id}"]`, `[data-automation-id="${id}"]`]);
      if (el && (!el.value || !el.value.trim())) { if (setNativeValue(el, val)) filled.push(id); }
    }

    // Links
    const linkMap = [
      { sel: ['input[data-automation-id*="linkedin" i]', 'input[id*="linkedin" i]'], val: l.linkedin, name: 'linkedin' },
      { sel: ['input[data-automation-id*="website" i]', 'input[id*="website" i]', 'input[id*="portfolio" i]'], val: l.portfolio, name: 'portfolio' },
      { sel: ['input[data-automation-id*="github" i]', 'input[id*="github" i]'], val: l.github, name: 'github' }
    ];
    for (const { sel, val, name } of linkMap) {
      if (!val) continue;
      const el = findField(sel);
      if (el && (!el.value || !el.value.trim())) { if (setNativeValue(el, val)) filled.push(name); }
    }

    await wait(200);

    // Country/State combobox
    const stateEl = findField(['[data-automation-id="addressSection_countryRegion"] input']);
    if (stateEl && !stateEl.value.trim()) { setSelectValue(stateEl, p.state); filled.push('state'); }

    await wait(200);

    // Radio groups: authorization, sponsorship
    const radioGroups = Array.from(document.querySelectorAll('[data-automation-id*="formLabel"], fieldset, [role=radiogroup], .WD-Label'));
    for (const c of radioGroups) {
      const txt = (c.innerText || '').toLowerCase();
      if (/(authorized to work|legally authorized)/i.test(txt)) {
        if (clickRadio(c, 'yes')) filled.push('authorized');
      }
      if (/(require sponsorship|visa sponsorship)/i.test(txt)) {
        const ans = profile.legal.requireSponsorship === 'Yes' ? 'yes' : 'no';
        if (clickRadio(c, ans)) filled.push('sponsorship');
      }
    }

    await wait(200);

    // Work Experience blocks
    const expRegex = /^Work Experience(\s*#?\s*\d+)?$/i;
    const allHeads = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,legend,div,span,p'));
    const expHeads = allHeads.filter(el => {
      const t = (el.innerText || el.textContent || '').trim();
      if (!expRegex.test(t)) return false;
      const child = el.querySelector('h1,h2,h3,h4,h5,h6,legend,div,span,p');
      return !(child && expRegex.test((child.innerText || '').trim()));
    });

    for (let i = 0; i < expHeads.length; i++) {
      const t = (expHeads[i].innerText || '').trim();
      const m = t.match(/Work Experience\s*#?\s*(\d+)/i);
      const idx = m ? parseInt(m[1], 10) - 1 : i;
      if (profile.experience[idx]) {
        let card = expHeads[i].parentElement;
        for (let j = 0; j < 8 && card && card !== document.body; j++) {
          if (card.querySelectorAll('input:not([type=hidden]), textarea').length >= 2) break;
          card = card.parentElement;
        }
        if (card) { fillExpBlock(card, profile.experience[idx], filled, `exp-${idx+1}`); }
      }
    }

    await wait(200);

    // Education blocks
    const eduRegex = /^Education(\s*#?\s*\d+)?$/i;
    const eduHeads = allHeads.filter(el => {
      const t = (el.innerText || el.textContent || '').trim();
      if (!eduRegex.test(t)) return false;
      const child = el.querySelector('h1,h2,h3,h4,h5,h6,legend,div,span,p');
      return !(child && eduRegex.test((child.innerText || '').trim()));
    });

    for (let i = 0; i < eduHeads.length; i++) {
      const t = (eduHeads[i].innerText || '').trim();
      const m = t.match(/Education\s*#?\s*(\d+)/i);
      const idx = m ? parseInt(m[1], 10) - 1 : i;
      if (profile.education[idx]) {
        let card = eduHeads[i].parentElement;
        for (let j = 0; j < 8 && card && card !== document.body; j++) {
          if (card.querySelectorAll('input:not([type=hidden]), textarea').length >= 2) break;
          card = card.parentElement;
        }
        if (card) { fillEduBlock(card, profile.education[idx], filled, `edu-${idx+1}`); }
      }
    }

    return filled;
  }

  if (typeof window !== 'undefined') {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.workday = { autofill: autofillWorkday };
  }
})();

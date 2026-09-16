// JobFill AI — TikTok / ByteDance Site Handler
// Handles lifeattiktok.com, tiktok.com career portals
// Key patterns proven in this session:
//   - Date picker: mousedown+mouseup+click on label, then click panel items
//   - Add card: click .addMore-add, wait 500ms for render
//   - setVal: HTMLInputElement.prototype setter + input/change/blur events

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

  function tripleClick(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(ev =>
      el.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true }))
    );
  }

  // ── Month name to abbreviated form (TikTok uses 3-letter abbrevs) ──────────
  const MONTH_ABBREV = {
    january: 'Jan', jan: 'Jan',
    february: 'Feb', feb: 'Feb',
    march: 'Mar', mar: 'Mar',
    april: 'Apr', apr: 'Apr',
    may: 'May',
    june: 'Jun', jun: 'Jun',
    july: 'Jul', jul: 'Jul',
    august: 'Aug', aug: 'Aug',
    september: 'Sep', sep: 'Sep',
    october: 'Oct', oct: 'Oct',
    november: 'Nov', nov: 'Nov',
    december: 'Dec', dec: 'Dec'
  };

  function toMonthAbbrev(monthStr) {
    if (!monthStr) return 'Jan';
    const key = monthStr.toLowerCase().trim();
    return MONTH_ABBREV[key] || monthStr.slice(0, 3);
  }

  // ── TikTok date picker ────────────────────────────────────────────────────
  // The picker has two label divs (start, end). Each opens a panel with
  // a year list and a month list (data-cy attributes for values).
  async function tiktokSetDate(labelEl, month, year) {
    if (!labelEl) return false;

    labelEl.scrollIntoView({ block: 'center' });
    await wait(100);
    tripleClick(labelEl);
    await wait(400); // wait for panel to open

    // Find the open panel (two lists: year at index 0, month at index 1)
    const panels = document.querySelectorAll('[class*="-period-month-panel-list"]');
    if (panels.length < 2) {
      console.warn('JobFill TikTok: date picker panel not found, retrying once');
      tripleClick(labelEl);
      await wait(600);
    }

    const panelsRetry = document.querySelectorAll('[class*="-period-month-panel-list"]');
    if (panelsRetry.length < 2) {
      console.warn('JobFill TikTok: date picker panel still not open');
      return false;
    }

    const yearList = panelsRetry[0];
    const monthList = panelsRetry[1];

    // Click year
    const yearItem = yearList.querySelector(`[data-cy="${year}"]`);
    if (yearItem) {
      tripleClick(yearItem);
      await wait(200);
    } else {
      console.warn(`JobFill TikTok: year ${year} not found in panel`);
    }

    // Click month abbreviation
    const monthAbbrev = toMonthAbbrev(month);
    const monthItem = monthList.querySelector(`[data-cy="${monthAbbrev}"]`);
    if (monthItem) {
      tripleClick(monthItem);
      await wait(200);
    } else {
      console.warn(`JobFill TikTok: month ${monthAbbrev} not found in panel`);
    }

    return true;
  }

  // ── Fill a date-picker pair (start + end) on a card ──────────────────────
  async function fillTiktokDates(card, startMonth, startYear, endMonth, endYear) {
    const labels = card.querySelectorAll('.atsx-date-picker-period-month-label');
    if (labels.length < 1) {
      // Some cards use text inputs instead
      const dateInputs = card.querySelectorAll('input[placeholder*="YYYY"], input[placeholder*="MM"]');
      if (dateInputs.length >= 1) {
        setNativeValue(dateInputs[0], `${startMonth} ${startYear}`);
      }
      if (dateInputs.length >= 2) {
        setNativeValue(dateInputs[1], `${endMonth} ${endYear}`);
      }
      return;
    }

    // labels[0] = start date, labels[1] = end date
    await tiktokSetDate(labels[0], startMonth, startYear);
    if (labels.length >= 2 && endMonth && endYear) {
      await wait(200);
      await tiktokSetDate(labels[1], endMonth, endYear);
    }
  }

  // ── Find sections by title ────────────────────────────────────────────────
  function findSection(titlePattern) {
    const sectionTitles = document.querySelectorAll('.createFormSection-mutiple > .createFormSection-left > .createFormSection-title, .createFormSection-title, [class*="sectionTitle"]');
    for (const title of sectionTitles) {
      const text = (title.innerText || title.textContent || '').trim();
      if (titlePattern.test(text)) {
        // Walk up to find the section container
        let parent = title.parentElement;
        for (let i = 0; i < 5; i++) {
          if (!parent) break;
          // The section parent should contain both the title and an addMore-add button OR multiple cards
          if (parent.querySelector('.addMore-add') || parent.querySelectorAll('[class*="resumeEditForm"]').length > 0) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return title.closest('[class*="section"], [class*="Section"]') || title.parentElement;
      }
    }
    return null;
  }

  // ── Ensure N cards exist in a section ────────────────────────────────────
  async function ensureCardCount(section, targetCount, cardSelector) {
    if (!section) return 0;
    const addBtn = section.querySelector('.addMore-add');
    let current = section.querySelectorAll(cardSelector).length;

    while (current < targetCount && addBtn) {
      addBtn.scrollIntoView({ block: 'center' });
      addBtn.click();
      await wait(600);
      const newCount = section.querySelectorAll(cardSelector).length;
      if (newCount === current) break; // no change, stop
      current = newCount;
    }
    return current;
  }

  // ── Fill a single Project card ────────────────────────────────────────────
  async function fillProjectCard(card, project) {
    if (!card || !project) return;

    // Project name (id pattern: project[N].name)
    const nameEl = card.querySelector('input[id*="name"], input[name*="name"], input[placeholder*="project name" i]');
    if (nameEl && (!nameEl.value || nameEl.value.trim() === '')) {
      setNativeValue(nameEl, project.name);
    }

    // Project link / URL
    const linkEl = card.querySelector('input[id*="link"], input[id*="url"], input[placeholder*="link" i], input[placeholder*="url" i], input[placeholder*="github" i]');
    if (linkEl && (!linkEl.value || linkEl.value.trim() === '')) {
      setNativeValue(linkEl, project.link || '');
    }

    // Description / summary textarea
    const descEl = card.querySelector('textarea');
    if (descEl && (!descEl.value || descEl.value.trim() === '')) {
      setNativeValue(descEl, project.description || '');
    }

    // Dates
    await fillTiktokDates(card, project.startMonth, project.startYear, project.endMonth, project.endYear);
  }

  // ── Fill a single Internship card ─────────────────────────────────────────
  async function fillInternshipCard(card, exp) {
    if (!card || !exp) return;

    // Company
    const compEl = card.querySelector('input[id*="company"], input[name*="company"], input[placeholder*="company" i]');
    if (compEl && (!compEl.value || compEl.value.trim() === '')) {
      setNativeValue(compEl, exp.company);
    }

    // Role / Title
    const roleEl = card.querySelector('input[id*="role"], input[id*="title"], input[id*="position"], input[placeholder*="role" i], input[placeholder*="title" i], input[placeholder*="position" i]');
    if (roleEl && (!roleEl.value || roleEl.value.trim() === '')) {
      setNativeValue(roleEl, exp.title);
    }

    // Location
    const locEl = card.querySelector('input[id*="location"], input[id*="city"], input[placeholder*="location" i], input[placeholder*="city" i]');
    if (locEl && (!locEl.value || locEl.value.trim() === '')) {
      setNativeValue(locEl, exp.location || '');
    }

    // Description
    const descEl = card.querySelector('textarea');
    if (descEl && (!descEl.value || descEl.value.trim() === '')) {
      setNativeValue(descEl, exp.description || '');
    }

    // Dates
    await fillTiktokDates(card, exp.startMonth, exp.startYear, exp.endMonth, exp.endYear);
  }

  // ── Fill a single Work Experience card ────────────────────────────────────
  async function fillWorkCard(card, exp) {
    if (!card || !exp) return;

    const compEl = card.querySelector('input[id*="company"], input[name*="company"], input[placeholder*="company" i]');
    if (compEl && (!compEl.value || compEl.value.trim() === '')) {
      setNativeValue(compEl, exp.company);
    }

    const titleEl = card.querySelector('input[id*="title"], input[id*="role"], input[id*="position"], input[placeholder*="title" i], input[placeholder*="role" i]');
    if (titleEl && (!titleEl.value || titleEl.value.trim() === '')) {
      setNativeValue(titleEl, exp.title);
    }

    const locEl = card.querySelector('input[id*="location"], input[placeholder*="location" i]');
    if (locEl && (!locEl.value || locEl.value.trim() === '')) {
      setNativeValue(locEl, exp.location || '');
    }

    const descEl = card.querySelector('textarea');
    if (descEl && (!descEl.value || descEl.value.trim() === '')) {
      setNativeValue(descEl, exp.description || '');
    }

    await fillTiktokDates(card, exp.startMonth, exp.startYear, exp.endMonth, exp.endYear);
  }

  // ── Radio/checkbox click helper ────────────────────────────────────────────
  function clickOption(container, textPattern) {
    if (!container) return false;
    const opts = Array.from(container.querySelectorAll('label, .radio-option, .checkbox-option, [class*="option"], [class*="radio"]'));
    for (const opt of opts) {
      const t = (opt.innerText || opt.textContent || '').trim();
      if (textPattern.test(t)) {
        const inp = opt.querySelector('input') || opt;
        inp.focus();
        inp.click();
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ── Main TikTok autofill entry ─────────────────────────────────────────────
  async function autofillTikTok(profile) {
    const filled = [];
    const p = profile.personal;
    const l = profile.links;

    // ── 1. Phone number ───────────────────────────────────────────────────────
    const phoneEl = document.querySelector('input[type=tel], input[id*="phone"], input[placeholder*="phone" i], input[name*="phone"]');
    if (phoneEl && (!phoneEl.value || phoneEl.value.trim() === '')) {
      // Strip formatting to digits only for TikTok
      const digits = p.phone.replace(/\D/g, '');
      setNativeValue(phoneEl, digits);
      filled.push('phone');
    }

    await wait(200);

    // ── 2. Work Experience (non-internship) ───────────────────────────────────
    const workSection = findSection(/^work\s*experience$/i);
    if (workSection) {
      const workExp = profile.experience.filter(e => !e.isInternship);
      const cardSel = '.resumeEditForm-career, .resumeEditForm-work, [class*="career" i], [class*="workExperience" i]';
      const existingCards = workSection.querySelectorAll(cardSel);

      if (existingCards.length > 0) {
        // Fill existing cards
        for (let i = 0; i < Math.min(existingCards.length, workExp.length); i++) {
          await fillWorkCard(existingCards[i], workExp[i]);
          filled.push(`workExp-${i + 1}`);
          await wait(300);
        }
      } else {
        // Try generic card containers
        const allCards = workSection.querySelectorAll('[class*="resumeEditForm"], [class*="editForm"]');
        for (let i = 0; i < Math.min(allCards.length, workExp.length); i++) {
          await fillWorkCard(allCards[i], workExp[i]);
          filled.push(`workExp-${i + 1}`);
          await wait(300);
        }
      }
    }

    await wait(300);

    // ── 3. Internship Experience ──────────────────────────────────────────────
    const internSection = findSection(/internship/i);
    if (internSection) {
      const internExps = profile.experience.filter(e => e.isInternship);
      const cardSel = '.resumeEditForm-internship, [class*="internship" i]';

      await ensureCardCount(internSection, internExps.length, cardSel + ', [class*="resumeEditForm"]');
      await wait(400);

      const internCards = internSection.querySelectorAll(cardSel + ', [class*="resumeEditForm"]');
      for (let i = 0; i < Math.min(internCards.length, internExps.length); i++) {
        await fillInternshipCard(internCards[i], internExps[i]);
        filled.push(`intern-${i + 1}`);
        await wait(300);
      }
    }

    await wait(300);

    // ── 4. Project Experience ─────────────────────────────────────────────────
    const projSection = findSection(/project/i);
    if (projSection) {
      const projects = profile.projects || [];
      const cardSel = '.resumeEditForm-project, [class*="project" i]';

      await ensureCardCount(projSection, projects.length, cardSel + ', [class*="resumeEditForm"]');
      await wait(400);

      const projCards = projSection.querySelectorAll(cardSel + ', [class*="resumeEditForm"]');
      for (let i = 0; i < Math.min(projCards.length, projects.length); i++) {
        await fillProjectCard(projCards[i], projects[i]);
        filled.push(`project-${i + 1}`);
        await wait(300);
      }
    }

    await wait(200);

    // ── 5. Work Samples / Portfolio URL ───────────────────────────────────────
    const workSampleEl = document.querySelector('input[id*="sample"], input[id*="portfolio"], input[placeholder*="sample" i], input[placeholder*="portfolio" i], input[placeholder*="website" i]');
    if (workSampleEl && (!workSampleEl.value || workSampleEl.value.trim() === '')) {
      setNativeValue(workSampleEl, l.portfolio || l.website);
      filled.push('workSample');
    }

    await wait(200);

    // ── 6. Work Authorization radio buttons ───────────────────────────────────
    const authSection = document.querySelector('[class*="authorization"], [class*="Authorization"]') ||
      Array.from(document.querySelectorAll('[class*="section"], [class*="question"]'))
        .find(s => /(authorized|work authorization|legally authorized)/i.test(s.innerText || ''));
    if (authSection) {
      clickOption(authSection, /yes/i);
      filled.push('workAuth');
    }

    await wait(200);

    // ── 7. Sponsorship ────────────────────────────────────────────────────────
    const sponsorSection = Array.from(document.querySelectorAll('[class*="section"], [class*="question"], [class*="form"]'))
      .find(s => /(sponsor|sponsorship|visa|currently employ)/i.test(s.innerText || ''));
    if (sponsorSection) {
      // "Do you require sponsorship?" → Yes (for F-1)
      clickOption(sponsorSection, /yes/i);
      filled.push('sponsorship');
    }

    await wait(200);

    // ── 8. Source / How did you find us ───────────────────────────────────────
    const sourceSection = Array.from(document.querySelectorAll('[class*="section"], [class*="question"], [class*="form"]'))
      .find(s => /(how did you|hear about|source|referral|know about)/i.test(s.innerText || ''));
    if (sourceSection) {
      // Try to click "Recruitment Website" or "LinkedIn" option
      const clicked = clickOption(sourceSection, /recruitment website/i) ||
                      clickOption(sourceSection, /linkedin/i) ||
                      clickOption(sourceSection, /job board/i) ||
                      clickOption(sourceSection, /website/i);
      if (clicked) filled.push('source');
    }

    await wait(200);

    // ── 9. Self-Introduction textarea ─────────────────────────────────────────
    // Look for the dedicated self-intro / cover letter textarea
    const introSelectors = [
      'textarea[id*="intro" i]', 'textarea[id*="cover" i]', 'textarea[id*="letter" i]',
      'textarea[placeholder*="introduc" i]', 'textarea[placeholder*="yourself" i]',
      'textarea[name*="intro" i]'
    ];
    let introEl = null;
    for (const sel of introSelectors) {
      introEl = document.querySelector(sel);
      if (introEl) break;
    }

    // Fallback: last large textarea on page (likely self-intro)
    if (!introEl) {
      const textareas = Array.from(document.querySelectorAll('textarea')).filter(t => !t.value || t.value.trim() === '');
      if (textareas.length > 0) introEl = textareas[textareas.length - 1];
    }

    if (introEl && (!introEl.value || introEl.value.trim() === '')) {
      const intro = `Hi! I'm Shivamshu Roy, a Master's student in Engineering Science (Data Science) at SUNY Buffalo (graduating December 2027, GPA 3.85/4.0). I bring 14+ months of professional data science experience — as a Data Scientist at NxtWave where I engineered executive dashboards and reduced manual data processing latency by 40%, and through internships at TCS, NIC, and Triyas Tech where I deployed ML models, computer vision pipelines, and Tableau dashboards. My research is IEEE-published (CVMI-2023) in financial time-series forecasting. I'm skilled in Python, SQL, BigQuery, PyTorch, Scikit-Learn, and cloud data tools. I'm authorized to work in the US on F-1 and eligible for CPT/STEM OPT. I'm passionate about building data-driven products and would love to bring this energy to your team!`;
      setNativeValue(introEl, intro);
      filled.push('selfIntro');
    }

    return filled;
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.JobFillSites = window.JobFillSites || {};
    window.JobFillSites.tiktok = {
      autofill: autofillTikTok,
      fillProjectCard,
      fillInternshipCard,
      fillWorkCard,
      tiktokSetDate,
      ensureCardCount,
      wait
    };
  }
})();

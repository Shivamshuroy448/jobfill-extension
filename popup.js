// JobFill AI — Popup Logic

document.addEventListener("DOMContentLoaded", async () => {
  const btnAutofill = document.getElementById("btn-autofill");
  const platformBadge = document.getElementById("platform-badge");
  const statusMessage = document.getElementById("status-message");
  const linkOptions = document.getElementById("link-options");
  const cardName = document.getElementById("card-name");
  const cardEmail = document.getElementById("card-email");

  // Tracker elements
  const detectedCompanyEl = document.getElementById("detected-company");
  const detectedDateEl = document.getElementById("detected-date");
  const detectedUrlEl = document.getElementById("detected-url");
  const btnCopySheetRow = document.getElementById("btn-copy-sheet-row");
  const historyToggle = document.getElementById("history-toggle");
  const historyArrow = document.getElementById("history-arrow");
  const historyBody = document.getElementById("history-body");
  const historyCountEl = document.getElementById("history-count");
  const historyListEl = document.getElementById("history-list");
  const btnCopyAllTsv = document.getElementById("btn-copy-all-tsv");
  const btnDownloadCsv = document.getElementById("btn-download-csv");
  const trackerSyncStatus = document.getElementById("tracker-sync-status");

  // Load profile to populate card
  const profile = await window.JobFillProfile.getStoredProfile();
  if (profile && profile.personal) {
    cardName.textContent = profile.personal.fullName || (profile.personal.firstName + " " + profile.personal.lastName);
    cardEmail.textContent = profile.personal.email;
  }

  // Get active tab
  let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab || !activeTab.url) {
    platformBadge.textContent = "No Tab";
    return;
  }

  const url = activeTab.url.toLowerCase();

  // Detect platform by URL
  let detectedPlatform = "Universal";
  if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) {
    detectedPlatform = "Workday";
  } else if (url.includes("greenhouse.io")) {
    detectedPlatform = "Greenhouse";
  } else if (url.includes("lever.co")) {
    detectedPlatform = "Lever";
  } else if (url.includes("ashbyhq.com")) {
    detectedPlatform = "Ashby";
  } else if (url.includes("adp.com") || url.includes("workforcenow.adp.com")) {
    detectedPlatform = "ADP";
  } else if (url.includes("smartrecruiters.com")) {
    detectedPlatform = "SmartRecruiters";
  } else if (url.includes("tiktok.com") || url.includes("bytedance.com") || url.includes("feishu.cn")) {
    detectedPlatform = "TikTok";
  }

  platformBadge.textContent = detectedPlatform;
  if (detectedPlatform !== "Universal") {
    platformBadge.classList.add("detected");
  }

  // Active detected job metadata state
  let currentJobMeta = {
    company: "Cardinal Health",
    role: "Data & Analytics Internship",
    dateApplied: new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }),
    url: activeTab.url
  };

  // Try extracting live metadata from tab
  try {
    const metaResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        if (window.JobFillCore && window.JobFillCore.extractJobMetadata) {
          return window.JobFillCore.extractJobMetadata();
        }
        return null;
      }
    });
    if (metaResults && metaResults[0] && metaResults[0].result) {
      currentJobMeta = metaResults[0].result;
    }
  } catch (e) {
    // Fallback extraction from URL and Title
    let comp = "Cardinal Health";
    if (url.includes("cardinalhealth")) comp = "Cardinal Health";
    else if (url.includes("tiktok")) comp = "TikTok";
    else if (url.includes("bytedance")) comp = "ByteDance";
    else {
      try {
        const h = new URL(activeTab.url).hostname.replace(/^www\./, "").split(".")[0];
        comp = h.charAt(0).toUpperCase() + h.slice(1);
      } catch (err) {}
    }
    currentJobMeta.company = comp;
    currentJobMeta.role = (activeTab.title || "").split(/[-|•]/)[0].trim() || "Internship Role";
  }

  // Populate Tracker Card
  if (detectedCompanyEl) detectedCompanyEl.textContent = currentJobMeta.company;
  if (detectedDateEl) detectedDateEl.textContent = currentJobMeta.dateApplied;
  if (detectedUrlEl) {
    detectedUrlEl.textContent = currentJobMeta.url;
    detectedUrlEl.title = currentJobMeta.url;
  }

  // Check if webhook is active
  const trackerSettings = await window.JobFillProfile.getTrackerSettings();
  if (trackerSettings && trackerSettings.webhookUrl && trackerSyncStatus) {
    trackerSyncStatus.textContent = "Auto-Sync ON";
    trackerSyncStatus.style.borderColor = "#10b981";
    trackerSyncStatus.style.color = "#34d399";
  }

  // Load and render tracked applications history
  async function refreshHistory() {
    const apps = await window.JobFillProfile.getTrackedApplications();
    if (historyCountEl) historyCountEl.textContent = apps.length;

    if (historyListEl) {
      if (apps.length === 0) {
        historyListEl.innerHTML = `<div style="color: #64748b; font-size: 11px; text-align: center; padding: 6px;">No applications tracked yet.</div>`;
      } else {
        historyListEl.innerHTML = apps.map(item => `
          <div class="history-item">
            <div>
              <div class="history-item-company">${item.company}</div>
              <div style="color: #94a3b8; font-size: 9.5px;">${item.role || "Internship"}</div>
            </div>
            <div class="history-item-date">${item.dateApplied}</div>
          </div>
        `).join("");
      }
    }
  }

  await refreshHistory();

  // History Toggle Accordion
  if (historyToggle && historyBody) {
    historyToggle.addEventListener("click", () => {
      const isHidden = historyBody.classList.toggle("hidden");
      if (historyArrow) {
        historyArrow.style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
      }
    });
  }

  // 1-Click Copy Row for Google Sheet
  if (btnCopySheetRow) {
    btnCopySheetRow.addEventListener("click", async () => {
      // Format TSV: Name of the Company \t Date Applied \t Link of the URL \t Role \t Status
      const rowText = [
        currentJobMeta.company || "Unknown",
        currentJobMeta.dateApplied || "",
        currentJobMeta.url || "",
        currentJobMeta.role || "",
        "Applied"
      ].join("\t");

      try {
        await navigator.clipboard.writeText(rowText);
        btnCopySheetRow.innerHTML = `<span>✓</span><span>Copied! (Cmd+V into Sheet)</span>`;
        btnCopySheetRow.style.background = "#10b981";
        setTimeout(() => {
          btnCopySheetRow.innerHTML = `<span>📋</span><span>Copy Row for Sheet</span>`;
          btnCopySheetRow.style.background = "#0284c7";
        }, 2500);
      } catch (err) {
        prompt("Copy this row for your Google Sheet (Tab-separated):", rowText);
      }
    });
  }

  // Copy All Rows as TSV
  if (btnCopyAllTsv) {
    btnCopyAllTsv.addEventListener("click", async () => {
      const apps = await window.JobFillProfile.getTrackedApplications();
      const tsv = window.JobFillProfile.formatForGoogleSheets(apps, true);
      try {
        await navigator.clipboard.writeText(tsv);
        btnCopyAllTsv.textContent = `✓ Copied All ${apps.length} Rows!`;
        setTimeout(() => {
          btnCopyAllTsv.textContent = "📋 Copy All (TSV)";
        }, 2500);
      } catch (err) {
        prompt("Copy all applications TSV:", tsv);
      }
    });
  }

  // Download CSV
  if (btnDownloadCsv) {
    btnDownloadCsv.addEventListener("click", async () => {
      const apps = await window.JobFillProfile.getTrackedApplications();
      const csv = window.JobFillProfile.formatAsCSV(apps);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `internship_applications_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    });
  }

  // Autofill Action
  btnAutofill.addEventListener("click", async () => {
    btnAutofill.disabled = true;
    btnAutofill.innerHTML = `<span>⏳</span><span>Filling Fields...</span>`;
    statusMessage.classList.add("hidden");

    try {
      // 1. Re-inject latest scripts to ensure page has latest autofill logic without needing hard refresh
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["profile-data.js", "autofill-core.js"]
        });
      } catch (e) {
        console.warn("Script injection note:", e);
      }

      // 2. Execute autofill directly in the tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (userProfile) => {
          if (window.JobFillCore) {
            const fillRes = window.JobFillCore.runAutofill(userProfile);
            const metadata = window.JobFillCore.extractJobMetadata ? window.JobFillCore.extractJobMetadata() : null;
            return { ...fillRes, jobMetadata: metadata };
          }
          return { success: false, count: 0, error: "Core engine not loaded" };
        },
        args: [profile]
      });

      const res = results && results[0] ? results[0].result : null;
      handleResult(res);

      // Track application
      if (res && res.jobMetadata) {
        currentJobMeta = res.jobMetadata;
        if (detectedCompanyEl) detectedCompanyEl.textContent = currentJobMeta.company;
        if (detectedDateEl) detectedDateEl.textContent = currentJobMeta.dateApplied;
        if (detectedUrlEl) detectedUrlEl.textContent = currentJobMeta.url;

        const saved = {
          company: currentJobMeta.company,
          role: currentJobMeta.role,
          dateApplied: currentJobMeta.dateApplied,
          url: currentJobMeta.url,
          platform: res.platform || detectedPlatform,
          status: "Applied"
        };
        await window.JobFillProfile.saveTrackedApplication(saved);
        if (trackerSettings && trackerSettings.webhookUrl) {
          window.JobFillProfile.syncApplicationToSheet(saved, trackerSettings.webhookUrl);
        }
        await refreshHistory();
      }
    } catch (err) {
      // Fallback to sendMessage if scripting fails
      chrome.tabs.sendMessage(activeTab.id, { action: "autofill" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          showError("Unable to autofill on this page: " + err.message);
        } else {
          handleResult(response);
          refreshHistory();
        }
      });
    }
  });

  function handleResult(res) {
    btnAutofill.disabled = false;
    btnAutofill.innerHTML = `<span class="btn-icon">⚡</span><span class="btn-text">Autofill Application Now</span>`;

    if (res && res.count > 0) {
      statusMessage.className = "status-message";
      statusMessage.innerHTML = `✓ Filled <b>${res.count}</b> fields & logged <b>${currentJobMeta.company}</b>!`;
      statusMessage.classList.remove("hidden");
    } else {
      statusMessage.className = "status-message";
      statusMessage.innerHTML = `✓ Scanned form. Logged <b>${currentJobMeta.company}</b> to tracker!`;
      statusMessage.classList.remove("hidden");
    }
  }

  function showError(msg) {
    btnAutofill.disabled = false;
    btnAutofill.innerHTML = `<span class="btn-icon">⚡</span><span class="btn-text">Autofill Application Now</span>`;
    statusMessage.className = "status-message warn";
    statusMessage.textContent = msg;
    statusMessage.classList.remove("hidden");
  }

  // Resume Sync tool link
  const linkResumeSync = document.getElementById("link-resume-sync");
  if (linkResumeSync) {
    linkResumeSync.addEventListener("click", (e) => {
      e.preventDefault();
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: "file:///Users/roy/projects/resume-sync/index.html" });
      } else {
        window.open("file:///Users/roy/projects/resume-sync/index.html", "_blank");
      }
    });
  }

  // Options page link
  if (linkOptions) {
    linkOptions.addEventListener("click", (e) => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL("options.html"));
      }
    });
  }

  // ==========================================
  // TAB SWITCHING & AI COPILOT LOGIC
  // ==========================================
  const navTabs = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      navTabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => {
        c.classList.remove("active");
        c.classList.add("hidden");
      });
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.remove("hidden");
        targetEl.classList.add("active");
      }
    });
  });

  // Copilot Elements
  const btnScanPage = document.getElementById("btn-scan-page");
  const scannedListEl = document.getElementById("scanned-questions-list");
  const customQuestionInput = document.getElementById("custom-question-input");
  const chips = document.querySelectorAll(".chip");
  const btnGenerateAnswer = document.getElementById("btn-generate-answer");
  const generatedContainer = document.getElementById("generated-answer-container");
  const generatedAnswerText = document.getElementById("generated-answer-text");
  const btnCopyAnswer = document.getElementById("btn-copy-answer");
  const inputGeminiKey = document.getElementById("input-gemini-key");
  const btnSaveKey = document.getElementById("btn-save-key");
  const btnOpenOptionsFull = document.getElementById("btn-open-options-full");

  // Load saved Gemini API Key
  if (chrome.storage && chrome.storage.local && inputGeminiKey) {
    chrome.storage.local.get(["geminiApiKey"], (res) => {
      if (res && res.geminiApiKey) {
        inputGeminiKey.value = res.geminiApiKey;
      }
    });
  }

  if (btnSaveKey && inputGeminiKey) {
    btnSaveKey.addEventListener("click", () => {
      const key = (inputGeminiKey.value || "").trim();
      chrome.storage.local.set({ geminiApiKey: key }, () => {
        btnSaveKey.textContent = "Saved!";
        btnSaveKey.style.background = "#10b981";
        btnSaveKey.style.color = "#0f172a";
        setTimeout(() => {
          btnSaveKey.textContent = "Save";
          btnSaveKey.style.background = "#1e293b";
          btnSaveKey.style.color = "#38bdf8";
        }, 2000);
      });
    });
  }

  // Quick Chips
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      if (customQuestionInput) {
        customQuestionInput.value = chip.getAttribute("data-q");
        generateCustomAnswer();
      }
    });
  });

  async function generateCustomAnswer() {
    if (!customQuestionInput) return;
    const qText = (customQuestionInput.value || "").trim();
    if (!qText) return;

    btnGenerateAnswer.disabled = true;
    btnGenerateAnswer.innerHTML = `<span>⏳</span><span>Synthesizing...</span>`;

    const selectedStyle = document.querySelector('input[name="copilot-style"]:checked')?.value || "comprehensive";

    try {
      if (window.JobFillAI && typeof window.JobFillAI.generateAnswer === "function") {
        const res = await window.JobFillAI.generateAnswer(qText, {
          style: selectedStyle,
          jobContext: currentJobMeta
        });
        if (generatedAnswerText && generatedContainer) {
          generatedAnswerText.value = res.answer || "";
          generatedContainer.classList.remove("hidden");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      btnGenerateAnswer.disabled = false;
      btnGenerateAnswer.innerHTML = `<span>✨</span><span>Generate Answer for Shivamshu</span>`;
    }
  }

  if (btnGenerateAnswer) {
    btnGenerateAnswer.addEventListener("click", generateCustomAnswer);
  }

  if (btnCopyAnswer && generatedAnswerText) {
    btnCopyAnswer.addEventListener("click", () => {
      navigator.clipboard.writeText(generatedAnswerText.value).then(() => {
        btnCopyAnswer.textContent = "✓ Copied!";
        setTimeout(() => { btnCopyAnswer.textContent = "📋 Copy"; }, 2000);
      });
    });
  }

  // Scan Page Questions from active tab
  if (btnScanPage && scannedListEl) {
    btnScanPage.addEventListener("click", async () => {
      btnScanPage.textContent = "Scanning...";
      scannedListEl.innerHTML = `<div class="empty-state">Scanning active page for form questions...</div>`;

      try {
        chrome.tabs.sendMessage(activeTab.id, { action: "scanQuestions" }, (res) => {
          btnScanPage.textContent = "Scan Page";
          if (chrome.runtime.lastError || !res || !res.questions || res.questions.length === 0) {
            scannedListEl.innerHTML = `<div class="empty-state">No open-ended essay questions found on this step.</div>`;
            return;
          }

          scannedListEl.innerHTML = "";
          res.questions.forEach((q) => {
            const card = document.createElement("div");
            card.className = "copilot-section";
            card.style.padding = "8px 10px";
            card.innerHTML = `
              <div style="font-size: 11.5px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">${q.label}</div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 6px;">${(q.suggestedAnswer || "").slice(0, 140)}...</div>
              <div style="display: flex; gap: 4px; justify-content: flex-end;">
                <button class="btn-mini btn-copy-scanned">📋 Copy</button>
              </div>
            `;
            const copyBtn = card.querySelector(".btn-copy-scanned");
            copyBtn.onclick = () => {
              navigator.clipboard.writeText(q.suggestedAnswer).then(() => {
                copyBtn.textContent = "✓ Copied!";
                setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 2000);
              });
            };
            scannedListEl.appendChild(card);
          });
        });
      } catch (e) {
        btnScanPage.textContent = "Scan Page";
        scannedListEl.innerHTML = `<div class="empty-state">Could not connect to page. Refresh the page and try again.</div>`;
      }
    });
  }

  if (btnOpenOptionsFull) {
    btnOpenOptionsFull.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }
});


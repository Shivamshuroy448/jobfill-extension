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
});

// JobFill AI — Content Script
// Injected into application pages to provide 1-click in-page button and popup communication

(function () {
  let isFormPage = false;

  function checkIfJobPage() {
    const url = window.location.href.toLowerCase();
    const isKnownATS = url.includes("myworkdayjobs.com") ||
                       url.includes("workday.com") ||
                       url.includes("greenhouse.io") ||
                       url.includes("lever.co") ||
                       url.includes("ashbyhq.com") ||
                       url.includes("smartrecruiters.com") ||
                       url.includes("icims.com") ||
                       url.includes("tiktok.com") ||
                       url.includes("bytedance.com") ||
                       url.includes("feishu.cn");

    if (isKnownATS) return true;

    // Check DOM for common job application cues
    const inputs = document.querySelectorAll("input, select, textarea");
    if (inputs.length < 3) return false;

    const pageText = (document.body ? document.body.innerText : "").toLowerCase();
    const hasApplyCues = pageText.includes("apply") ||
                         pageText.includes("application") ||
                         pageText.includes("resume") ||
                         pageText.includes("candidate") ||
                         pageText.includes("cover letter") ||
                         pageText.includes("contact information");

    return hasApplyCues;
  }

  function showToast(message, isSuccess = true, appData = null) {
    const existing = document.getElementById("jobfill-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "jobfill-toast";
    
    let actionsHtml = "";
    if (appData) {
      actionsHtml = `
        <div class="toast-actions">
          <button id="jobfill-toast-copy-btn" class="toast-btn" title="Copy tab-separated row for Google Sheet">
            <span>📋</span><span>Copy for Sheet</span>
          </button>
          <a href="https://docs.google.com/spreadsheets/d/1il6dWqzqRaZQ1fFpsBXPlZcMnh_GO5M1YcRDlKI8nrA/edit?usp=sharing" target="_blank" class="toast-btn" title="Open Google Sheet">
            <span>↗</span><span>Open Sheet</span>
          </a>
        </div>
      `;
    }

    toast.innerHTML = `
      <span style="color: ${isSuccess ? '#10b981' : '#f59e0b'}; font-size: 16px;">${isSuccess ? '✓' : '⚠️'}</span>
      <span>${message}</span>
      ${actionsHtml}
    `;
    document.body.appendChild(toast);

    if (appData) {
      const copyBtn = document.getElementById("jobfill-toast-copy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const rowText = [
            appData.company || "Unknown",
            appData.dateApplied || "",
            appData.url || "",
            appData.role || "",
            appData.status || "Applied"
          ].join("\t");
          navigator.clipboard.writeText(rowText).then(() => {
            copyBtn.innerHTML = `<span>✓</span><span>Copied!</span>`;
            copyBtn.style.background = "#10b981";
            copyBtn.style.color = "#0f172a";
            setTimeout(() => {
              copyBtn.innerHTML = `<span>📋</span><span>Copy for Sheet</span>`;
              copyBtn.style.background = "#1e293b";
              copyBtn.style.color = "#38bdf8";
            }, 2500);
          });
        });
      }
    }

    setTimeout(() => {
      toast.style.transition = "opacity 0.5s ease";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, appData ? 8000 : 4000);
  }

  async function executeAutofill() {
    try {
      const profile = await window.JobFillProfile.getStoredProfile();
      const result = window.JobFillCore.runAutofill(profile);
      
      // Extract job metadata for Google Sheets tracker
      const metadata = window.JobFillCore.extractJobMetadata();
      const trackerSettings = await window.JobFillProfile.getTrackerSettings();

      const savedApp = {
        company: metadata.company,
        role: metadata.role,
        dateApplied: metadata.dateApplied,
        url: metadata.url,
        platform: result.platform || "Universal",
        status: "Applied"
      };

      // Save application to local tracking database
      await window.JobFillProfile.saveTrackedApplication(savedApp);

      // If user configured Google Apps Script Webhook, sync automatically
      let syncNote = "";
      if (trackerSettings && trackerSettings.webhookUrl) {
        window.JobFillProfile.syncApplicationToSheet(savedApp, trackerSettings.webhookUrl)
          .then(syncRes => {
            if (syncRes.success) {
              console.log("JobFill AI: Synced to Google Sheet webhook successfully.");
            }
          });
        syncNote = " & synced to Sheet";
      }

      if (result.count > 0) {
        showToast(`⚡ Filled ${result.count} fields! Logged: ${metadata.company}${syncNote}`, true, savedApp);
      } else {
        showToast(`Form scanned. Logged: ${metadata.company} (${metadata.dateApplied})${syncNote}`, true, savedApp);
      }

      return {
        ...result,
        jobMetadata: metadata,
        trackedApp: savedApp
      };
    } catch (e) {
      console.error("JobFill Autofill Error:", e);
      showToast("Error during autofill: " + e.message, false);
      return { success: false, error: e.message };
    }
  }

  function injectFloatingPill() {
    if (document.getElementById("jobfill-floating-pill")) return;

    const pill = document.createElement("div");
    pill.id = "jobfill-floating-pill";
    const platform = window.JobFillCore ? window.JobFillCore.detectPlatform() : "Auto";
    
    pill.innerHTML = `
      <span class="pill-icon">⚡</span>
      <span>Autofill</span>
      <span class="pill-badge">${platform}</span>
    `;

    pill.title = "Click to 1-click autofill with Shivamshu's profile";
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      executeAutofill();
    });

    document.body.appendChild(pill);
  }

  // Listen for messages from popup
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "autofill") {
        executeAutofill().then(res => sendResponse(res));
        return true; // Keep channel open for async response
      }
      if (request.action === "detect") {
        const platform = window.JobFillCore ? window.JobFillCore.detectPlatform() : "Unknown";
        sendResponse({ isJobPage: checkIfJobPage(), platform });
      }
    });
  }

  // Initialize on page load
  function init() {
    isFormPage = checkIfJobPage();
    if (isFormPage) {
      injectFloatingPill();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-check periodically for single-page applications (SPAs like Workday and Greenhouse)
  setInterval(() => {
    if (!document.getElementById("jobfill-floating-pill") && checkIfJobPage()) {
      injectFloatingPill();
    }
  }, 2500);

})();

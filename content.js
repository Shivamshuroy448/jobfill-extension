// JobFill AI — Content Script
// Injected into application pages to provide 1-click in-page button, AI Copilot drawer, and popup communication

(function () {
  let isFormPage = false;
  let isExecuting = false;

  function checkIfJobPage() {
    const url = window.location.href.toLowerCase();
    const isKnownATS = url.includes("myworkdayjobs.com") ||
                       url.includes("workday.com") ||
                       url.includes("greenhouse.io") ||
                       url.includes("lever.co") ||
                       url.includes("ashbyhq.com") ||
                       url.includes("smartrecruiters.com") ||
                       url.includes("icims.com") ||
                       url.includes("adp.com") ||
                       url.includes("workforcenow.adp.com") ||
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
                         pageText.includes("contact information") ||
                         pageText.includes("work authorization") ||
                         pageText.includes("screening question");

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
    if (isExecuting) return { success: false, reason: "Already running" };
    isExecuting = true;

    const autofillBtn = document.getElementById("jobfill-pill-autofill-btn");
    const originalHtml = autofillBtn ? autofillBtn.innerHTML : "";

    if (autofillBtn) {
      autofillBtn.innerHTML = `<span>⏳</span><span>Autofilling...</span>`;
      autofillBtn.style.pointerEvents = "none";
    }

    try {
      const profile = await window.JobFillProfile.getStoredProfile();
      const result = await window.JobFillCore.runAutofill(profile);
      
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

      await window.JobFillProfile.saveTrackedApplication(savedApp);

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

      const count = result.count || 0;
      if (count > 0) {
        showToast(`⚡ Filled ${count} fields with Shivamshu's profile! Logged: ${metadata.company}${syncNote}`, true, savedApp);
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
    } finally {
      isExecuting = false;
      if (autofillBtn) {
        autofillBtn.innerHTML = originalHtml;
        autofillBtn.style.pointerEvents = "auto";
      }
    }
  }

  // ==========================================
  // IN-PAGE AI COPILOT DRAWER
  // ==========================================
  function createOrGetCopilotDrawer() {
    let drawer = document.getElementById("jobfill-copilot-drawer");
    if (drawer) return drawer;

    drawer = document.createElement("div");
    drawer.id = "jobfill-copilot-drawer";

    drawer.innerHTML = `
      <div class="copilot-drawer-header">
        <div class="copilot-header-title">
          <span>🤖</span>
          <span>AI Question Copilot</span>
        </div>
        <div class="copilot-header-actions">
          <button id="copilot-btn-fill-all" class="copilot-btn-fill-all" title="Fill all detected questions in form">⚡ Fill All with AI</button>
          <button id="copilot-btn-close" class="copilot-btn-close" title="Close drawer">&times;</button>
        </div>
      </div>
      <div id="copilot-drawer-body" class="copilot-drawer-body">
        <div style="text-align: center; color: #94a3b8; padding: 40px 10px;">
          Scanning page for questions...
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    document.getElementById("copilot-btn-close").addEventListener("click", () => {
      drawer.classList.remove("open");
    });

    return drawer;
  }

  function renderCopilotQuestions() {
    const drawer = createOrGetCopilotDrawer();
    const body = document.getElementById("copilot-drawer-body");
    if (!body) return;

    if (!window.JobFillAI || typeof window.JobFillAI.scanPageQuestions !== "function") {
      body.innerHTML = `<div style="color: #ef4444; padding: 20px;">AI Copilot Engine loading...</div>`;
      return;
    }

    const questions = window.JobFillAI.scanPageQuestions();

    if (!questions || questions.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 40px 10px; font-size: 13px;">
          <div style="font-size: 28px; margin-bottom: 12px;">📝</div>
          <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 6px;">No Open Questions Detected</div>
          <div>No open-ended essay or screening questions found on this page.</div>
          <div style="margin-top: 14px; font-size: 12px; color: #64748b;">Click <strong>⚡ Autofill</strong> on the floating pill to fill standard contact, address, and legal fields.</div>
        </div>
      `;
      return;
    }

    body.innerHTML = "";

    questions.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "copilot-question-card";

      const categoryLabels = {
        about_yourself: "About You",
        why_role: "Why Role",
        why_company: "Why Company",
        technical_project: "Projects",
        ml_skills: "ML / Skills",
        salary: "Salary",
        relocation: "Relocation",
        availability: "Availability",
        notice_period: "Notice",
        sponsorship: "Visa / Auth",
        heard_about: "Source",
        conflict_interest: "Legal"
      };

      const catBadge = categoryLabels[q.category] || "Question";

      card.innerHTML = `
        <div class="copilot-q-header">
          <div class="copilot-q-label">${escapeHtml(q.label)}</div>
          <span class="copilot-q-badge">${catBadge}</span>
        </div>
        <div class="copilot-tabs">
          <button class="copilot-tab-btn active" data-style="comprehensive">Comprehensive</button>
          <button class="copilot-tab-btn" data-style="concise">Concise</button>
          <button class="copilot-tab-btn" data-style="technical">Technical</button>
        </div>
        <textarea id="copilot-text-${idx}" class="copilot-q-textarea">${escapeHtml(q.suggestedAnswer)}</textarea>
        <div class="copilot-card-actions">
          <button id="copilot-copy-${idx}" class="copilot-action-btn copy">📋 Copy</button>
          <button id="copilot-insert-${idx}" class="copilot-action-btn insert">⚡ Insert into Form</button>
        </div>
      `;

      body.appendChild(card);

      const textarea = card.querySelector(`#copilot-text-${idx}`);
      const tabBtns = card.querySelectorAll(".copilot-tab-btn");
      const insertBtn = card.querySelector(`#copilot-insert-${idx}`);
      const copyBtn = card.querySelector(`#copilot-copy-${idx}`);

      // Tab style switching
      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          tabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const style = btn.getAttribute("data-style");
          if (style === "concise") textarea.value = q.conciseAnswer;
          else if (style === "technical") textarea.value = q.technicalAnswer;
          else textarea.value = q.suggestedAnswer;
        });
      });

      // Insert button
      insertBtn.addEventListener("click", () => {
        if (q.element && window.JobFillCore) {
          window.JobFillCore.setNativeValue(q.element, textarea.value);
          q.element.classList.add("jobfill-ai-highlight");
          q.element.scrollIntoView({ behavior: "smooth", block: "center" });

          insertBtn.innerHTML = `✓ Inserted!`;
          insertBtn.style.background = "#10b981";
          setTimeout(() => {
            insertBtn.innerHTML = `⚡ Insert into Form`;
            insertBtn.style.background = "#8b5cf6";
          }, 2000);
        }
      });

      // Copy button
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(textarea.value).then(() => {
          copyBtn.innerHTML = `✓ Copied!`;
          setTimeout(() => {
            copyBtn.innerHTML = `📋 Copy`;
          }, 2000);
        });
      });
    });

    // Fill All button in drawer header
    const fillAllBtn = document.getElementById("copilot-btn-fill-all");
    if (fillAllBtn) {
      fillAllBtn.onclick = () => {
        let insertedCount = 0;
        questions.forEach((q, idx) => {
          const textarea = document.getElementById(`copilot-text-${idx}`);
          const val = textarea ? textarea.value : q.suggestedAnswer;
          if (q.element && window.JobFillCore && val) {
            window.JobFillCore.setNativeValue(q.element, val);
            q.element.classList.add("jobfill-ai-highlight");
            insertedCount++;
          }
        });
        showToast(`⚡ Inserted AI answers into ${insertedCount} questions!`, true);
        drawer.classList.remove("open");
      };
    }
  }

  function toggleCopilotDrawer() {
    const drawer = createOrGetCopilotDrawer();
    const isOpen = drawer.classList.contains("open");
    if (isOpen) {
      drawer.classList.remove("open");
    } else {
      renderCopilotQuestions();
      drawer.classList.add("open");
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function injectFloatingPill() {
    if (document.getElementById("jobfill-floating-pill")) return;

    const container = document.createElement("div");
    container.id = "jobfill-floating-pill";
    const platform = window.JobFillCore ? window.JobFillCore.detectPlatform() : "Auto";
    
    container.innerHTML = `
      <button id="jobfill-pill-autofill-btn" class="jobfill-pill-btn primary" title="1-Click Autofill full application">
        <span>⚡</span>
        <span>Autofill</span>
        <span class="pill-badge">${platform}</span>
      </button>
      <button id="jobfill-pill-copilot-btn" class="jobfill-pill-btn copilot" title="Open AI Question Copilot side drawer">
        <span>🤖</span>
        <span>AI Copilot</span>
      </button>
    `;

    document.body.appendChild(container);

    document.getElementById("jobfill-pill-autofill-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      executeAutofill();
    });

    document.getElementById("jobfill-pill-copilot-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCopilotDrawer();
    });
  }

  // Listen for messages from popup
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "autofill") {
        executeAutofill().then(res => sendResponse(res));
        return true;
      }
      if (request.action === "detect") {
        const platform = window.JobFillCore ? window.JobFillCore.detectPlatform() : "Unknown";
        sendResponse({ isJobPage: checkIfJobPage(), platform });
      }
      if (request.action === "scanQuestions") {
        if (window.JobFillAI && typeof window.JobFillAI.scanPageQuestions === "function") {
          const qs = window.JobFillAI.scanPageQuestions().map(q => ({
            id: q.id,
            label: q.label,
            category: q.category,
            suggestedAnswer: q.suggestedAnswer,
            conciseAnswer: q.conciseAnswer,
            technicalAnswer: q.technicalAnswer
          }));
          sendResponse({ questions: qs });
        } else {
          sendResponse({ questions: [] });
        }
      }
      if (request.action === "toggleCopilot") {
        toggleCopilotDrawer();
        sendResponse({ success: true });
      }
    });
  }

  // ResumeSync AI -> Overleaf Bridge Relay
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "RESUMESYNC_TO_OVERLEAF") {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: "INJECT_INTO_OVERLEAF",
          latex: event.data.latex
        }, (res) => {
          window.postMessage({ type: "RESUMESYNC_RESULT", result: res }, "*");
        });
      }
    }
    if (event.data && event.data.type === "RESUMESYNC_DOWNLOAD_PDF") {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "DOWNLOAD_OVERLEAF_PDF" }, (res) => {
          window.postMessage({ type: "RESUMESYNC_DOWNLOAD_RESULT", result: res }, "*");
        });
      }
    }
  });

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

  // Re-check periodically for single-page applications
  setInterval(() => {
    if (!document.getElementById("jobfill-floating-pill") && checkIfJobPage()) {
      injectFloatingPill();
    }
  }, 2000);

})();

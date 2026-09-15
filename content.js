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
                       url.includes("icims.com");

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

  function showToast(message, isSuccess = true) {
    const existing = document.getElementById("jobfill-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "jobfill-toast";
    toast.innerHTML = `
      <span style="color: ${isSuccess ? '#10b981' : '#f59e0b'}; font-size: 16px;">${isSuccess ? '✓' : '⚠️'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.5s ease";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  async function executeAutofill() {
    try {
      const profile = await window.JobFillProfile.getStoredProfile();
      const result = window.JobFillCore.runAutofill(profile);
      
      if (result.count > 0) {
        showToast(`⚡ JobFill AI: Filled ${result.count} field${result.count > 1 ? 's' : ''} on ${result.platform}!`);
      } else {
        showToast("Form scanned. No empty matching fields found or already filled.", false);
      }
      return result;
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

// JobFill AI — Popup Logic

document.addEventListener("DOMContentLoaded", async () => {
  const btnAutofill = document.getElementById("btn-autofill");
  const platformBadge = document.getElementById("platform-badge");
  const statusMessage = document.getElementById("status-message");
  const linkOptions = document.getElementById("link-options");
  const cardName = document.getElementById("card-name");
  const cardEmail = document.getElementById("card-email");

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
  }

  platformBadge.textContent = detectedPlatform;
  if (detectedPlatform !== "Universal") {
    platformBadge.classList.add("detected");
  }

  // Autofill Action
  btnAutofill.addEventListener("click", async () => {
    btnAutofill.disabled = true;
    btnAutofill.innerHTML = `<span>⏳</span><span>Filling Fields...</span>`;
    statusMessage.classList.add("hidden");

    try {
      // 1. Try sending message to content script first
      chrome.tabs.sendMessage(activeTab.id, { action: "autofill" }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          // Content script not ready; execute directly via chrome.scripting
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: async (userProfile) => {
                if (window.JobFillCore) {
                  return window.JobFillCore.runAutofill(userProfile);
                }
                return { success: false, error: "Core engine not loaded" };
              },
              args: [profile]
            });

            const res = results && results[0] ? results[0].result : null;
            handleResult(res);
          } catch (execErr) {
            showError("Unable to autofill on this page: " + execErr.message);
          }
        } else {
          handleResult(response);
        }
      });
    } catch (err) {
      showError(err.message);
    }
  });

  function handleResult(res) {
    btnAutofill.disabled = false;
    btnAutofill.innerHTML = `<span class="btn-icon">⚡</span><span class="btn-text">Autofill Application Now</span>`;

    if (res && res.count > 0) {
      statusMessage.className = "status-message";
      statusMessage.innerHTML = `✓ Successfully filled <b>${res.count}</b> fields on ${res.platform || detectedPlatform}!`;
      statusMessage.classList.remove("hidden");
    } else {
      statusMessage.className = "status-message warn";
      statusMessage.textContent = "Scanned form. All recognized fields are either already filled or not found.";
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

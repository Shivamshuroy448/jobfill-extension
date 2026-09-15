// JobFill AI — Options & Profile Editor Logic

document.addEventListener("DOMContentLoaded", async () => {
  const formFields = {
    firstName: document.getElementById("p-firstName"),
    lastName: document.getElementById("p-lastName"),
    email: document.getElementById("p-email"),
    phone: document.getElementById("p-phone"),
    address: document.getElementById("p-address"),
    city: document.getElementById("p-city"),
    state: document.getElementById("p-state"),
    postal: document.getElementById("p-postal"),
    website: document.getElementById("p-website"),
    linkedin: document.getElementById("p-linkedin"),
    github: document.getElementById("p-github"),
    medium: document.getElementById("p-medium"),
    school: document.getElementById("p-school"),
    degree: document.getElementById("p-degree"),
    major: document.getElementById("p-major"),
    gpa: document.getElementById("p-gpa"),
    gradDate: document.getElementById("p-gradDate"),
    authUS: document.getElementById("p-authUS"),
    sponsor: document.getElementById("p-sponsor")
  };

  // Tracker fields
  const tSheetUrl = document.getElementById("t-sheetUrl");
  const tWebhookUrl = document.getElementById("t-webhookUrl");
  const tBtnCopyTsv = document.getElementById("t-btn-copy-tsv");
  const tBtnDownloadCsv = document.getElementById("t-btn-download-csv");
  const tBtnClear = document.getElementById("t-btn-clear");
  const btnCopyScript = document.getElementById("btn-copy-script");
  const appsScriptCode = document.getElementById("apps-script-code");
  const tAppCount = document.getElementById("t-app-count");
  const tAppTbody = document.getElementById("t-app-tbody");

  const btnSave = document.getElementById("btn-save");
  const btnReset = document.getElementById("btn-reset");
  const toast = document.getElementById("toast");

  let currentProfile = await window.JobFillProfile.getStoredProfile();
  let currentTrackerSettings = await window.JobFillProfile.getTrackerSettings();

  function loadProfileToUI(p) {
    if (!p) return;
    formFields.firstName.value = p.personal.firstName || "";
    formFields.lastName.value = p.personal.lastName || "";
    formFields.email.value = p.personal.email || "";
    formFields.phone.value = p.personal.phone || "";
    formFields.address.value = p.personal.addressLine1 || "";
    formFields.city.value = p.personal.city || "";
    formFields.state.value = p.personal.state || "";
    formFields.postal.value = p.personal.postalCode || "";

    formFields.website.value = p.links.website || "";
    formFields.linkedin.value = p.links.linkedin || "";
    formFields.github.value = p.links.github || "";
    formFields.medium.value = p.links.medium || "";

    if (p.education && p.education[0]) {
      const edu = p.education[0];
      formFields.school.value = edu.school || "";
      formFields.degree.value = edu.degree || "";
      formFields.major.value = edu.major || edu.fieldOfStudy || "";
      formFields.gpa.value = edu.gpa || "";
      formFields.gradDate.value = (edu.endMonth ? edu.endMonth + " " : "") + (edu.endYear || "");
    }

    formFields.authUS.value = p.legal.authorizedUS || "Yes";
    formFields.sponsor.value = p.legal.requireSponsorship || "Yes";
  }

  function loadTrackerSettingsToUI(s) {
    if (!s) return;
    if (tSheetUrl) tSheetUrl.value = s.sheetUrl || "";
    if (tWebhookUrl) tWebhookUrl.value = s.webhookUrl || "";
  }

  async function renderTrackedTable() {
    const apps = await window.JobFillProfile.getTrackedApplications();
    if (tAppCount) tAppCount.textContent = apps.length;

    if (tAppTbody) {
      if (apps.length === 0) {
        tAppTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No applications tracked yet. Autofill a job to log it automatically!</td></tr>`;
      } else {
        tAppTbody.innerHTML = apps.map(item => `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 8px 10px; font-weight: 600; color: #f8fafc;">${item.company}</td>
            <td style="padding: 8px 10px; color: #94a3b8; font-family: monospace;">${item.dateApplied}</td>
            <td style="padding: 8px 10px; color: #cbd5e1;">${item.role || "Internship"}</td>
            <td style="padding: 8px 10px;">
              <a href="${item.url}" target="_blank" style="color: #38bdf8; text-decoration: none; font-size: 11px;">View Job &nearr;</a>
            </td>
          </tr>
        `).join("");
      }
    }
  }

  loadProfileToUI(currentProfile);
  loadTrackerSettingsToUI(currentTrackerSettings);
  await renderTrackedTable();

  // Copy Apps Script Code button
  if (btnCopyScript && appsScriptCode) {
    btnCopyScript.addEventListener("click", () => {
      navigator.clipboard.writeText(appsScriptCode.textContent).then(() => {
        btnCopyScript.textContent = "✓ Copied!";
        btnCopyScript.style.background = "#10b981";
        setTimeout(() => {
          btnCopyScript.textContent = "Copy Code";
          btnCopyScript.style.background = "#1e293b";
        }, 2000);
      });
    });
  }

  // Copy All TSV button
  if (tBtnCopyTsv) {
    tBtnCopyTsv.addEventListener("click", async () => {
      const apps = await window.JobFillProfile.getTrackedApplications();
      const tsv = window.JobFillProfile.formatForGoogleSheets(apps, true);
      await navigator.clipboard.writeText(tsv);
      tBtnCopyTsv.textContent = `✓ Copied All ${apps.length} Rows! (Cmd+V into Sheet)`;
      tBtnCopyTsv.style.background = "#10b981";
      setTimeout(() => {
        tBtnCopyTsv.textContent = "📋 Copy All Tracked Rows (TSV for Google Sheets)";
        tBtnCopyTsv.style.background = "#0284c7";
      }, 2500);
    });
  }

  // Download CSV button
  if (tBtnDownloadCsv) {
    tBtnDownloadCsv.addEventListener("click", async () => {
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

  // Clear tracked applications
  if (tBtnClear) {
    tBtnClear.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear your tracked applications history?")) {
        await window.JobFillProfile.clearTrackedApplications();
        await renderTrackedTable();
      }
    });
  }

  btnSave.addEventListener("click", async () => {
    currentProfile.personal.firstName = formFields.firstName.value.trim();
    currentProfile.personal.lastName = formFields.lastName.value.trim();
    currentProfile.personal.fullName = (currentProfile.personal.firstName + " " + currentProfile.personal.lastName).trim();
    currentProfile.personal.email = formFields.email.value.trim();
    currentProfile.personal.phone = formFields.phone.value.trim();
    currentProfile.personal.addressLine1 = formFields.address.value.trim();
    currentProfile.personal.city = formFields.city.value.trim();
    currentProfile.personal.state = formFields.state.value.trim();
    currentProfile.personal.postalCode = formFields.postal.value.trim();

    currentProfile.links.website = formFields.website.value.trim();
    currentProfile.links.portfolio = formFields.website.value.trim();
    currentProfile.links.linkedin = formFields.linkedin.value.trim();
    currentProfile.links.github = formFields.github.value.trim();
    currentProfile.links.medium = formFields.medium.value.trim();

    if (currentProfile.education && currentProfile.education[0]) {
      currentProfile.education[0].school = formFields.school.value.trim();
      currentProfile.education[0].degree = formFields.degree.value.trim();
      currentProfile.education[0].major = formFields.major.value.trim();
      currentProfile.education[0].fieldOfStudy = formFields.major.value.trim();
      currentProfile.education[0].gpa = formFields.gpa.value.trim();
    }

    currentProfile.legal.authorizedUS = formFields.authUS.value;
    currentProfile.legal.requireSponsorship = formFields.sponsor.value;
    currentProfile.legal.futureSponsorship = formFields.sponsor.value;

    await window.JobFillProfile.saveStoredProfile(currentProfile);

    // Save Tracker settings
    if (tSheetUrl && tWebhookUrl) {
      currentTrackerSettings.sheetUrl = tSheetUrl.value.trim();
      currentTrackerSettings.webhookUrl = tWebhookUrl.value.trim();
      await window.JobFillProfile.saveTrackerSettings(currentTrackerSettings);
    }

    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  });

  btnReset.addEventListener("click", async () => {
    if (confirm("Reset profile details back to verified defaults from your portfolio?")) {
      currentProfile = JSON.parse(JSON.stringify(window.JobFillProfile.DEFAULT_PROFILE));
      await window.JobFillProfile.saveStoredProfile(currentProfile);
      loadProfileToUI(currentProfile);
      toast.textContent = "✓ Reset to Default Profile";
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        toast.textContent = "✓ Profile Saved Successfully!";
      }, 2500);
    }
  });
});

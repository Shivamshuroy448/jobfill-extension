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

  const btnSave = document.getElementById("btn-save");
  const btnReset = document.getElementById("btn-reset");
  const toast = document.getElementById("toast");

  let currentProfile = await window.JobFillProfile.getStoredProfile();

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

  loadProfileToUI(currentProfile);

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

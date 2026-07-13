// ✅ Toggle Settings Menu (Desktop & Mobile)
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

function toggleSettingsMenu() {
  settingsMenu.classList.toggle("active"); // Add/remove "active" class
}

settingsBtn.addEventListener("click", toggleSettingsMenu);
settingsBtnMobile.addEventListener("click", toggleSettingsMenu);
// ===== Dark Mode Toggle =====
const darkModeBtn = document.querySelector("#settingsMenu button:first-of-type");

// Apply saved theme on load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
});

// Toggle dark mode when button is clicked
darkModeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Save preference
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
    darkModeBtn.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    darkModeBtn.textContent = "🌙 Dark Mode";
  }
});
});

// ✅ Notifications Toggle
const notificationsBtn = settingsMenu.querySelector("button:nth-child(3)");

notificationsBtn.addEventListener("click", () => {
  alert("🔔 Notifications feature coming soon!");
});

// ✅ Privacy Button
const privacyBtn = settingsMenu.querySelector("button:nth-child(4)");

privacyBtn.addEventListener("click", () => {
  window.location.href = "Privacy Policy.html"; // Redirect to Privacy Policy
});

// ✅ Close menu when clicking outside
document.addEventListener("click", (event) => {
  if (!settingsMenu.contains(event.target) && 
      event.target !== settingsBtn && 
      event.target !== settingsBtnMobile) {
    settingsMenu.classList.remove("active");
  }
});



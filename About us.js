// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const bottomNav = document.querySelector(".bottom-nav");

  // Sidebar button clicks
  if (sidebar) {
    sidebar.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "A") {
        alert(`You clicked: ${e.target.textContent}`);
      }
    });
  }

  // Bottom nav button clicks
  if (bottomNav) {
    bottomNav.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "A") {
        alert(`Bottom nav clicked: ${e.target.textContent}`);
      }
    });
  }
});
// ✅ Toggle Settings Menu (Desktop & Mobile)
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

function toggleSettingsMenu() {
  settingsMenu.classList.toggle("active"); // Add/remove "active" class
}

settingsBtn.addEventListener("click", toggleSettingsMenu);
settingsBtnMobile.addEventListener("click", toggleSettingsMenu);

// ✅ Dark Mode Toggle
const darkModeBtn = settingsMenu.querySelector("button:nth-child(2)"); // 🌙 Dark Mode button

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
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

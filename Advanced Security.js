// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settingsBtn");          // Sidebar button
  const settingsBtnMobile = document.getElementById("settingsBtnMobile"); // Bottom nav button
  const settingsMenu = document.getElementById("settingsMenu");

  // Toggle function
  function toggleSettings() {
    if (settingsMenu.style.display === "block") {
      settingsMenu.style.display = "none";
    } else {
      settingsMenu.style.display = "block";
    }
  }

  // Attach events
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleSettings();
    });
  }

  if (settingsBtnMobile) {
    settingsBtnMobile.addEventListener("click", (e) => {
      e.preventDefault();
      toggleSettings();
    });
  }

  // Optional: close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      settingsMenu.style.display === "block" &&
      !settingsMenu.contains(e.target) &&
      e.target !== settingsBtn &&
      e.target !== settingsBtnMobile
    ) {
      settingsMenu.style.display = "none";
    }
  });
});

  // Get elements
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsBtnMobile = document.getElementById("settingsBtnMobile");
  const settingsMenu = document.getElementById("settingsMenu");

  // Function to toggle menu visibility
  function toggleSettingsMenu(event) {
    event.preventDefault(); // prevent link default behavior
    if (settingsMenu.style.display === "block") {
      settingsMenu.style.display = "none";
    } else {
      settingsMenu.style.display = "block";
    }
  }

  // Attach event listeners
  settingsBtn.addEventListener("click", toggleSettingsMenu);
  settingsBtnMobile.addEventListener("click", toggleSettingsMenu);





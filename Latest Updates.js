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

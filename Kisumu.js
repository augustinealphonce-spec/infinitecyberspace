// script.js
document.addEventListener("DOMContentLoaded", () => {
  /* -------- Training Hub Tabs -------- */
  const buttons = document.querySelectorAll(".hub-tabs button");
  const content = document.getElementById("tab-content");

  const tabData = {
    guides: "📘 Quick Guides: Step-by-step cybersecurity tips.",
    videos: "🎥 Video Tutorials: Learn visually with guided lessons.",
    scripts: "💾 Download Scripts: Ready-to-use automation scripts."
  };

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      content.innerHTML = `<p>${tabData[tab]}</p>`;
    });
  });

  /* -------- Service Box Repair Animation -------- */
  document.querySelectorAll(".service-box button").forEach(button => {
    button.addEventListener("click", (e) => {
      const animationBox = e.target.closest(".service-box").querySelector(".repair-animation");
      animationBox.classList.add("active");
      alert("Repair animation running for this service!");

      setTimeout(() => {
        animationBox.classList.remove("active");
      }, 5000);
    });
  });

  /* -------- Settings Modal -------- */
  const modal = document.getElementById("settings-modal");
  const openBtns = [document.getElementById("settings-btn"), document.getElementById("settings-btn-mobile")];
  const closeBtn = document.getElementById("close-settings");

  openBtns.forEach(btn => {
    btn.addEventListener("click", () => modal.classList.add("open"));
  });

  closeBtn.addEventListener("click", () => modal.classList.remove("open"));

  document.getElementById("save-settings").addEventListener("click", () => {
    const theme = document.getElementById("theme-selector").value;
    const fontSize = document.getElementById("font-size").value;

    document.body.className = theme;
    document.body.style.fontSize =
      fontSize === "small" ? "14px" :
      fontSize === "large" ? "18px" : "16px";

    alert("Settings saved!");
  });
});
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

// Toggle floating menu
function toggleMenu(e) {
  e.preventDefault(); // stop link navigation
  settingsMenu.style.display = 
    (settingsMenu.style.display === "block") ? "none" : "block";
}

settingsBtn.addEventListener("click", toggleMenu);
settingsBtnMobile.addEventListener("click", toggleMenu);

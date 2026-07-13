/* ===== Settings Menu ===== */
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

function toggleSettingsMenu() {
  settingsMenu.classList.toggle("active");
}

[settingsBtn, settingsBtnMobile].forEach(btn => 
  btn?.addEventListener("click", toggleSettingsMenu)
);

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!settingsMenu.contains(e.target) && ![settingsBtn, settingsBtnMobile].includes(e.target)) {
    settingsMenu.classList.remove("active");
  }
});

/* ===== Dark Mode ===== */
const darkModeBtn = settingsMenu.querySelector("button:first-of-type");

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    darkModeBtn.textContent = "☀️ Light Mode";
  }
});

darkModeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  darkModeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

/* ===== Notifications ===== */
settingsMenu.querySelector("button:nth-child(3)")?.addEventListener("click", () => {
  alert("🔔 Notifications feature coming soon!");
});

/* ===== Privacy Policy ===== */
settingsMenu.querySelector("button:nth-child(4)")?.addEventListener("click", () => {
  window.location.href = "Privacy Policy.html";
});

/* ===== Page Effects ===== */
// Fade in on load
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.opacity = 0;
  document.body.style.transition = "opacity 1.5s ease";
  requestAnimationFrame(() => document.body.style.opacity = 1);
});

// Ripple effect for package buttons
document.querySelectorAll(".package-card button").forEach(button => {
  button.addEventListener("click", (e) => {
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    button.appendChild(ripple);

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    setTimeout(() => ripple.remove(), 600);
  });
});

// Ripple CSS
const rippleStyle = document.createElement("style");
rippleStyle.textContent = `
  .package-card button { position: relative; overflow: hidden; }
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    transform: scale(0);
    animation: rippleEffect 0.6s linear;
    pointer-events: none;
  }
  @keyframes rippleEffect { to { transform: scale(4); opacity: 0; } }
`;
document.head.appendChild(rippleStyle);

// Parallax background on scroll
window.addEventListener("scroll", () => {
  document.body.style.backgroundPosition = `${window.scrollY / 10}px ${window.scrollY / 15}px`;
});



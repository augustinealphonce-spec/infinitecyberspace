// === Our Packages.js ===
document.addEventListener("DOMContentLoaded", () => {
  const packages = document.querySelectorAll(".package");

  // Highlight recommended plan (Standard)
  const recommended = packages[1]; // Standard package
  recommended.classList.add("recommended");

  // Toggle details on click
  packages.forEach(pkg => {
    pkg.addEventListener("click", () => {
      pkg.classList.toggle("expanded");
    });
  });

  // Comparison modal
  const compareBtn = document.createElement("button");
  compareBtn.textContent = "Compare Plans";
  compareBtn.className = "compare-btn";
  document.querySelector(".pricing").appendChild(compareBtn);

  compareBtn.addEventListener("click", () => {
    alert(`
    🔍 Plan Comparison:
    - Basic: Firewall, malware detection, reports
    - Standard: + Endpoint protection, email security, 24/7 monitoring
    - Premium: + Pen testing, training, threat intelligence, priority support
    - Enterprise: Custom strategy, compliance, cloud security, audits
    `);
  });
});

// === M-Pesa Payment ===
function payWithMpesa(amount) {
  const phone = prompt("Enter your M-Pesa phone number (e.g. 2547XXXXXXXX):");
  if (!phone) return;

  fetch("/stkpush", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, amount })
  })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(() => alert("Payment failed"));
}

// === Settings Menu ===
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

function toggleSettingsMenu() {
  settingsMenu.classList.toggle("active");
}

[settingsBtn, settingsBtnMobile].forEach(btn => {
  if (btn) btn.addEventListener("click", toggleSettingsMenu);
});

// Dark Mode Toggle
const darkModeBtn = settingsMenu.querySelector("button:nth-child(2)");
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Notifications Toggle
const notificationsBtn = settingsMenu.querySelector("button:nth-child(3)");
notificationsBtn.addEventListener("click", () => {
  alert("🔔 Notifications feature coming soon!");
});

// Privacy Button
const privacyBtn = settingsMenu.querySelector("button:nth-child(4)");
privacyBtn.addEventListener("click", () => {
  window.location.href = "Privacy Policy.html";
});

// Close menu when clicking outside
document.addEventListener("click", (event) => {
  if (!settingsMenu.contains(event.target) &&
      event.target !== settingsBtn &&
      event.target !== settingsBtnMobile) {
    settingsMenu.classList.remove("active");
  }
});
// === Bottom Navigation Scroll Behavior ===
let lastScrollY = window.scrollY;
const bottomNav = document.querySelector(".bottom-nav");

window.addEventListener("scroll", () => {
  if (window.innerWidth <= 768) { // only mobile
    if (window.scrollY > lastScrollY) {
      // scrolling down → hide nav
      bottomNav.classList.remove("show");
    } else {
      // scrolling up → show nav
      bottomNav.classList.add("show");
    }

    // keep nav visible when at very top
    if (window.scrollY === 0) {
      bottomNav.classList.add("show");
    }

    lastScrollY = window.scrollY;
  } else {
    // desktop → always hide
    bottomNav.classList.remove("show");
  }
});


// Our Packages.js

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
<script>
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
  .catch(err => alert("Payment failed"));
}

.recommended {
  border: 3px solid #38ada9;
  box-shadow: 0 0 15px rgba(56,173,169,0.5);
}

.expanded {
  background: #f0f9ff;
  transform: scale(1.05);
}

.compare-btn {
  margin-top: 30px;
  padding: 12px 20px;
  font-size: 1rem;
  background: #1e3799;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.compare-btn:hover {
  background: #0a3d62;
}
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

</script>


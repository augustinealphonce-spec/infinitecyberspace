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

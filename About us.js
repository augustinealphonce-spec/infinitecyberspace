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

// ===== Kisumu Cybersecurity Hub - Quote Modal Script =====

// Wait until the page loads
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("quoteModal");
  const openBtn = document.getElementById("getQuoteBtn");
  const closeBtn = document.querySelector(".close");

  // Open modal when "Get Quote" button is clicked
  if (openBtn) {
    openBtn.addEventListener("click", function () {
      modal.classList.add("show");
    });
  }

  // Close modal when "×" is clicked
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      modal.classList.remove("show");
    });
  }

  // Close modal when clicking outside the modal content
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.classList.remove("show");
    }
  });
});

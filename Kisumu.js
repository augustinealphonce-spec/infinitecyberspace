// ===========================
// Utility Functions
// ===========================

// Toggle element visibility
function toggleVisibility(selector) {
  const el = document.querySelector(selector);
  if (el) {
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  }
}

// Smooth scroll to target
function smoothScroll(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ===========================
// Floating Menu Controls
// ===========================
const settingsBtn = document.querySelector('.settings-btn');
const floatingMenu = document.querySelector('.floating-menu');

if (settingsBtn && floatingMenu) {
  settingsBtn.addEventListener('click', () => {
    toggleVisibility('.floating-menu');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (floatingMenu.style.display === 'block' && !floatingMenu.contains(e.target) && e.target !== settingsBtn) {
      floatingMenu.style.display = 'none';
    }
  });
}

// ===========================
// Hero Buttons
// ===========================
document.querySelectorAll('.hero-text .btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = btn.getAttribute('data-target');
    if (targetId) smoothScroll(targetId);
  });
});

// ===========================
// Sidebar Navigation
// ===========================
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').replace('#', '');
    smoothScroll(targetId);
  });
});

// ===========================
// Bottom Navigation (Mobile)
// ===========================
document.querySelectorAll('.bottom-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').replace('#', '');
    smoothScroll(targetId);
  });
});

// ===========================
// Button Ripple Effect
// ===========================
function addRippleEffect(button) {
  button.addEventListener('click', function (e) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
  });
}

document.querySelectorAll('.findmyPlan-btn, .getQuote-btn, .hero-text .btn').forEach(addRippleEffect);


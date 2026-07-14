// ===== Settings Menu =====
const settingsBtn = document.getElementById("settingsBtn");
const settingsBtnMobile = document.getElementById("settingsBtnMobile");
const settingsMenu = document.getElementById("settingsMenu");

function toggleSettingsMenu() {
  settingsMenu.classList.toggle("active");
}
[settingsBtn, settingsBtnMobile].forEach(btn =>
  btn?.addEventListener("click", toggleSettingsMenu)
);
document.addEventListener("click", (e) => {
  if (!settingsMenu.contains(e.target) && ![settingsBtn, settingsBtnMobile].includes(e.target)) {
    settingsMenu.classList.remove("active");
  }
});

// ===== Dark Mode =====
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

// ===== Notifications =====
settingsMenu.querySelector("button:nth-child(3)")?.addEventListener("click", () => {
  alert("🔔 Notifications feature coming soon!");
});

// ===== Privacy Policy =====
settingsMenu.querySelector("button:nth-child(4)")?.addEventListener("click", () => {
  window.location.href = "Privacy Policy.html";
});

// ===== Bottom Nav Scroll Behavior =====
let lastScrollY = window.scrollY;
const bottomNav = document.querySelector(".bottom-nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > lastScrollY) {
    bottomNav.style.transform = "translateY(100%)";
    bottomNav.style.opacity = "0";
  } else {
    bottomNav.style.transform = "translateY(0)";
    bottomNav.style.opacity = "1";
  }
  lastScrollY = window.scrollY;
});

// ===== Three.js Scene =====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.classList.add("background-canvas");
document.body.prepend(renderer.domElement);

// Stars
const starGeometry = new THREE.BufferGeometry();
const starCount = 5000;
const positions = [];
for (let i = 0; i < starCount; i++) {
  positions.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
}
starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5,

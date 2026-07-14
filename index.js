renderer.domElement.classList.add("background-canvas");
document.body.prepend(renderer.domElement);

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

 // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = [];
    for (let i = 0; i < starCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Shooting star setup
    let shootingStar;
    let shootingStarTrail = [];
    const trailLength = 50;
    const shootingStarMaterial = new THREE.MeshBasicMaterial({ color: 0xfffaaa });
    const shootingStarGeometry = new THREE.SphereGeometry(3, 8, 8);

    function spawnShootingStar() {
      shootingStar = new THREE.Mesh(shootingStarGeometry, shootingStarMaterial);
      shootingStar.position.set(
        -1000,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600
      );
      scene.add(shootingStar);
      shootingStarTrail = [];
    }

    let lastSpawn = 0;
    const spawnInterval = 5000; // every 5 seconds

    // Cursor tracking (parallax)
    let mouseX = 0, mouseY = 0;
    document.addEventListener("mousemove", (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation loop
    function animate(time) {
      requestAnimationFrame(animate);

      // Parallax effect
      camera.position.x += (mouseX * 100 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 100 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Shooting star logic
      if (!shootingStar && time - lastSpawn > spawnInterval) {
        spawnShootingStar();
        lastSpawn = time;
      }
      if (shootingStar) {
        shootingStar.position.x += 15;
        shootingStar.position.y -= 5;

        // Trail effect
        shootingStarTrail.push(shootingStar.position.clone());
        if (shootingStarTrail.length > trailLength) shootingStarTrail.shift();

        const trailGeometry = new THREE.BufferGeometry().setFromPoints(shootingStarTrail);
        const trailMaterial = new THREE.LineBasicMaterial({
          color: 0xfffaaa,
          transparent: true,
          opacity: 0.6
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        scene.add(trail);

        // Remove old trails
        if (shootingStarTrail.length === trailLength) {
          scene.remove(trail);
        }

        // Remove shooting star when out of view
        if (shootingStar.position.x > 1000 || shootingStar.position.y < -1000) {
          scene.remove(shootingStar);
          shootingStar = null;
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // Responsive resize
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });


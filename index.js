// === Three.js Galaxy Background with Nebula + Cyber Grid ===

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 2000
);
camera.position.z = 500;

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("galaxy-container").appendChild(renderer.domElement);

// === Starfield ===
const starGeometry = new THREE.BufferGeometry();
const starCount = 5000;
const positions = [];

for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  positions.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0x4db8ff,
  size: 1,
  transparent: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// === Nebula Clouds ===
const nebulaMaterial = new THREE.MeshPhongMaterial({
  color: 0x6633ff,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide
});

for (let i = 0; i < 5; i++) {
  const nebulaGeometry = new THREE.SphereGeometry(200 + Math.random() * 100, 32, 32);
  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
  nebula.position.set(
    (Math.random() - 0.5) * 1500,
    (Math.random() - 0.5) * 1500,
    (Math.random() - 0.5) * 1500
  );
  scene.add(nebula);
}

// === Cyber Grid ===
const gridHelper = new THREE.GridHelper(2000, 50, 0x4db8ff, 0x222222);
gridHelper.position.y = -200;
scene.add(gridHelper);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x4db8ff, 2, 2000);
pointLight.position.set(500, 500, 500);
scene.add(pointLight);

// === OrbitControls (interactive camera) ===
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.minDistance = 200;
controls.maxDistance = 1200;

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  // Rotate stars & grid slowly
  stars.rotation.x += 0.0005;
  stars.rotation.y += 0.001;
  gridHelper.rotation.y += 0.0005;

  controls.update();
  renderer.render(scene, camera);
}
animate();

// === Handle Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



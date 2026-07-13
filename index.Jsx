import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* --- Starfield Component --- */
function Starfield() {
  const ref = useRef();
  const starCount = 5000;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 2000;
  }
  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={1.5}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

/* --- Shooting Star Component --- */
function ShootingStar() {
  const [star, setStar] = useState(null);
  const { scene } = useThree();

  useEffect(() => {
    const interval = setInterval(() => {
      const geometry = new THREE.SphereGeometry(3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xfffaaa });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        -1000,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600
      );
      scene.add(mesh);
      setStar(mesh);
    }, 5000);
    return () => clearInterval(interval);
  }, [scene]);

  useFrame(() => {
    if (star) {
      star.position.x += 15;
      star.position.y -= 5;
      if (star.position.x > 1000 || star.position.y < -1000) {
        scene.remove(star);
        setStar(null);
      }
    }
  });

  return null;
}

/* --- Camera Controller Component --- */
function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      mouse.current.x * 100,
      0.05
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      mouse.current.y * 100,
      0.05
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* --- Main Exported Component --- */
export default function SpaceBackground() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="app-container">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 500], fov: 75 }} onCreated={({ gl }) => {
        gl.setClearColor("black");
      }}>
        <Starfield />
        <ShootingStar />
        <CameraController />
      </Canvas>

      {/* Header with Logo & Button */}
      <header className="header">
        <div className="logo">
          <img src="Infinite.jpg" alt="Logo" />
        </div>
        <div className="find-plan">
          <a href="Our Packages.html">Find Your Plan</a>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <nav className="sidebar">
        <ul>
          <li><a href="index.html">🏠</a></li>
          <li><a href="Latest Updates.html">📰</a></li>
          <li><a href="Login.html">🛡️</a></li>
          <li><a href="Contact.html">📞</a></li>
          <li>
            <button className="icon-btn" onClick={() => setSettingsOpen(!settingsOpen)}>⚙️</button>
          </li>
        </ul>
      </nav>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        <a href="index.html">🏠</a>
        <a href="Latest Updates.html">📰</a>
        <a href="Login.html">🛡️</a>
        <a href="Contact.html">📞</a>
        <button className="icon-btn" onClick={() => setSettingsOpen(!settingsOpen)}>⚙️</button>
      </nav>

      {/* Floating Settings Panel */}
      <div className={`settings-panel ${settingsOpen ? "open" : ""}`}>
        <h3>⚙️ Settings</h3>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={() => alert("🔔 Notifications feature coming soon!")}>
          🔔 Notifications
        </button>
        <button onClick={() => (window.location.href = "Privacy Policy.html")}>
          🛡️ Privacy
        </button>
      </div>

      {/* Footer */}
      <footer>© 2026 All Rights Reserved</footer>
    </div>
  );
}



      

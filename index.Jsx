import React, { useEffect, useState } from "react";
import "./index.css";

export default function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [menuActive, setMenuActive] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <>
      {/* Sidebar */}
      <nav className="sidebar">
        <ul>
          <li><a href="index.html">🏠</a></li>
          <li><a href="Latest Updates.html">📰</a></li>
          <li><a href="Login.html">🛡️</a></li>
          <li><a href="Contuct us.html">📞</a></li>
          <li><button onClick={() => setMenuActive(!menuActive)}>⚙️</button></li>
        </ul>
      </nav>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <a href="index.html">🏠</a>
        <a href="Latest Updates.html">📰</a>
        <a href="Login.html">🛡️</a>
        <a href="Contuct us.html">📞</a>
        <button onClick={() => setMenuActive(!menuActive)}>⚙️</button>
      </nav>

      {/* Settings Menu */}
      {menuActive && (
        <div className="floating-menu">
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
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>Protecting Your Enterprise.</h1>
          <p>Affordable Cybersecurity Solutions for SMEs.</p>
          <a href="About us.html" className="btn">Learn More</a>
          <a href="Services.html" className="btn">Get Started</a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 All Rights Reserved | 
          <a href="Privacy Policy.html"> Privacy Policy</a>
        </p>
      </footer>
    </>
  );
}




      

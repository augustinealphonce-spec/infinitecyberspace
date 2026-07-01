// Animate the "Just Send It" text with a pulsing glow
const title = document.querySelector('.title');
setInterval(() => {
  title.style.textShadow = '0 0 20px #ff6600';
  setTimeout(() => {
    title.style.textShadow = 'none';
  }, 800);
}, 1600);

// Add glowing hover effect to icons
document.querySelectorAll('.icon').forEach(icon => {
  icon.addEventListener('mouseenter', () => {
    const color = getComputedStyle(icon).color;
    icon.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    icon.style.transform = 'scale(1.3)';
  });
  icon.addEventListener('mouseleave', () => {
    icon.style.textShadow = 'none';
    icon.style.transform = 'scale(1)';
  });
});

// Optional: subtle floating animation for icons
document.querySelectorAll('.icon').forEach((icon, i) => {
  icon.style.position = 'relative';
  let direction = 1;
  setInterval(() => {
    let offset = parseInt(icon.style.top || 0);
    if (offset > 5) direction = -1;
    if (offset < -5) direction = 1;
    icon.style.top = (offset + direction) + 'px';
  }, 100);
});


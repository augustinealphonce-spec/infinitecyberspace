document.querySelectorAll('.icon').forEach(button => {
  button.addEventListener('click', () => {
    alert(`Opening ${button.textContent.trim()}...`);
  });
});

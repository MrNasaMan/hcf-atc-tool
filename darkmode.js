
function setDarkModeStyle(isDarkMode) {
    const body = document.body;
    body.classList.toggle('dark-mode', isDarkMode);
  }
 
  function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    setDarkModeStyle(!isDarkMode);
  
    localStorage.setItem('darkMode', !isDarkMode);
  
    const darkModeToggleBtn = document.getElementById('darkModeToggle');
    darkModeToggleBtn.textContent = !isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  }
  
  const storedDarkMode = localStorage.getItem('darkMode');
  const isDarkMode = storedDarkMode === 'true';
  
  setDarkModeStyle(isDarkMode);
  
  const darkModeToggleBtn = document.getElementById('darkModeToggle');
  darkModeToggleBtn.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
  
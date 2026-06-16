function toggleTheme() {
  document.body.classList.toggle("light-mode");

  const theme = document.body.classList.contains("light-mode") ? "light" : "dark";

  localStorage.setItem("phoenix_v3_theme", theme);
}

function loadTheme() {
  if (localStorage.getItem("phoenix_v3_theme") === "light") {
    document.body.classList.add("light-mode");
  }
}

loadTheme();

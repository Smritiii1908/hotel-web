document.addEventListener("DOMContentLoaded", () => {
  setupSignupForm();
  setupLoginForm();
});

function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();
      if (!result.success) {
        showAuthMessage("authMessage", result.message || "Signup failed.", "error");
        return;
      }

      localStorage.setItem("hotelUser", JSON.stringify(result.user));
      showAuthMessage("authMessage", "Account created successfully! Redirecting to home page...", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1100);
    } catch {
      showAuthMessage("authMessage", "Server error during signup.", "error");
    }
  });
}

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (!result.success) {
        showAuthMessage("authMessage", result.message || "Login failed.", "error");
        return;
      }

      localStorage.setItem("hotelUser", JSON.stringify(result.user));
      showAuthMessage("authMessage", "Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 900);
    } catch {
      showAuthMessage("authMessage", "Server error during login.", "error");
    }
  });
}

function showAuthMessage(id, text, type) {
  const messageBox = document.getElementById(id);
  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}

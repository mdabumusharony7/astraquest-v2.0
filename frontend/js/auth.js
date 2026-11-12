const $ = id => document.getElementById(id);
let mode = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login";

function setMode(next) {
  mode = next;
  const signup = mode === "signup";
  $("loginTab").classList.toggle("active", !signup);
  $("signupTab").classList.toggle("active", signup);
  $("formTitle").textContent = signup
    ? "Join the mission, Commander"
    : "Welcome back, Commander";
  $("subtitle").textContent = signup
    ? "Create your account and prepare for launch."
    : "Sign in to continue your space journey.";
  $("nameField").hidden = !signup;
  $("confirmField").hidden = !signup;
  $("termsRow").hidden = !signup;
  $("rememberRow").hidden = signup;
  $("forgot").hidden = signup;
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("submit").textContent = signup ? "CREATE ACCOUNT　 →" : "LOG IN　 →";
  $("switchText").innerHTML = signup
    ? 'Already have an account? <button type="button" id="switch">Log in</button>'
    : 'New to ASTRAQUEST? <button type="button" id="switch">Create an account</button>';
  $("switch").addEventListener("click", () => setMode(signup ? "login" : "signup"));
  $("message").textContent = "";
  $("message").className = "";
  history.replaceState(null, "", `auth.html?mode=${mode}`);
}

function validateForm() {
  ["nameError", "emailError", "passwordError", "confirmError"].forEach(
    id => ($(id).textContent = ""),
  );
  $("message").className = "";

  const email = $("email").value.trim();
  const password = $("password").value;
  let valid = true;
  if (mode === "signup" && !$("name").value.trim()) {
    $("nameError").textContent = "Enter your commander name.";
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("emailError").textContent = "Enter a valid email address.";
    valid = false;
  }
  if (password.length < 8) {
    $("passwordError").textContent = "Use at least 8 characters.";
    valid = false;
  }
  if (mode === "signup" && password !== $("confirm").value) {
    $("confirmError").textContent = "Passwords do not match.";
    valid = false;
  }
  if (mode === "signup" && !$("terms").checked) {
    $("message").textContent = "Please accept the Terms of Use.";
    valid = false;
  }
  return valid;
}

$("loginTab").addEventListener("click", () => setMode("login"));
$("signupTab").addEventListener("click", () => setMode("signup"));
$("showPassword").addEventListener("click", () => {
  const password = $("password");
  password.type = password.type === "password" ? "text" : "password";
  $("showPassword").textContent = password.type === "password" ? "◉" : "◎";
});
$("forgot").addEventListener("click", () => {
  $("message").textContent = "Password recovery is not available yet.";
});
$("termsLink").addEventListener("click", event => {
  event.preventDefault();
  $("message").textContent = "Terms of Use will be published before registration is enabled.";
});

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!validateForm()) return;

  const submitButton = $("submit");
  submitButton.disabled = true;
  submitButton.textContent = "CONNECTING…";
  $("message").textContent = "";

  try {
    const signup = mode === "signup";
    const data = await window.AstraquestApi.request(
      signup ? "/api/auth/register/" : "/api/auth/token/",
      {
        method: "POST",
        auth: false,
        body: signup
          ? {
              email: $("email").value.trim(),
              display_name: $("name").value.trim(),
              password: $("password").value,
            }
          : {
              email: $("email").value.trim(),
              password: $("password").value,
            },
      },
    );

    window.AstraquestApi.setTokens(data, !signup && $("rememberRow").querySelector("input").checked);
    $("message").textContent = "Signed in. Preparing your mission…";
    $("message").classList.add("success");
    window.location.href = "mission-selection.html";
  } catch (error) {
    $("message").textContent = error.message || "Sign-in failed. Please try again.";
    $("message").classList.remove("success");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = mode === "signup" ? "CREATE ACCOUNT　 →" : "LOG IN　 →";
  }
});

$("year").textContent = new Date().getFullYear();
setMode(mode);
if (window.lucide) window.lucide.createIcons();

(() => {
  const form = document.getElementById("profileForm");
  const message = document.getElementById("profileMessage");
  const saveButton = document.getElementById("saveProfile");
  const api = window.AstraquestApi;

  function initials(name) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function signOut() {
    api.clearTokens();
    window.location.href = "index.html";
  }

  document.getElementById("profileLogout").addEventListener("click", signOut);

  async function loadProfile() {
    if (!api.isAuthenticated()) {
      window.location.replace("auth.html?mode=login");
      return;
    }

    try {
      const user = await api.request("/api/auth/me/");
      form.elements.email.value = user.email;
      form.elements.display_name.value = user.profile.display_name;
      document.getElementById("profileInitials").textContent =
        initials(user.profile.display_name) || "A";
      document.getElementById("coins").textContent =
        user.profile.coins.toLocaleString();
      document.getElementById("diamonds").textContent =
        user.profile.diamonds.toLocaleString();
    } catch (error) {
      if (!api.isAuthenticated()) {
        window.location.replace("auth.html?mode=login");
        return;
      }
      message.textContent = error.message || "Could not load your profile.";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("success");
    saveButton.disabled = true;

    try {
      const user = await api.request("/api/auth/me/", {
        method: "PATCH",
        body: {
          profile: {
            display_name: form.elements.display_name.value,
          },
        },
      });
      form.elements.display_name.value = user.profile.display_name;
      document.getElementById("profileInitials").textContent =
        initials(user.profile.display_name) || "A";
      message.textContent = "Profile updated.";
      message.classList.add("success");
      document.dispatchEvent(new CustomEvent("astraquest:profile-updated", { detail: user }));
    } catch (error) {
      message.textContent = error.message || "Could not save your profile.";
    } finally {
      saveButton.disabled = false;
    }
  });

  loadProfile();
  if (window.lucide) window.lucide.createIcons();
})();

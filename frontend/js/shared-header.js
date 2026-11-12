/* Shared navigation and account menu for every ASTRAQUEST page. */
(() => {
  const TOKEN_KEY = "astraquestTokens";
  const toggle = document.getElementById("mobileMenu");
  const nav = document.getElementById("mainNav");
  const accountNav = document.querySelector(".site-header .auth-nav");

  if (toggle && nav && !toggle.dataset.sharedBound) {
    toggle.dataset.sharedBound = "true";
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }),
    );
  }

  function hasSavedSession() {
    try {
      return Boolean(
        window.localStorage.getItem(TOKEN_KEY) ||
          window.sessionStorage.getItem(TOKEN_KEY),
      );
    } catch (error) {
      console.error("Could not read the saved account session.", error);
      return false;
    }
  }

  function loadApiClient() {
    if (window.AstraquestApi) return Promise.resolve(window.AstraquestApi);

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "js/api-client.js";
      script.onload = () => resolve(window.AstraquestApi);
      script.onerror = () =>
        reject(new Error("Could not load the account service."));
      document.head.append(script);
    });
  }

  function showGuestLinks() {
    if (!accountNav) return;
    accountNav.replaceChildren();

    const signup = document.createElement("a");
    signup.href = "auth.html?mode=signup";
    signup.textContent = "Sign Up";
    const login = document.createElement("a");
    login.href = "auth.html?mode=login";
    login.textContent = "Log In";
    accountNav.append(signup, login);
  }

  function initials(name) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function showAccount(user, api) {
    if (!accountNav) return;
    const profile = user.profile;
    const displayName = profile.display_name || user.email;
    accountNav.replaceChildren();
    accountNav.classList.add("account-nav");

    const wrap = document.createElement("div");
    wrap.className = "profile-wrap";
    const button = document.createElement("button");
    button.className = "profile-button";
    button.type = "button";
    button.setAttribute("aria-label", `Account menu for ${displayName}`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");

    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initials(displayName) || "A";
    const name = document.createElement("span");
    name.className = "profile-label";
    name.textContent = displayName;
    button.append(avatar, name);

    const menu = document.createElement("div");
    menu.className = "profile-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    const summary = document.createElement("div");
    summary.className = "profile-summary";
    const summaryName = document.createElement("strong");
    summaryName.textContent = displayName;
    const email = document.createElement("span");
    email.textContent = user.email;
    summary.append(summaryName, email);

    const profileLink = document.createElement("a");
    profileLink.href = "profile.html";
    profileLink.setAttribute("role", "menuitem");
    profileLink.textContent = "View profile";
    const logout = document.createElement("button");
    logout.type = "button";
    logout.setAttribute("role", "menuitem");
    logout.textContent = "Log out";
    logout.addEventListener("click", () => {
      api.clearTokens();
      window.location.href = "index.html";
    });

    menu.append(summary, profileLink, logout);
    button.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (event) => {
      if (!wrap.contains(event.target)) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });

    wrap.append(button, menu);
    accountNav.append(wrap);
  }

  async function loadAccount() {
    if (!accountNav || !hasSavedSession()) return;

    try {
      const api = await loadApiClient();
      if (!api?.isAuthenticated()) {
        showGuestLinks();
        return;
      }
      const user = await api.request("/api/auth/me/");
      showAccount(user, api);
    } catch (error) {
      console.error("Could not load the signed-in commander profile.", error);
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === TOKEN_KEY) window.location.reload();
  });
  document.addEventListener("astraquest:profile-updated", (event) => {
    if (event.detail) showAccount(event.detail, window.AstraquestApi);
  });

  loadAccount();
  if (window.lucide) window.lucide.createIcons();
})();

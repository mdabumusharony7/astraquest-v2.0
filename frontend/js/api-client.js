(() => {
  const TOKEN_KEY = "astraquestTokens";

  function getStoredTokens() {
    try {
      const raw =
        window.localStorage.getItem(TOKEN_KEY) ||
        window.sessionStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      throw new Error("Unable to read saved sign-in information from this browser.");
    }
  }

  function saveTokens(tokens, remember = false) {
    const primaryStorage = remember ? window.localStorage : window.sessionStorage;
    const secondaryStorage = remember ? window.sessionStorage : window.localStorage;
    primaryStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    secondaryStorage.removeItem(TOKEN_KEY);
  }

  function clearTokens() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }

  function formatError(data, fallback, prefix = "") {
    if (typeof data === "string") return prefix ? `${prefix}: ${data}` : data;
    if (Array.isArray(data)) {
      return data.map((item) => formatError(item, fallback, prefix)).join(" ");
    }
    if (!data || typeof data !== "object") return fallback;
    if (data.detail) return data.detail;

    return Object.entries(data)
      .map(([field, messages]) => {
        const label = field === "non_field_errors" ? prefix : [prefix, field].filter(Boolean).join(".");
        return formatError(messages, fallback, label);
      })
      .join(" ");
  }

  async function decodeResponse(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function refreshTokens(tokens) {
    if (!tokens?.refresh) return null;

    const response = await window.fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!response.ok) return null;

    const refreshed = await decodeResponse(response);
    const nextTokens = { ...tokens, access: refreshed.access };
    saveTokens(nextTokens, window.localStorage.getItem(TOKEN_KEY) !== null);
    return nextTokens;
  }

  async function request(path, options = {}, retried = false) {
    const tokens = getStoredTokens();
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (options.auth !== false && tokens?.access) {
      headers.set("Authorization", `Bearer ${tokens.access}`);
    }

    let response;
    try {
      response = await window.fetch(path, {
        ...options,
        headers,
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body),
      });
    } catch {
      throw new Error("Could not reach the ASTRAQUEST server. Check that the backend is running.");
    }

    if (response.status === 401 && options.auth !== false && !retried) {
      const refreshed = await refreshTokens(tokens);
      if (refreshed) return request(path, options, true);
      clearTokens();
    }

    const data = await decodeResponse(response);
    if (!response.ok) {
      throw new Error(formatError(data, `Request failed (${response.status}).`));
    }
    return data;
  }

  window.AstraquestApi = {
    request,
    formatError,
    setTokens: saveTokens,
    clearTokens,
    isAuthenticated() {
      return Boolean(getStoredTokens()?.access);
    },
  };
})();

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Map,
  Menu,
  Settings,
  Star,
  TriangleAlert,
} from "lucide-react";
import "../css/shared-header.css";
import "../css/style.css";
import "../js/api-client.js";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let active = true;
    const api = window.AstraquestApi;
    const loadAccount = () => {
      try {
        if (!api.isAuthenticated()) {
          setUser(null);
          return;
        }
        api.request("/api/auth/me/")
          .then((currentUser) => {
            if (active) setUser(currentUser);
          })
          .catch((error) => {
            if (active && !api.isAuthenticated()) setUser(null);
            console.error("Could not load the signed-in commander profile.", error);
          });
      } catch (error) {
        console.error("Could not read the saved commander session.", error);
      }
    };

    const syncAccount = (event) => {
      if (
        !event ||
        event.type === "astraquest:profile-updated" ||
        event.key === "astraquestTokens"
      ) {
        loadAccount();
      }
    };
    loadAccount();
    window.addEventListener("storage", syncAccount);
    document.addEventListener("astraquest:profile-updated", syncAccount);

    return () => {
      active = false;
      window.removeEventListener("storage", syncAccount);
      document.removeEventListener("astraquest:profile-updated", syncAccount);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const displayName = user?.profile?.display_name || "";
  const profileInitials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "A";

  return (
    <header className="site-header">
      <a className="brand" href="index.html" aria-label="ASTRAQUEST home">
        <img
          src="/assets/astraquest-logo.png"
          alt="ASTRAQUEST — Junior Astronaut Mission Trainer"
        />
      </a>
      <button
        className="mobile-menu"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Menu aria-hidden="true" />
      </button>
      <nav
        className={`main-nav${menuOpen ? " open" : ""}`}
        aria-label="Main navigation"
      >
        <a className="nav-link active" href="index.html" aria-current="page" onClick={closeMenu}>Home</a>
        <a className="nav-link" href="tutorial.html" onClick={closeMenu}>How it works</a>
        <a className="nav-link" href="index.html#learn" onClick={closeMenu}>Levels</a>
        <a className="nav-link" href="nasa-data.html" onClick={closeMenu}>NASA Data</a>
        <a className="nav-link" href="store.html" onClick={closeMenu}>Store</a>
      </nav>
      {user ? (
        <div className="auth-nav account-nav">
          <div className="profile-wrap" ref={profileRef}>
            <button
              className="profile-button"
              type="button"
              aria-label={`Account menu for ${displayName}`}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="profile-avatar" aria-hidden="true">{profileInitials}</span>
              <span className="profile-label">{displayName}</span>
            </button>
            {profileOpen && (
              <div className="profile-menu" role="menu">
                <div className="profile-summary">
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                </div>
                <a href="profile.html" role="menuitem" onClick={closeMenu}>View profile</a>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    window.AstraquestApi.clearTokens();
                    setUser(null);
                    setProfileOpen(false);
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="auth-nav">
          <a href="auth.html?mode=signup">Sign Up</a>
          <a href="auth.html?mode=login">Log In</a>
        </div>
      )}
    </header>
  );
}

function App() {
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => setToastMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      <Header />
      <main id="home">
        <section className="landing-hero">
          <div
            className="landing-art"
            role="img"
            aria-label="Astronaut exploring the surface of Mars"
          />
          <div className="landing-copy">
            <h1>
              BECOME THE
              <br />
              <span>MISSION</span>
              <br />
              COMMANDER
            </h1>
            <h2>Plan. Decide. Explore.</h2>
            <p>Learn real space engineering through mission decisions.</p>
            <div className="landing-actions">
              <a className="cta cta-primary" href="mission-selection.html">
                START MISSION <ArrowRight aria-hidden="true" />
              </a>
              <a className="cta cta-outline" href="tutorial.html">
                HOW IT WORKS
              </a>
            </div>
          </div>
        </section>

        <section
          className="landing-options"
          id="missions"
          aria-label="Mission destinations"
        >
          <article className="destination moon-destination">
            <img src="/assets/moon.png" alt="Moon" />
            <div className="destination-info">
              <h2>MOON MISSION</h2>
              <p>Build and survive a lunar mission.</p>
              <span className="difficulty"><i /> Beginner</span>
            </div>
            <button
              className="explore-button"
              type="button"
              onClick={() => setToastMessage("Moon mission selected. Sign in or create an account to continue.")}
            >
              Explore <span>→</span>
            </button>
          </article>
          <article className="destination mars-destination">
            <img src="/assets/mars.png" alt="Mars" />
            <div className="destination-info">
              <h2>MARS MISSION</h2>
              <p>Manage a longer and more challenging mission.</p>
              <span className="difficulty"><i /> Intermediate</span>
            </div>
            <button
              className="explore-button"
              type="button"
              onClick={() => setToastMessage("Mars mission selected. Sign in or create an account to continue.")}
            >
              Explore <span>→</span>
            </button>
          </article>
          <aside className="nasa-callout" id="nasa-data">
            <h3>
              Build with <span>NASA supported</span>
              <br />
              data and references
            </h3>
            <a className="cta cta-primary" href="nasa-data.html">
              EXPLORE NASA DATA <ArrowRight aria-hidden="true" />
            </a>
          </aside>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-intro">
            <span>HOW IT WORKS</span>
            <h2>Your Mission Journey</h2>
            <p>
              From training to debrief, experience the full cycle
              <br />
              of a real life space mission
            </p>
          </div>
          <div className="journey-steps">
            <article>
              <div className="step-icon"><Map aria-hidden="true" /></div>
              <div><b>CHOOSE</b><p>Moon or Mars</p></div>
            </article>
            <span className="step-arrow">➜</span>
            <article>
              <div className="step-icon"><Settings aria-hidden="true" /></div>
              <div><b>PLAN</b><p>Manage your<br />resources</p></div>
            </article>
            <span className="step-arrow">➜</span>
            <article>
              <div className="step-icon"><TriangleAlert aria-hidden="true" /></div>
              <div><b>DECIDE</b><p>Respond to<br />mission events</p></div>
            </article>
            <span className="step-arrow">➜</span>
            <article id="learn">
              <div className="step-icon"><Star aria-hidden="true" /></div>
              <div><b>LEARN</b><p>See why your<br />decision matters</p></div>
            </article>
          </div>
        </section>
      </main>
      <div className="toast" role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}

export default App;

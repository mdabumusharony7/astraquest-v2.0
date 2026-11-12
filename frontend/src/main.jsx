import { useEffect, useState } from "react";
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

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

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
      <div className="auth-nav">
        <a href="auth.html?mode=signup">Sign Up</a>
        <a href="auth.html?mode=login">Log In</a>
      </div>
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

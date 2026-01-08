// src/components/Navbar.jsx
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Navbar.css";

export default function Navbar() {
  const [u, setU] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setU(user);
      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } else {
        setUserProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (q.trim()) {
      nav(`/search?q=${encodeURIComponent(q)}`);
      setIsMenuOpen(false);
    }
  }

  function handleLogout() {
    signOut(auth);
    setIsMenuOpen(false);
  }

  return (
    <nav className="navbar-upgraded" role="navigation" aria-label="ניווט ראשי">
      <div className="navbar-container">
        {/* Logo Section */}
        <Link className="navbar-logo" to="/" onClick={() => setIsMenuOpen(false)} aria-label="punkontrol - עמוד הבית">
          <span className="logo-icon" aria-hidden="true">🎨</span>
          <span className="logo-text">punkontrol</span>
        </Link>

        {/* Search Bar - Desktop */}
        <form className="navbar-search" onSubmit={onSubmit} role="search">
          <input
            type="search"
            className="search-input"
            placeholder="חפש יצירות אמנות..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="חיפוש יצירות אמנות"
          />
          <button type="submit" className="search-button" aria-label="בצע חיפוש">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {u ? (
            <>
              <Link className="nav-btn nav-btn-upload" to="/upload" aria-label="העלה יצירה חדשה">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>העלה</span>
              </Link>
              <Link
                className="nav-btn nav-btn-profile"
                to={`/u/${userProfile?.username || "me"}`}
                aria-label={`הפרופיל של ${userProfile?.username || u.displayName || "משתמש"}`}
              >
                <div className="profile-avatar">
                  {(userProfile?.avatarUrl || u.photoURL) ? (
                    <img src={userProfile?.avatarUrl || u.photoURL} alt={`תמונת פרופיל של ${userProfile?.username || u.displayName}`} />
                  ) : (
                    <span aria-hidden="true">{u.displayName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <span>הפרופיל שלי</span>
              </Link>
              <button className="nav-btn nav-btn-logout" onClick={handleLogout} aria-label="התנתק מהאתר">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>התנתק</span>
              </button>
            </>
          ) : (
            <Link className="nav-btn nav-btn-login" to="/login" aria-label="התחבר לאתר">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>התחבר</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={`menu-toggle ${isMenuOpen ? "open" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "סגור תפריט" : "פתח תפריט"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div id="mobile-menu" className={`mobile-menu ${isMenuOpen ? "open" : ""}`} role="navigation" aria-label="תפריט ניווט נייד">
        <form className="mobile-search" onSubmit={onSubmit} role="search">
          <input
            type="search"
            className="search-input"
            placeholder="חפש יצירות אמנות..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="חיפוש יצירות אמנות"
          />
          <button type="submit" className="search-button" aria-label="בצע חיפוש">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div className="mobile-actions">
          {u ? (
            <>
              <Link className="mobile-nav-btn" to="/upload" onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>העלה יצירה</span>
              </Link>
              <Link
                className="mobile-nav-btn"
                to={`/u/${userProfile?.username || "me"}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="profile-avatar">
                  {(userProfile?.avatarUrl || u.photoURL) ? (
                    <img src={userProfile?.avatarUrl || u.photoURL} alt="Profile" />
                  ) : (
                    <span>{u.displayName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <span>הפרופיל שלי</span>
              </Link>
              <button className="mobile-nav-btn logout" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>התנתק</span>
              </button>
            </>
          ) : (
            <Link className="mobile-nav-btn login" to="/login" onClick={() => setIsMenuOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>התחבר</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

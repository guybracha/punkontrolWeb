import { useState, useEffect } from "react";
import "../styles/Accessibility.css";

/**
 * כלי נגישות - תפריט לניהול הגדרות נגישות
 * מספק: ניגודיות גבוהה, גופנים גדולים, ניווט במקלדת, הפחתת אנימציות
 */
export default function AccessibilityTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    focusIndicator: true,
    underlineLinks: false,
    screenReaderOptimized: false,
  });

  // טען הגדרות מ-localStorage
  useEffect(() => {
    const saved = localStorage.getItem("a11y-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error("Error loading accessibility settings:", error);
      }
    }
  }, []);

  // החל הגדרות על הדף
  function applySettings(newSettings) {
    const root = document.documentElement;
    
    // ניגודיות גבוהה
    if (newSettings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // טקסט גדול
    if (newSettings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    // הפחתת תנועה
    if (newSettings.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // מחוון פוקוס משופר
    if (newSettings.focusIndicator) {
      root.classList.add("enhanced-focus");
    } else {
      root.classList.remove("enhanced-focus");
    }

    // קו תחתון לקישורים
    if (newSettings.underlineLinks) {
      root.classList.add("underline-links");
    } else {
      root.classList.remove("underline-links");
    }

    // אופטימיזציה לקוראי מסך
    if (newSettings.screenReaderOptimized) {
      root.classList.add("screen-reader-optimized");
    } else {
      root.classList.remove("screen-reader-optimized");
    }
  }

  // עדכן הגדרה
  function toggleSetting(key) {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem("a11y-settings", JSON.stringify(newSettings));
  }

  // איפוס הגדרות
  function resetSettings() {
    const defaultSettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      focusIndicator: true,
      underlineLinks: false,
      screenReaderOptimized: false,
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.setItem("a11y-settings", JSON.stringify(defaultSettings));
  }

  // ניהול מקלדת - פתיחה/סגירה עם Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Skip to main content */}
      <a href="#main-content" className="skip-link">
        דלג לתוכן הראשי
      </a>

      {/* כפתור פתיחת תפריט נגישות */}
      <button
        className="a11y-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        title="כלי נגישות"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="8" r="1" />
          <path d="M8.5 11.5a3.5 3.5 0 0 1 7 0" />
          <path d="M9 19l-1-6" />
          <path d="M15 19l1-6" />
        </svg>
        <span className="visually-hidden">נגישות</span>
      </button>

      {/* תפריט נגישות */}
      {isOpen && (
        <div
          id="a11y-panel"
          className="a11y-panel"
          role="dialog"
          aria-label="הגדרות נגישות"
          aria-modal="true"
        >
          <div className="a11y-header">
            <h2 id="a11y-title">כלי נגישות</h2>
            <button
              className="a11y-close"
              onClick={() => setIsOpen(false)}
              aria-label="סגור תפריט נגישות"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="a11y-content">
            {/* ניגודיות גבוהה */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={() => toggleSetting("highContrast")}
                aria-describedby="desc-highContrast"
              />
              <div>
                <strong>ניגודיות גבוהה</strong>
                <span id="desc-highContrast" className="a11y-description">
                  צבעים בניגודיות גבוהה לקריאה נוחה יותר
                </span>
              </div>
            </label>

            {/* טקסט גדול */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={() => toggleSetting("largeText")}
                aria-describedby="desc-largeText"
              />
              <div>
                <strong>גופן גדול</strong>
                <span id="desc-largeText" className="a11y-description">
                  הגדל את גודל הטקסט באתר
                </span>
              </div>
            </label>

            {/* הפחתת תנועה */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={() => toggleSetting("reducedMotion")}
                aria-describedby="desc-reducedMotion"
              />
              <div>
                <strong>הפחת אנימציות</strong>
                <span id="desc-reducedMotion" className="a11y-description">
                  צמצם אנימציות ומעברים
                </span>
              </div>
            </label>

            {/* מחוון פוקוס */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.focusIndicator}
                onChange={() => toggleSetting("focusIndicator")}
                aria-describedby="desc-focusIndicator"
              />
              <div>
                <strong>מחוון פוקוס משופר</strong>
                <span id="desc-focusIndicator" className="a11y-description">
                  הדגש אלמנטים בפוקוס לניווט במקלדת
                </span>
              </div>
            </label>

            {/* קו תחתון לקישורים */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.underlineLinks}
                onChange={() => toggleSetting("underlineLinks")}
                aria-describedby="desc-underlineLinks"
              />
              <div>
                <strong>קו תחתון לקישורים</strong>
                <span id="desc-underlineLinks" className="a11y-description">
                  הצג קו תחתון לכל הקישורים
                </span>
              </div>
            </label>

            {/* אופטימיזציה לקוראי מסך */}
            <label className="a11y-option">
              <input
                type="checkbox"
                checked={settings.screenReaderOptimized}
                onChange={() => toggleSetting("screenReaderOptimized")}
                aria-describedby="desc-screenReaderOptimized"
              />
              <div>
                <strong>אופטימיזציה לקוראי מסך</strong>
                <span id="desc-screenReaderOptimized" className="a11y-description">
                  שפר את החוויה עם קוראי מסך
                </span>
              </div>
            </label>
          </div>

          <div className="a11y-footer">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={resetSettings}
            >
              אפס הגדרות
            </button>
          </div>

          <div className="a11y-info">
            <p>קיצורי מקלדת נפוצים:</p>
            <ul>
              <li><kbd>Tab</kbd> - עבור בין אלמנטים</li>
              <li><kbd>Enter</kbd> - הפעל קישור או כפתור</li>
              <li><kbd>Space</kbd> - סמן תיבת סימון</li>
              <li><kbd>Esc</kbd> - סגור דיאלוגים</li>
            </ul>
          </div>
        </div>
      )}

      {/* רקע שקוף */}
      {isOpen && (
        <div
          className="a11y-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

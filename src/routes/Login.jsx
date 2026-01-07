// src/routes/Login.jsx
import { auth, db, googleProvider } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function createUserDoc(user, name) {
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, {
      username: name.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000),
      displayName: name,
      bio: "",
      avatarUrl: "",
      email: user.email,
      createdAt: serverTimestamp(),
      followersCount: 0,
      followingCount: 0,
      artworksCount: 0,
      status: "active"
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // הרשמה
        if (!displayName.trim()) {
          throw new Error("נא להזין שם תצוגה");
        }
        if (password.length < 6) {
          throw new Error("הסיסמה חייבת להכיל לפחות 6 תווים");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
        await createUserDoc(userCredential.user, displayName.trim());
        navigate("/");
      } else {
        // התחברות
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      
      // הודעות שגיאה בעברית
      let errorMessage = "אירעה שגיאה. נסה שוב.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "כתובת האימייל כבר בשימוש";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "הסיסמה חלשה מדי";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "כתובת אימייל לא תקינה";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "משתמש לא נמצא";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "סיסמה שגויה";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "פרטי התחברות שגויים";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // בדיקה אם המשתמש קיים במסד הנתונים
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // יצירת מסמך משתמש חדש אם לא קיים
        await createUserDoc(user, user.displayName || "משתמש");
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      
      let errorMessage = "אירעה שגיאה בהתחברות עם Google";
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "ההתחברות בוטלה";
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMessage = "בקשת התחברות בוטלה";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🎨</div>
          <h1>punkontrol</h1>
          <p className="login-subtitle">
            {isSignUp ? "צור חשבון חדש" : "התחבר לחשבון שלך"}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="displayName">שם תצוגה</label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                placeholder="השם שלך"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder={isSignUp ? "לפחות 6 תווים" : "הסיסמה שלך"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              isSignUp ? "הירשם" : "התחבר"
            )}
          </button>
        </form>

        <div className="divider">
          <span>או</span>
        </div>

        <button 
          type="button"
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {isSignUp ? "הירשם עם Google" : "התחבר עם Google"}
        </button>

        <div className="login-footer">
          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            disabled={loading}
          >
            {isSignUp ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הירשם"}
          </button>
        </div>
      </div>
    </div>
  );
}

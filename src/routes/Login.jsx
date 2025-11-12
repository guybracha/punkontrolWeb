// src/routes/Login.jsx
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect } from "react";

export default function Login() {

  // אם חזרנו מ-redirect, נסיים רישום משתמש
  useEffect(() => {
    (async () => {
      const res = await getRedirectResult(auth);
      if (res?.user) await ensureUserDoc(res.user);
    })();
  }, []);

  async function ensureUserDoc(u) {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        username: (u.displayName || "user").toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random()*1000),
        displayName: u.displayName || "User",
        bio: "",
        avatarUrl: u.photoURL || "",
        createdAt: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        artworksCount: 0,
        status: "active"
      });
    }
    window.history.back();
  }

  async function signIn() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user);
    } catch (e) {
      // אם הפופ-אפ נחסם, ננסה redirect
      if (String(e?.code).includes("popup") || String(e?.message).toLowerCase().includes("popup")) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      console.error(e);
      alert("Login failed: " + e?.message);
    }
  }

  return (
    <div className="container py-5">
      <h1>Login</h1>
      <button className="btn btn-primary" onClick={signIn}>Login with Google</button>
    </div>
  );
}

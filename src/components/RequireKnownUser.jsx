// src/components/RequireKnownUser.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RequireKnownUser({ children }) {
  const loc = useLocation();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) return setOk(false);
      const snap = await getDoc(doc(db, "users", u.uid));
      setOk(snap.exists() && snap.data()?.status !== "blocked");
    });
    return () => off();
  }, []);

  if (ok === null) return <div className="container py-4">טוען…</div>;
  if (!ok) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

// src/components/Navbar.jsx
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const [u, setU] = useState(null);
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");

  useEffect(() => onAuthStateChanged(auth, setU), []);

  function onSubmit(e){
    e.preventDefault();
    nav(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <nav className="navbar navbar-light bg-light px-3">
      <Link className="navbar-brand" to="/">punkontrol</Link>
      <form className="d-flex" onSubmit={onSubmit}>
        <input className="form-control me-2" placeholder="Search artworks…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn btn-outline-primary">Search</button>
      </form>
      <div className="ms-auto d-flex gap-2">
        {u ? (
          <>
            <Link className="btn btn-primary" to="/upload">+ Upload</Link>
            <Link className="btn btn-outline-secondary" to={`/u/${u.displayName?.toLowerCase().replace(/\s+/g,"") || "me"}`}>הפרופיל שלי</Link>
            <button className="btn btn-link" onClick={()=>signOut(auth)}>Logout</button>
          </>
        ) : (
          <Link className="btn btn-primary" to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

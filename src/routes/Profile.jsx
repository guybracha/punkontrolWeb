// src/routes/Profile.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserByUsername, getUserArtworks } from "../lib/queries";
import ArtworkCard from "../components/ArtworkCard";
import FollowButton from "../components/FollowButton";

export default function Profile() {
  const { username } = useParams();

  // טוען את המשתמש לפי שם משתמש
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    error: userErr,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
    retry: false,
  });

  // טוען יצירות רק אחרי שמצאנו את המשתמש (לפי uid)
  const {
    data: arts = [],
    isLoading: artsLoading,
    isError: artsError,
  } = useQuery({
    queryKey: ["arts", user?.uid],
    queryFn: () => getUserArtworks(user.uid), // אם הפונקציה שלך מקבלת username – החלף ל: () => getUserArtworks(user.username)
    enabled: !!user?.uid,
    retry: false,
  });

  if (userLoading) {
    return <div className="container py-4">טוען…</div>;
  }

  if (userError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          לא ניתן לטעון את הפרופיל: {String(userErr?.message || "")}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4 mb-3">לא נמצא משתמש בשם @{username}</h1>
        <Link to="/" className="btn btn-primary">חזרה לדף הבית</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <header className="d-flex align-items-center gap-3 mb-3">
        <img
          src={user.avatarUrl || "https://placehold.co/96x96?text=👤"}
          className="rounded-circle border"
          alt={`${user.displayName || user.username} avatar`}
          width={64}
          height={64}
        />
        <div className="min-w-0">
          <h1 className="h4 m-0 text-truncate">{user.displayName || user.username}</h1>
          <div className="text-muted">@{user.username}</div>
        </div>
        <div className="ms-auto">
          <FollowButton targetUserId={user.uid} />
        </div>
      </header>

      {user.bio && <p className="mb-4">{user.bio}</p>}

      <h2 className="h5 mt-4 mb-3">Artworks</h2>

      {artsLoading && <div>טוען יצירות…</div>}
      {artsError && (
        <div className="alert alert-warning" role="alert">
          לא ניתן לטעון יצירות כרגע.
        </div>
      )}

      <div className="row g-3">
        {arts.map((a) => (
          <div className="col-6 col-md-4 col-lg-3" key={a.id}>
            <ArtworkCard art={a} />
          </div>
        ))}
      </div>

      {!artsLoading && !artsError && arts.length === 0 && (
        <div className="text-muted mt-3">אין יצירות להצגה.</div>
      )}
    </div>
  );
}

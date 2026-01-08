import { Link } from "react-router-dom";

/**
 * כרטיס משתמש לתוצאות חיפוש
 */
export default function UserCard({ user }) {
  return (
    <Link 
      to={`/u/${user.username}`}
      className="card h-100 text-decoration-none shadow-sm hover-shadow"
      style={{ transition: "all 0.2s" }}
    >
      <div className="card-body text-center">
        {/* תמונת פרופיל */}
        <div className="mb-3">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.username}&size=128&background=random`}
            alt={user.displayName || user.username}
            className="rounded-circle"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
        </div>

        {/* שם משתמש */}
        <h6 className="card-title mb-1 fw-bold">
          {user.displayName || user.username}
        </h6>
        <p className="text-muted small mb-2">@{user.username}</p>

        {/* ביוגרפיה */}
        {user.bio && (
          <p className="card-text small text-muted mb-3" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {user.bio}
          </p>
        )}

        {/* סטטיסטיקות */}
        <div className="d-flex justify-content-around text-muted small">
          <div>
            <strong>{user.followersCount || 0}</strong>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>עוקבים</div>
          </div>
          <div>
            <strong>{user.artworksCount || 0}</strong>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>יצירות</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

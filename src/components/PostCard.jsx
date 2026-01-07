import { Link } from "react-router-dom";
import { formatRelativeTime } from "../lib/dateUtils";

/**
 * כרטיס פוסט - תומך בפוסטי טקסט, אמנות וקומיקס
 */
export default function PostCard({ post }) {
  const { id, title, body, type, media = [], authorUsername, counts = {}, createdAt } = post;

  // תמונה ראשונה אם יש
  const firstImage = media[0]?.url;

  return (
    <div className="card h-100 shadow-sm">
      {/* תמונה */}
      {firstImage && (
        <Link to={`/post/${id}`}>
          <img
            src={firstImage}
            alt={title}
            className="card-img-top"
            style={{ height: 200, objectFit: "cover" }}
          />
        </Link>
      )}

      <div className="card-body">
        {/* סוג */}
        <div className="mb-2">
          <span className={`badge ${getTypeBadgeColor(type)}`}>
            {getTypeLabel(type)}
          </span>
        </div>

        {/* כותרת */}
        <h5 className="card-title">
          <Link to={`/post/${id}`} className="text-decoration-none text-dark">
            {title}
          </Link>
        </h5>

        {/* תוכן (מקוצר) */}
        {body && (
          <p className="card-text text-muted small">
            {body.length > 100 ? `${body.slice(0, 100)}...` : body}
          </p>
        )}

        {/* מטא-דאטה */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Link to={`/u/${authorUsername}`} className="text-decoration-none small">
            @{authorUsername}
          </Link>
          <div className="text-muted small" title={createdAt ? new Date(createdAt.toDate?.() || createdAt).toLocaleString("he-IL") : ""}>
            {createdAt ? formatRelativeTime(createdAt) : ""}
          </div>
        </div>
        
        {/* סטטיסטיקות */}
        <div className="text-muted small mt-2">
          ❤️ {counts.likes || 0} · 💬 {counts.comments || 0}
        </div>
      </div>
    </div>
  );
}

function getTypeBadgeColor(type) {
  switch (type) {
    case "art":
      return "bg-primary";
    case "comic":
      return "bg-warning";
    case "text":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
}

function getTypeLabel(type) {
  switch (type) {
    case "art":
      return "🎨 אמנות";
    case "comic":
      return "📚 קומיקס";
    case "text":
      return "📝 טקסט";
    default:
      return type;
  }
}

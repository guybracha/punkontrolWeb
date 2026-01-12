import { Link } from "react-router-dom";
import { formatRelativeTime } from "../lib/dateUtils";
import ShareButton from "./ShareButton";

/**
 * כרטיס פוסט - תומך בפוסטי טקסט, אמנות וקומיקס
 */
export default function PostCard({ post }) {
  const { id, title, body, type, media = [], authorUsername, counts = {}, createdAt } = post;

  // תמונה ראשונה אם יש
  const firstImage = media[0]?.url;

  return (
    <article className="card h-100 shadow-sm" aria-label={`${getTypeLabel(type)}: ${title}`}>
      {/* תמונה */}
      {firstImage && (
        <Link to={`/post/${id}`} aria-label={`הצג ${title}`}>
          <img
            src={firstImage}
            alt={title}
            className="card-img-top"
            style={{ height: 200, objectFit: "cover" }}
            loading="lazy"
          />
        </Link>
      )}

      <div className="card-body">
        {/* סוג */}
        <div className="mb-2 d-flex justify-content-between align-items-start">
          <span className={`badge ${getTypeBadgeColor(type)}`}>
            {getTypeLabel(type)}
          </span>
          <ShareButton 
            url={`/post/${id}`}
            title={title}
            description={body?.substring(0, 100)}
          />
        </div>

        {/* כותרת */}
        <h5 className="card-title">
          <Link to={`/post/${id}`} className="text-decoration-none text-dark" aria-label={`קרא עוד על ${title}`}>
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
          <Link to={`/u/${authorUsername}`} className="text-decoration-none small" aria-label={`פרופיל של ${authorUsername}`}>
            @{authorUsername}
          </Link>
          <div className="text-muted small" title={createdAt ? new Date(createdAt.toDate?.() || createdAt).toLocaleString("he-IL") : ""}>
            {createdAt ? formatRelativeTime(createdAt) : ""}
          </div>
        </div>
        
        {/* סטטיסטיקות */}
        <div className="text-muted small mt-2" aria-label={`${counts.likes || 0} לייקים, ${counts.comments || 0} תגובות`}>
          <span aria-hidden="true">❤️</span> {counts.likes || 0} <span aria-hidden="true">·</span> <span aria-hidden="true">💬</span> {counts.comments || 0}
        </div>
      </div>
    </article>
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

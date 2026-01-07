import { useState, useEffect } from "react";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import PostCard from "../components/PostCard";

/**
 * Feed מתקדם עם פילטרים
 */
export default function AdvancedFeed() {
  const [filterType, setFilterType] = useState(null);
  const { items, loading, hasMore, error, loadMore, reset } = useInfiniteFeed({
    pageSize: 20,
    type: filterType,
  });

  // כשמשנים פילטר - מאפס ומטען מחדש
  useEffect(() => {
    reset();
    loadMore();
  }, [filterType]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📰 Feed</h1>

        {/* פילטר סוג */}
        <div className="btn-group" role="group">
          <button
            className={`btn ${filterType === null ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterType(null)}
          >
            🌐 הכל
          </button>
          <button
            className={`btn ${filterType === "art" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterType("art")}
          >
            🎨 אמנות
          </button>
          <button
            className={`btn ${filterType === "comic" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterType("comic")}
          >
            📚 קומיקס
          </button>
          <button
            className={`btn ${filterType === "text" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterType("text")}
          >
            📝 טקסט
          </button>
        </div>
      </div>

      {/* שגיאה */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* רשת פוסטים */}
      <div className="row g-4">
        {items.map((post) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={post.id}>
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {/* טוען או כפתור "טען עוד" */}
      <div className="mt-4 text-center">
        {loading && (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">טוען...</span>
          </div>
        )}

        {!loading && hasMore && (
          <button className="btn btn-outline-primary btn-lg" onClick={loadMore}>
            טען עוד
          </button>
        )}

        {!loading && !hasMore && items.length > 0 && (
          <p className="text-muted">זהו, הגעת לסוף! 🎉</p>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted fs-4">אין פוסטים עדיין 😢</p>
            <p className="text-muted">היה הראשון לפרסם משהו!</p>
          </div>
        )}
      </div>
    </div>
  );
}

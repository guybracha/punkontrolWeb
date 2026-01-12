import { useEffect, useRef } from "react";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import PostCard from "../components/PostCard";
import SEO from "../components/SEO";

/**
 * עמוד Feed עם פגינציה אינסופית (Tumblr-style)
 */
export default function Feed() {
  const { items, loading, hasMore, error, loadMore } = useInfiniteFeed({
    pageSize: 20,
    type: null, // null = כל הסוגים
  });

  const isInitialLoad = useRef(true);

  // טוען את העמוד הראשון
  useEffect(() => {
    if (isInitialLoad.current && items.length === 0 && !loading) {
      isInitialLoad.current = false;
      loadMore();
    }
  }, [items.length, loading, loadMore]);

  return (
    <>
      <SEO 
        title="Feed - פיד תוכן"
        description="עקוב אחר הפוסטים והיצירות האחרונות מהאמנים שאתה אוהב"
      />
      <div className="container py-4">
      <h1 className="mb-4"><span aria-hidden="true">📰</span> Feed</h1>

      {/* שגיאה */}
      {error && (
        <div className="alert alert-danger" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {/* רשת פוסטים */}
      <div className="row g-4" role="list" aria-label="רשימת פוסטים">
        {items.map((post) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={post.id}>
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {/* טוען או כפתור "טען עוד" */}
      <div className="mt-4 text-center" role="region" aria-live="polite" aria-label="סטטוס טעינה">
        {loading && (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">טוען פוסטים נוספים...</span>
          </div>
        )}

        {!loading && hasMore && (
          <button className="btn btn-outline-primary" onClick={loadMore} aria-label="טען פוסטים נוספים">
            טען עוד
          </button>
        )}

        {!loading && !hasMore && items.length > 0 && (
          <p className="text-muted" role="status">זהו, הגעת לסוף! <span aria-hidden="true">🎉</span></p>
        )}

        {!loading && items.length === 0 && (
          <p className="text-muted" role="status">אין פוסטים עדיין <span aria-hidden="true">😢</span></p>
        )}
      </div>
    </div>
    </>
  );
}

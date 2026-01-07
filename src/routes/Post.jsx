import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostById, getComments, addComment, toggleLike, hasLiked } from "../services/posts.api";
import { useAuth } from "../context/AuthContext";

export default function Post() {
  const { postId } = useParams();
  const { userProfile } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // טוען פוסט ותגובות
  useEffect(() => {
    async function load() {
      try {
        const [postData, commentsData] = await Promise.all([
          getPostById(postId),
          getComments(postId),
        ]);

        setPost(postData);
        setComments(commentsData);

        // בודק אם המשתמש לייק
        if (userProfile?.uid) {
          const isLiked = await hasLiked(postId, userProfile.uid);
          setLiked(isLiked);
        }
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [postId, userProfile]);

  // לייק
  async function handleLike() {
    if (!userProfile?.uid) return;

    try {
      const newLiked = await toggleLike(postId, userProfile.uid);
      setLiked(newLiked);

      // עדכון מקומי של המונה
      setPost((prev) => ({
        ...prev,
        counts: {
          ...prev.counts,
          likes: prev.counts.likes + (newLiked ? 1 : -1),
        },
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }

  // הוספת תגובה
  async function handleComment(e) {
    e.preventDefault();
    if (!userProfile?.uid || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const commentId = await addComment(postId, {
        authorId: userProfile.uid,
        authorUsername: userProfile.username,
        text: commentText.trim(),
      });

      // הוספה מקומית
      setComments((prev) => [
        ...prev,
        {
          id: commentId,
          authorId: userProfile.uid,
          authorUsername: userProfile.username,
          text: commentText.trim(),
          createdAt: new Date(),
        },
      ]);

      // עדכון מונה
      setPost((prev) => ({
        ...prev,
        counts: {
          ...prev.counts,
          comments: prev.counts.comments + 1,
        },
      }));

      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">טוען...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">הפוסט לא נמצא</div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      {/* כותרת */}
      <h1 className="mb-3">{post.title}</h1>

      {/* מחבר */}
      <div className="mb-3">
        <Link to={`/u/${post.authorUsername}`} className="text-decoration-none">
          @{post.authorUsername}
        </Link>
        <span className="text-muted ms-2">
          · {new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString("he-IL")}
        </span>
      </div>

      {/* תמונות */}
      {post.media?.length > 0 && (
        <div className="mb-4">
          {post.media.map((m, i) => (
            <img
              key={i}
              src={m.url}
              alt={`${post.title} ${i + 1}`}
              className="img-fluid mb-3 rounded"
            />
          ))}
        </div>
      )}

      {/* תוכן */}
      {post.body && (
        <div className="mb-4" style={{ whiteSpace: "pre-wrap" }}>
          {post.body}
        </div>
      )}

      {/* תגיות */}
      {post.tags?.length > 0 && (
        <div className="mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="badge bg-secondary me-2">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <hr />

      {/* לייק */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className={`btn ${liked ? "btn-danger" : "btn-outline-danger"}`}
          onClick={handleLike}
          disabled={!userProfile}
        >
          ❤️ {post.counts?.likes || 0}
        </button>
        <span className="text-muted">💬 {post.counts?.comments || 0} תגובות</span>
      </div>

      <hr />

      {/* תגובות */}
      <h3 className="mb-3">תגובות</h3>

      {/* טופס תגובה */}
      {userProfile ? (
        <form onSubmit={handleComment} className="mb-4">
          <textarea
            className="form-control mb-2"
            rows="3"
            placeholder="כתוב/כתבי תגובה..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button className="btn btn-primary" disabled={submitting || !commentText.trim()}>
            {submitting ? "שולח..." : "שלח תגובה"}
          </button>
        </form>
      ) : (
        <div className="alert alert-info mb-4">
          <Link to="/login">התחבר/י</Link> כדי להגיב
        </div>
      )}

      {/* רשימת תגובות */}
      <div className="vstack gap-3">
        {comments.length === 0 && <p className="text-muted">אין תגובות עדיין</p>}

        {comments.map((comment) => (
          <div key={comment.id} className="card">
            <div className="card-body">
              <div className="mb-2">
                <Link to={`/u/${comment.authorUsername}`} className="fw-bold text-decoration-none">
                  @{comment.authorUsername}
                </Link>
                <span className="text-muted ms-2 small">
                  {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleDateString(
                    "he-IL"
                  )}
                </span>
              </div>
              <p className="mb-0">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

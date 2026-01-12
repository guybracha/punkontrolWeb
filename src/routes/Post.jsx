import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPostById, getComments, addComment, toggleLike, hasLiked, updatePost, deletePost, incrementPostViews } from "../services/posts.api";
import { useAuth } from "../context/AuthContext";
import { formatRelativeTime } from "../lib/dateUtils";
import SEO from "../components/SEO";
import ShareButtons from "../components/ShareButtons";

export default function Post() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", body: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ספירת צפייה פעם אחת בלבד
  useEffect(() => {
    if (postId) {
      incrementPostViews(postId);
    }
  }, [postId]);

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

  // עריכת הפוסט
  const isOwner = userProfile && post && userProfile.uid === post.authorId;

  const handleEditClick = () => {
    setEditForm({
      title: post.title || "",
      body: post.body || "",
      tags: post.tags?.join(", ") || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) return;
    
    setSaving(true);
    try {
      const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      await updatePost(postId, {
        title: editForm.title.trim(),
        body: editForm.body.trim(),
        tags
      });
      
      // עדכון מקומי
      setPost(prev => ({
        ...prev,
        title: editForm.title.trim(),
        body: editForm.body.trim(),
        tags
      }));
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("שגיאה בעדכון הפוסט");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !isOwner) return;
    
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את הפוסט "${post.title}"?\n\nפעולה זו לא ניתנת לביטול!`
    );
    
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      await deletePost(postId, userProfile.uid);
      alert("הפוסט נמחק בהצלחה");
      navigate(`/u/${post.authorUsername}`);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("שגיאה במחיקת הפוסט");
      setDeleting(false);
    }
  };

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

  const postPreview = post.body?.substring(0, 160) || '';

  return (
    <>
      <SEO 
        title={post.title}
        description={postPreview}
        image={post.imageUrl}
        url={`https://punkontrol.web.app/post/${postId}`}
        type="article"
        author={post.authorUsername}
        keywords={post.tags || []}
      />
      <div className="container py-4" style={{ maxWidth: 800 }}>
      {/* כותרת */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <h1 className="mb-0">{post.title}</h1>
        {isOwner && (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={handleEditClick}
              title="ערוך פוסט"
              disabled={deleting}
            >
              ✏️
            </button>
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={handleDelete}
              title="מחק פוסט"
              disabled={deleting}
            >
              {deleting ? "🔄" : "🗑️"}
            </button>
          </div>
        )}
      </div>

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

      {/* סרטון YouTube */}
      {post.youtubeId && (
        <div className="mb-4">
          <div className="ratio ratio-16x9">
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeId}`}
              title="YouTube video"
              allowFullScreen
              className="rounded"
            ></iframe>
          </div>
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

      {/* לייק ושיתוף */}
      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className={`btn ${liked ? "btn-danger" : "btn-outline-danger"}`}
            onClick={handleLike}
            disabled={!userProfile}
          >
            ❤️ {post.counts?.likes || 0}
          </button>
          <span className="text-muted">💬 {post.counts?.comments || 0} תגובות</span>
          <span className="text-muted">👁️ {post.counts?.views || 0} צפיות</span>
        </div>
        
        {/* Share Buttons */}
        <ShareButtons 
          url={`/post/${postId}`}
          title={post.title}
          description={post.body?.substring(0, 160)}
          type="פוסט"
        />
      </div>

      <hr />

      {/* תגובות */}
      <h3 className="h5 mb-3">💬 תגובות ({comments.length})</h3>

      {/* טופס תגובה */}
      {userProfile ? (
        <form onSubmit={handleComment} className="mb-4">
          <div className="d-flex gap-2 align-items-start">
            <img
              src={userProfile.avatarUrl || "https://placehold.co/40x40?text=👤"}
              alt={userProfile.username}
              className="rounded-circle"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            <div className="flex-grow-1">
              <textarea
                className="form-control"
                rows="3"
                placeholder="כתוב תגובה..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
                maxLength={1000}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">{commentText.length}/1000</small>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? "שולח..." : "פרסם תגובה"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="alert alert-info mb-4">
          <Link to="/login" className="alert-link">התחבר</Link> כדי להגיב על הפוסט
        </div>
      )}

      {/* רשימת תגובות */}
      {comments.length === 0 ? (
        <div className="alert alert-light text-center">
          אין תגובות עדיין. היה הראשון להגיב!
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="card">
              <div className="card-body">
                <div className="d-flex gap-2">
                  <Link to={`/u/${comment.authorUsername}`}>
                    <img
                      src={comment.authorAvatar || "https://placehold.co/40x40?text=👤"}
                      alt={comment.authorUsername}
                      className="rounded-circle"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                  </Link>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <Link
                          to={`/u/${comment.authorUsername}`}
                          className="fw-bold text-decoration-none"
                        >
                          @{comment.authorUsername}
                        </Link>
                        <small className="text-muted ms-2">
                          {formatRelativeTime(comment.createdAt)}
                        </small>
                      </div>
                    </div>
                    <p className="mb-0 mt-2" style={{ whiteSpace: "pre-wrap" }}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
          onClick={() => !saving && setIsEditing(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">ערוך פוסט</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">כותרת *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.title}
                    onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                    disabled={saving}
                    maxLength={200}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">תוכן</label>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={editForm.body}
                    onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))}
                    disabled={saving}
                    maxLength={10000}
                    placeholder="כתוב את הפוסט שלך..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">תגיות (מופרדות בפסיק)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value }))}
                    disabled={saving}
                    placeholder="אמנות, בלוג, מחשבות"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.title.trim()}
                >
                  {saving ? "שומר..." : "שמור שינויים"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// src/routes/Artwork.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getArtworkBySlugOrId, deleteArtwork } from "../lib/queries";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Artwork(){
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { data:art } = useQuery({ queryKey:["art",slugOrId], queryFn:()=>getArtworkBySlugOrId(slugOrId) });
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // תמיכה במקש ESC לסגירת המודאל
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // מונע סקרול ברקע
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const isOwner = userProfile && art && userProfile.uid === art.authorId;

  const handleEditClick = () => {
    setEditForm({
      title: art.title || "",
      description: art.description || "",
      tags: art.tags?.join(", ") || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!art?.id || !editForm.title.trim()) return;
    
    setSaving(true);
    try {
      const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      await updateDoc(doc(db, "artworks", art.id), {
        title: editForm.title.trim(),
        titleLower: editForm.title.trim().toLowerCase(),
        description: editForm.description.trim(),
        tags
      });
      
      queryClient.invalidateQueries(["art", slugOrId]);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating artwork:", error);
      alert("שגיאה בעדכון היצירה");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!art?.id || !isOwner) return;
    
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את היצירה "${art.title}"?\n\nפעולה זו לא ניתנת לביטול!`
    );
    
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      await deleteArtwork(art.id, userProfile.uid);
      alert("היצירה נמחקה בהצלחה");
      navigate(`/u/${art.authorUsername}`);
    } catch (error) {
      console.error("Error deleting artwork:", error);
      alert("שגיאה במחיקת היצירה");
      setDeleting(false);
    }
  };

  if (!art) return <div className="container py-4">טוען…</div>;
  
  return (
    <>
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-7">
            <div className="position-relative" style={{ overflow: 'hidden', borderRadius: '12px' }}>
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="img-fluid w-100" 
                style={{ 
                  cursor: 'zoom-in',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onClick={() => setIsModalOpen(true)}
                title="לחץ להגדלה"
              />
              <div 
                className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded"
                style={{ 
                  background: 'rgba(0,0,0,0.6)', 
                  fontSize: '0.85rem',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              >
                🔍 לחץ להגדלה
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h1 className="h3 mb-0">{art.title}</h1>
              {isOwner && (
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleEditClick}
                    title="ערוך יצירה"
                    disabled={deleting}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleDelete}
                    title="מחק יצירה"
                    disabled={deleting}
                  >
                    {deleting ? "🔄" : "🗑️"}
                  </button>
                </div>
              )}
            </div>
            <div className="text-muted mb-2">@{art.authorUsername}</div>
            <p>{art.description}</p>
            <div className="d-flex flex-wrap gap-2">{art.tags?.map(t=><span key={t} className="badge bg-secondary">{t}</span>)}</div>
          </div>
        </div>
      </div>

      {/* Modal מסך מלא משופר */}
      {isModalOpen && (
        <div 
          className="modal d-block" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.96)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out',
            backdropFilter: 'blur(10px)',
            padding: '80px 20px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          {/* כותרת עליונה */}
          <div 
            className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white">
              <h5 className="mb-1">{art.title}</h5>
              <small className="text-white-50">by @{art.authorUsername}</small>
            </div>
            <button
              type="button"
              className="btn btn-lg"
              style={{
                color: 'white',
                fontSize: '2rem',
                lineHeight: '1',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'scale(1)';
              }}
              aria-label="סגור"
              title="סגור (או לחץ ESC)"
            >
              ×
            </button>
          </div>

          {/* התמונה */}
          <img
            src={art.imageUrl}
            alt={art.title}
            style={{
              maxWidth: '90vw',
              maxHeight: 'calc(100vh - 160px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              boxShadow: '0 10px 100px rgba(0,0,0,0.9)',
              borderRadius: '8px',
              animation: 'zoomIn 0.3s ease-out',
              display: 'block',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* הוראות למטה */}
          <div 
            className="position-absolute bottom-0 start-0 end-0 p-3 text-center text-white-50"
            style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              fontSize: '0.9rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            לחץ בכל מקום או ESC לסגירה
          </div>

          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes zoomIn {
                from { 
                  opacity: 0;
                  transform: scale(0.9);
                }
                to { 
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}
          </style>
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
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">ערוך יצירה</h5>
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
                    maxLength={100}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">תיאור</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    disabled={saving}
                    maxLength={2000}
                    placeholder="תאר את היצירה שלך..."
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
                    placeholder="אמנות דיגיטלית, פנטזיה, דמות"
                  />
                  <small className="text-muted">דוגמה: אמנות דיגיטלית, פנטזיה, דמות</small>
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
    </>
  );
}

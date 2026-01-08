// src/routes/Profile.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserByUsername, getUserArtworks } from "../lib/queries";
import { getUserPosts } from "../services/posts.api";
import ArtworkCard from "../components/ArtworkCard";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import { auth, db, storage } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { fixUserCounts } from "../lib/fixCounts";
import "../styles/Profile.css";

export default function Profile() {
  const { username } = useParams();
  const [currentUser] = useAuthState(auth);
  const queryClient = useQueryClient();
  
  // State for edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("artworks"); // "artworks" | "posts"
  const [fixingCounts, setFixingCounts] = useState(false);

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
    error: artsErr,
  } = useQuery({
    queryKey: ["arts", user?.uid],
    queryFn: () => getUserArtworks(user.uid),
    enabled: !!user?.uid,
    retry: false,
    staleTime: 0, // תמיד תשאל מחדש
  });
  
  console.log('🎨 Profile - User UID:', user?.uid);
  console.log('🎨 Profile - Artworks:', arts.length, 'artworks');
  console.log('🎨 Profile - Loading:', artsLoading, 'Error:', artsError);
  if (artsErr) console.error('🎨 Profile - Error details:', artsErr);

  // טוען פוסטים של המשתמש
  const {
    data: posts = [],
    isLoading: postsLoading,
    isError: postsError,
  } = useQuery({
    queryKey: ["userPosts", user?.uid],
    queryFn: () => getUserPosts(user.uid),
    enabled: !!user?.uid,
    retry: false,
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user", username]);
      setIsEditing(false);
    },
  });

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser && user && currentUser.uid === user.uid;

  const handleEditClick = () => {
    setEditDisplayName(user.displayName || "");
    setEditBio(user.bio || "");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setUploading(true);
    try {
      const updates = {
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
      };

      // Upload avatar if selected
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${avatarFile.name}`);
        await uploadBytes(storageRef, avatarFile);
        const avatarUrl = await getDownloadURL(storageRef);
        updates.avatarUrl = avatarUrl;
      }

      await updateProfileMutation.mutateAsync(updates);
      setAvatarFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("שגיאה בעדכון הפרופיל");
    } finally {
      setUploading(false);
    }
  };

  const handleFixCounts = async () => {
    if (!user?.uid) return;
    
    setFixingCounts(true);
    try {
      const result = await fixUserCounts(user.uid);
      if (result.success) {
        alert(`✅ הספירות תוקנו!\n${result.artworksCount} יצירות\n${result.postsCount} פוסטים`);
        queryClient.invalidateQueries(["user", username]);
      } else {
        alert("❌ שגיאה בתיקון הספירות");
      }
    } catch (error) {
      console.error("Error fixing counts:", error);
      alert("❌ שגיאה בתיקון הספירות");
    } finally {
      setFixingCounts(false);
    }
  };

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
      {/* Profile Header */}
      <header className="profile-header mb-4">
        <div className="profile-header-content">
          {/* Avatar */}
          <div className="profile-avatar-wrapper">
            <img
              src={user.avatarUrl || currentUser?.photoURL || "https://placehold.co/100x100?text=👤"}
              className="profile-avatar"
              alt={`${user.displayName || user.username} avatar`}
            />
          </div>

          {/* Info Section */}
          <div className="profile-info">
            <div className="profile-name-section">
              <h1 className="profile-name">{user.displayName || user.username}</h1>
              <div className="profile-username">@{user.username}</div>
              {user.email && <div className="profile-email">📧 {user.email}</div>}
            </div>
            
            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{user.followersCount || 0}</strong>
                <span>עוקבים</span>
              </div>
              <div className="profile-stat">
                <strong>{user.followingCount || 0}</strong>
                <span>עוקב</span>
              </div>
              <div className="profile-stat">
                <strong>{user.artworksCount || 0}</strong>
                <span>יצירות</span>
              </div>
              <div className="profile-stat">
                <strong>{user.postsCount || 0}</strong>
                <span>פוסטים</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button 
                  className="btn btn-sm btn-outline-secondary profile-action-btn"
                  onClick={handleFixCounts}
                  disabled={fixingCounts}
                  title="תקן את הספירות במידה והן לא מעודכנות"
                >
                  <span className="d-none d-md-inline">{fixingCounts ? "🔄 מתקן..." : "🔧 תקן ספירות"}</span>
                  <span className="d-md-none">{fixingCounts ? "🔄" : "🔧"}</span>
                </button>
                <button 
                  className="btn btn-outline-primary profile-action-btn"
                  onClick={handleEditClick}
                >
                  <span className="d-none d-sm-inline">✏️ ערוך פרופיל</span>
                  <span className="d-sm-none">✏️</span>
                </button>
              </>
            ) : (
              <FollowButton targetUserId={user.uid} />
            )}
          </div>
        </div>
      </header>

      {user.bio && (
        <div className="mb-4 p-3 bg-light rounded">
          <p className="m-0" style={{ whiteSpace: "pre-wrap" }}>{user.bio}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "artworks" ? "active" : ""}`}
            onClick={() => setActiveTab("artworks")}
          >
            🎨 יצירות אמנות ({arts.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            📝 פוסטים ({posts.length})
          </button>
        </li>
      </ul>

      {/* Artworks Tab */}
      {activeTab === "artworks" && (
        <>
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
            <div className="alert alert-light text-center py-5">
              <h5>אין יצירות עדיין</h5>
              <p className="text-muted">
                {isOwnProfile ? "התחל ליצור ולשתף את האמנות שלך!" : "המשתמש עדיין לא פרסם יצירות."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <>
          {postsLoading && <div>טוען פוסטים…</div>}
          {postsError && (
            <div className="alert alert-warning" role="alert">
              לא ניתן לטעון פוסטים כרגע.
            </div>
          )}

          <div className="row g-4">
            {posts.map((post) => (
              <div className="col-12 col-sm-6 col-md-4" key={post.id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {!postsLoading && !postsError && posts.length === 0 && (
            <div className="alert alert-light text-center py-5">
              <h5>אין פוסטים עדיין</h5>
              <p className="text-muted">
                {isOwnProfile ? "התחל לכתוב ולשתף את המחשבות שלך!" : "המשתמש עדיין לא פרסם פוסטים."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !uploading && setIsEditing(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">ערוך פרופיל</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsEditing(false)}
                  disabled={uploading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">שם תצוגה</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    disabled={uploading}
                    maxLength={50}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">ביוגרפיה</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    disabled={uploading}
                    maxLength={500}
                    placeholder="ספר/י קצת על עצמך..."
                  />
                  <small className="text-muted">{editBio.length}/500</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">תמונת פרופיל</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    disabled={uploading}
                  />
                  {avatarFile && (
                    <small className="text-success d-block mt-1">
                      ✓ קובץ נבחר: {avatarFile.name}
                    </small>
                  )}
                </div>

                {user.email && (
                  <div className="alert alert-info small">
                    <strong>אימייל:</strong> {user.email} (לא ניתן לעריכה)
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={uploading}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={uploading || !editDisplayName.trim()}
                >
                  {uploading ? "שומר..." : "שמור"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

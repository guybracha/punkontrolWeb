import { useState } from "react";
import { auth, db, storage } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import slugify from "../lib/slugify";
import { createPost } from "../services/posts.api";

// מזהי הקטגוריות התקניים למסד (כמו שסיכמנו)
const CATEGORY_IDS = [
  "comics","fantasy","scifi","horror","comedy","slice-of-life",
  "erotic-18","concept-art","digital-art","traditional-art",
  "3d","photography","painting"
];

function normalizeCategories(input) {
  // קולט טקסט עם פסיקים/רווחים ומחזיר מערך מזהים חוקיים
  const toId = (s) => s
    .trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const ids = Array.from(
    new Set(
      (input || "")
        .split(",")
        .map(toId)
        .filter(Boolean)
    )
  );
  return ids.filter((id) => CATEGORY_IDS.includes(id));
}

function pickExt(file) {
  if (!file?.name) return "jpg";
  const m = (file.name.toLowerCase().match(/\.(\w+)$/) || [,"jpg"])[1];
  // נגן על סוגים נפוצים
  if (["png","jpg","jpeg","webp"].includes(m)) return m === "jpeg" ? "jpg" : m;
  return "jpg";
}

export default function Upload(){
  const [mode, setMode] = useState("art"); // "art" או "post"
  const [postType, setPostType] = useState("text"); // "text", "art", "comic"
  const [form, setForm] = useState({
    title:"", description:"", tags:"", categoriesText:"", ageRestricted:false
  });
  const [files, setFiles] = useState([]); // תמיכה במספר תמונות לפוסט
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useState(null)[0];

  // פונקציה ליצירת פוסט (Tumblr-style)
  async function handlePostSubmit(e) {
    e.preventDefault();
    setErr("");
    const u = auth.currentUser;
    if (!u) return setErr("צריך להתחבר");
    if (!form.title.trim()) return setErr("כותרת היא חובה");

    try {
      setSaving(true);

      // שם משתמש
      const us = await getDoc(doc(db, "users", u.uid));
      const username = us.data()?.username || (u.displayName || "user").toLowerCase().replace(/\s+/g, "");

      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

      const postId = await createPost({
        uid: u.uid,
        username,
        title: form.title.trim(),
        body: form.description || "",
        type: postType,
        tags,
        files: Array.from(files),
      });

      window.location.assign(`/post/${postId}`);
    } catch (e) {
      console.error(e);
      setErr("שגיאה ביצירת הפוסט");
    } finally {
      setSaving(false);
    }
  }

  // פונקציה להעלאת artwork (DeviantArt-style)
  async function handleArtworkSubmit(e) {
    e.preventDefault();
    setErr("");
    const u = auth.currentUser;
    if (!u) return setErr("צריך להתחבר");
    if (files.length === 0) return setErr("בחר/י תמונה");
    if (!form.title.trim()) return setErr("כותרת היא חובה");

    const categories = normalizeCategories(form.categoriesText);
    const ageRestricted = !!form.ageRestricted;
    const cats = ageRestricted
      ? Array.from(new Set([...categories, "erotic-18"]))
      : categories;

    try {
      setSaving(true);

      // שם משתמש מה-users
      const us = await getDoc(doc(db,"users", u.uid));
      const username = us.data()?.username || (u.displayName || "user").toLowerCase().replace(/\s+/g,"");

      // יצירת מסמך יצירה
      const title = form.title.trim();
      const slug = `${slugify(title)}-${Math.floor(Math.random()*9000+1000)}`;
      const tags = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
      const docRef = await addDoc(collection(db,"artworks"), {
        authorId: u.uid,
        authorUsername: username,
        title,
        titleLower: title.toLowerCase(),
        slug,
        description: form.description || "",
        tags,
        categories: cats,            // << קטגוריות
        ageRestricted,               // << 18+
        imageUrl: "",
        visibility: "public",
        likesCount: 0,
        createdAt: serverTimestamp()
      });

      // העלאה ל-Storage (שומר סיומת קובץ אמיתית)
      const ext = pickExt(files[0]);
      const path = `artworks/${u.uid}/${docRef.id}.${ext}`;
      await uploadBytes(ref(storage, path), files[0]);
      const url = await getDownloadURL(ref(storage, path));
      await updateDoc(doc(db,"artworks", docRef.id), { imageUrl: url });

      window.location.assign(`/art/${docRef.id}`);
    } catch(e){
      console.error(e);
      setErr("שגיאה בהעלאה");
    } finally{
      setSaving(false);
    }
  }

  const onSubmit = mode === "post" ? handlePostSubmit : handleArtworkSubmit;

  // הוספת תמונה למיקום הנוכחי בטקסט (רק במצב פוסט)
  const insertImageAtCursor = (imageIndex) => {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.description;
    const imageMarker = `[תמונה ${imageIndex + 1}]`;
    
    const newText = text.substring(0, start) + imageMarker + text.substring(end);
    setForm(f => ({ ...f, description: newText }));
    
    // מחזיר את הפוקוס למיקום אחרי הסימון
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imageMarker.length, start + imageMarker.length);
    }, 0);
  };

  return (
    <div className="container py-4" style={{maxWidth:720}}>
      <h1 className="mb-3">העלאה</h1>
      {err && <div className="alert alert-danger">{err}</div>}

      {/* בורר מצב: Artwork או Post */}
      <div className="btn-group mb-4 w-100" role="group">
        <button
          type="button"
          className={`btn ${mode === "art" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("art")}
        >
          🎨 יצירה אמנותית
        </button>
        <button
          type="button"
          className={`btn ${mode === "post" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("post")}
        >
          📝 פוסט
        </button>
      </div>

      {/* סוג פוסט (רק במצב post) */}
      {mode === "post" && (
        <div className="mb-3">
          <label className="form-label">סוג פוסט</label>
          <select
            className="form-select"
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
          >
            <option value="text">טקסט</option>
            <option value="art">אמנות</option>
            <option value="comic">קומיקס</option>
          </select>
        </div>
      )}

      <form className="vstack gap-3" onSubmit={onSubmit}>
        <div>
          <label className="form-label fw-bold fs-5">כותרת *</label>
          <input 
            className="form-control form-control-lg border-0 border-bottom rounded-0 px-0" 
            placeholder={mode === "post" ? "כתוב כותרת מעניינת..." : "שם היצירה"}
            style={{ fontSize: mode === "post" ? "1.5rem" : "1.25rem", fontWeight: mode === "post" ? "600" : "normal" }}
            value={form.title}
            onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
        </div>

        {mode === "post" ? (
          // עורך בסגנון בלוג לפוסטים
          <div className="position-relative">
            <label className="form-label fw-bold">תוכן הפוסט</label>
            <textarea 
              id="postContent"
              className="form-control border-1 p-3" 
              rows="15"
              placeholder="ספר את הסיפור שלך... &#10;&#10;אתה יכול להוסיף תמונות מהגלריה למטה או פשוט לכתוב טקסט חופשי."
              style={{ 
                fontSize: "1.1rem", 
                lineHeight: "1.8",
                minHeight: "400px",
                resize: "vertical"
              }}
              value={form.description}
              onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
            
            {/* כלי עזר לעריכה */}
            <div className="text-muted small mt-2">
              💡 <strong>טיפ:</strong> השתמש ב-[תמונה X] כדי לסמן היכן תופיע כל תמונה בתוך הטקסט
            </div>
          </div>
        ) : (
          // שדה תיאור רגיל ל-artwork
          <div>
            <label className="form-label">תיאור</label>
            <textarea className="form-control" rows="5"
              value={form.description}
              onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
          </div>
        )}

        <div>
          <label className="form-label">תגיות (מופרדות בפסיק)</label>
          <input className="form-control"
            value={form.tags}
            onChange={e=>setForm(f=>({...f, tags:e.target.value}))}/>
        </div>

        {/* קטגוריות (רק ב-artwork) */}
        {mode === "art" && (
          <>
            <div>
              <label className="form-label">קטגוריות (מזהים מופרדים בפסיק)</label>
              <input className="form-control"
                placeholder="comics, digital-art, scifi, slice-of-life, painting..."
                value={form.categoriesText}
                onChange={e=>setForm(f=>({...f, categoriesText:e.target.value}))}/>
              <div className="form-text">
                מותר: comics, fantasy, scifi, horror, comedy, slice-of-life, erotic-18, concept-art,
                digital-art, traditional-art, 3d, photography, painting
              </div>
            </div>

            <div className="form-check">
              <input className="form-check-input" id="age18" type="checkbox"
                checked={form.ageRestricted}
                onChange={e=>setForm(f=>({...f, ageRestricted:e.target.checked}))}/>
              <label className="form-check-label" htmlFor="age18">
                תוכן 18+
              </label>
            </div>
          </>
        )}

        <div>
          <label className="form-label fw-bold">
            {mode === "art" ? "תמונה *" : "גלריית תמונות"}
          </label>
          
          {mode === "post" && (
            <div className="alert alert-info py-2 mb-2">
              📸 הוסף תמונות ואז לחץ על "הוסף לטקסט" כדי להכניס אותן למיקום הרצוי בפוסט
            </div>
          )}
          
          <input
            type="file"
            accept="image/*"
            multiple={mode === "post"}
            className="form-control"
            onChange={(e) => setFiles(e.target.files || [])}
          />
          
          {files.length > 0 && (
            <>
              <div className="form-text mb-3 fw-bold">
                📁 {files.length} {files.length === 1 ? 'תמונה' : 'תמונות'}
              </div>
              
              {/* תצוגת preview של התמונות */}
              <div className="row g-3">
                {Array.from(files).map((file, index) => (
                  <div key={index} className="col-6 col-md-4">
                    <div className="card shadow-sm h-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="card-img-top"
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">תמונה {index + 1}</small>
                          <div className="btn-group btn-group-sm">
                            {mode === "post" && (
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => insertImageAtCursor(index)}
                                title="הוסף לטקסט במיקום הסמן"
                              >
                                ➕ הוסף
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => {
                                const newFiles = Array.from(files).filter((_, i) => i !== index);
                                const dataTransfer = new DataTransfer();
                                newFiles.forEach(f => dataTransfer.items.add(f));
                                setFiles(dataTransfer.files);
                              }}
                              title="הסר תמונה"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="btn btn-primary" disabled={saving}>
          {saving ? "מעלה…" : mode === "art" ? "פרסום היצירה" : "פרסום הפוסט"}
        </button>
      </form>
    </div>
  );
}

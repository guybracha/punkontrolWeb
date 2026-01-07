import { useState } from "react";
import { auth, db, storage } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import slugify from "../lib/slugify";
import { createPost } from "../services/posts.api";
import "../styles/Upload.css";

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

// רשימת תגיות פופולריות להצעות
const POPULAR_TAGS = [
  "אמנות דיגיטלית", "ציור", "איור", "אנימציה", "קומיקס", "מנגה", "אנימה",
  "פנטזיה", "מדע בדיוני", "אימה", "רומנטיקה", "הרפתקאות", 
  "דמויות", "נוף", "פורטרט", "מופשט", "ריאליסטי", "סקיצה",
  "צבעי מים", "שמן", "אקריליק", "עיפרון", "דיגיטל",
  "3D", "פיקסל ארט", "וקטור", "פוטומניפולציה",
  "fan art", "fanart", "fantasy", "original character", "OC", "commission", "WIP",
  "digital art", "illustration", "painting", "sketch", "character design"
];

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
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

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
    
    console.log('🔐 Current user:', u);
    console.log('📧 User email:', u?.email);
    console.log('🆔 User UID:', u?.uid);
    
    if (!u) return setErr("צריך להתחבר");
    if (files.length === 0) return setErr("בחר/י תמונה");
    if (!form.title.trim()) return setErr("כותרת היא חובה");

    // השתמש בקטגוריות שנבחרו במקום הטקסט
    const categories = selectedCategories.length > 0 ? selectedCategories : normalizeCategories(form.categoriesText);
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

      console.log('📄 Document created:', docRef.id);

      // העלאה ל-Storage (שומר סיומת קובץ אמיתית)
      const ext = pickExt(files[0]);
      const path = `artworks/${u.uid}/${docRef.id}.${ext}`;
      
      console.log('📤 Uploading to path:', path);
      console.log('📦 File size:', files[0].size, 'bytes');
      
      // נסה עם metadata מפורש
      const metadata = {
        contentType: files[0].type || 'image/png',
        customMetadata: {
          uploadedBy: u.uid
        }
      };
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, files[0], metadata);
      
      console.log('✅ Upload successful!');
      
      const url = await getDownloadURL(storageRef);
      
      console.log('🔗 Download URL:', url);
      
      await updateDoc(doc(db,"artworks", docRef.id), { imageUrl: url });

      window.location.assign(`/art/${slug}`);
    } catch(e){
      console.error('❌ Error details:', e);
      console.error('❌ Error code:', e.code);
      console.error('❌ Error message:', e.message);
      setErr("שגיאה בהעלאה: " + (e.message || "לא ידוע"));
    } finally{
      setSaving(false);
    }
  }

  const onSubmit = mode === "post" ? handlePostSubmit : handleArtworkSubmit;

  // טיפול בשדה התגיות עם autocomplete
  const handleTagsChange = (value) => {
    setForm(f => ({ ...f, tags: value }));
    
    // מצא את התגית האחרונה שהמשתמש מקליד
    const tags = value.split(",");
    const currentTag = tags[tags.length - 1].trim();
    setCurrentTagInput(currentTag);
    
    console.log('Current tag:', currentTag); // Debug
    
    if (currentTag.length >= 1) {
      // סינון התגיות לפי הקלט הנוכחי
      const filtered = POPULAR_TAGS.filter(tag => 
        tag.toLowerCase().includes(currentTag.toLowerCase())
      ).slice(0, 8); // מקסימום 8 הצעות
      
      console.log('Filtered tags:', filtered); // Debug
      
      setTagSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      // אם השדה ריק או רק פסיק, הצג את כל ההצעות
      const topTags = POPULAR_TAGS.slice(0, 10);
      setTagSuggestions(topTags);
      setShowTagSuggestions(true);
    }
  };

  // הוספת תגית מוצעת
  const selectTag = (tag) => {
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    tags.pop(); // הסר את התגית הנוכחית שלא הושלמה
    tags.push(tag);
    setForm(f => ({ ...f, tags: tags.join(", ") + ", " }));
    setShowTagSuggestions(false);
    setCurrentTagInput("");
    // החזר פוקוס לשדה הקלט
    document.getElementById('tagsInput')?.focus();
  };

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

  // טיפול בבחירת קטגוריות
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // הסר קטגוריה
        return prev.filter(c => c !== categoryId);
      } else {
        // הוסף קטגוריה
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>✨ צור משהו מדהים</h1>
        <p>שתף את היצירתיות שלך עם העולם</p>
      </div>

      {err && (
        <div className="alert-modern alert-error">
          <span>⚠️</span>
          <span>{err}</span>
        </div>
      )}

      {/* בורר מצב: Artwork או Post */}
      <div className="mode-selector">
        <div
          className={`mode-card ${mode === "art" ? "active" : ""}`}
          onClick={() => setMode("art")}
        >
          <span className="mode-icon">🎨</span>
          <h3 className="mode-title">יצירה אמנותית</h3>
          <p className="mode-description">העלה ציור, דיגיטל ארט או אמנות מסורתית</p>
        </div>
        <div
          className={`mode-card ${mode === "post" ? "active" : ""}`}
          onClick={() => setMode("post")}
        >
          <span className="mode-icon">📝</span>
          <h3 className="mode-title">פוסט</h3>
          <p className="mode-description">שתף סיפור, מחשבות או אוסף תמונות</p>
        </div>
      </div>

      {/* סוג פוסט (רק במצב post) */}
      {mode === "post" && (
        <div className="post-type-selector">
          <button
            type="button"
            className={`post-type-btn ${postType === "text" ? "active" : ""}`}
            onClick={() => setPostType("text")}
          >
            📄 טקסט
          </button>
          <button
            type="button"
            className={`post-type-btn ${postType === "art" ? "active" : ""}`}
            onClick={() => setPostType("art")}
          >
            🖼️ אמנות
          </button>
          <button
            type="button"
            className={`post-type-btn ${postType === "comic" ? "active" : ""}`}
            onClick={() => setPostType("comic")}
          >
            📚 קומיקס
          </button>
        </div>
      )}

      <form className="upload-form-card" onSubmit={onSubmit}>
        <div className="form-group-modern">
          <label className="form-label-modern">
            <span className="form-label-icon">✍️</span>
            כותרת *
          </label>
          <input 
            className="form-input-modern form-input-title" 
            placeholder={mode === "post" ? "כתוב כותרת מעניינת..." : "שם היצירה"}
            value={form.title}
            onChange={e=>setForm(f=>({...f, title:e.target.value}))}
          />
        </div>

        {mode === "post" ? (
          // עורך בסגנון בלוג לפוסטים
          <div className="form-group-modern">
            <label className="form-label-modern">
              <span className="form-label-icon">📖</span>
              תוכן הפוסט
            </label>
            <textarea 
              id="postContent"
              className="form-textarea-modern form-textarea-post" 
              placeholder="ספר את הסיפור שלך...&#10;&#10;אתה יכול להוסיף תמונות מהגלריה למטה או פשוט לכתוב טקסט חופשי."
              value={form.description}
              onChange={e=>setForm(f=>({...f, description:e.target.value}))}
            />
            
            <div className="info-box info-box-tip">
              <span className="info-box-icon">💡</span>
              <div className="info-box-content">
                <div className="info-box-title">טיפ מקצועי</div>
                <p className="info-box-text">השתמש ב-[תמונה X] כדי לסמן היכן תופיע כל תמונה בתוך הטקסט</p>
              </div>
            </div>
          </div>
        ) : (
          // שדה תיאור רגיל ל-artwork
          <div className="form-group-modern">
            <label className="form-label-modern">
              <span className="form-label-icon">📝</span>
              תיאור
            </label>
            <textarea 
              className="form-textarea-modern"
              placeholder="ספר על היצירה שלך, התהליך, ההשראה..."
              rows="5"
              value={form.description}
              onChange={e=>setForm(f=>({...f, description:e.target.value}))}
            />
          </div>
        )}

        <div className="form-group-modern">
          <label className="form-label-modern">
            <span className="form-label-icon">🏷️</span>
            תגיות
          </label>
          <div style={{ position: "relative" }}>
            <input 
              id="tagsInput"
              className="form-input-modern"
              placeholder="אמנות דיגיטלית, ציור, פנטזיה..."
              value={form.tags}
              onChange={e => handleTagsChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              onFocus={() => {
                // כשהשדה מקבל פוקוס, הצג הצעות
                const tags = form.tags.split(",");
                const currentTag = tags[tags.length - 1].trim();
                
                if (currentTag.length >= 1) {
                  const filtered = POPULAR_TAGS.filter(tag => 
                    tag.toLowerCase().includes(currentTag.toLowerCase())
                  ).slice(0, 8);
                  setTagSuggestions(filtered);
                  setShowTagSuggestions(filtered.length > 0);
                } else {
                  // הצג תגיות פופולריות
                  const topTags = POPULAR_TAGS.slice(0, 10);
                  setTagSuggestions(topTags);
                  setShowTagSuggestions(true);
                }
              }}
            />
            
            {/* Dropdown של הצעות תגיות */}
            {showTagSuggestions && (
              <div className="tags-suggestions-dropdown">
                {tagSuggestions.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    className="tag-suggestion-item"
                    onClick={() => selectTag(tag)}
                  >
                    <span className="tag-icon">🏷️</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <small style={{color: "#666", fontSize: "0.9rem", marginTop: "0.5rem", display: "block"}}>
            הפרד תגיות בפסיקים - התחל להקליד לקבלת הצעות
          </small>
        </div>

        {/* קטגוריות (רק ב-artwork) */}
        {mode === "art" && (
          <>
            <div className="form-group-modern">
              <label className="form-label-modern">
                <span className="form-label-icon">📂</span>
                קטגוריות
              </label>
              <p style={{color: "#666", fontSize: "0.95rem", marginBottom: "1rem"}}>
                בחר קטגוריות שמתאימות ליצירה שלך (לחץ כדי לבחור/לבטל)
              </p>
              <div className="categories-selector">
                {CATEGORY_IDS.map((categoryId) => (
                  <button
                    key={categoryId}
                    type="button"
                    className={`category-select-pill ${selectedCategories.includes(categoryId) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(categoryId)}
                  >
                    {categoryId === "comics" && "📚"}
                    {categoryId === "fantasy" && "🧙"}
                    {categoryId === "scifi" && "🚀"}
                    {categoryId === "horror" && "👻"}
                    {categoryId === "comedy" && "😂"}
                    {categoryId === "slice-of-life" && "☕"}
                    {categoryId === "erotic-18" && "🔞"}
                    {categoryId === "concept-art" && "💡"}
                    {categoryId === "digital-art" && "🖥️"}
                    {categoryId === "traditional-art" && "🎨"}
                    {categoryId === "3d" && "🧊"}
                    {categoryId === "photography" && "📷"}
                    {categoryId === "painting" && "🖌️"}
                    <span style={{marginRight: "0.5rem"}}>{categoryId}</span>
                  </button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <div className="info-box info-box-tip" style={{marginTop: "1rem"}}>
                  <span className="info-box-icon">✓</span>
                  <div className="info-box-content">
                    <p className="info-box-text">
                      נבחרו {selectedCategories.length} {selectedCategories.length === 1 ? 'קטגוריה' : 'קטגוריות'}: {selectedCategories.join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <label className="checkbox-modern">
              <input 
                type="checkbox" 
                id="age18"
                checked={form.ageRestricted}
                onChange={e=>setForm(f=>({...f, ageRestricted:e.target.checked}))}
              />
              <span className="checkbox-label">
                <span>🔞</span>
                תוכן למבוגרים בלבד (18+)
              </span>
            </label>
          </>
        )}

        <div className="form-group-modern">
          <label className="form-label-modern">
            <span className="form-label-icon">
              {mode === "art" ? "🖼️" : "📸"}
            </span>
            {mode === "art" ? "תמונה *" : "גלריית תמונות"}
          </label>
          
          {mode === "post" && (
            <div className="info-box info-box-tip">
              <span className="info-box-icon">📸</span>
              <div className="info-box-content">
                <p className="info-box-text">הוסף תמונות ואז לחץ על "הוסף לטקסט" כדי להכניס אותן למיקום הרצוי בפוסט</p>
              </div>
            </div>
          )}
          
          <div 
            className={`file-upload-zone ${files.length > 0 ? "has-files" : ""}`}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div className="file-upload-icon">
              {files.length > 0 ? "✅" : "☁️"}
            </div>
            <div className="file-upload-text">
              {files.length > 0 
                ? `${files.length} ${files.length === 1 ? 'תמונה נבחרה' : 'תמונות נבחרו'}`
                : "לחץ להעלאת תמונות"
              }
            </div>
            <div className="file-upload-hint">
              {mode === "art" ? "JPG, PNG או WEBP" : "בחר תמונה אחת או יותר"}
            </div>
          </div>
          
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            multiple={mode === "post"}
            className="file-input-hidden"
            onChange={(e) => setFiles(e.target.files || [])}
          />
          
          {/* תצוגת preview של התמונות */}
          {files.length > 0 && (
            <div className="image-preview-grid">
              {Array.from(files).map((file, index) => (
                <div key={index} className="image-preview-card">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="image-preview-img"
                  />
                  <div className="image-preview-footer">
                    <span className="image-preview-label">תמונה {index + 1}</span>
                    <div className="image-preview-actions">
                      {mode === "post" && (
                        <button
                          type="button"
                          className="btn-image-action btn-image-insert"
                          onClick={() => insertImageAtCursor(index)}
                          title="הוסף לטקסט במיקום הסמן"
                        >
                          ➕
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-image-action btn-image-remove"
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
              ))}
            </div>
          )}
        </div>

        <button className="btn-submit-upload" disabled={saving}>
          {saving ? "🚀 מעלה..." : mode === "art" ? "🎨 פרסום היצירה" : "📝 פרסום הפוסט"}
        </button>
      </form>
    </div>
  );
}

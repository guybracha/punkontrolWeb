import { useState } from "react";
import { auth, db, storage } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import slugify from "../lib/slugify";

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
  const [form, setForm] = useState({
    title:"", description:"", tags:"", categoriesText:"", ageRestricted:false
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e){
    e.preventDefault();
    setErr("");
    const u = auth.currentUser;
    if (!u) return setErr("צריך להתחבר");
    if (!file) return setErr("בחר/י תמונה");
    if (!form.title.trim()) return setErr("כותרת היא חובה");

    const categories = normalizeCategories(form.categoriesText);
    // אם סומן 18+—נכניס גם את קטגוריית erotic-18 למערך
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
      const ext = pickExt(file);
      const path = `artworks/${u.uid}/${docRef.id}.${ext}`;
      await uploadBytes(ref(storage, path), file);
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

  return (
    <div className="container py-4" style={{maxWidth:720}}>
      <h1 className="mb-3">העלאת יצירה</h1>
      {err && <div className="alert alert-danger">{err}</div>}

      <form className="vstack gap-3" onSubmit={onSubmit}>
        <div>
          <label className="form-label">כותרת *</label>
          <input className="form-control"
            value={form.title}
            onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
        </div>

        <div>
          <label className="form-label">תיאור</label>
          <textarea className="form-control" rows="3"
            value={form.description}
            onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
        </div>

        <div>
          <label className="form-label">תגיות (מופרדות בפסיק)</label>
          <input className="form-control"
            value={form.tags}
            onChange={e=>setForm(f=>({...f, tags:e.target.value}))}/>
        </div>

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

        <div>
          <label className="form-label">תמונה *</label>
          <input type="file" accept="image/*" className="form-control"
            onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>

        <button className="btn btn-primary" disabled={saving}>
          {saving ? "מעלה…" : "פרסום היצירה"}
        </button>
      </form>
    </div>
  );
}

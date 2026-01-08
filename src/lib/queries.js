import { db } from "../firebase";
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, getDoc
} from "firebase/firestore";

// ========== POSTS (TUMBLR-STYLE) ==========

/**
 * מחזיר פוסטים אחרונים (למיזוג עם feed)
 */
export async function getLatestPosts(n = 20, type = null) {
  let q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(n)
  );

  if (type) {
    q = query(
      collection(db, "posts"),
      where("type", "==", type),
      orderBy("createdAt", "desc"),
      limit(n)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * מחזיר פוסט בודד
 */
export async function getPostById(postId) {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

/**
 * חיפוש בפוסטים
 */
export async function searchPosts({ q: term = "", type = null, sort = "latest", limit: n = 40 }) {
  // שלב 1: מביא את כל הפוסטים לפי פילטרים
  let qRef = query(
    collection(db, "posts"),
    orderBy(sort === "popular" ? "counts.likes" : "createdAt", "desc"),
    limit(n)
  );

  if (type) {
    qRef = query(
      collection(db, "posts"),
      where("type", "==", type),
      orderBy(sort === "popular" ? "counts.likes" : "createdAt", "desc"),
      limit(n)
    );
  }

  const snap = await getDocs(qRef);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // שלב 2: סינון טקסטואלי בצד הלקוח
  if (term && term.trim()) {
    const searchTerm = term.toLowerCase().trim();
    results = results.filter(post => {
      const title = (post.title || "").toLowerCase();
      const body = (post.body || "").toLowerCase();
      const tags = (post.tags || []).map(t => t.toLowerCase());
      const authorName = (post.authorUsername || "").toLowerCase();
      
      return title.includes(searchTerm) || 
             body.includes(searchTerm) ||
             tags.some(tag => tag.includes(searchTerm)) ||
             authorName.includes(searchTerm);
    });
  }
  
  return results;
}

// ========== ARTWORKS (DEVIANTART-STYLE) ==========

/**
 * opts:
 *  - cat: string | null            // מזהה קטגוריה (למשל "comics")
 *  - sort: "latest" | "popular"    // מיון
 *  - nsfw: "hide" | "show" | "only"// טיפול ב-18+
 *  - lim: number
 */
function buildArtQuery(opts = {}) {
  const { cat=null, sort="latest", nsfw="show", lim=24 } = opts;

  const parts = [];
  
  // זמנית - בלי visibility כדי לבדוק
  // parts.push(where("visibility","==","public"));

  if (cat) parts.push(where("categories","array-contains", cat));

  if (nsfw === "hide") parts.push(where("ageRestricted","==", false));
  if (nsfw === "only") parts.push(where("ageRestricted","==", true));

  if (sort === "popular") parts.push(orderBy("likesCount","desc"));
  else parts.push(orderBy("createdAt","desc"));

  parts.push(limit(lim));

  return query(collection(db, "artworks"), ...parts);
}

export async function getLatestArtworks(n = 24, opts = {}) {
  const snap = await getDocs(buildArtQuery({ ...opts, lim: n }));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchArtworks({ q: term = "", cat = null, sort = "latest", nsfw = "show", limit: n = 40 }) {
  // שלב 1: מביא את כל היצירות לפי פילטרים (קטגוריה, מיון, nsfw)
  const snap = await getDocs(buildArtQuery({ cat, sort, nsfw, lim: n }));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // שלב 2: אם יש טרם חיפוש טקסטואלי, מסנן בצד הלקוח
  if (term && term.trim()) {
    const searchTerm = term.toLowerCase().trim();
    results = results.filter(art => {
      const title = (art.title || "").toLowerCase();
      const description = (art.description || "").toLowerCase();
      const tags = (art.tags || []).map(t => t.toLowerCase());
      const authorName = (art.authorName || "").toLowerCase();
      
      return title.includes(searchTerm) || 
             description.includes(searchTerm) ||
             tags.some(tag => tag.includes(searchTerm)) ||
             authorName.includes(searchTerm);
    });
  }
  
  return results;
}

export async function getUserByUsername(username){
  const qRef = query(collection(db,"users"), where("username","==", username));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * חיפוש משתמשים לפי טקסט חופשי
 */
export async function searchUsers({ q: term = "", sort = "latest", limit: n = 40 }) {
  // מביא משתמשים (ניתן להוסיף מיון לפי פופולריות בעתיד)
  let qRef = query(
    collection(db, "users"),
    limit(n)
  );

  const snap = await getDocs(qRef);
  let results = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  
  // סינון טקסטואלי בצד הלקוח
  if (term && term.trim()) {
    const searchTerm = term.toLowerCase().trim();
    results = results.filter(user => {
      const username = (user.username || "").toLowerCase();
      const displayName = (user.displayName || "").toLowerCase();
      const bio = (user.bio || "").toLowerCase();
      
      return username.includes(searchTerm) || 
             displayName.includes(searchTerm) ||
             bio.includes(searchTerm);
    });
  }
  
  // מיון אופציונלי
  if (sort === "popular") {
    results.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
  }
  
  return results;
}

export async function getUserArtworks(userId) {
  const qRef = query(
    collection(db,"artworks"),
    where("authorId","==", userId),
    // זמנית - בלי visibility
    // where("visibility","==","public"),
    orderBy("createdAt","desc"),
    limit(60)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function getArtworkBySlugOrId(slugOrId){
  const d = await getDoc(doc(db,"artworks", slugOrId));
  if (d.exists()) return { id:d.id, ...d.data() };

  const qRef = query(collection(db,"artworks"), where("slug","==", slugOrId));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { id:snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * מחיקת יצירה
 * @param {string} artworkId - מזהה היצירה
 * @param {string} userId - מזהה המשתמש (לעדכון הספירה)
 */
export async function deleteArtwork(artworkId, userId) {
  const { deleteDoc, updateDoc } = await import("firebase/firestore");
  
  // מחק את היצירה
  await deleteDoc(doc(db, "artworks", artworkId));
  
  // עדכן את ספירת היצירות של המשתמש
  if (userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const currentCount = userSnap.data()?.artworksCount || 0;
    
    // וודא שהספירה לא תרד מתחת ל-0
    if (currentCount > 0) {
      await updateDoc(userRef, {
        artworksCount: currentCount - 1
      });
    }
  }
}

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  startAfter,
  serverTimestamp,
  increment,
  setDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

// ========== FEED & PAGINATION ==========

/**
 * מחזיר עמוד של פוסטים (עם פגינציה)
 * @param {Object} options
 * @param {DocumentSnapshot} options.lastDoc - המסמך האחרון מהעמוד הקודם
 * @param {number} options.pageSize - כמות פוסטים לטעון
 * @param {string} options.type - סוג פוסט: "art" | "text" | "comic" | null (הכל)
 * @returns {Promise<{items: Array, lastDoc: DocumentSnapshot|null}>}
 */
export async function getFeedPage({ lastDoc = null, pageSize = 20, type = null }) {
  let q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  // סינון לפי סוג
  if (type) {
    q = query(
      collection(db, "posts"),
      where("type", "==", type),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
  }

  // פגינציה - התחל אחרי המסמך האחרון
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const newLastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { items, lastDoc: newLastDoc };
}

/**
 * מחזיר את כל הפוסטים של משתמש מסוים
 * @param {string} userId - UID של המשתמש
 * @returns {Promise<Array>}
 */
export async function getUserPosts(userId) {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ========== POST CRUD ==========

/**
 * מחזיר פוסט בודד לפי ID
 */
export async function getPostById(postId) {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Post not found");
  }

  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * העלאת תמונות ל-Storage
 * @param {string} uid - מזהה המשתמש
 * @param {File[]} files - מערך של קבצים
 * @returns {Promise<Array<{url: string, path: string}>>}
 */
async function uploadImages(uid, files) {
  const results = [];

  for (const file of files) {
    const timestamp = Date.now();
    const path = `posts/${uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    results.push({ url, path });
  }

  return results;
}

/**
 * יצירת פוסט חדש
 * @param {Object} postData
 * @param {string} postData.uid - מזהה המשתמש
 * @param {string} postData.username - שם משתמש
 * @param {string} postData.title - כותרת
 * @param {string} postData.body - תוכן
 * @param {string} postData.type - "art" | "text" | "comic"
 * @param {string[]} postData.tags - תגיות
 * @param {File[]} postData.files - קבצים להעלאה (אופציונלי)
 * @returns {Promise<string>} מזהה הפוסט החדש
 */
export async function createPost({ uid, username, title, body, type, tags = [], files = [] }) {
  // העלאת תמונות אם יש
  const media = files?.length ? await uploadImages(uid, files) : [];

  // יצירת הפוסט
  const docRef = await addDoc(collection(db, "posts"), {
    authorId: uid,
    authorUsername: username,
    title,
    body,
    type,
    tags,
    media,
    createdAt: serverTimestamp(),
    counts: {
      likes: 0,
      comments: 0,
    },
  });

  return docRef.id;
}

/**
 * עדכון פוסט קיים
 */
export async function updatePost(postId, updates) {
  const docRef = doc(db, "posts", postId);
  await updateDoc(docRef, updates);
}

/**
 * מחיקת פוסט
 */
export async function deletePost(postId) {
  const docRef = doc(db, "posts", postId);
  await deleteDoc(docRef);
}

// ========== COMMENTS ==========

/**
 * מחזיר תגובות לפוסט
 */
export async function getComments(postId) {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * הוספת תגובה
 * @param {string} postId
 * @param {Object} commentData
 * @param {string} commentData.authorId
 * @param {string} commentData.authorUsername
 * @param {string} commentData.text
 */
export async function addComment(postId, { authorId, authorUsername, text }) {
  // הוספת התגובה
  const docRef = await addDoc(collection(db, "posts", postId, "comments"), {
    authorId,
    authorUsername,
    text,
    createdAt: serverTimestamp(),
  });

  // עדכון מונה התגובות בפוסט
  await updateDoc(doc(db, "posts", postId), {
    "counts.comments": increment(1),
  });

  return docRef.id;
}

/**
 * מחיקת תגובה
 */
export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));

  // עדכון מונה
  await updateDoc(doc(db, "posts", postId), {
    "counts.comments": increment(-1),
  });
}

// ========== LIKES ==========

/**
 * בדיקה אם משתמש לייק לפוסט
 */
export async function hasLiked(postId, uid) {
  const docRef = doc(db, "posts", postId, "likes", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

/**
 * טוגל לייק (אם יש - מוריד, אם אין - מוסיף)
 */
export async function toggleLike(postId, uid) {
  const likeRef = doc(db, "posts", postId, "likes", uid);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    // הסרת לייק
    await deleteDoc(likeRef);
    await updateDoc(doc(db, "posts", postId), {
      "counts.likes": increment(-1),
    });
    return false;
  } else {
    // הוספת לייק
    await setDoc(likeRef, {
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "posts", postId), {
      "counts.likes": increment(1),
    });
    return true;
  }
}



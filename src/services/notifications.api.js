import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * סוגי התראות:
 * - "like_artwork" - מישהו לייק ליצירה שלך
 * - "comment_artwork" - מישהו הגיב על יצירה שלך
 * - "like_post" - מישהו לייק לפוסט שלך
 * - "comment_post" - מישהו הגיב על פוסט שלך
 * - "follow" - מישהו עוקב אחריך
 * - "message" - הודעה חדשה
 */

/**
 * יצירת התראה חדשה
 * @param {Object} notificationData
 * @param {string} notificationData.userId - מזהה המשתמש שמקבל את ההתראה
 * @param {string} notificationData.type - סוג ההתראה
 * @param {string} notificationData.fromUserId - מזהה המשתמש שיצר את ההתראה
 * @param {string} notificationData.fromUsername - שם המשתמש שיצר את ההתראה
 * @param {string} notificationData.fromUserAvatar - אווטאר של המשתמש שיצר את ההתראה
 * @param {string} notificationData.targetId - מזהה היצירה/פוסט (אופציונלי)
 * @param {string} notificationData.targetTitle - כותרת היצירה/פוסט (אופציונלי)
 * @param {string} notificationData.commentText - תוכן התגובה (אם רלוונטי)
 */
export async function createNotification(notificationData) {
  const {
    userId,
    type,
    fromUserId,
    fromUsername,
    fromUserAvatar,
    targetId,
    targetTitle,
    commentText,
  } = notificationData;

  // אל תיצור התראה אם המשתמש עושה פעולה על התוכן שלו
  if (userId === fromUserId) return null;

  // בדיקה אם כבר יש התראה זהה (מונעת התראות כפולות)
  const existingQuery = query(
    collection(db, "users", userId, "notifications"),
    where("type", "==", type),
    where("fromUserId", "==", fromUserId),
    where("targetId", "==", targetId || null),
    where("read", "==", false),
    limit(1)
  );

  const existingSnap = await getDocs(existingQuery);
  
  // אם כבר יש התראה דומה שלא נקראה, לא ניצור עוד אחת
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  // יצירת ההתראה
  const docRef = await addDoc(collection(db, "users", userId, "notifications"), {
    type,
    fromUserId,
    fromUsername,
    fromUserAvatar: fromUserAvatar || null,
    targetId: targetId || null,
    targetTitle: targetTitle || null,
    commentText: commentText || null,
    read: false,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * קבלת כל ההתראות של משתמש
 * @param {string} userId - מזהה המשתמש
 * @param {number} limitCount - מספר מקסימלי של התראות
 */
export async function getUserNotifications(userId, limitCount = 50) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * קבלת התראות שלא נקראו
 * @param {string} userId - מזהה המשתמש
 */
export async function getUnreadNotifications(userId) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * סימון התראה כנקראה
 * @param {string} userId - מזהה המשתמש
 * @param {string} notificationId - מזהה ההתראה
 */
export async function markNotificationAsRead(userId, notificationId) {
  const notifRef = doc(db, "users", userId, "notifications", notificationId);
  await updateDoc(notifRef, {
    read: true,
  });
}

/**
 * סימון כל ההתראות כנקראו
 * @param {string} userId - מזהה המשתמש
 */
export async function markAllNotificationsAsRead(userId) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    where("read", "==", false),
    limit(100)
  );

  const snap = await getDocs(q);
  
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((document) => {
    batch.update(document.ref, { read: true });
  });

  await batch.commit();
}

/**
 * ספירת התראות שלא נקראו
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationsCount(userId) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    where("read", "==", false),
    limit(100)
  );

  const snap = await getDocs(q);
  return snap.size;
}

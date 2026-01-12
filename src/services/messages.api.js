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
  onSnapshot,
  or,
  and,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * שליחת הודעה פרטית
 * @param {Object} messageData
 * @param {string} messageData.senderId - מזהה השולח
 * @param {string} messageData.senderUsername - שם משתמש של השולח
 * @param {string} messageData.senderAvatar - אווטאר השולח
 * @param {string} messageData.receiverId - מזהה המקבל
 * @param {string} messageData.receiverUsername - שם משתמש של המקבל
 * @param {string} messageData.text - תוכן ההודעה
 */
export async function sendMessage(messageData) {
  const {
    senderId,
    senderUsername,
    senderAvatar,
    receiverId,
    receiverUsername,
    text,
  } = messageData;

  // יצירת מזהה שיחה ייחודי (לפי סדר אלפביתי כדי שיהיה זהה לשני הצדדים)
  const conversationId = [senderId, receiverId].sort().join("_");

  // שליחת ההודעה
  const messageRef = await addDoc(collection(db, "messages"), {
    conversationId,
    senderId,
    senderUsername,
    senderAvatar: senderAvatar || null,
    receiverId,
    receiverUsername,
    text,
    read: false,
    createdAt: serverTimestamp(),
  });

  return messageRef.id;
}

/**
 * קבלת כל ההודעות בשיחה בין שני משתמשים
 * @param {string} userId1 - מזהה משתמש ראשון
 * @param {string} userId2 - מזהה משתמש שני
 * @param {number} limitCount - מספר מקסימלי של הודעות
 */
export async function getConversation(userId1, userId2, limitCount = 100) {
  const conversationId = [userId1, userId2].sort().join("_");

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * האזנה בזמן אמת לשיחה
 * @param {string} userId1 - מזהה משתמש ראשון
 * @param {string} userId2 - מזהה משתמש שני
 * @param {Function} callback - פונקציה שתקבל את ההודעות המעודכנות
 * @returns {Function} פונקציה לביטול ההאזנה
 */
export function subscribeToConversation(userId1, userId2, callback) {
  const conversationId = [userId1, userId2].sort().join("_");

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}

/**
 * קבלת רשימת השיחות (conversations) של משתמש
 * מחזיר את ההודעה האחרונה מכל שיחה
 * @param {string} userId - מזהה המשתמש
 */
export async function getUserConversations(userId) {
  // מביא את כל ההודעות שהמשתמש מעורב בהן
  const q = query(
    collection(db, "messages"),
    or(
      where("senderId", "==", userId),
      where("receiverId", "==", userId)
    ),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snap = await getDocs(q);
  const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // קיבוץ לפי conversationId ולקיחת ההודעה האחרונה
  const conversationsMap = new Map();

  messages.forEach((msg) => {
    if (!conversationsMap.has(msg.conversationId)) {
      // מזהה את המשתמש השני בשיחה
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUsername = msg.senderId === userId ? msg.receiverUsername : msg.senderUsername;
      const otherAvatar = msg.senderId === userId ? null : msg.senderAvatar;

      conversationsMap.set(msg.conversationId, {
        conversationId: msg.conversationId,
        otherUserId,
        otherUsername,
        otherAvatar,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    // ספירת הודעות שלא נקראו
    const conversation = conversationsMap.get(msg.conversationId);
    if (!msg.read && msg.receiverId === userId) {
      conversation.unreadCount++;
    }
  });

  return Array.from(conversationsMap.values());
}

/**
 * סימון כל ההודעות בשיחה כנקראו
 * @param {string} userId - מזהה המשתמש שקורא
 * @param {string} otherUserId - מזהה המשתמש השני
 */
export async function markConversationAsRead(userId, otherUserId) {
  const conversationId = [userId, otherUserId].sort().join("_");

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("receiverId", "==", userId),
    where("read", "==", false),
    limit(100)
  );

  const snap = await getDocs(q);

  const updates = snap.docs.map((document) => {
    return updateDoc(document.ref, { read: true });
  });

  await Promise.all(updates);
}

/**
 * ספירת הודעות שלא נקראו
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<number>}
 */
export async function getUnreadMessagesCount(userId) {
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", userId),
    where("read", "==", false),
    limit(100)
  );

  const snap = await getDocs(q);
  return snap.size;
}

/**
 * האזנה בזמן אמת למספר הודעות שלא נקראו
 * @param {string} userId - מזהה המשתמש
 * @param {Function} callback - פונקציה שתקבל את המספר המעודכן
 * @returns {Function} פונקציה לביטול ההאזנה
 */
export function subscribeToUnreadMessagesCount(userId, callback) {
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", userId),
    where("read", "==", false),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
}

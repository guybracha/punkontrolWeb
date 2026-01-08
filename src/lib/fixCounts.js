// פונקציית עזר לתיקון ספירות עבור משתמשים קיימים
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";

/**
 * מתקן את הספירות של יצירות ופוסטים עבור כל המשתמשים
 * הפונקציה הזו צריכה לרוץ פעם אחת כדי לתקן את הנתונים הקיימים
 */
export async function fixAllUserCounts() {
  try {
    console.log("🔧 מתחיל תיקון ספירות...");
    
    // קבל את כל המשתמשים
    const usersSnap = await getDocs(collection(db, "users"));
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`📊 בודק משתמש: ${userId}`);
      
      // ספור יצירות
      const artworksQuery = query(
        collection(db, "artworks"),
        where("authorId", "==", userId)
      );
      const artworksSnap = await getDocs(artworksQuery);
      const artworksCount = artworksSnap.size;
      
      // ספור פוסטים
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId)
      );
      const postsSnap = await getDocs(postsQuery);
      const postsCount = postsSnap.size;
      
      // עדכן את המשתמש
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        artworksCount: artworksCount,
        postsCount: postsCount
      });
      
      console.log(`✅ עודכן: ${artworksCount} יצירות, ${postsCount} פוסטים`);
    }
    
    console.log("🎉 תיקון ספירות הושלם בהצלחה!");
    return { success: true, message: "הספירות תוקנו בהצלחה" };
  } catch (error) {
    console.error("❌ שגיאה בתיקון ספירות:", error);
    return { success: false, error };
  }
}

/**
 * מתקן ספירות עבור משתמש בודד
 * @param {string} userId - מזהה המשתמש
 */
export async function fixUserCounts(userId) {
  try {
    console.log(`🔧 מתקן ספירות עבור משתמש: ${userId}`);
    
    // ספור יצירות
    const artworksQuery = query(
      collection(db, "artworks"),
      where("authorId", "==", userId)
    );
    const artworksSnap = await getDocs(artworksQuery);
    const artworksCount = artworksSnap.size;
    
    // ספור פוסטים
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId)
    );
    const postsSnap = await getDocs(postsQuery);
    const postsCount = postsSnap.size;
    
    // עדכן את המשתמש
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      artworksCount: artworksCount,
      postsCount: postsCount
    });
    
    console.log(`✅ עודכן משתמש ${userId}: ${artworksCount} יצירות, ${postsCount} פוסטים`);
    return { success: true, artworksCount, postsCount };
  } catch (error) {
    console.error("❌ שגיאה בתיקון ספירות למשתמש:", error);
    return { success: false, error };
  }
}

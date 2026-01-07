import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // טוען את הפרופיל מ-Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (userDoc.exists()) {
          setUserProfile({ uid: firebaseUser.uid, ...userDoc.data() });
        } else {
          // משתמש חדש - יוצר פרופיל בסיסי
          const newProfile = {
            username: firebaseUser.email?.split("@")[0] || `user_${firebaseUser.uid.slice(0, 8)}`,
            displayName: firebaseUser.displayName || "Anonymous User",
            photoURL: firebaseUser.photoURL || null,
            bio: "",
            createdAt: new Date(),
          };
          
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
          setUserProfile({ uid: firebaseUser.uid, ...newProfile });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

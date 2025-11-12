// src/components/FollowButton.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function FollowButton({ targetUserId }){
  const [following, setFollowing] = useState(false);
  const uid = auth.currentUser?.uid;
  const fid = uid && targetUserId ? `${uid}_${targetUserId}` : null;

  useEffect(()=>{
    (async ()=>{
      if (!fid) return;
      const snap = await getDoc(doc(db,"follows", fid));
      setFollowing(snap.exists());
    })();
  }, [fid]);

  async function toggle(){
    if (!uid) return alert("צריך להתחבר");
    if (following) {
      await deleteDoc(doc(db,"follows", fid));
      setFollowing(false);
    } else {
      await setDoc(doc(db,"follows", fid), {
        followerId: uid, followeeId: targetUserId, createdAt: serverTimestamp()
      });
      setFollowing(true);
    }
  }

  return (
    <button className={"btn " + (following?"btn-outline-secondary":"btn-primary")} onClick={toggle}>
      {following? "מפסיק לעקוב" : "עקוב"}
    </button>
  );
}

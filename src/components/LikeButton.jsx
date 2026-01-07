import { useState, useEffect } from "react";
import { toggleLike, hasLiked } from "../services/posts.api";
import { useAuth } from "../context/AuthContext";

/**
 * כפתור לייק - ניתן לשימוש חוזר
 */
export default function LikeButton({ postId, initialCount = 0, size = "md" }) {
  const { userProfile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // בודק אם המשתמש כבר לייק
  useEffect(() => {
    async function checkLike() {
      if (!userProfile?.uid) return;

      try {
        const isLiked = await hasLiked(postId, userProfile.uid);
        setLiked(isLiked);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    }

    checkLike();
  }, [postId, userProfile]);

  async function handleClick() {
    if (!userProfile?.uid || loading) return;

    setLoading(true);
    try {
      const newLiked = await toggleLike(postId, userProfile.uid);
      setLiked(newLiked);
      setCount((prev) => prev + (newLiked ? 1 : -1));
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLoading(false);
    }
  }

  const buttonSize = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  return (
    <button
      className={`btn ${liked ? "btn-danger" : "btn-outline-danger"} ${buttonSize}`}
      onClick={handleClick}
      disabled={!userProfile || loading}
      title={userProfile ? (liked ? "Unlike" : "Like") : "התחבר כדי לתת לייק"}
    >
      {liked ? "❤️" : "🤍"} {count}
    </button>
  );
}

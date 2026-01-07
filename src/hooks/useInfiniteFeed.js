import { useState, useCallback } from "react";
import { getFeedPage } from "../services/posts.api";

/**
 * Hook לניהול feed עם פגינציה אינסופית
 * @param {Object} options
 * @param {number} options.pageSize - כמות פריטים בכל עמוד
 * @param {string} options.type - סוג פוסט לסינון (null = הכל)
 */
export function useInfiniteFeed({ pageSize = 20, type = null } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const { items: newItems, lastDoc: newLastDoc } = await getFeedPage({
        lastDoc,
        pageSize,
        type,
      });

      setItems((prev) => [...prev, ...newItems]);
      setLastDoc(newLastDoc);

      // אם קיבלנו פחות מ-pageSize, סיימנו
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading feed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc, pageSize, type]);

  const reset = useCallback(() => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}

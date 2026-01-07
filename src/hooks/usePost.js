import { useQuery } from "@tanstack/react-query";
import { getPostById, getComments } from "../services/posts.api";

/**
 * Hook לטעינת פוסט בודד עם React Query
 */
export function usePost(postId) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
}

/**
 * Hook לטעינת תגובות של פוסט
 */
export function useComments(postId) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
}

/**
 * Hook משולב - טוען פוסט + תגובות ביחד
 */
export function usePostWithComments(postId) {
  const postQuery = usePost(postId);
  const commentsQuery = useComments(postId);

  return {
    post: postQuery.data,
    comments: commentsQuery.data || [],
    isLoading: postQuery.isLoading || commentsQuery.isLoading,
    error: postQuery.error || commentsQuery.error,
    refetchPost: postQuery.refetch,
    refetchComments: commentsQuery.refetch,
  };
}

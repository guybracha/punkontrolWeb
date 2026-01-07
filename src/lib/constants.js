/**
 * קונסטנטות גלובליות לפרויקט
 */

// ========== POST TYPES ==========
export const POST_TYPES = {
  TEXT: "text",
  ART: "art",
  COMIC: "comic",
};

export const POST_TYPE_LABELS = {
  he: {
    [POST_TYPES.TEXT]: "טקסט",
    [POST_TYPES.ART]: "אמנות",
    [POST_TYPES.COMIC]: "קומיקס",
  },
  en: {
    [POST_TYPES.TEXT]: "Text",
    [POST_TYPES.ART]: "Art",
    [POST_TYPES.COMIC]: "Comic",
  },
};

// ========== ARTWORK CATEGORIES ==========
export const ARTWORK_CATEGORIES = [
  // ז'אנרים
  { id: "comics", label: { he: "קומיקס", en: "Comics" } },
  { id: "fantasy", label: { he: "פנטזיה", en: "Fantasy" } },
  { id: "scifi", label: { he: "מדע בדיוני", en: "Sci-Fi" } },
  { id: "horror", label: { he: "אימה", en: "Horror" } },
  { id: "comedy", label: { he: "קומדיה", en: "Comedy" } },
  { id: "slice-of-life", label: { he: "חתך חיים", en: "Slice of Life" } },
  
  // מדיומים
  { id: "digital-art", label: { he: "אמנות דיגיטלית", en: "Digital Art" } },
  { id: "traditional-art", label: { he: "אמנות מסורתית", en: "Traditional Art" } },
  { id: "3d", label: { he: "תלת-ממד", en: "3D" } },
  { id: "photography", label: { he: "צילום", en: "Photography" } },
  { id: "painting", label: { he: "ציור", en: "Painting" } },
  { id: "concept-art", label: { he: "קונספט ארט", en: "Concept Art" } },
  
  // מבוגרים בלבד
  { id: "erotic-18", label: { he: "ארוטי (18+)", en: "Erotic (18+)" } },
];

export const CATEGORY_IDS = ARTWORK_CATEGORIES.map((c) => c.id);

/**
 * מחזיר תווית קטגוריה לפי ID ושפה
 */
export function getCategoryLabel(categoryId, lang = "he") {
  const category = ARTWORK_CATEGORIES.find((c) => c.id === categoryId);
  return category?.label[lang] || categoryId;
}

// ========== NSFW FILTERS ==========
export const NSFW_FILTERS = {
  HIDE: "hide",
  SHOW: "show",
  ONLY: "only",
};

// ========== SORT OPTIONS ==========
export const SORT_OPTIONS = {
  LATEST: "latest",
  POPULAR: "popular",
};

// ========== PAGINATION ==========
export const DEFAULT_PAGE_SIZE = 20;
export const ARTWORK_PAGE_SIZE = 24;

// ========== FILE LIMITS ==========
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_POST = 10;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ========== TEXT LIMITS ==========
export const MAX_TITLE_LENGTH = 100;
export const MAX_BODY_LENGTH = 10000;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_BIO_LENGTH = 500;
export const MAX_TAGS = 20;

// ========== ROUTES ==========
export const ROUTES = {
  HOME: "/",
  FEED: "/feed",
  UPLOAD: "/upload",
  LOGIN: "/login",
  SEARCH: "/search",
  POST: (id) => `/post/${id}`,
  ARTWORK: (id) => `/art/${id}`,
  PROFILE: (username) => `/u/${username}`,
};

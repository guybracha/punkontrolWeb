/**
 * אייקונים בטקסט (emoji) לשימוש בפרויקט
 * כך שיהיה אחיד בכל האפליקציה
 */

export const Icons = {
  // סוגי תוכן
  art: "🎨",
  comic: "📚",
  text: "📝",
  feed: "📰",
  
  // פעולות
  like: "❤️",
  unlike: "🤍",
  comment: "💬",
  share: "🔗",
  upload: "⬆️",
  edit: "✏️",
  delete: "🗑️",
  
  // משתמשים
  user: "👤",
  profile: "🖼️",
  followers: "👥",
  
  // נווט
  home: "🏠",
  search: "🔍",
  settings: "⚙️",
  logout: "🚪",
  
  // סטטוס
  loading: "⏳",
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  
  // אחר
  fire: "🔥",
  star: "⭐",
  sparkles: "✨",
  party: "🎉",
  rocket: "🚀",
  pin: "📌",
  tag: "#️⃣",
  calendar: "📅",
  clock: "🕐",
  image: "🖼️",
  gallery: "🎴",
  world: "🌐",
};

/**
 * פונקציה לקבלת אייקון לפי סוג פוסט
 */
export function getPostIcon(type) {
  switch (type) {
    case "art":
      return Icons.art;
    case "comic":
      return Icons.comic;
    case "text":
      return Icons.text;
    default:
      return Icons.feed;
  }
}

/**
 * פונקציה לקבלת תווית לפי סוג פוסט
 */
export function getPostLabel(type, lang = "he") {
  const labels = {
    he: {
      art: "אמנות",
      comic: "קומיקס",
      text: "טקסט",
    },
    en: {
      art: "Art",
      comic: "Comic",
      text: "Text",
    },
  };

  return labels[lang]?.[type] || type;
}

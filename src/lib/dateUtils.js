/**
 * פונקציות עזר לפורמט תאריכים
 */

/**
 * ממיר Firestore Timestamp לאובייקט Date
 */
export function toDate(timestamp) {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

/**
 * פורמט תאריך מלא
 * דוגמה: "7 בינואר 2026"
 */
export function formatDate(timestamp, locale = "he-IL") {
  const date = toDate(timestamp);
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * פורמט תאריך + שעה
 * דוגמה: "7 בינואר 2026, 14:30"
 */
export function formatDateTime(timestamp, locale = "he-IL") {
  const date = toDate(timestamp);
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * פורמט יחסי ("לפני 5 דקות", "לפני שעתיים")
 */
export function formatRelativeTime(timestamp, locale = "he") {
  const date = toDate(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (locale === "he") {
    if (diffSec < 60) return "ממש עכשיו";
    if (diffMin === 1) return "לפני דקה";
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    if (diffHour === 1) return "לפני שעה";
    if (diffHour < 24) return `לפני ${diffHour} שעות`;
    if (diffDay === 1) return "אתמול";
    if (diffDay < 7) return `לפני ${diffDay} ימים`;
    if (diffWeek === 1) return "לפני שבוע";
    if (diffWeek < 4) return `לפני ${diffWeek} שבועות`;
    if (diffMonth === 1) return "לפני חודש";
    if (diffMonth < 12) return `לפני ${diffMonth} חודשים`;
    if (diffYear === 1) return "לפני שנה";
    return `לפני ${diffYear} שנים`;
  }

  // English fallback
  if (diffSec < 60) return "just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return "1 hour ago";
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return "1 month ago";
  if (diffMonth < 12) return `${diffMonth} months ago`;
  if (diffYear === 1) return "1 year ago";
  return `${diffYear} years ago`;
}

/**
 * פורמט קצר לתאריכים
 * דוגמה: "07/01/2026"
 */
export function formatShortDate(timestamp) {
  const date = toDate(timestamp);
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

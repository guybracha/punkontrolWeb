// מזהי קטגוריות בלי רווחים – יציבים ל-DB/שאילתות
export const CATEGORIES = [
  { id: "comics",         label: "Comics" },
  { id: "fantasy",        label: "Fantasy" },
  { id: "scifi",          label: "Sci-Fi" },         // שים לב: בלי מקף ב-id
  { id: "horror",         label: "Horror" },
  { id: "comedy",         label: "Comedy" },
  { id: "slice-of-life",  label: "Slice of Life" },  // id עם מקף במקום רווח
  { id: "erotic-18",      label: "Erotic (18+)" },   // נשמור בנפרד גם ageRestricted
  { id: "concept-art",    label: "Concept Art" },
  { id: "digital-art",    label: "Digital Art" },
  { id: "traditional-art",label: "Traditional Art" },
  { id: "3d",             label: "3D" },
  { id: "photography",    label: "Photography" },
  { id: "painting",       label: "Painting" },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id));

/** נירמול שמות חופשיים ל-id (למקרה שמגיע טקסט חופשי) */
export function normalizeCategory(str="") {
  return str
    .trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

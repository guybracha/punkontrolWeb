// src/lib/slugify.js
export default function slugify(s=""){
  return s.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\u0590-\u05FF\s-]/g,"")
    .trim().replace(/\s+/g,"-").slice(0,60);
}

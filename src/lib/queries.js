import { db } from "../firebase";
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, getDoc
} from "firebase/firestore";

/**
 * opts:
 *  - cat: string | null            // מזהה קטגוריה (למשל "comics")
 *  - sort: "latest" | "popular"    // מיון
 *  - nsfw: "hide" | "show" | "only"// טיפול ב-18+
 *  - lim: number
 */
function buildArtQuery(opts = {}) {
  const { cat=null, sort="latest", nsfw="show", lim=24 } = opts;

  const parts = [ where("visibility","==","public") ];

  if (cat) parts.push(where("categories","array-contains", cat));

  if (nsfw === "hide") parts.push(where("ageRestricted","==", false));
  if (nsfw === "only") parts.push(where("ageRestricted","==", true));

  if (sort === "popular") parts.push(orderBy("likesCount","desc"));
  else parts.push(orderBy("createdAt","desc"));

  parts.push(limit(lim));

  return query(collection(db, "artworks"), ...parts);
}

export async function getLatestArtworks(n = 24, opts = {}) {
  const snap = await getDocs(buildArtQuery({ ...opts, lim: n }));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchArtworks({ q: term = "", cat = null, sort = "latest", nsfw = "show", limit: n = 40 }) {
  // TODO: term => אינדוקס עתידי (Algolia/Typesense או titleLower prefix)
  const snap = await getDocs(buildArtQuery({ cat, sort, nsfw, lim: n }));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserByUsername(username){
  const qRef = query(collection(db,"users"), where("username","==", username));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getUserArtworks(username) {
  const qRef = query(
    collection(db,"artworks"),
    where("authorUsername","==", username),
    where("visibility","==","public"),
    orderBy("createdAt","desc"),
    limit(60)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function getArtworkBySlugOrId(slugOrId){
  const d = await getDoc(doc(db,"artworks", slugOrId));
  if (d.exists()) return { id:d.id, ...d.data() };

  const qRef = query(collection(db,"artworks"), where("slug","==", slugOrId));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { id:snap.docs[0].id, ...snap.docs[0].data() };
}

// src/routes/Search.jsx
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchArtworks, searchPosts, searchUsers } from "../lib/queries";
import ArtworkCard from "../components/ArtworkCard";
import PostCard from "../components/PostCard";
import UserCard from "../components/UserCard";
import CategoryPicker from "../components/CategoryPicker";
import { useState } from "react";

export default function Search(){
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "";
  const [selectedCat, setSelectedCat] = useState(sp.get("cat") || null);
  const [sortBy, setSortBy] = useState(sp.get("sort") || "latest");
  const [contentType, setContentType] = useState(sp.get("type") || "all"); // "all" | "artworks" | "posts" | "users"
  
  // חיפוש יצירות
  const { data: artworks=[], isLoading: artsLoading } = useQuery({ 
    queryKey:["search-artworks", q, selectedCat, sortBy], 
    queryFn:()=>searchArtworks({q, cat: selectedCat, sort: sortBy}), 
    enabled: !!q && (contentType === "all" || contentType === "artworks")
  });
  
  // חיפוש פוסטים
  const { data: posts=[], isLoading: postsLoading } = useQuery({ 
    queryKey:["search-posts", q, sortBy], 
    queryFn:()=>searchPosts({q, sort: sortBy}), 
    enabled: !!q && (contentType === "all" || contentType === "posts")
  });
  
  // חיפוש משתמשים
  const { data: users=[], isLoading: usersLoading } = useQuery({ 
    queryKey:["search-users", q, sortBy], 
    queryFn:()=>searchUsers({q, sort: sortBy}), 
    enabled: !!q && (contentType === "all" || contentType === "users")
  });
  
  // מיזוג ומיון תוצאות
  const allResults = [
    ...artworks.map(a => ({...a, contentType: 'artwork'})),
    ...posts.map(p => ({...p, contentType: 'post'})),
    ...users.map(u => ({...u, contentType: 'user'}))
  ].sort((a, b) => {
    if (sortBy === "popular") {
      const likesA = a.likesCount || a.counts?.likes || a.followersCount || 0;
      const likesB = b.likesCount || b.counts?.likes || b.followersCount || 0;
      return likesB - likesA;
    }
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  
  // תוצאות לפי טאב
  const displayResults = contentType === "all" ? allResults :
                         contentType === "artworks" ? artworks.map(a => ({...a, contentType: 'artwork'})) :
                         contentType === "posts" ? posts.map(p => ({...p, contentType: 'post'})) :
                         users.map(u => ({...u, contentType: 'user'}));
  
  const isLoading = artsLoading || postsLoading || usersLoading;
  
  function handleCategoryChange(cat) {
    setSelectedCat(cat);
    const newSp = new URLSearchParams(sp);
    if (cat) newSp.set("cat", cat);
    else newSp.delete("cat");
    setSp(newSp);
  }
  
  function handleSortChange(sort) {
    setSortBy(sort);
    const newSp = new URLSearchParams(sp);
    newSp.set("sort", sort);
    setSp(newSp);
  }
  
  function handleTypeChange(type) {
    setContentType(type);
    const newSp = new URLSearchParams(sp);
    if (type !== "all") newSp.set("type", type);
    else newSp.delete("type");
    setSp(newSp);
  }
  
  return (
    <div className="container py-4">
      <h1>Search Results</h1>
      {q && <p className="text-muted mb-3">Searching for: "{q}"</p>}
      
      {/* טאבים לסוג תוכן */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <button 
            type="button" 
            className={`btn ${contentType === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => handleTypeChange("all")}
          >
            🌟 הכל ({allResults.length})
          </button>
          <button 
            type="button" 
            className={`btn ${contentType === "artworks" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => handleTypeChange("artworks")}
          >
            🎨 יצירות ({artworks.length})
          </button>
          <button 
            type="button" 
            className={`btn ${contentType === "posts" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => handleTypeChange("posts")}
          >
            📝 רשומות ({posts.length})
          </button>
          <button 
            type="button" 
            className={`btn ${contentType === "users" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => handleTypeChange("users")}
          >
            👥 משתמשים ({users.length})
          </button>
        </div>
      </div>
      
      {/* פילטרים */}
      <div className="mb-4 p-3 bg-light rounded">
        <div className="row g-3 align-items-center">
          {(contentType === "all" || contentType === "artworks") && (
            <div className="col-md-8">
              <label className="form-label small fw-bold">Category Filter (Artworks only):</label>
              <CategoryPicker value={selectedCat} onChange={handleCategoryChange} allowAll />
            </div>
          )}
          <div className={(contentType === "all" || contentType === "artworks") ? "col-md-4" : "col-md-12"}>
            <label className="form-label small fw-bold">Sort By:</label>
            <select 
              className="form-select" 
              value={sortBy} 
              onChange={e=>handleSortChange(e.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* תוצאות */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : displayResults.length ? (
        <>
          <p className="text-muted mb-3">{displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found</p>
          <div className="row g-3">
            {displayResults.map(item => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={`${item.contentType}-${item.id || item.uid}`}>
                {item.contentType === 'artwork' ? (
                  <ArtworkCard art={item} />
                ) : item.contentType === 'post' ? (
                  <PostCard post={item} />
                ) : (
                  <UserCard user={item} />
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <h3>No results found</h3>
          <p className="text-muted">Try different keywords or remove filters</p>
        </div>
      )}
    </div>
  );
}

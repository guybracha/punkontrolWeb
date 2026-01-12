// src/routes/Home.jsx
import { useQuery } from "@tanstack/react-query";
import { getLatestArtworks, getLatestPosts } from "../lib/queries";
import ArtworkCard from "../components/ArtworkCard";
import PostCard from "../components/PostCard";
import SEO from "../components/SEO";
import { useState } from "react";

export default function Home(){
  const [activeTab, setActiveTab] = useState("all"); // "all" | "art" | "posts"
  
  const { data: artworks=[], isLoading: artsLoading, error: artsError } = useQuery({ 
    queryKey:["latest-artworks"], 
    queryFn:()=>getLatestArtworks(12),
    staleTime: 0,
  });
  
  const { data: posts=[], isLoading: postsLoading, error: postsError } = useQuery({ 
    queryKey:["latest-posts"], 
    queryFn:()=>getLatestPosts(12),
    staleTime: 0,
  });
  
  console.log('🏠 Home - Artworks:', artworks.length, 'Posts:', posts.length);
  
  // מיזוג ומיון לפי תאריך
  const allContent = [...artworks.map(a=>({...a, contentType: 'artwork'})), ...posts.map(p=>({...p, contentType: 'post'}))]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });
  
  const isLoading = artsLoading || postsLoading;
  const error = artsError || postsError;
  
  // סינון לפי טאב
  const displayContent = activeTab === "all" ? allContent : 
                         activeTab === "art" ? artworks.map(a=>({...a, contentType: 'artwork'})) :
                         posts.map(p=>({...p, contentType: 'post'}));
  
  return (
    <>
      <SEO 
        title="דף הבית"
        description="גלה אמנות ויצירות מקוריות מאמנים ישראלים. פלטפורמת שיתוף אמנות Punkontrol"
        keywords={['אמנות', 'יצירות', 'פאנק', 'אמנים ישראלים', 'גלריה', 'ציור', 'עיצוב']}
      />
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>תוכן אחרון</h1>
        
        {/* טאבים */}
        <div className="btn-group" role="group">
          <button 
            type="button" 
            className={`btn ${activeTab === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("all")}
          >
            🌟 הכל
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === "art" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("art")}
          >
            🎨 יצירות ({artworks.length})
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === "posts" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTab("posts")}
          >
            📝 רשומות ({posts.length})
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">טוען...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">שגיאה בטעינת התוכן</div>
      ) : displayContent.length === 0 ? (
        <div className="alert alert-info" role="alert">אין תוכן עדיין</div>
      ) : (
        <div className="row g-3">
          {displayContent.map(item => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={`${item.contentType}-${item.id}`}>
              {item.contentType === 'artwork' ? (
                <ArtworkCard art={item} />
              ) : (
                <PostCard post={item} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

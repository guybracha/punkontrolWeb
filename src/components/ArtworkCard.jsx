// src/components/ArtworkCard.jsx
import { Link } from "react-router-dom";
export default function ArtworkCard({ art }) {
  const imageUrl = art.imageUrl || "https://placehold.co/400x300?text=%D7%90%D7%99%D7%9F+%D7%AA%D7%9E%D7%95%D7%A0%D7%94";
  
  return (
    <article className="card h-100">
      <Link to={`/art/${art.slug || art.id}`} aria-label={`הצג יצירה: ${art.title}`}>
        <img 
          src={imageUrl} 
          alt={art.title} 
          className="card-img-top" 
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://placehold.co/400x300?text=%D7%A9%D7%92%D7%99%D7%90%D7%94+%D7%91%D7%AA%D7%9E%D7%95%D7%A0%D7%94";
          }}
        />
      </Link>
      <div className="card-body">
        <h6 className="card-title mb-1">{art.title}</h6>
        <Link to={`/u/${art.authorUsername}`} className="text-muted" aria-label={`פרופיל של ${art.authorUsername}`}>@{art.authorUsername}</Link>
      </div>
    </article>
  );
}

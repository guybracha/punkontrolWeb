// src/components/ArtworkCard.jsx
import { Link } from "react-router-dom";
export default function ArtworkCard({ art }) {
  const imageUrl = art.imageUrl || "https://placehold.co/400x300?text=No+Image";
  
  return (
    <article className="card h-100">
      <Link to={`/art/${art.slug || art.id}`}>
        <img 
          src={imageUrl} 
          alt={art.title} 
          className="card-img-top" 
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://placehold.co/400x300?text=Image+Error";
          }}
        />
      </Link>
      <div className="card-body">
        <h6 className="card-title mb-1">{art.title}</h6>
        <Link to={`/u/${art.authorUsername}`} className="text-muted">@{art.authorUsername}</Link>
      </div>
    </article>
  );
}

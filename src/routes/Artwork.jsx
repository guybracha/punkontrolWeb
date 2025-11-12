// src/routes/Artwork.jsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getArtworkBySlugOrId } from "../lib/queries";

export default function Artwork(){
  const { slugOrId } = useParams();
  const { data:art } = useQuery({ queryKey:["art",slugOrId], queryFn:()=>getArtworkBySlugOrId(slugOrId) });
  if (!art) return <div className="container py-4">טוען…</div>;
  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-md-7"><img src={art.imageUrl} alt={art.title} className="img-fluid rounded-3"/></div>
        <div className="col-md-5">
          <h1 className="h3">{art.title}</h1>
          <div className="text-muted mb-2">@{art.authorUsername}</div>
          <p>{art.description}</p>
          <div className="d-flex flex-wrap gap-2">{art.tags?.map(t=><span key={t} className="badge bg-secondary">{t}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

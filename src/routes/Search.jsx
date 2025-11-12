// src/routes/Search.jsx
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchArtworks } from "../lib/queries";
import ArtworkCard from "../components/ArtworkCard";

export default function Search(){
  const [sp] = useSearchParams();
  const q = sp.get("q") || "";
  const { data=[], isLoading } = useQuery({ queryKey:["search",q], queryFn:()=>searchArtworks({q}), enabled: !!q });
  return (
    <div className="container py-4">
      <h1>Search Results</h1>
      {isLoading? "Loading…" :
        data.length? (
          <div className="row g-3">{data.map(a=><div className="col-6 col-md-3" key={a.id}><ArtworkCard art={a}/></div>)}</div>
        ): <p>No results found.</p>}
    </div>
  );
}

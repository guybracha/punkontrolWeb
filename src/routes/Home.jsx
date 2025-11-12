// src/routes/Home.jsx
import { useQuery } from "@tanstack/react-query";
import { getLatestArtworks } from "../lib/queries";
import ArtworkCard from "../components/ArtworkCard";

export default function Home(){
  const { data=[], isLoading } = useQuery({ queryKey:["latest"], queryFn:()=>getLatestArtworks(24) });
  return (
    <div className="container py-4">
      <h1 className="mb-3">Latest Art</h1>
      {isLoading? "Loading..." :
        <div className="row g-3">
          {data.map(a=>(
            <div className="col-6 col-md-3" key={a.id}><ArtworkCard art={a}/></div>
          ))}
        </div>}
    </div>
  );
}

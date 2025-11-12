// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import Home from "./routes/Home";
import Search from "./routes/Search";
import Profile from "./routes/Profile";
import Artwork from "./routes/Artwork";
import Upload from "./routes/Upload";
import Login from "./routes/Login";
import RequireKnownUser from "./components/RequireKnownUser";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/globals.css";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/art/:slugOrId" element={<Artwork />} />
          <Route
            path="/upload"
            element={
              <RequireKnownUser>
                <Upload />
              </RequireKnownUser>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

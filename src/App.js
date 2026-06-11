// src/App.js
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AccessibilityTools from "./components/AccessibilityTools";
import Home from "./routes/Home";
import Feed from "./routes/Feed";
import Post from "./routes/Post";
import Search from "./routes/Search";
import Profile from "./routes/Profile";
import Artwork from "./routes/Artwork";
import Upload from "./routes/Upload";
import Login from "./routes/Login";
import Messages from "./routes/Messages";
import About from "./routes/About";
import Terms from "./routes/Terms";
import Privacy from "./routes/Privacy";
import Contact from "./routes/Contact";
import RequireKnownUser from "./components/RequireKnownUser";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/globals.css";
import "./styles/ShareButtons.css";

const qc = new QueryClient();
const GTAG_ID = "G-FJPDWQB8LX";

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scriptId = "gtag-js";
    const existingScript = document.getElementById(scriptId);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", GTAG_ID);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    logEvent(analytics, 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title
    });

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return (
    <>
      <AccessibilityTools />
      <Navbar />
      <main id="main-content">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/post/:postId" element={<Post />} />
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
        <Route
          path="/messages"
          element={
            <RequireKnownUser>
              <Messages />
            </RequireKnownUser>
          }
        />
        <Route
          path="/messages/:username"
          element={
            <RequireKnownUser>
              <Messages />
            </RequireKnownUser>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </main>
    <Footer />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { moviesPageStyles } from "../assets/dummyStyles";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const COLLAPSE_COUNT = 12;
const PLACEHOLDER = "https://via.placeholder.com/400x600?text=No+Poster";

const getUploadUrl = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe !== "string") return null;
  if (maybe.startsWith("http://") || maybe.startsWith("https://")) return maybe;
  return `${API_BASE}/uploads/${String(maybe).replace(/^uploads\//, "")}`;
};

const categoriesList = [
  { id: "all", name: "All Movies" },
  { id: "action", name: "Action" },
  { id: "horror", name: "Horror" },
  { id: "comedy", name: "Comedy" },
  { id: "adventure", name: "Adventure" },
];

const mapBackendMovie = (m) => {
  const id = m._id || m.id || "";
  const title = m.movieName || m.title || "Untitled";
  const rawImg = m.poster || m.latestTrailer?.thumbnail || m.thumbnail || null;
  const image = getUploadUrl(rawImg) || PLACEHOLDER;

  // pick first category (normalize to lowercase for category id comparisons)
  const cat =
    (Array.isArray(m.categories) && m.categories[0]) ||
    m.category ||
    (Array.isArray(m.latestTrailer?.genres) && m.latestTrailer.genres[0]) ||
    "General";

  const category = String(cat || "General").toLowerCase();

  return { id, title, image, category, raw: m };
};

function MoviePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}/api/movies?type=normal&limit=200`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = Array.isArray(json.items) 
          ? json.items 
          : Array.isArray(json.data) 
            ? json.data 
            : Array.isArray(json) 
              ? json 
              : [];

        const mapped = items.map(mapBackendMovie);
        if (mounted) {
          setMovies(mapped);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load movies:", err);
        
        // fallback: try a generic fetch for any movies
        try {
          const res2 = await fetch(`${API_BASE}/api/movies?limit=200`);
          if (!res2.ok) throw new Error(`Fallback HTTP ${res2.status}`);
          const json2 = await res2.json();
          const items2 = Array.isArray(json2.items) 
            ? json2.items 
            : Array.isArray(json2.data) 
              ? json2.data 
              : Array.isArray(json2) 
                ? json2 
                : [];
          const mapped2 = items2.map(mapBackendMovie);
          if (mounted) {
            setMovies(mapped2);
            setLoading(false);
          }
        } catch (err2) {
          if (err2.name === "AbortError") return;
          console.error("Movies fallback failed:", err2);
          if (mounted) {
            setError("Unable to load movies.");
            setLoading(false);
          }
        }
      }
    }

    load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  const filteredMovies = useMemo(() => {
    if (activeCategory === "all") return movies;
    return movies.filter(
      (m) => 
        String(m.category || "").toLowerCase() ===
        String(activeCategory || "").toLowerCase()
    );
  }, [movies, activeCategory]);

  const visibleMovies = showAll
    ? filteredMovies
    : filteredMovies.slice(0, COLLAPSE_COUNT);

  useEffect(() => {
    setShowAll(false);
  }, [activeCategory]);

  return (
    <div className={moviesPageStyles.container}>
      <section className={moviesPageStyles.categoriesSection}>
        <div className={moviesPageStyles.categoriesContainer}>
          <h1 className={moviesPageStyles.pageTitle}>Movies</h1>
          
          {loading ? (
            <div className="py-12 text-center text-gray-300">Loading movies... </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">{error}</div>
          ) : (
            <div className={moviesPageStyles.categoriesFlex}>
              {categoriesList.map((category) => (
                <button
                  key={category.id}
                  className={`
                    relative
                    px-8 
                    py-4 
                    rounded-full
                    font-bold
                    text-lg
                    transition-all
                    duration-300
                    border-2
                    ${activeCategory === category.id
                      ? 'bg-gradient-to-r from-red-500 to-red-700 text-white border-transparent shadow-2xl'
                      : 'bg-transparent text-gray-300 border-gray-600 hover:border-red-500 hover:text-white'
                    }
                  `}
                  onClick={() => setActiveCategory(category.id)}
                  style={{
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    if (activeCategory !== category.id) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeCategory !== category.id) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                >
                  {category.name}
                  {activeCategory === category.id && (
                    <span 
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={moviesPageStyles.moviesSection}>
        <div className={moviesPageStyles.moviesContainer}>
          {loading ? (
            <div className="py-12 text-center text-gray-300">Loading movies...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">{error}</div>
          ) : (
            <>
              <div className={moviesPageStyles.moviesGrid}>
                {visibleMovies.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-4xl mb-4">🎬</div>
                    <h3 className="text-2xl font-bold text-gray-300 mb-2">
                      No movies found
                    </h3>
                    <p className="text-gray-400">
                      Try selecting a different category
                    </p>
                  </div>
                ) : (
                  visibleMovies.map((movie, index) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className={`
                        relative
                        group
                        rounded-2xl
                        overflow-hidden
                        bg-gradient-to-br from-gray-800 to-gray-900
                        transition-all
                        duration-500
                        hover:shadow-2xl
                        hover:shadow-red-500/20
                      `}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        animation: 'fadeInUp 0.5s ease forwards',
                        opacity: 0,
                      }}
                    >
                      <div className="relative overflow-hidden h-80">
                        <img
                          src={movie.image}
                          alt={movie.title}
                          className={`
                            w-full
                            h-full
                            object-cover
                            transition-transform
                            duration-700
                            group-hover:scale-110
                          `}
                          onError={(e) => {
                            e.target.src = PLACEHOLDER;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-xl font-bold text-white mb-2">
                              {movie.title}
                            </h3>
                            <span className="inline-block px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full text-sm text-red-300 border border-red-500/30">
                              {movie.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {filteredMovies.length > COLLAPSE_COUNT && (
                <div className="flex justify-center mt-12">
                  <button
                    className={`
                      relative
                      px-8
                      py-4
                      rounded-full
                      font-bold
                      text-lg
                      transition-all
                      duration-300
                      overflow-hidden
                      group
                      ${showAll 
                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border border-gray-600' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }
                    `}
                    onClick={() => setShowAll(!showAll)}
                    type="button"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <span className="relative z-10">
                      {showAll
                        ? "Show Less"
                        : `Show More (${filteredMovies.length - COLLAPSE_COUNT} more)`}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default MoviePage;
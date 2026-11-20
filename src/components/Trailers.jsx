import React, { useEffect, useState, useRef } from 'react'
import { trailersStyles } from '../assets/dummyStyles'
import { Calendar, ChevronLeft, ChevronRight, Clapperboard, Clock, Play, X } from 'lucide-react'
import API_BASE from '../config'

const PLACEHOLDER_THUMB = "https://placehold.co/800x450?text=No+Thumbnail";

const getUploadUrl = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) return input;
    return `/uploads/${input.replace(/^uploads\//, "")}`;
  }
  if (typeof input === "object") {
    const possible = input.url || input.path || input.filename || input.file || input.image || "";
    if (possible) return getUploadUrl(possible);
  }
  return null;
};

const formatDuration = (dur) => {
  if (!dur) return "";
  if (typeof dur === "string") return dur;
  if (typeof dur === "number") return `${dur}m`;
  const h = dur.hours ?? 0;
  const m = dur.minutes ?? 0;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return "";
};

const mapMovieToTrailerItem = (movie) => {
  const lt = movie.latestTrailer || {};
  const title = lt.title || movie.movieName || movie.title || "Untitled";
  const thumbnail = getUploadUrl(lt.thumbnail) || getUploadUrl(movie.poster) || PLACEHOLDER_THUMB;
  const videoUrl = lt.videoId || lt.videoUrl || movie.trailerUrl || movie.videoUrl || "";
  const duration = lt.duration ? formatDuration(lt.duration) : movie.duration ? formatDuration(movie.duration) : "";
  const year = lt.year || movie.year || "";
  const genre = lt.genres && lt.genres.length 
    ? lt.genres.join(", ") 
    : movie.categories && movie.categories.length 
      ? movie.categories.join(", ") 
      : movie.genre || "";
  const description = lt.description || movie.story || "";

  const credits = {};
  const directors = lt.directors || movie.directors || [];
  const producers = lt.producers || movie.producers || [];
  const singers = lt.singers || [];
  
  const firstDirector = directors.find(Boolean);
  const firstProducer = producers.find(Boolean);
  const firstSinger = singers.find(Boolean);

  if (firstDirector) {
    credits["Director"] = {
      name: firstDirector.name || "Unknown",
      image: getUploadUrl(firstDirector.file) || PLACEHOLDER_THUMB,
    };
  }
  if (firstProducer) {
    credits["Producer"] = {
      name: firstProducer.name || "Unknown",
      image: getUploadUrl(firstProducer.file) || PLACEHOLDER_THUMB,
    };
  }
  if (firstSinger) {
    credits["Singer"] = {
      name: firstSinger.name || "Unknown",
      image: getUploadUrl(firstSinger.file) || PLACEHOLDER_THUMB,
    };
  }

  return {
    id: movie._id || movie.id || Math.random().toString(),
    title,
    thumbnail,
    videoUrl,
    duration,
    year,
    genre,
    description,
    credits,
  };
};

function Trailers() {
  const [featuredTrailer, setFeaturedTrailer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const url = `${API_BASE}/api/movies?type=latestTrailer&limit=50`;
        console.log("Fetching from URL:", url);
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        console.log("API Response:", json);
        
        let items = [];
        if (Array.isArray(json.items)) {
          items = json.items;
        } else if (Array.isArray(json.data)) {
          items = json.data;
        } else if (Array.isArray(json)) {
          items = json;
        }
        
        console.log("Found items:", items.length);

        // If no latestTrailer type found, try to get all movies and filter
        if (items.length === 0) {
          console.log("No latestTrailer movies found, trying all movies...");
          const allMoviesUrl = `${API_BASE}/api/movies?limit=100`;
          const allRes = await fetch(allMoviesUrl, { signal: ac.signal });
          if (allRes.ok) {
            const allJson = await allRes.json();
            const allItems = Array.isArray(allJson.items) ? allJson.items : 
                           Array.isArray(allJson.data) ? allJson.data : 
                           Array.isArray(allJson) ? allJson : [];
            
            // Filter movies that have trailer data
            items = allItems.filter(movie => 
              movie.trailerUrl || 
              movie.videoUrl || 
              movie.latestTrailer?.videoId ||
              movie.latestTrailer?.url
            );
            console.log("Filtered movies with trailers:", items.length);
          }
        }

        if (items.length > 0) {
          const mapped = items.map(mapMovieToTrailerItem);
          console.log("Mapped trailers:", mapped);
          
          setTrailers(mapped);
          setFeaturedTrailer(mapped[0]);
          setLoading(false);
        } else {
          // Create a fallback demo trailer
          const demoTrailers = [
            {
              id: "demo1",
              title: "SAJID NADIADWALA'S BAAGHIA",
              thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
              videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              duration: "2h 15m",
              year: "2024",
              genre: "Action, Drama",
              description: "An epic action drama featuring thrilling sequences and powerful performances.",
              credits: {
                "Director": {
                  name: "A. HARSHA",
                  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop"
                },
                "Producer": {
                  name: "SAJID NADIADWALA",
                  image: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=100&h=100&fit=crop"
                }
              }
            },
            {
              id: "demo2",
              title: "Ocean's Legacy",
              thumbnail: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=450&fit=crop",
              videoUrl: "https://www.youtube.com/watch?v=example1",
              duration: "2h 8m",
              year: "2024",
              genre: "Adventure, Fantasy",
              description: "Explore the mysteries of the deep ocean in this breathtaking cinematic experience.",
              credits: {
                "Director": {
                  name: "James Cameron",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                }
              }
            },
            {
              id: "demo3",
              title: "Midnight Chronicles",
              thumbnail: "https://images.unsplash.com/photo-1489599809516-9827b6d1cf13?w=800&h=450&fit=crop",
              videoUrl: "https://www.youtube.com/watch?v=example2",
              duration: "1h 58m",
              year: "2023",
              genre: "Mystery, Thriller",
              description: "A suspenseful journey through the dark secrets of a small town.",
              credits: {
                "Director": {
                  name: "David Fincher",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                }
              }
            }
          ];
          
          setTrailers(demoTrailers);
          setFeaturedTrailer(demoTrailers[0]);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Failed to load trailers:", err);
        
        // Create demo trailers on error
        const demoTrailers = [
          {
            id: "demo1",
            title: "SAJID NADIADWALA'S BAAGHIA",
            thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            duration: "2h 15m",
            year: "2024",
            genre: "Action, Drama",
            description: "An epic action drama featuring thrilling sequences and powerful performances.",
            credits: {
              "Director": {
                name: "A. HARSHA",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop"
              },
              "Producer": {
                name: "SAJID NADIADWALA",
                image: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=100&h=100&fit=crop"
              }
            }
          }
        ];
        
        setTrailers(demoTrailers);
        setFeaturedTrailer(demoTrailers[0]);
        setError('Using demo data. Could not connect to server.');
        setLoading(false);
      }
    }
    load();
    return () => ac.abort();
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  const selectTrailer = (trailer) => {
    setFeaturedTrailer(trailer);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (featuredTrailer?.videoUrl) {
      setIsPlaying(!isPlaying);
    } else {
      alert("No video available for this trailer");
    }
  };

  const getEmbedUrl = (videoUrl) => {
    if (!videoUrl) return "";
    try {
      let videoId = '';
      
      if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1];
        const questionMarkPosition = videoId.indexOf('?');
        if (questionMarkPosition !== -1) {
          videoId = videoId.substring(0, questionMarkPosition);
        }
      } else if (videoUrl.includes('youtube.com/embed/')) {
        videoId = videoUrl.split('embed/')[1];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
      }
      
      return videoUrl;
    } catch (e) {
      return videoUrl || "";
    }
  };

  if (loading) {
    return (
      <div className={trailersStyles.container}>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-300 text-lg">Loading Trailers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!featuredTrailer) {
    return (
      <div className={trailersStyles.container}>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-300 mb-4">No Trailers Available</h3>
            <p className="text-gray-400 mb-6">Check back later for new trailers.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition duration-300"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={trailersStyles.container}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.8);
        }
      `}</style>
      
      <main className={trailersStyles.main}>
        <div className={trailersStyles.layout}>
          {/* Left Side - Carousel */}
          <div className={trailersStyles.leftSide}>
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                    <Clapperboard className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white" style={{fontFamily: "'Monoton', cursive", letterSpacing: '2px'}}>
                    LATEST TRAILERS
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={scrollLeft}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition duration-300"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={scrollRight}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition duration-300"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              <div 
                ref={carouselRef} 
                className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar"
                style={{ scrollbarWidth: 'thin', msOverflowStyle: 'none' }}
              >
                {trailers.map((trailer) => (
                  <div
                    key={trailer.id}
                    className={`flex-shrink-0 w-60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      featuredTrailer?.id === trailer.id 
                        ? 'ring-2 ring-red-500 scale-105' 
                        : 'opacity-80 hover:opacity-100 hover:scale-102'
                    }`}
                    onClick={() => selectTrailer(trailer)}
                  >
                    <div className="relative">
                      <img 
                        src={trailer.thumbnail} 
                        alt={trailer.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-white font-semibold text-sm truncate">{trailer.title}</h3>
                        <p className="text-gray-300 text-xs truncate">{trailer.genre}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-red-500 rounded"></div>
                  NOW TRENDING
                </h3>
                <div className="space-y-4">
                  {trailers.slice(0, 3).map((trailer) => (
                    <div 
                      key={trailer.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition duration-300 cursor-pointer"
                      onClick={() => selectTrailer(trailer)}
                    >
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={trailer.thumbnail} 
                          alt={trailer.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{trailer.title}</h4>
                        <p className="text-gray-400 text-xs truncate">{trailer.genre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Featured Trailer */}
          <div className={trailersStyles.rightSide}>
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-2xl">
              {isPlaying && featuredTrailer?.videoUrl ? (
                <div className="relative rounded-xl overflow-hidden mb-6" style={{height: "400px"}}>
                  <iframe
                    src={getEmbedUrl(featuredTrailer.videoUrl)}
                    title={featuredTrailer.title}
                    className="w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button 
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center transition duration-300"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden mb-6 group" style={{height: "400px"}}>
                  <img 
                    src={featuredTrailer.thumbnail} 
                    alt={featuredTrailer.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {featuredTrailer.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={togglePlay}
                        className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                      >
                        <Play className="w-10 h-10 text-white ml-1" fill="white" />
                      </button>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-4 mb-2">
                      {featuredTrailer.duration && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
                          <Clock className="w-4 h-4 text-red-400" />
                          <span className="text-white text-sm">{featuredTrailer.duration}</span>
                        </div>
                      )}
                      {featuredTrailer.year && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
                          <Calendar className="w-4 h-4 text-red-400" />
                          <span className="text-white text-sm">{featuredTrailer.year}</span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                      {featuredTrailer.title}
                    </h2>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Genres */}
                {featuredTrailer.genre && (
                  <div className="flex flex-wrap gap-2">
                    {featuredTrailer.genre.split(',').map((genre, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Description */}
                {featuredTrailer.description && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">SYNOPSIS</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {featuredTrailer.description}
                    </p>
                  </div>
                )}
                
                {/* Credits */}
                {featuredTrailer.credits && Object.keys(featuredTrailer.credits).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">CREDITS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(featuredTrailer.credits).map(([role, person]) => (
                        <div 
                          key={role} 
                          className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            <img 
                              src={person.image} 
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-red-400 text-xs font-medium">{role}</div>
                            <div className="text-white font-semibold">{person.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Trailers;
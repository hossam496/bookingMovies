import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Film, Star, Clock, Calendar, Ticket, Play, Trash2, ShieldAlert, Edit2 } from 'lucide-react';

import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:5000';

const getImageUrl = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe !== 'string') return null;
  if (maybe.startsWith('http://') || maybe.startsWith('https://')) return maybe;
  return `${API_BASE}/uploads/${String(maybe).replace(/^uploads\//, '')}`;
};

const ListMovies = ({ onEdit }) => {

  const [movies, setMovies] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all' && filterType !== 'latestTrailers') {
        params.type = filterType;
      }
      if (filterType === 'latestTrailers') {
        params.latestTrailers = true;
        params.type = 'latestTrailers';
      }
      if (search && search.trim()) params.search = search.trim();
      
      const res = await axios.get(`${API_BASE}/api/movies`, { params });
      let items = res?.data?.success ? res.data.items || [] : Array.isArray(res?.data) ? res.data : [];
      setMovies(items);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => fetchMovies(), 300);
    return () => clearTimeout(delaySearch);
  }, [filterType, search]);

  const handleDelete = async (movie) => {
      const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${movie.title || movie.movieName}". This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      background: '#111827',
      color: '#fff',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/api/movies/${movie._id || movie.id}`);
        setMovies(prev => prev.filter(m => (m._id || m.id) !== (movie._id || movie.id)));
        Swal.fire({
          title: 'Deleted!', 
          text: 'The movie has been deleted.', 
          icon: 'success', 
          background: '#111827', 
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      } catch (err) {
        Swal.fire({title: 'Error', text: 'Failed to delete movie.', icon: 'error', background: '#111827', color: '#fff'});
      }
    }
  };

  const filteredMovies = useMemo(() => movies.filter(m => m.type !== 'cinenews'), [movies]);

  const tabs = [
    { id: 'all', label: 'All', icon: <Film className="w-4 h-4" /> },
    { id: 'normal', label: 'Now Showing', icon: <Ticket className="w-4 h-4" /> },
    { id: 'featured', label: 'Featured', icon: <Star className="w-4 h-4" /> },
    { id: 'releaseSoon', label: 'Coming Soon', icon: <Calendar className="w-4 h-4" /> },
    { id: 'latestTrailers', label: 'Trailers', icon: <Play className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === tab.id
                  ? 'bg-blue-900/40 text-blue-400 border border-blue-800'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none placeholder-gray-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <ShieldAlert className="w-16 h-16 text-gray-700 mb-4" />
          <p className="text-xl font-medium text-gray-300">No movies found</p>
          <p className="text-sm mt-1 text-gray-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map(movie => {
            const isTrailerPhase = movie.type === 'latestTrailers' || movie.latestTrailer?.title;
            const title = movie.movieName || movie.title || movie.latestTrailer?.title || 'Untitled';
            const img = getImageUrl(movie.poster || movie.thumbnail || movie.latestTrailer?.thumbnail);
            const rating = movie.rating || movie.latestTrailer?.rating;
            const genres = movie.categories || movie.genres || movie.latestTrailer?.genres || [];
            
            return (
              <div key={movie._id || movie.id} className="group flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex justify-center items-center">
                      <Film className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <button
                      onClick={() => onEdit && onEdit(movie)}
                      className="p-2 cursor-pointer bg-black/60 backdrop-blur text-blue-400 rounded-full hover:bg-blue-900/50 hover:text-blue-300 shadow-md transition-colors"
                      title="Edit Movie"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(movie)}
                      className="p-2 cursor-pointer bg-black/60 backdrop-blur text-red-500 rounded-full hover:bg-red-900/50 hover:text-red-400 shadow-md transition-colors"
                      title="Delete Movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded-md">
                      {isTrailerPhase ? 'Trailer' : movie.type}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-100 line-clamp-1 mb-1">{title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {genres.slice(0, 3).map((g, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1 font-medium">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-gray-300">{rating || 'N/A'}</span>
                    </div>
                    {movie.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {typeof movie.duration === 'number' 
                            ? `${Math.floor(movie.duration/60)}h ${movie.duration%60}m` 
                            : movie.duration.hours ? `${movie.duration.hours}h ${movie.duration.minutes}m` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListMovies;

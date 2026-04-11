import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

import { Film, Plus } from 'lucide-react';
import API_BASE from '../../config';
import ListMovies from './components/ListMovies';
import AddMovie from './components/AddMovie';

const Movies = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const section = searchParams.get('section');



  useEffect(() => {
    if (editId) {
      const fetchEditMovie = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/movies/${editId}`);
          if (res.data) {
            setEditingMovie(res.data.item || res.data);
            setActiveTab('add');
            // Clear the param so it doesn't re-trigger
            setSearchParams({});
          }

        } catch (err) {
          console.error('Error fetching movie for edit', err);
        }
      };
      fetchEditMovie();
    }
  }, [editId]);

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setActiveTab('add');
  };


  const handleComplete = () => {
    setEditingMovie(null);
    setActiveTab('list');
    setSearchParams({});
  };



  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Movies Management</h1>
          <p className="text-gray-400">Manage all movies, trailers, and showtimes.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-1 rounded-xl flex gap-1 shadow-sm">
          <button
            onClick={() => {
              setEditingMovie(null);
              setActiveTab('list');
            }}

            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'list'
                ? 'bg-gray-800 text-gray-100 shadow-md border border-gray-700'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`}
          >
            <Film className="w-4 h-4" />
            All Movies
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`}
          >
            <Plus className="w-4 h-4" />
             {editingMovie ? 'Edit Movie' : 'Add Movie'}
           </button>

        </div>
      </div>

      <div className="bg-gray-950 rounded-2xl shadow-lg border border-gray-800 overflow-hidden">
         {activeTab === 'list' ? (
          <ListMovies onEdit={handleEdit} />
        ) : (
          <AddMovie initialData={editingMovie} onComplete={handleComplete} section={section} />
        )}


      </div>
    </div>
  );
};

export default Movies;

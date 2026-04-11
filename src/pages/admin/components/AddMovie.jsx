import React, { useState } from 'react';
import axios from 'axios';
import { Film, Upload, Plus, X, Calendar, Clock, Star, Users, Briefcase, Mic } from 'lucide-react';
import Swal from 'sweetalert2';
import API_BASE from '../../../config';


const ImageUpload = ({ label, icon, onFileChange, previewUrl, onRemove }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {previewUrl ? (
      <div className="relative w-full h-48 bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-gray-900/90 text-red-500 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer group">
        <div className="p-3 bg-gray-800 rounded-full shadow-sm text-gray-500 group-hover:text-red-500 transition-colors mb-3">
          {icon}
        </div>
        <span className="text-sm text-gray-400 font-medium">Click to upload</span>
        <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
      </label>
    )}
  </div>
);

const AddMovie = ({ initialData, onComplete, section }) => {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (section) {
      setTimeout(() => {
        const element = document.getElementById(`edit-${section}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-4', 'rounded-xl');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-4');
          }, 3000);
        }
      }, 500);
    }
  }, [section]);


  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'normal',
    movieName: '',
    categories: [],
    trailerUrl: '',
    rating: '7.5',
    duration: '120',
    story: '',
    standardPrice: '150',
    reclinerPrice: '250',
    auditorium: 'Audi 1',
    cast: [],
    directors: [],
    producers: [],
    slots: []
  });

  // State for person images
  const [castFiles, setCastFiles] = useState([]);
  const [directorFiles, setDirectorFiles] = useState([]);
  const [producerFiles, setProducerFiles] = useState([]);


  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'normal',
        movieName: initialData.movieName || initialData.title || '',
        categories: initialData.categories || [],
        trailerUrl: initialData.trailerUrl || '',
        status: initialData.status || 'Active',
        rating: String(initialData.rating || '7.5'),
        duration: String(initialData.duration || '120'),
        story: initialData.story || '',
        standardPrice: String(initialData.seatPrices?.standard || '150'),
        reclinerPrice: String(initialData.seatPrices?.recliner || '250'),
        auditorium: initialData.auditorium || 'Audi 1',
        cast: initialData.cast || [],
        directors: initialData.directors || [],
        producers: initialData.producers || [],
        slots: initialData.slots || []
      });
      if (initialData.poster || initialData.thumbnail) {
        setPosterPreview(initialData.poster || initialData.thumbnail);
      }
    }
  }, [initialData]);



  const availableCategories = ['Action', 'Horror', 'Comedy', 'Adventure', 'Sci-Fi', 'Drama', 'Romance'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const cats = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: cats };
    });
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'normal',
      movieName: '',
      categories: [],
      trailerUrl: '',
      rating: '7.5',
      duration: '120',
      story: '',
      standardPrice: '150',
      reclinerPrice: '250',
      auditorium: 'Audi 1'
    });
    setPoster(null);
    setPosterPreview(null);
    setCastFiles([]);
    setDirectorFiles([]);
    setProducerFiles([]);
  };

  const addItem = (field, defaultValue) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], defaultValue] }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    if (field === 'cast') setCastFiles(prev => prev.filter((_, i) => i !== index));
    if (field === 'directors') setDirectorFiles(prev => prev.filter((_, i) => i !== index));
    if (field === 'producers') setProducerFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleArrayChange = (field, index, subfield, value) => {
    setFormData(prev => {
      const newArr = [...prev[field]];
      newArr[index] = { ...newArr[index], [subfield]: value };
      return { ...prev, [field]: newArr };
    });
  };

  const handlePersonFile = (field, index, file) => {
    if (field === 'cast') {
      const newFiles = [...castFiles];
      newFiles[index] = file;
      setCastFiles(newFiles);
    } else if (field === 'directors') {
      const newFiles = [...directorFiles];
      newFiles[index] = file;
      setDirectorFiles(newFiles);
    } else if (field === 'producers') {
      const newFiles = [...producerFiles];
      newFiles[index] = file;
      setProducerFiles(newFiles);
    }
    
    // Create preview
    const preview = URL.createObjectURL(file);
    handleArrayChange(field, index, 'preview', preview);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieName) return Swal.fire('Error', 'Movie Name is required', 'error');
    if (!poster && !posterPreview && formData.type !== 'releaseSoon') return Swal.fire('Error', 'Poster Image is required', 'error');
    if (formData.categories.length === 0) return Swal.fire('Error', 'Please select at least one category', 'error');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('movieName', formData.movieName);
      data.append('categories', JSON.stringify(formData.categories));
      if (poster) data.append('poster', poster);
      data.append('trailerUrl', formData.trailerUrl);
      data.append('rating', formData.rating);
      data.append('duration', formData.duration);
      data.append('story', formData.story);
      
      data.append('seatPrices', JSON.stringify({
        standard: Number(formData.standardPrice),
        recliner: Number(formData.reclinerPrice)
      }));
      data.append('auditorium', formData.auditorium);
      
      data.append('cast', JSON.stringify(formData.cast.map(c => ({ name: c.name, role: c.role }))));
      data.append('directors', JSON.stringify(formData.directors.map(d => ({ name: d.name }))));
      data.append('producers', JSON.stringify(formData.producers.map(p => ({ name: p.name }))));
      data.append('slots', JSON.stringify(formData.slots));

      castFiles.forEach(f => { if (f) data.append('castFiles', f); });
      directorFiles.forEach(f => { if (f) data.append('directorFiles', f); });
      producerFiles.forEach(f => { if (f) data.append('producerFiles', f); });


      if (initialData) {
        await axios.put(`${API_BASE}/api/movies/${initialData._id || initialData.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({title: 'Success', text: 'Movie updated successfully!', icon: 'success', background: '#111827', color: '#fff'});
      } else {
        await axios.post(`${API_BASE}/api/movies`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({title: 'Success', text: 'Movie added successfully!', icon: 'success', background: '#111827', color: '#fff'});
      }
      
      if (onComplete) onComplete();
      else resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire({title: 'Error', text: err.response?.data?.message || 'Failed to save movie', icon: 'error', background: '#111827', color: '#fff'});
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm">
          <label className="text-sm font-medium text-gray-300 mb-4 block">Movie Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'normal', label: 'Now Showing' },
              { id: 'featured', label: 'Featured' },
              { id: 'releaseSoon', label: 'Coming Soon' },
              { id: 'latestTrailers', label: 'Trailer' }
            ].map(type => (
              <label
                key={type.id}
                className={`flex items-center justify-center py-3 px-4 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                  formData.type === type.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.id}
                  checked={formData.type === type.id}
                  onChange={handleInputChange}
                  className="hidden"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Col: Poster */}
          <div className="md:col-span-1">
            <ImageUpload
              label="Movie Poster"
              icon={<Upload className="w-6 h-6" />}
              previewUrl={posterPreview}
              onFileChange={handlePosterChange}
              onRemove={() => { setPoster(null); setPosterPreview(null); }}
            />
          </div>

          {/* Right Col: Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Movie Title *</label>
              <input
                type="text"
                name="movieName"
                value={formData.movieName}
                onChange={handleInputChange}
                placeholder="Enter movie title"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Genres *</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(cat => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${
                      formData.categories.includes(cat)
                        ? 'bg-blue-900/40 text-blue-400 border border-blue-800'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trailer URL</label>
                <div className="relative">
                  <Film className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    name="trailerUrl"
                    value={formData.trailerUrl}
                    onChange={handleInputChange}
                    placeholder="https://"
                    className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (mins)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {(formData.type === 'normal' || formData.type === 'featured') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Standard Price (₹)</label>
                  <input
                    type="number"
                    name="standardPrice"
                    value={formData.standardPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border bg-gray-800 text-gray-100 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recliner Price (₹)</label>
                  <input
                    type="number"
                    name="reclinerPrice"
                    value={formData.reclinerPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border bg-gray-800 text-gray-100 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Storyline</label>
              <textarea
                name="story"
                value={formData.story}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder-gray-600"
                placeholder="Write a brief synopsis of the movie..."
              />
            </div>
          </div>
        </div>

        {/* Showtimes Section */}
        <div id="edit-showtimes" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Showtimes
            </h3>
            <button
              type="button"
              onClick={() => addItem('slots', { date: '', time: '', ampm: 'PM' })}
              className="flex items-center cursor-pointer gap-1 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.slots.map((slot, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded-xl border border-gray-700 relative group">
                <button
                  type="button"
                  onClick={() => removeItem('slots', idx)}
                  className="absolute cursor-pointer -top-2 -right-2 p-1 bg-gray-900 text-red-500 rounded-full border border-red-900/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={slot.date}
                    style={{ colorScheme: 'dark' }}
                    onChange={(e) => handleArrayChange('slots', idx, 'date', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg text-sm outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={slot.time}
                      onChange={(e) => handleArrayChange('slots', idx, 'time', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm outline-none"
                    />
                    <select
                      value={slot.ampm}
                      onChange={(e) => handleArrayChange('slots', idx, 'ampm', e.target.value)}
                      className="px-2 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg text-sm outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cast Section */}
        <div id="edit-cast" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Cast Members
            </h3>
            <button
              type="button"
              onClick={() => addItem('cast', { name: '', role: '', preview: null })}
              className="flex items-center gap-1 cursor-pointer text-sm font-medium text-blue-500 hover:text-blue-400"
            >
              <Plus className="w-4 h-4" /> Add Actor
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.cast.map((member, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-gray-800 rounded-2xl border border-gray-700 relative group">
                <button
                  type="button"
                  onClick={() => removeItem('cast', idx)}
                  className="absolute cursor-pointer -top-2 -right-2 p-1 bg-gray-900 text-red-500 rounded-full border border-red-900/50 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-800"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="w-16 h-16 rounded-full bg-gray-900 overflow-hidden flex-shrink-0 relative border border-gray-700">
                  {member.preview || member.file ? (
                    <img src={member.preview || member.file} className="w-full h-full object-cover" />
                  ) : <Users className="w-6 h-6 m-auto text-gray-500 mt-5" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" className="hidden" onChange={(e) => handlePersonFile('cast', idx, e.target.files[0])} />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    placeholder="Actor Name"
                    value={member.name}
                    onChange={(e) => handleArrayChange('cast', idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm outline-none"
                  />
                  <input
                    placeholder="Role Name"
                    value={member.role}
                    onChange={(e) => handleArrayChange('cast', idx, 'role', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Section (Director/Producer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div id="edit-director" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Directors
              </h3>
              <button
                type="button"
                onClick={() => addItem('directors', { name: '', preview: null })}
                className="text-blue-500 cursor-pointer hover:text-blue-400 hover:bg-gray-800 rounded-full p-1"
              ><Plus className="w-4 h-4" /></button>
            </div>
            {formData.directors.map((d, idx) => (
              <div key={idx} className="flex gap-3 mb-3 relative group">
                <button
                  type="button"
                  onClick={() => removeItem('directors', idx)}
                  className="absolute cursor-pointer -top-2 left-10 p-0.5 bg-gray-900 text-red-500 rounded-full opacity-0 group-hover:opacity-100 z-10 transition-all hover:bg-gray-800"
                ><X className="w-3 h-3" /></button>
                <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden relative">
                  {(d.preview || d.file) && <img src={d.preview || d.file} className="w-full h-full object-cover" />}
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"><Upload className="w-3 h-3 text-gray-500" /><input type="file" className="hidden" onChange={e => handlePersonFile('directors', idx, e.target.files[0])} /></label>
                </div>
                <input
                  placeholder="Director Name"
                  value={d.name}
                  onChange={e => handleArrayChange('directors', idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm outline-none"
                />
              </div>
            ))}
          </div>

          <div id="edit-producer" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" />
                Producers
              </h3>
               <button
                type="button"
                onClick={() => addItem('producers', { name: '', preview: null })}
                className="text-blue-500 cursor-pointer hover:text-blue-400 hover:bg-gray-800 p-1 rounded-full"
              ><Plus className="w-4 h-4" /></button>
            </div>
             {formData.producers.map((p, idx) => (
              <div key={idx} className="flex gap-3 mb-3 relative group">
                <button
                  type="button"
                  onClick={() => removeItem('producers', idx)}
                  className="absolute cursor-pointer -top-2 left-10 p-0.5 bg-gray-900 text-red-500 rounded-full opacity-0 group-hover:opacity-100 z-10 transition-all hover:bg-gray-800"
                ><X className="w-3 h-3" /></button>
                <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden relative">
                  {(p.preview || p.file) && <img src={p.preview || p.file} className="w-full h-full object-cover" />}
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"><Upload className="w-3 h-3 text-gray-500" /><input type="file" className="hidden" onChange={e => handlePersonFile('producers', idx, e.target.files[0])} /></label>
                </div>
                <input
                  placeholder="Producer Name"
                  value={p.name}
                  onChange={e => handleArrayChange('producers', idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm outline-none"
                />
              </div>
            ))}
          </div>
        </div>


        <div className="pt-6 border-t border-gray-800 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2.5 cursor-pointer text-sm font-medium text-gray-400 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 cursor-pointer text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-900/40 transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Movie' : 'Save Movie'
            )}

          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMovie;

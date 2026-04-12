import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Search, Calendar, CreditCard, User, AlertCircle, Clock, Trash2, CheckCircle2, XCircle } from 'lucide-react';

import Swal from 'sweetalert2';
import API_BASE from '../../config';


const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/bookings`, {
        params: { paymentStatus: 'all', limit: 1000 }
      });
      
      const data = res.data?.items || res.data || [];
      const normalized = Array.isArray(data) ? data : [];
      
      // Sort by newest first (assuming _id or createdAt can be used, otherwise just reverse)
      setBookings(normalized.reverse());
    } catch (err) {
      console.error('Error fetching bookings', err);
      Swal.fire('Error', 'Failed to load bookings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (booking) => {
      const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this booking record? This cannot be undone.",
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
        await axios.delete(`${API_BASE}/api/bookings/${booking._id || booking.id}`);
        setBookings(prev => prev.filter(b => (b._id || b.id) !== (booking._id || booking.id)));
        Swal.fire({
          title: 'Deleted!', 
          text: 'Booking has been removed.', 
          icon: 'success',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      } catch (err) {
        Swal.fire({title: 'Error', text: 'Failed to delete booking.', icon: 'error', background: '#111827', color: '#fff'});
      }
    }
  };

  const handleToggleStatus = async (booking) => {
    const newStatus = (booking.paymentStatus === 'paid' || booking.paymentStatus === 'success') ? 'pending' : 'paid';
    const newGeneralStatus = newStatus === 'paid' ? 'confirmed' : 'pending';
    
    try {
      const res = await axios.put(`${API_BASE}/api/bookings/${booking._id || booking.id}`, { 
        paymentStatus: newStatus,
        status: newGeneralStatus
      });
      if (res.data.success) {
        setBookings(prev => prev.map(b => (b._id || b.id) === (booking._id || booking.id) ? { ...b, paymentStatus: newStatus, status: newGeneralStatus } : b));
        Swal.fire({
          title: 'Updated!', 
          text: `Payment status changed to ${newStatus}`, 
          icon: 'success',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({title: 'Error', text: 'Failed to update booking status.', icon: 'error', background: '#111827', color: '#fff'});
    }
  };


  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'success' || s === 'completed') return 'bg-green-900/40 text-green-400 border-green-800';
    if (s === 'pending') return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
    if (s === 'failed' || s === 'cancelled') return 'bg-red-900/40 text-red-400 border-red-800';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  const filteredBookings = bookings.filter(b => {
    const term = search.toLowerCase();
    const movieName = (b.movie?.movieName || b.movieName || b.movieTitle || '').toLowerCase();
    const userName = (b.user?.name || b.user?.fullName || b.customer || '').toLowerCase();
    const email = (b.user?.email || b.email || '').toLowerCase();
    const id = (b._id || b.id || '').toLowerCase();
    return movieName.includes(term) || userName.includes(term) || email.includes(term) || id.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Bookings</h1>
          <p className="text-gray-400">View and manage all customer ticket reservations.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm placeholder-gray-500"
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Booking ID</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Customer</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Movie / Show</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Seats</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm text-right">Amount</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                      <span className="text-gray-400">Loading bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-lg font-medium text-gray-300">No bookings found</p>
                      <p className="text-sm">Try using different search keywords</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const id = b._id || b.id || b.bookingId;
                  const movie = b.movie?.movieName || b.movieName || b.movie?.title || 'Unknown Movie';
                  const user = b.user?.name || b.user?.fullName || b.customer || 'Guest';
                  const email = b.user?.email || b.email || '';
                  const seats = Array.isArray(b.seats) ? b.seats.map(s => typeof s === 'string' ? s : (s.seatId || s.id || s.name || '-')).join(', ') : b.seatNumber || '-';
                  const total = b.amountPaise ? b.amountPaise / 100 : b.amount || b.totalAmount || 0;
                  const status = b.paymentStatus || b.status || 'Pending';
                  
                  // Try to extract show date / time
                  let showTime = '';
                  if (b.showDate) showTime += new Date(b.showDate).toLocaleDateString();
                  if (b.showTime) showTime += ` ${b.showTime}`;
                  if (!showTime) showTime = new Date(b.createdAt || b.date).toLocaleDateString();

                  return (
                    <tr key={id} className="hover:bg-gray-800 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gray-500" />
                          <span className="font-mono text-sm text-gray-400 truncate max-w-[120px]">
                            {id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-800 flex items-center justify-center text-blue-400 font-bold shadow-sm">
                            {(user)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200 text-sm">{user}</p>
                            {email && <p className="text-xs text-gray-500">{email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-200 text-sm line-clamp-1">{movie}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{showTime}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 font-medium">
                          {seats}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="font-medium text-gray-200">₹{total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Paid via Card</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(b)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              (status === 'paid' || status === 'success') 
                                ? 'bg-yellow-900/30 text-yellow-500 hover:bg-yellow-900/50' 
                                : 'bg-green-900/30 text-green-500 hover:bg-green-900/50'
                            }`}
                            title={(status === 'paid' || status === 'success') ? "Mark as Pending" : "Mark as Paid"}
                          >
                            {(status === 'paid' || status === 'success') ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="p-1.5 bg-red-900/30 text-red-500 rounded-lg cursor-pointer hover:bg-red-900/50 transition-colors"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredBookings.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-gray-900 flex items-center justify-between text-sm text-gray-400">
            <span>Showing {filteredBookings.length} bookings</span>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 border border-gray-800 rounded text-gray-600 cursor-not-allowed bg-gray-900">Previous</button>
              <button disabled className="px-3 py-1 border border-gray-800 rounded text-gray-600 cursor-not-allowed bg-gray-900">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;

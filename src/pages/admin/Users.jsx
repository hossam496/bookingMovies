import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Search, Mail, Phone, Calendar, Shield, Activity, ShieldAlert, CheckCircle, Clock, Trash2, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';

import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:5000';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Wait, in Dashboard we saw it calls /api/auth to get users
      const res = await axios.get(`${API_BASE}/api/auth`);
      const data = res.data?.items || res.data || [];
      const normalized = Array.isArray(data) ? data : [];
      
      setUsers(normalized.reverse());
    } catch (err) {
      console.error('Error fetching users', err);
      Swal.fire('Error', 'Failed to load users data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete account for ${user.name || user.fullName || user.email}? This cannot be undone.`,
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
        await axios.delete(`${API_BASE}/api/auth/${user._id || user.id}`);
        setUsers(prev => prev.filter(u => (u._id || u.id) !== (user._id || user.id)));
        Swal.fire('Deleted!', 'User has been removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete user.', 'error');
      }
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await axios.patch(`${API_BASE}/api/auth/role/${user._id || user.id}`, { role: newRole });
      if (res.data.success) {
        setUsers(prev => prev.map(u => (u._id || u.id) === (user._id || user.id) ? { ...u, role: newRole } : u));
        Swal.fire({
          title: 'Updated!', 
          text: `User promoted to ${newRole}`, 
          icon: 'success',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({title: 'Error', text: 'Failed to update user role.', icon: 'error', background: '#111827', color: '#fff'});
    }
  };


  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role) => {
    const isSpecial = role && role.toLowerCase() === 'admin';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isSpecial ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 'bg-gray-800 text-gray-300 border border-gray-700'
      }`}>
        {isSpecial ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
        {(role || 'User').charAt(0).toUpperCase() + (role || 'User').slice(1)}
      </span>
    );
  };

  const UserIcon = ({ className }) => <UsersIcon className={className} />;

  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const name = (u.name || u.fullName || u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Users</h1>
          <p className="text-gray-400">Manage all registered accounts and their roles.</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm placeholder-gray-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-gray-900 rounded-2xl border border-gray-800 shadow-sm mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 font-medium">Loading user database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-gray-900 rounded-2xl border border-gray-800 shadow-sm mt-6">
          <ShieldAlert className="w-16 h-16 text-gray-700 mb-4" />
          <p className="text-xl font-semibold text-gray-200">No Users Found</p>
          <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredUsers.map((user) => {
            const name = user.name || user.fullName || user.username || 'Unknown User';
            const email = user.email || 'No email provided';
            const joinDate = user.createdAt || user.date 
              ? new Date(user.createdAt || user.date).toLocaleDateString(undefined, { 
                  year: 'numeric', month: 'short', day: 'numeric' 
                }) 
              : 'Unknown Date';
            const id = user._id || user.id || '';
            const isActive = true; // Placeholder for activity status

            return (
              <div key={id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-sm hover:shadow-lg hover:border-gray-700 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-900/50 transform group-hover:-translate-y-1 transition-transform">
                    {getInitials(name)}
                  </div>
                  {getRoleBadge(user.role)}
                </div>
                
                <h3 className="font-bold text-lg text-gray-100 truncate" title={name}>
                  {name}
                </h3>
                
                <div className="space-y-2.5 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="truncate" title={email}>{email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {isActive ? 'Active Now' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(user)}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        user.role === 'admin' 
                          ? 'bg-yellow-900/30 text-yellow-500 hover:bg-yellow-900/50' 
                          : 'bg-green-900/30 text-green-500 hover:bg-green-900/50'
                      }`}
                      title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                    >
                      {user.role === 'admin' ? <UserMinus className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 bg-red-900/30 text-red-500 rounded-lg cursor-pointer hover:bg-red-900/50 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-mono" title={`ID: ${id}`}>
                    #{id.substring(id.length - 6).toUpperCase()}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Users;

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Users, Film, Link as LinkIcon, DollarSign, Activity, PlusCircle, UserCog, ClipboardList } from 'lucide-react';
import { NavLink } from 'react-router-dom';


const API_BASE = 'http://localhost:5000';

const fmtINR = (num) =>
  typeof num === "number"
    ? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "₹0";

const Dashboard = () => {
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setLoading(true);
        const [mRes, bRes, uRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/movies`),
          axios.get(`${API_BASE}/api/bookings`, {
            params: { paymentStatus: "all", limit: 1000 }
          }),
          axios.get(`${API_BASE}/api/auth`)
        ]);

        const normaliseArrayResponse = (r) => {
          if (!r || r.status === "rejected") return [];
          const data = r.value?.data;
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (Array.isArray(data.items)) return data.items;
          if (Array.isArray(data.rows)) return data.rows;
          if (Array.isArray(data.data)) return data.data;
          return [];
        };

        const rawMovies = normaliseArrayResponse(mRes);
        const rawBookings = normaliseArrayResponse(bRes);
        const rawUsers = normaliseArrayResponse(uRes);

        const normMovies = rawMovies.map((m) => ({
          id: m._id || m.id || m.movieId || m.idStr || "",
          title: m.title || m.movieName || m.name || "Untitled",
          basePrice: Number(m.basePrice || m.price || m.ticketPrice || 0) || 0,
        }));

        const normBookings = rawBookings.map((b) => {
          const movieId = b.movieId || (b.movie && (b.movie.id || b.movie._id)) || "";
          const movieTitle = (b.movie && (b.movie.title || b.movie.movieName)) || b.movieName || b.movie || "";
          const totalPaid = Number(b.amountPaise !== undefined && b.amountPaise !== null ? Number(b.amountPaise) / 100 : b.amount || b.total || 0) || 0;
          return {
            id: b._id || b.id || b.bookingId || "",
            movieId,
            movieTitle,
            totalPaid,
            raw: b,
            userId: b.userId || (b.user && (b.user._id || b.user.id)) || b.customerId || "",
            customer: b.customer || b.customerName || (b.user && (b.user.name || b.user.fullName)) || "",
          };
        });

        // Calculate statistics based on paid bookings, but keep others for display if needed
        const paidBookings = normBookings.filter((bk) => {
          const raw = bk.raw || {};
          const ps = (raw.paymentStatus || raw.payment_status || raw.paymentstate || "").toString().toLowerCase();
          const st = (raw.status || "").toString().toLowerCase();
          return ps === "paid" || st === "paid" || ps === "success";
        });

        // For the performance table, we might want to see all bookings or just paid ones.
        // To satisfy the user seeing their data, we'll use all bookings but indicate status if we had a status column.
        // For now, let's include everything in 'bookings' state so they show up in the table, 
        // but we'll sum revenue carefully in the useMemo.
        const allBookings = normBookings;

        const normUsers = rawUsers.map((u) => ({
          id: u._id || u.id || u.userId || "",
          name: u.name || u.fullName || u.username || "",
        }));

        if (!cancelled) {
          setMovies(normMovies);
          setBookings(allBookings); // Show all bookings in the dashboard stats/table
          setUsers(normUsers);
          setLoading(false);
        }
      } catch (err) {
        console.error("dashboard fetch error:", err);
        setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => {
    const totalBookings = bookings.length;
    let totalRevenue = 0;
    for (let i = 0; i < bookings.length; i++) {
        const bk = bookings[i];
        const raw = bk.raw || {};
        const ps = (raw.paymentStatus || raw.payment_status || "").toLowerCase();
        // Only count revenue for paid/success bookings
        if (ps === "paid" || ps === "success") {
            totalRevenue += bk.totalPaid || 0;
        }
    }

    const usersFromApi = new Set(users.map((u) => u.id).filter(Boolean));
    const usersFromBookings = new Set();
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (b.userId) usersFromBookings.add(String(b.userId));
      else if (b.customer) usersFromBookings.add(String(b.customer));
      else if (b.raw && b.raw.email) usersFromBookings.add(String(b.raw.email));
    }
    const totalUsers = usersFromApi.size > 0 ? usersFromApi.size : usersFromBookings.size;

    const totalMovies = movies.length;

    const map = {};
    const movieTitleMap = {};
    for (let i = 0; i < movies.length; i++) {
      if (movies[i].id) {
        movieTitleMap[movies[i].id] = movies[i].title;
        // Pre-initialize map with 0s for all movies
        map[movies[i].id] = { id: movies[i].id, title: movies[i].title, bookings: 0, earnings: 0 };
      }
    }

    for (let i = 0; i < bookings.length; i++) {
      const bk = bookings[i];
      const key = bk.movieId || bk.movieTitle;
      if (!key) continue;

      if (!map[key]) {
        map[key] = { id: key, title: bk.movieTitle || "Unknown", bookings: 0, earnings: 0 };
      }
      map[key].bookings += 1;
      map[key].earnings += bk.totalPaid || 0;
    }

    const movieStats = Object.values(map).sort((a, b) => b.bookings - a.bookings);
    return { totalBookings, totalRevenue, totalUsers, totalMovies, movieStats };
  }, [movies, bookings, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Activity className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-100">Dashboard Overview</h1>
        <p className="text-gray-400">Summary of revenue, bookings, and user activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-gray-700 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{fmtINR(summary.totalRevenue)}</p>
          </div>
          <div className="p-4 bg-green-900/20 rounded-xl border border-green-900/30">
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-gray-700 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{summary.totalBookings}</p>
          </div>
          <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-900/30">
            <Film className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-gray-700 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-400">Active Users</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{summary.totalUsers}</p>
          </div>
          <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-900/30">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        {/* Added Total Movies card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-gray-700 transition-colors md:col-span-3 lg:col-span-1">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Movies</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{summary.totalMovies}</p>
          </div>
          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-900/50">
            <LinkIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Activity className="w-32 h-32 text-blue-600" />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Control Center
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NavLink to="/admin/movies" onClick={() => {}} className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all group">
              <div className="p-3 bg-blue-600/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-100">Add New Movie</p>
                <p className="text-xs text-gray-400">Expand your library</p>
              </div>
            </NavLink>

            <NavLink to="/admin/users" className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all group">
              <div className="p-3 bg-blue-600/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-100">Manage Users</p>
                <p className="text-xs text-gray-400">Roles and accounts</p>
              </div>
            </NavLink>

            <NavLink to="/admin/bookings" className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-purple-600/20 border border-gray-700 hover:border-purple-500/50 rounded-xl transition-all group">
              <div className="p-3 bg-purple-600/10 text-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-100">Booking Reports</p>
                <p className="text-xs text-gray-400">View latest sales</p>
              </div>
            </NavLink>
          </div>
        </div>
      </div>


      <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 mt-8 overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-lg font-semibold text-gray-100">Movie Performance Stats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 text-gray-400 text-sm border-b border-gray-800">
                <th className="py-4 px-6 font-medium">Movie Title</th>
                <th className="py-4 px-6 font-medium text-center">Total Bookings</th>
                <th className="py-4 px-6 font-medium text-right">Total Earnings</th>
                <th className="py-4 px-6 font-medium text-right">Avg. Per Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {summary.movieStats.map((m) => {
                const avg = m.bookings ? Math.round(m.earnings / m.bookings) : 0;
                return (
                  <tr key={m.id} className="hover:bg-gray-800/60 even:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-200">{m.title}</td>
                    <td className="py-4 px-6 text-center text-gray-400">{m.bookings}</td>
                    <td className="py-4 px-6 text-right font-medium text-green-400">{fmtINR(m.earnings)}</td>
                    <td className="py-4 px-6 text-right text-gray-500">{fmtINR(avg)}</td>
                  </tr>
                );
              })}
              {summary.movieStats.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">No movie data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

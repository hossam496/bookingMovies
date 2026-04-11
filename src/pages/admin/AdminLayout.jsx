import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Film, Ticket, Users, LogOut, Menu, X, UserCircle, Globe } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cine_auth");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("cine_user_email");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Movies", path: "/admin/movies", icon: Film },
    { name: "Bookings", path: "/admin/bookings", icon: Ticket },
    { name: "Users", path: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden text-gray-100">
      {/* Sidebar / Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-950 text-white transform transition-transform duration-300 ease-in-out border-r border-gray-800 lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-black border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Film className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold tracking-wider">CINEVERSE</span>
          </div>
          <button 
            className="p-1 lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col flex-1 pb-4 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
          
          <div className="px-4 mt-auto border-t border-gray-800 pt-4">
            <a 
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">View Site</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-4 bg-black border-b border-gray-800 lg:px-6">
          <div className="flex items-center">
            <button 
              className="p-2 mr-4 text-gray-400 rounded-lg lg:hidden hover:bg-gray-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold sm:text-2xl text-gray-100 placeholder-opacity-90 tracking-wide">
              Admin <span className="text-blue-500">Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCircle className="w-8 h-8 text-gray-500" />
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-300">Administrator</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-950/30 hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-900/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

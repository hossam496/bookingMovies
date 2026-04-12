import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Movie from "./pages/Movie";
import Release from "./pages/Release";
import Bookings from "./pages/Bookings";
import Contact from "./pages/Contact";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatSelector from "./pages/SeatSelctor";
import VerifyPaymentPage from "../VerifyPaymentPage";

// Admin Imports
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminMovies from "./pages/admin/Movies";
import AdminBookings from "./pages/admin/Bookings";
import AdminUsers from "./pages/admin/Users";

/**
 * ScrollToTop component:
 * - Forces an immediate jump to the very top on every navigation.
 * - If URL has a hash, it will try to jump to that element (also immediately).
 * - Disables browser's automatic scroll restoration to avoid the browser restoring previous positions.
 */
function ScrollToTop() {
  const location = useLocation();

  // Debug: log navigation
  useEffect(() => {
    console.log('📍 Navigation to:', location.pathname);
    console.log('🎬 Movie ID from URL:', location.pathname.match(/\/movie\/([^/]+)/)?.[1]);
  }, [location]);

  // Disable browser auto scroll restoration (do once)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      try {
        window.history.scrollRestoration = "manual";
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // If there's a hash (e.g. /page#section), try to jump to that element
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el =
        document.getElementById(id) || document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({
          behavior: "auto",
          block: "start",
          inline: "nearest",
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        return;
      }
    }

    // Force immediate top-of-page
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function App() {
  // Ensure no horizontal overflow on the root document (defensive)
  useEffect(() => {
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;

    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    return () => {
      // restore previous values just in case other scripts rely on them
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      document.body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/movies" element={<Movie />} />
          <Route path="/releases" element={<Release />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/contact" element={<Contact />} />

          {/* صفحة تفاصيل الفيلم - مسار واحد موحد */}
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          
          {/* صفحة اختيار المقاعد - مسار واحد موحد */}
          <Route
            path="/movie/:id/seat-selector/:slot"
            element={<SeatSelector />}
          />
          
          {/* مسار احتياطي للتوافق */}
          <Route
            path="/movies/:id/seat-selector/:slot"
            element={<SeatSelector />}
          />
          <Route path="/success" element={<VerifyPaymentPage/>}/>
          <Route path="/cancel" element={<VerifyPaymentPage/>}/>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
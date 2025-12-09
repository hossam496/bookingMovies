import React, { useEffect, useState, useRef } from 'react'
import { navbarCSS, navbarStyles } from "../assets/dummyStyles"
import { Calendar, Clapperboard, Home, Film, Mail, Ticket, LogOut, User, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Read auth stat from local storage
  const readAuthFromStorage = () => {
    const json = localStorage.getItem('cine_auth');
    if (json) {
      try {
        const parsed = JSON.parse(json);
        setIsLoggedIn(Boolean(parsed.isLoggedIn));
        setUserEmail(parsed?.email || "");
        return;
      } catch (err) {}
    }

    const simpleFlag = localStorage.getItem('isloggedin');
    const email = localStorage.getItem('userEmail') || localStorage.getItem('cine_user_email');
    if (simpleFlag === "true") {
      setIsLoggedIn(true);
      setUserEmail(email || "");
      return;
    }

    if (email) {
      setIsLoggedIn(true);
      setUserEmail(email);
      return;
    }

    setIsLoggedIn(false);
    setUserEmail("");
  };

  useEffect(() => {
    readAuthFromStorage();

    const onStorage = (e) => {
      if (["cine_auth", "isLoggedIn", "userEmail", "cine_user_email"].includes(e.key)) {
        readAuthFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('cine_auth');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('cine_user_email');
    setIsLoggedIn(false);
    setUserEmail("");
    window.location.href = '/login';
  };

  const navItems = [
    { id: "home", label: "Home", Icon: Home, path: "/" },
    { id: "movies", label: "Movies", Icon: Film, path: "/movies" },
    { id: "releases", label: "Releases", Icon: Calendar, path: "/releases" },
    { id: "contact", label: "Contact", Icon: Mail, path: "/contact" },
    { id: "bookings", label: "Bookings", Icon: Ticket, path: "/bookings" }
  ];

  return (
    <nav className={`${navbarStyles.nav.base} ${
      isScrolled ? navbarStyles.nav.scrolled : navbarStyles.nav.notScrolled
    }`}>
      <div className={navbarStyles.container}>
        <div className={navbarStyles.logoContainer}>
          <div className={navbarStyles.logoIconContainer}>
            <Clapperboard className={navbarStyles.logoIcon} />
          </div>
          <div className={navbarStyles.logoText}>CineVerse</div>
        </div>
        
        <div className={navbarStyles.desktopNav}>
          <div className={navbarStyles.desktopNavItems}>
            {navItems.map((item) => {
              const IconComponent = item.Icon;
              return (
                <div key={item.id} className={navbarStyles.desktopNavItem}>
                  <NavLink 
                    to={item.path} 
                    end 
                    className={({ isActive }) =>
                      `${navbarStyles.desktopNavLink.base} ${
                        isActive ? navbarStyles.desktopNavLink.active : navbarStyles.desktopNavLink.inactive
                      }`
                    }
                  >
                    <IconComponent className={navbarStyles.desktopNavIcon} />
                    <span>{item.label}</span>
                    <div className="pill-underline"></div>
                  </NavLink>
                  <span className="pill-border"></span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={navbarStyles.rightSection}>
          <div className={navbarStyles.tabletNav}>
            {navItems.map((item) => {
              const IconComponent = item.Icon;
              return (
                <NavLink 
                  key={item.id} 
                  to={item.path} 
                  end 
                  className={({ isActive }) =>
                    `${navbarStyles.tabletNavLink.base} ${
                      isActive ? navbarStyles.tabletNavLink.active : navbarStyles.tabletNavLink.inactive
                    }`
                  }
                >
                  <IconComponent className={navbarStyles.tabletNavIcon} />
                  <span className={navbarStyles.tabletNavText}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* Auth section */}
          <div className={navbarStyles.authSection}>
            <div className={navbarStyles.desktopAuth}>
              {isLoggedIn ? (
                <button
                  title={userEmail || "Logout"}
                  onClick={handleLogout}
                  className={navbarStyles.logoutButton}
                >
                  <LogOut className={navbarStyles.authIcon} />
                  <span>Log out</span>
                </button>
              ) : (
                <NavLink to="/login" className={navbarStyles.loginButton}>
                  <User className={navbarStyles.authIcon} />
                  <span>Login</span>
                </NavLink>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className={navbarStyles.mobileMenuToggle}>
              <button 
                onClick={() => setIsMenuOpen((s) => !s)}
                className={navbarStyles.mobileMenuButton}
              >
                {isMenuOpen ? (
                  <X className={navbarStyles.mobileMenuIcon} />
                ) : (
                  <Menu className={navbarStyles.mobileMenuIcon} />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div ref={menuRef} className={navbarStyles.mobileMenuPanel}>
            {navItems.map((item) => {
              const IconComponent = item.Icon;
              return (
                <NavLink 
                  key={item.id} 
                  to={item.path} 
                  end 
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `${navbarStyles.mobileNavLink.base} ${
                      isActive ? navbarStyles.mobileNavLink.active : navbarStyles.mobileNavLink.inactive
                    }`
                  }
                >
                  <IconComponent className={navbarStyles.mobileNavIcon} />
                  <span className={navbarStyles.mobileNavText}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
            <div className= {navbarStyles.mobileAuthSection}>
              {isLoggedIn ? (
                <button onClick={() => {
                  setIsMenuOpen (false);
                  handleLogout();
                }} className= {navbarStyles.mobileLogoutButton}>
                  <LogOut className= {navbarStyles.mobileAuthIcon} />
                  Logout
                </button>
              ) : (
                <a href="/login" className= {navbarStyles.mobileLoginButton} onClick={() => setIsMenuOpen(false)}>
                  <User className= {navbarStyles.mobileAuthIcon} />
                  Login
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <style jsx>{navbarCSS}</style>
    </nav>
  );
}

export default Navbar;
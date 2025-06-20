import React, { useState, useEffect, useLayoutEffect } from 'react'; // Added useLayoutEffect
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { useAuth } from '../store/authContext';
import Sidebar from '../components/common/Sidebar';
import styles from './MainLayout.module.css';
import { FaBars as MobileMenuIcon } from 'react-icons/fa'; // Icon for mobile toggle

const Footer = () => {
  return (
    <footer className={styles.appFooter}>
      © {new Date().getFullYear()} Payroll App. All rights reserved.
    </footer>
  );
};

const MainLayout = () => {
  const { isAuthenticated, userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // For closing mobile sidebar on route change

  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTabletView, setIsTabletView] = useState(false); // Initialize based on initial check
  const [isMobileView, setIsMobileView] = useState(false); // Initialize based on initial check


  // Hook to update view type on resize
  useLayoutEffect(() => {
    const updateViewModes = () => {
      const currentIsMobile = window.innerWidth <= 767;
      const currentIsTablet = window.innerWidth <= 991 && window.innerWidth > 767;

      if (currentIsMobile !== isMobileView) {
        setIsMobileView(currentIsMobile);
      }
      if (currentIsTablet !== isTabletView) {
        setIsTabletView(currentIsTablet);
        if (currentIsTablet) { // Entering Tablet view
            setIsDesktopSidebarCollapsed(true);
        } else if (!currentIsMobile && isDesktopSidebarCollapsed) {
            // Optional: If leaving tablet UP to desktop, and it was collapsed, un-collapse it?
            // For now, it stays collapsed unless user expands.
        }
      }

      // Close mobile sidebar if screen becomes too large for it
      if (!currentIsMobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', updateViewModes);
    updateViewModes(); // Initial check
    return () => window.removeEventListener('resize', updateViewModes);
  }, [isMobileView, isTabletView, isMobileSidebarOpen]); // Added dependencies


  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname]);


  const handleDesktopSidebarToggle = (collapsedStateFromSidebar) => {
    setIsDesktopSidebarCollapsed(collapsedStateFromSidebar);
  };

  const handleMobileSidebarToggle = (openState) => {
    setIsMobileSidebarOpen(typeof openState === 'boolean' ? openState : !isMobileSidebarOpen);
  };

  const sidebarTheme = 'dark';

  const handleLogout = () => {
    logout(); // This is from useAuth()
    navigate('/login'); // This is from useNavigate()
  };

  let mainContentClass = styles.mainContent;
  if (isAuthenticated) {
    if (isMobileView) { // Check isMobileView state
      mainContentClass = `${styles.mainContent} ${styles.contentNoShiftMobile}`;
    } else { // Desktop or Tablet
      mainContentClass = `${styles.mainContent} ${isDesktopSidebarCollapsed ? styles.contentShiftCollapsed : styles.contentShiftExpanded}`;
    }
  } else {
    mainContentClass = `${styles.mainContent} ${styles.contentNoSidebar}`;
  }


  return (
    <div className={`${styles.mainLayout} ${isMobileSidebarOpen ? styles.mobileSidebarActive : ''}`}>
      <nav className={`navbar navbar-expand-lg navbar-light bg-light ${styles.appNavbar}`}>
        <div className="container-fluid">
          {/* Mobile Sidebar Toggle - visible only on small screens */}
          {isAuthenticated && isMobileView && ( // Check isMobileView state
            <button
              className={`${styles.mobileSidebarToggle} d-lg-none`} // d-lg-none hides on large screens and up
              onClick={() => handleMobileSidebarToggle()}
              aria-label="Open navigation menu"
              aria-expanded={isMobileSidebarOpen}
              aria-controls="appSidebar" // Point to sidebar ID if it has one
            >
              <MobileMenuIcon />
            </button>
          )}
          <Link className="navbar-brand" to="/">{isAuthenticated && isMobileView ? '' : 'Payroll App'}</Link> {/* Hide brand on mobile if toggle is there to save space */}

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavMain" aria-controls="navbarNavMain" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNavMain">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {isAuthenticated && userInfo && (
                <>
                  {/* <li className="nav-item"><Link className="nav-link" to="/messages">Messages</Link></li> */}
                </>
              )}
            </ul>
             {!isAuthenticated && ( // Show only if not authenticated
              <>
                <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
                <Link className="btn btn-primary" to="/register-company">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className={styles.contentWrapper}>
        {isAuthenticated && (
          <Sidebar
            id="appSidebar" // Added ID for aria-controls
            theme={sidebarTheme}
            onDesktopToggle={handleDesktopSidebarToggle}
            initialDesktopCollapsed={isTabletView || isDesktopSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={handleMobileSidebarToggle}
            onLogoutClick={handleLogout} // Add this line
            userInfo={userInfo} // Add this line
          />
        )}
        <main className={mainContentClass}>
          <Outlet />
        </main>
      </div>
      {/* Backdrop is now part of Sidebar.jsx and controlled there */}
      <Footer />
    </div>
  );
};

export default MainLayout;

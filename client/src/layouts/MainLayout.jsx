import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext'; // Adjust path if necessary

// Basic Footer component (can be enhanced or moved later)
const Footer = () => {
  return (
    <footer className="bg-dark text-white text-center p-4 mt-auto">
      © {new Date().getFullYear()} Payroll App. All rights reserved.
    </footer>
  );
};

const MainLayout = () => {
  const { isAuthenticated, userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Updated outer div to be a flex column for Navbar, Main Content, Footer
    <div className="d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom"> {/* Added border-bottom for subtle separation */}
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Payroll App</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {isAuthenticated && userInfo && ( // Show links if user is logged in and userInfo is available
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/">Home</Link>
                  </li>
                  {/* Messages link for all authenticated users */}
                  <li className="nav-item">
                    <Link className="nav-link" to="/messages">Messages</Link>
                  </li>
                  {/* Employee specific links */}
                  {userInfo.role === 'employee' && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/my-paystubs">My Paystubs</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/my-benefits">My Benefits</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/help">Help</Link>
                      </li>
                    </>
                  )}
                  { userInfo.role !== 'employee' && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/employees">Employees</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/departments">Departments</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/payrolls">Payrolls</Link>
                      </li>
                    </>
                  )}
                  {/* Add other links based on roles if needed, e.g., Income Grades, Payroll Ops */}
                  {/* Ensure userInfo is checked before accessing its properties */}
                  {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && (
                     <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownOps" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Operations
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="navbarDropdownOps">
                            <li><Link className="dropdown-item" to="/income-grades">Income Grades</Link></li>
                            <li><Link className="dropdown-item" to="/payroll-ops/advances">Advances</Link></li>
                            {/* Add other ops links here */}
                        </ul>
                    </li>
                  )}
                  {/* Settings link for all authenticated users */}
                  <li className="nav-item">
                    <Link className="nav-link" to="/settings">Settings</Link>
                  </li>
                </>
              )}
            </ul>
            {isAuthenticated ? (
              null // Logout button removed, alternative is on Settings page
            ) : (
              <>
                <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
                <Link className="btn btn-primary" to="/register-company">Register Company</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Wrapper for main content and footer, to grow and push footer down */}
      <div className="d-flex flex-column flex-grow-1">
        <main className="flex-grow-1 p-4">
          <Outlet /> {/* This renders the actual page content */}
        </main>
        <Footer /> {/* Footer component */}
      </div>
    </div>
  );
};

export default MainLayout;

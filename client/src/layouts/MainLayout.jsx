import React from 'react';
import { Outlet } from 'react-router-dom';

// Basic Footer component (can be enhanced or moved later)
const Footer = () => {
  return (
    <footer className="bg-dark text-white text-center p-4 mt-auto">
      © {new Date().getFullYear()} My App. All rights reserved.
    </footer>
  );
};

const MainLayout = () => {
  return (
    <div className="d-flex min-vh-100 bg-light"> {/* Main container for flex layout */}

      <div className="d-flex flex-column flex-grow-1"> {/* Wrapper for main content and footer */}
        {/* Main content area */}
        <main className="flex-grow-1 p-4">
          {/*
            md:ml-52 assumes sidebar width is w-52 (208px).
            This pushes content to the right of the static sidebar on md screens and up.
            On small screens, sidebar is an overlay, so no margin needed here due to md prefix.
          */}
          <Outlet /> {/* This renders the actual page content */}
        </main>
        <Footer /> {/* Footer component */}
      </div>
    </div>
  );
};

export default MainLayout;

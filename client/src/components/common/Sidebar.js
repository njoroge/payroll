import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

// Defined navigation items
const actualNavigationItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Manage Employees', path: '/employees' },
  { name: 'Process Payroll', path: '/payrolls/run' },
  { name: 'Reports', path: '/payrolls' }, // Using /payrolls as decided
];

// Placeholder for an icon (e.g., Hamburger menu)
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Sidebar = ({ items = actualNavigationItems }) => {
  const [isOpen, setIsOpen] = useState(false); // Hidden by default on small screens

  return (
    <>
      {/* Toggle button for small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-700 fixed top-4 left-4 z-20 bg-white rounded-md shadow" // Basic styling
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white w-52 min-h-screen fixed top-0 left-0 z-10 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:block flex flex-col`} // Added flex flex-col
      >
        {/* Sidebar Header */}
        <div className="p-4 py-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-center text-white">My App</h1> {/* Centered Title */}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto"> {/* Added flex-1 and overflow-y-auto for scrollable nav */}
          <ul> {/* Removed mb-2 from li, as space-y handles it on parent nav */}
            {items.map((item) => (
              <li key={item.name}> {/* Removed mb-2 from here */}
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-150 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`
                  }
                  onClick={() => {if (window.innerWidth < 768) setIsOpen(false);}} // Close sidebar on link click on small screens
                >
                  {/* Add a placeholder for icons later if needed */}
                  {/* <span className="mr-3 w-5 h-5">ICON</span> */}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Optional: Sidebar Footer (e.g., settings, user profile snippet) */}
        {/* <div className="p-4 border-t border-gray-700 mt-auto"> {/* mt-auto to push to bottom if sidebar is flex flex-col */}
        {/*  <p className="text-sm text-gray-400 text-center">© 2024</p> */}
        {/* </div> */}
      </aside>
    </>
  );
};

export default Sidebar;

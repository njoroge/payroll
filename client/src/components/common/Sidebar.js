import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const actualNavigationItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Manage Employees', path: '/employees' },
  { name: 'Process Payroll', path: '/payrolls/run' },
  { name: 'Reports', path: '/payrolls' },
];

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button for small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-700 fixed top-4 left-4 z-20 bg-white rounded-md shadow"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white w-52 min-h-screen fixed top-0 left-0 z-10 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:flex flex-col`} // md:flex to enable flex col for children
      >
        {/* Sidebar Header */}
        <div className="p-4 py-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-center text-white">My App</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <ul>
            {items.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-150 ${
                      isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'
                    }`
                  }
                  onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
                >
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

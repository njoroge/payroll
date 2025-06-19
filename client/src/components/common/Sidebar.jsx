// client/src/components/common/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
  FaBars, FaTachometerAlt, FaFileInvoiceDollar, FaUsers, FaChartBar, FaCog, FaQuestionCircle, FaSignOutAlt, FaUserCircle, FaAngleDown, FaAngleRight, FaTimes
} from 'react-icons/fa';

const navItems = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: <FaTachometerAlt />,
    path: '/',
  },
  {
    id: 'payrollProcessing',
    text: 'Payroll Processing',
    icon: <FaFileInvoiceDollar />,
    path: '/payrolls',
    subItems: [
      { id: 'runPayroll', text: 'Run Payroll', path: '/payrolls/run', icon: <FaAngleRight className={styles.submenuIcon} /> },
      { id: 'payrollHistory', text: 'Payroll History', path: '/payrolls', icon: <FaAngleRight className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'employeeManagement',
    text: 'Employee Management',
    icon: <FaUsers />,
    path: '/employees',
    subItems: [
      { id: 'employeeList', text: 'Employee List', path: '/employees', icon: <FaAngleRight className={styles.submenuIcon} /> },
      { id: 'addEmployee', text: 'Add Employee', path: '/employees/new', icon: <FaAngleRight className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'reportsAnalytics',
    text: 'Reports & Analytics',
    icon: <FaChartBar />,
    path: '/reports',
  },
  {
    id: 'configurationAdmin',
    text: 'Configuration',
    icon: <FaCog />,
    path: '/settings',
    subItems: [
      { id: 'departments', text: 'Departments', path: '/departments', icon: <FaAngleRight className={styles.submenuIcon} /> },
      { id: 'incomeGrades', text: 'Income Grades', path: '/income-grades', icon: <FaAngleRight className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'supportResources',
    text: 'Support & Resources',
    icon: <FaQuestionCircle />,
    path: '/help',
  },
];

const Sidebar = ({ theme = 'dark', onDesktopToggle, initialDesktopCollapsed = false, isMobileOpen = false, onMobileToggle }) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(initialDesktopCollapsed);
  const [openAccordionSubmenu, setOpenAccordionSubmenu] = useState(null); // For accordion
  const [hoveredFlyoutParentId, setHoveredFlyoutParentId] = useState(null); // For flyout
  const location = useLocation();
  const sidebarRef = useRef(null);
  const flyoutTimeoutRef = useRef(null); // Ref for flyout close delay

  useEffect(() => {
    setIsDesktopCollapsed(initialDesktopCollapsed);
    if (initialDesktopCollapsed) {
        setOpenAccordionSubmenu(null);
    }
  }, [initialDesktopCollapsed]);

  const handleDesktopCollapseToggle = () => {
    const newCollapsedState = !isDesktopCollapsed;
    setIsDesktopCollapsed(newCollapsedState);
    if (newCollapsedState) {
      setOpenAccordionSubmenu(null);
      setHoveredFlyoutParentId(null); // Close flyouts too
    }
    if (onDesktopToggle) {
      onDesktopToggle(newCollapsedState);
    }
    // Focus logic can be added here if needed
  };

  useEffect(() => { // Close mobile sidebar on navigation
    if (isMobileOpen && location.pathname) { // Check onMobileToggle existence before calling
        if (onMobileToggle) onMobileToggle(false);
        setOpenAccordionSubmenu(null);
    }
  }, [location.pathname, isMobileOpen]); // Removed onMobileToggle from deps

  const handleAccordionSubmenuToggle = (id) => {
    if (!isDesktopCollapsed || isMobileOpen) {
      setOpenAccordionSubmenu(openAccordionSubmenu === id ? null : id);
    }
  };

  const handleFlyoutMouseEnter = (id) => {
    if (isDesktopCollapsed && !isMobileOpen) {
      clearTimeout(flyoutTimeoutRef.current);
      setHoveredFlyoutParentId(id);
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (isDesktopCollapsed && !isMobileOpen) {
      flyoutTimeoutRef.current = setTimeout(() => {
        setHoveredFlyoutParentId(null);
      }, 200);
    }
  };

  const currentIsEffectivelyCollapsed = isDesktopCollapsed && !isMobileOpen;

  const renderNavItems = (items) => {
    return items.map((item) => {
      const { id, text, icon, path, subItems } = item;
      const isParentActive = location.pathname.startsWith(path) && path !== '/';
      const isExactlyActive = location.pathname === path;
      let itemIsActive = isExactlyActive;
      if (subItems && !itemIsActive) {
        itemIsActive = subItems.some(sub => location.pathname === sub.path);
      }

      const isAccordionSubmenuOpen = openAccordionSubmenu === id && (!isDesktopCollapsed || isMobileOpen);
      const isFlyoutSubmenuVisible = hoveredFlyoutParentId === id && currentIsEffectivelyCollapsed;

      return (
        <li
          key={id}
          className={`${styles.navItem} ${itemIsActive ? styles.activeParent : ''}`}
          title={currentIsEffectivelyCollapsed && !isFlyoutSubmenuVisible ? text : undefined}
          role="none"
          onMouseEnter={() => subItems && handleFlyoutMouseEnter(id)}
          onMouseLeave={() => subItems && handleFlyoutMouseLeave()}
        >
          {subItems ? (
            <>
              <div
                className={`${styles.navLink} ${(isAccordionSubmenuOpen || isFlyoutSubmenuVisible) ? styles.submenuOpen : ''}`}
                onClick={() => handleAccordionSubmenuToggle(id)}
                role="menuitem"
                tabIndex={0}
                onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleAccordionSubmenuToggle(id)}
                aria-expanded={isAccordionSubmenuOpen || isFlyoutSubmenuVisible}
                aria-controls={`submenu-${id}`}
                aria-haspopup="true"
              >
                <span className={styles.icon}>{icon}</span>
                {(!currentIsEffectivelyCollapsed || isMobileOpen) && <span className={styles.text}>{text}</span>}
                {(!currentIsEffectivelyCollapsed || isMobileOpen) && subItems && (
                  <span className={styles.submenuArrow} aria-hidden="true">
                    {isAccordionSubmenuOpen ? <FaAngleDown /> : <FaAngleRight />}
                  </span>
                )}
              </div>

              {((isAccordionSubmenuOpen && (!isDesktopCollapsed || isMobileOpen)) || isFlyoutSubmenuVisible) && (
                <ul
                  id={`submenu-${id}`}
                  className={`
                    ${styles.submenu}
                    ${isFlyoutSubmenuVisible ? styles.flyoutActive : ''}
                    ${isAccordionSubmenuOpen ? styles.accordionActive : ''}
                  `}
                  role="menu"
                  aria-label={`${text} submenu`}
                  onMouseEnter={() => isFlyoutSubmenuVisible && clearTimeout(flyoutTimeoutRef.current)}
                  onMouseLeave={() => isFlyoutSubmenuVisible && handleFlyoutMouseLeave()}
                >
                  {subItems.map((subItem) => {
                    const isSubActive = location.pathname === subItem.path;
                    return (
                      <li key={subItem.id} className={`${styles.submenuItem} ${isSubActive ? styles.active : ''}`} role="none">
                        <Link
                          to={subItem.path}
                          className={styles.navLink}
                          role="menuitem"
                          onClick={() => {
                            if (isMobileOpen && onMobileToggle) onMobileToggle(false);
                            setHoveredFlyoutParentId(null);
                          }}
                        >
                          <span className={styles.icon}>{subItem.icon}</span>
                          <span className={styles.text}>{subItem.text}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <Link
              to={path}
              className={`${styles.navLink} ${itemIsActive ? styles.active : ''}`}
              title={currentIsEffectivelyCollapsed ? text : undefined}
              role="menuitem"
              onClick={() => {
                if (isMobileOpen && onMobileToggle) onMobileToggle(false);
                setHoveredFlyoutParentId(null);
              }}
            >
              <span className={styles.icon}>{icon}</span>
              {(!currentIsEffectivelyCollapsed || isMobileOpen) && <span className={styles.text}>{text}</span>}
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <>
      {isMobileOpen && <div className={styles.backdropActive} onClick={() => onMobileToggle && onMobileToggle(false)} />}
      <div
        ref={sidebarRef}
        className={`
          ${styles.sidebar}
          ${theme === 'dark' ? styles.darkTheme : styles.lightTheme}
          ${isMobileOpen ? styles.mobileOpen : (isDesktopCollapsed ? styles.desktopCollapsed : styles.desktopExpanded)}
        `}
        tabIndex={-1}
        aria-hidden={isMobileOpen ? 'false' : (isDesktopCollapsed && typeof window !== 'undefined' && window.innerWidth <= 767 ? 'true' : 'false')}
      >
        <button
          onClick={handleDesktopCollapseToggle}
          className={`${styles.toggleButton} ${styles.desktopToggle}`}
          aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isDesktopCollapsed}
          title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isDesktopCollapsed ? <FaBars /> : <FaTimes />}
        </button>
        {isMobileOpen && (
            <button onClick={() => onMobileToggle && onMobileToggle(false)}
                className={`${styles.toggleButton} ${styles.mobileCloseButton}`}
                aria-label="Close sidebar"> <FaTimes />
            </button>
        )}
        <nav className={styles.navigation} aria-label="Main navigation">
          <ul className={styles.navList} role="menu"> {renderNavItems(navItems)} </ul>
        </nav>
        <div className={styles.userProfile} title={currentIsEffectivelyCollapsed && !hoveredFlyoutParentId && !isMobileOpen ? "User Menu" : undefined} role="none">
          <div className={styles.avatarContainer}>
              <FaUserCircle size={(currentIsEffectivelyCollapsed && !isMobileOpen) ? 30 : 36} />
          </div>
          {(!currentIsEffectivelyCollapsed || isMobileOpen) && (
            <div className={styles.userDetails}>
              <p className={styles.userName} title="User Name">User Name</p>
              <Link to="#" onClick={() => {alert('Logout clicked!'); if(isMobileOpen && onMobileToggle) onMobileToggle(false); setHoveredFlyoutParentId(null);}} className={styles.logoutLink} role="menuitem">
                <FaSignOutAlt className={styles.icon} /> <span className={styles.text}>Logout</span>
              </Link>
            </div>
          )}
           {(currentIsEffectivelyCollapsed && !isMobileOpen) && (
              <Link to="#" onClick={() => {alert('Logout clicked!'); setHoveredFlyoutParentId(null);}} className={styles.logoutLink} title="Logout" role="menuitem">
                <FaSignOutAlt className={styles.icon} />
              </Link>
            )}
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark']),
  onDesktopToggle: PropTypes.func,
  initialDesktopCollapsed: PropTypes.bool,
  isMobileOpen: PropTypes.bool,
  onMobileToggle: PropTypes.func,
};
export default Sidebar;

// client/src/components/common/Sidebar.jsx
import React, { useState, useEffect, useRef, useContext } from 'react'; // Added useContext
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
  FaBars, FaTachometerAlt, FaFileInvoiceDollar, FaUsers, FaChartBar, FaCog, FaQuestionCircle, FaSignOutAlt, FaUserCircle, FaAngleDown, FaAngleRight, FaTimes, FaHistory, FaComments, FaEnvelope, FaUserCheck, FaMoneyBillWave, FaLeaf, FaFileContract, FaCalendarAlt, FaIdCard, FaPrint, FaPlusSquare, FaListAlt
} from 'react-icons/fa'; // Added FaPlusSquare and FaListAlt for leave icons

// This will be populated by getSidebarNavItemsFromRoles or similar logic later
// const navItems = [ // This static navItems array will be replaced or augmented
// Default navItems structure - this can be merged with role-based items
const baseNavItems = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: <FaTachometerAlt />,
    path: '/',
  },
  {
    id: 'employeeSelfService',
    text: 'Employee Self Service',
    icon: <FaUserCheck />,
    path: '/my-personal-info', // Default path for the parent item
    // Sub-items for employeeSelfService will be dynamically added based on role, including new leave links
    subItems: [
      { id: 'myPaystubs', text: 'Paystubs', path: '/my-paystubs', icon: <FaMoneyBillWave className={styles.submenuIcon} />, roles: ['employee'] },
      { id: 'myBenefits', text: 'Benefits', path: '/my-benefits', icon: <FaLeaf className={styles.submenuIcon} />, roles: ['employee'] },
      { id: 'myTaxForms', text: 'Tax Forms', path: '/my-tax-forms', icon: <FaFileContract className={styles.submenuIcon} />, roles: ['employee'] },
      // { id: 'myLeave', text: 'Leave', path: '/my-leave', icon: <FaCalendarAlt className={styles.submenuIcon} />, roles: ['employee'] }, // Original single leave link
      { id: 'requestLeave', text: 'Request Leave', path: '/my-leave-request', icon: <FaPlusSquare className={styles.submenuIcon} />, roles: ['employee'] },
      { id: 'myLeaveHistory', text: 'My Leave History', path: '/my-leave-history', icon: <FaListAlt className={styles.submenuIcon} />, roles: ['employee'] },
      { id: 'myPersonalInfo', text: 'Personal Information', path: '/my-personal-info', icon: <FaIdCard className={styles.submenuIcon} />, roles: ['employee'] },
    ],
    roles: ['employee'] // Parent item also needs role check if all sub-items are for 'employee'
  },
  {
    id: 'payrollProcessing',
    text: 'Payroll Processing',
    icon: <FaFileInvoiceDollar />,
    path: '/payrolls',
    roles: ['company_admin', 'employee_admin', 'hr_manager'],
    subItems: [
      { id: 'runPayroll', text: 'Run Payroll', path: '/payrolls/run', icon: <FaAngleRight className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'employeeManagement',
    text: 'Employee Management',
    icon: <FaUsers />,
    path: '/employees',
    roles: ['company_admin', 'employee_admin', 'hr_manager'],
    subItems: [
      { id: 'employeeList', text: 'Employee List', path: '/employees', icon: <FaAngleRight className={styles.submenuIcon} /> },
      { id: 'addEmployee', text: 'Add Employee', path: '/employees/new', icon: <FaAngleRight className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'reportsAnalytics',
    text: 'Reports & Analytics',
    icon: <FaChartBar />,
    path: '/reports', // This path might need to be adjusted if it's a parent now
    subItems: [
      { id: 'payrollHistoryReport', text: 'Payroll History', path: '/payrolls', icon: <FaHistory className={styles.submenuIcon} />, roles: ['company_admin', 'employee_admin', 'hr_manager'] },
      { id: 'myPayslipReport', text: 'My Payslip Report', path: '/reports/my-payslips', icon: <FaPrint className={styles.submenuIcon} /> }
    ],
  },
  {
    id: 'communication',
    text: 'Communication',
    icon: <FaComments />,
    path: '/communication', // Define a base path, can be adjusted later
    subItems: [
      { id: 'messages', text: 'Messages', path: '/messages', icon: <FaEnvelope className={styles.submenuIcon} /> },
    ],
  },
  {
    id: 'configurationAdmin',
    text: 'Configuration',
    icon: <FaCog />,
    path: '/settings',
    roles: ['company_admin', 'employee_admin', 'hr_manager'],
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

// Defaulting theme prop to 'light' as a safeguard, though MainLayout should always pass 'light'.
const Sidebar = ({ theme = 'light', onDesktopToggle, initialDesktopCollapsed = false, isMobileOpen = false, onMobileToggle, onLogoutClick, userInfo, navItems: propNavItems }) => { // Added navItems prop
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

  const renderNavItems = (itemsToRender) => { // itemsToRender will be the merged list
    // userInfo is available from Sidebar component's props
    return itemsToRender
      .filter(item => {
        // If item has roles, check if userInfo.role is one of them
        if (item.roles && Array.isArray(item.roles)) {
          return userInfo && userInfo.role && item.roles.includes(userInfo.role);
        }
        // If item has no roles array, it's visible to all authenticated users (or handled by parent's role)
        return true;
      })
      .map((item) => {
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
                  {subItems
                    .filter(subItem => { // Added .filter() for subItems
                      if (subItem.roles) {
                        return userInfo && userInfo.role && subItem.roles.includes(userInfo.role);
                      }
                      return true; // If no roles on subItem, it's visible (assuming parent is visible)
                    })
                    .map((subItem) => { // Map the filtered subItems
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <li key={subItem.id} className={`${styles.submenuItem} ${isSubActive ? styles.active : ''}`} role="none">
                          <Link
                            to={subItem.path}
                            className={styles.navLink}
                            role="menuitem"
                            onClick={() => {
                              if (isMobileOpen && onMobileToggle) onMobileToggle(false);
                              setHoveredFlyoutParentId(null); // Close any flyouts
                              // Do not toggle accordion here, it's handled by parent click
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
          {/* Pass propNavItems from props and userInfo from props to getCombinedNavItems */}
          <ul className={styles.navList} role="menu"> {renderNavItems(getCombinedNavItems(propNavItems, userInfo))} </ul>
        </nav>
        <div className={styles.userProfile} title={currentIsEffectivelyCollapsed && !hoveredFlyoutParentId && !isMobileOpen ? "User Menu" : undefined} role="none">
          <div className={styles.avatarContainer}>
              <FaUserCircle size={(currentIsEffectivelyCollapsed && !isMobileOpen) ? 30 : 36} />
          </div>
          {(!currentIsEffectivelyCollapsed || isMobileOpen) && (
            <div className={styles.userDetails}>
              <p className={styles.userName} title={userInfo?.lastName || userInfo?.firstName || ''}>
                {userInfo?.lastName || userInfo?.firstName || ''}
              </p>
              <a href="#" onClick={(e) => { e.preventDefault(); if(onLogoutClick) onLogoutClick(); if(isMobileOpen && onMobileToggle) onMobileToggle(false); setHoveredFlyoutParentId(null); }} className={styles.logoutLink} role="menuitem">
                <FaSignOutAlt className={styles.icon} /> <span className={styles.text}>Logout</span>
              </a>
            </div>
          )}
           {(currentIsEffectivelyCollapsed && !isMobileOpen) && (
              <a href="#" onClick={(e) => { e.preventDefault(); if(onLogoutClick) onLogoutClick(); setHoveredFlyoutParentId(null); }} className={styles.logoutLink} title="Logout" role="menuitem">
                <FaSignOutAlt className={styles.icon} />
              </a>
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
  onLogoutClick: PropTypes.func,
  userInfo: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.string, // Added role to userInfo proptypes
  }),
  navItems: PropTypes.array, // For navItems passed from MainLayout
};

Sidebar.defaultProps = {
  userInfo: {
    firstName: '',
    lastName: '',
    role: '', // Default role
  },
  navItems: [], // Default to empty array
};

export default Sidebar;

// Helper to combine base nav items with dynamically generated ones (like from MainLayout)
const getCombinedNavItems = (propNavItemsFromMainLayout, userInfoFromContext) => {
  let combinedItems = JSON.parse(JSON.stringify(baseNavItems)); // Deep clone base

  // Add items from MainLayout (propNavItemsFromMainLayout) if they exist
  // These are top-level items like "Manage Leave Requests"
  if (propNavItemsFromMainLayout && propNavItemsFromMainLayout.length > 0) {
    propNavItemsFromMainLayout.forEach(propItem => {
      // Simple merge: add if not already present by path (can be made more sophisticated)
      if (!combinedItems.find(item => item.path === propItem.path)) {
        // Determine appropriate icon (this is a placeholder, ideally icons come from MainLayout or a config)
        let icon = <FaAngleRight />;
        if (propItem.path.includes('manage-leave-requests')) {
          icon = <FaCalendarAlt />; // Example icon for manage leave
        }

        combinedItems.push({
          id: propItem.label.toLowerCase().replace(/\s+/g, '-') + '-prop', // Ensure unique ID
          text: propItem.label,
          path: propItem.path,
          icon: icon, // Add an icon
          // roles: propItem.roles, // Assuming MainLayout's getSidebarNavItems correctly assigns roles
                                  // Actually, getSidebarNavItems in MainLayout already filters by role
                                  // So, items received here are already role-appropriate.
                                  // No need for additional role check here for these items.
        });
      }
    });
  }

  // Filter items and their subItems based on user role
  const filterByRole = (items, userRole) => {
    if (!userRole) return []; // Or return all items if no role context for some reason
    return items.map(item => {
      // If item itself has role restrictions
      if (item.roles && !item.roles.includes(userRole)) {
        return null; // Remove item
      }
      // If item has subItems, filter them too
      if (item.subItems) {
        item.subItems = item.subItems.filter(subItem => !subItem.roles || subItem.roles.includes(userRole));
        // If a parent item has no visible sub-items after filtering (and isn't a direct link itself),
        // you might choose to hide it, unless it's a non-clickable category header.
        // For now, if subItems becomes empty, the parent might still show if it has a path.
      }
      return item;
    }).filter(item => item !== null); // Remove null entries
  };

  return filterByRole(combinedItems, userInfoFromContext?.role);
};

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const MainLayout = () => {
    const { userInfo, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        // navigate('/login'); // authContext logout already redirects
    };

    return (
        <div>
            <nav style={{ backgroundColor: '#f0f0f0', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Link to="/" style={{ marginRight: '1rem' }}>Home/Dashboard</Link>
                    {isAuthenticated && userInfo?.role === 'company_admin' && (
                        <>
                            <Link to="/employees" style={{ marginRight: '1rem' }}>Employees</Link>
                            <Link to="/departments" style={{ marginRight: '1rem' }}>Departments</Link>
                            <Link to="/income-grades" style={{ marginRight: '1rem' }}>Income Grades</Link>
                            <Link to="/payrolls" style={{ marginRight: '1rem' }}>Payrolls</Link>
                            <Link to="/payroll-ops/advances" style={{ marginRight: '1rem' }}>Advances</Link>
                             {/* Add more admin links */}
                        </>
                    )}
                     {isAuthenticated && userInfo?.role === 'hr_manager' && (
                        <>
                            <Link to="/employees" style={{ marginRight: '1rem' }}>Employees</Link>
                            <Link to="/payrolls" style={{ marginRight: '1rem' }}>Payrolls</Link>
                             {/* Add more HR links */}
                        </>
                    )}
                    {isAuthenticated && userInfo?.role === 'employee' && (
                         <Link to={`/employees/\${userInfo.employee?._id}/payslips`} style={{ marginRight: '1rem' }}>My Payslips</Link>
                    )}
                </div>
                <div>
                    {isAuthenticated ? (
                        <>
                            <span style={{ marginRight: '1rem' }}>Welcome, {userInfo?.email} ({userInfo?.role})</span>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
                            <Link to="/register-company">Register Company</Link>
                        </>
                    )}
                </div>
            </nav>
            <main style={{ padding: '1rem' }}>
                <Outlet /> {/* Child routes will render here */}
            </main>
            <footer style={{ textAlign: 'center', padding: '1rem', marginTop: '2rem', borderTop: '1px solid #ccc' }}>
                Payroll MERN App &copy; 2023
            </footer>
        </div>
    );
};

export default MainLayout;

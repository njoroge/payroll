import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, userInfo, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading authentication status...</div>; // Or a spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && roles.length > 0 && (!userInfo?.role || !roles.includes(userInfo.role))) {
        // User is authenticated but does not have the required role
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
        // Or show a generic "Forbidden" page:
        // return <div><h2>Access Denied</h2><p>You do not have permission to view this page.</p></div>;
    }

    return children;
};

export default ProtectedRoute;

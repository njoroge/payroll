import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

const PublicRouteOnly = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Basic Bootstrap styled loading message
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading authentication status...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        // If user is authenticated, redirect them from public-only pages
        // Redirect to location.state.from if it exists (e.g., if they were redirected to login from a protected route)
        // Otherwise, redirect to a default authenticated page like '/'
        const from = location.state?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    // If user is not authenticated, render the child component (e.g., LoginPage, RegisterCompanyPage)
    return children;
};

export default PublicRouteOnly;

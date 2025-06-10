import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6"> {/* Adjusted column width for better proportions */}
                    <div className="card text-center shadow-sm border-danger"> {/* Added border-danger for emphasis */}
                        <div className="card-header bg-danger text-white">
                            <h2 className="card-title mb-0">Access Denied</h2>
                        </div>
                        <div className="card-body p-4 p-md-5"> {/* Responsive padding */}
                            <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i> {/* Bootstrap Icon placeholder */}
                            <p className="lead">
                                We're sorry, but you do not have the necessary permissions to access this page.
                            </p>
                            <p className="text-muted">
                                If you believe this is an error, please contact your system administrator.
                            </p>
                            <Link to="/" className="btn btn-success mt-4">
                                <i className="bi bi-house-door-fill me-2"></i>Go to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;

import React from 'react';
import { useAuth } from '../store/authContext';
import { Link } from 'react-router-dom'; // Added for potential buttons

const HomePage = () => {
    const { userInfo, isAuthenticated } = useAuth(); // Assuming 'user' is available for general logged-in check, 'userInfo' for details

    return (
        <div className="container mt-5">
            <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
                <div className="container-fluid py-5">
                    <h1 className="display-5 fw-bold">Welcome to the Payroll System</h1>
                    <p className="col-md-10 fs-4">
                        Manage your employees, departments, income grades, and payroll operations efficiently.
                    </p>
                    {!isAuthenticated && (
                        <Link className="btn btn-success btn-lg mt-3" to="/login" role="button">Login to Get Started</Link>
                    )}
                </div>
            </div>

            {isAuthenticated && userInfo ? ( // Check for both user (for auth status) and userInfo (for details)
                <div className="card">
                    <div className="card-header">
                        <h4 className="my-0 fw-normal">User Information</h4>
                    </div>
                    <div className="card-body">
                        <p className="card-text fs-5">You are logged in as: <strong>{userInfo.email}</strong></p>
                        <p className="card-text fs-5">Role: <span className="badge bg-info text-dark">{userInfo.role}</span></p> {/* Styled role with a badge */}
                        {userInfo.company && (
                            <div className="mt-3">
                                <h5 className="card-title">Company Details:</h5>
                                <p className="card-text mb-1">Name: {userInfo.company.name}</p>
                                <p className="card-text">Tax PIN: {userInfo.company.taxPin}</p>
                            </div>
                        )}
                        {userInfo.employee && (
                             <div className="mt-3">
                                <h5 className="card-title">Employee Association:</h5>
                                <p className="card-text">Name: {userInfo.employee.firstName} {userInfo.employee.lastName}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // This part is now covered by the "Login to Get Started" button if !isAuthenticated
                // If isAuthenticated exists but userInfo is somehow missing, this could be a fallback.
                // However, the primary condition for this block is already handled by !isAuthenticated check for the login button.
                // So, we can simplify this or remove it if the login button is the only intended UI for non-authenticated users.
                // For now, let's ensure it doesn't conflict. The outer condition is `isAuthenticated && userInfo`, so this `else` implies `!(isAuthenticated && userInfo)`.
                // If `!isAuthenticated`, the login button is shown. If `isAuthenticated` but `!userInfo`, this block might be relevant.
                // Let's keep the original logic structure but use isAuthenticated.
                !isAuthenticated && ( // This condition is redundant if the login button is already shown when !isAuthenticated
                    <div className="alert alert-info" role="alert">
                        Please log in or register a company to continue.
                    </div>
                )
            )}
        </div>
    );
};
export default HomePage;

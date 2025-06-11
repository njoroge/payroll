import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authContext';
import { Link } from 'react-router-dom';
import api from '../services/api.jsx'; // Corrected import path
import { formatCurrency } from '../../utils/formatting';

const HomePage = () => {
    const { userInfo, isAuthenticated } = useAuth();

    // State variables for employee specific data
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [recentPaystubs, setRecentPaystubs] = useState([]);
    // const [upcomingPayments, setUpcomingPayments] = useState([]); // Placeholder for future use

    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingPaystubs, setLoadingPaystubs] = useState(false);
    // const [loadingPayments, setLoadingPayments] = useState(false); // Placeholder

    const [errorDetails, setErrorDetails] = useState(null);
    const [errorPaystubs, setErrorPaystubs] = useState(null);
    // const [errorPayments, setErrorPayments] = useState(null); // Placeholder

    useEffect(() => {
        if (isAuthenticated && userInfo && userInfo.role === 'employee') {
            // Fetch Employee Details
            const fetchEmployeeDetails = async () => {
                setLoadingDetails(true);
                setErrorDetails(null);
                try {
                    // For an employee fetching their own details, /employees/me is standard.
                    const response = await api.get('/employees/me');
                    setEmployeeDetails(response.data);
                } catch (err) {
                    console.error("Error fetching employee details:", err);
                    setErrorDetails('Failed to fetch personal details. Please try again later.');
                } finally {
                    setLoadingDetails(false);
                }
            };

            // Fetch Recent Paystubs
            const fetchRecentPaystubs = async () => {
                setLoadingPaystubs(true);
                setErrorPaystubs(null);
                try {
                    // For an employee, the backend will use req.user.employeeId from the token.
                    // No need to send employeeId as a query param.
                    const response = await api.get(`/payrolls?limit=3&sort=-year,-month`);
                    setRecentPaystubs(response.data.payrolls || response.data || []); // Assuming paystubs might be nested or direct array
                } catch (err) {
                    console.error("Error fetching recent paystubs:", err);
                    setErrorPaystubs('Failed to fetch recent paystubs. Please try again later.');
                } finally {
                    setLoadingPaystubs(false);
                }
            };

            fetchEmployeeDetails();
            fetchRecentPaystubs();
            // Fetch upcoming payments would go here in the future
        }
    }, [userInfo, isAuthenticated]);

    return (
        <div className="container mt-5">
            <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
                <div className="container-fluid py-5">
                    <h1 className="display-5 fw-bold">
                        {userInfo && userInfo.role === 'employee' && employeeDetails && employeeDetails.firstName
                            ? `Welcome, ${employeeDetails.firstName}!`
                            : "Welcome to the Payroll System"}
                    </h1>
                    <p className="col-md-10 fs-4">
                        {userInfo && userInfo.role === 'employee' && employeeDetails && employeeDetails.firstName
                            ? "Here you can view your personal details, recent paystubs, and other payroll information."
                            : "Manage your employees, departments, income grades, and payroll operations efficiently."}
                    </p>
                    {!isAuthenticated && (
                        <Link className="btn btn-success btn-lg mt-3" to="/login" role="button">Login to Get Started</Link>
                    )}
                </div>
            </div>

            {isAuthenticated && userInfo && (
                <div className="card mb-4"> {/* Added mb-4 for spacing */}
                    <div className="card-header">
                        <h4 className="my-0 fw-normal">User Information</h4>
                    </div>
                    <div className="card-body">
                        <p className="card-text fs-5">You are logged in as: <strong>{userInfo.email}</strong></p>
                        <p className="card-text fs-5">Role: <span className="badge bg-info text-dark">{userInfo.role}</span></p>
                        {userInfo.company && (
                            <div className="mt-3">
                                <h5 className="card-title">Company Details:</h5>
                                <p className="card-text mb-1">Name: {userInfo.company.name}</p>
                                <p className="card-text">Tax PIN: {userInfo.company.taxPin}</p>
                            </div>
                        )}
                        {/* General employee association info, if still relevant alongside detailed view */}
                        {userInfo.employee && userInfo.role !== 'employee' && (
                             <div className="mt-3">
                                <h5 className="card-title">Employee Association:</h5>
                                <p className="card-text">Name: {userInfo.employee.firstName} {userInfo.employee.lastName}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Employee Specific Sections */}
            {isAuthenticated && userInfo && userInfo.role === 'employee' && (
                <div className="row">
                    {/* My Details Section */}
                    <div className="col-md-6 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="my-0 fw-normal">My Details</h4>
                            </div>
                            <div className="card-body">
                                {loadingDetails && <p>Loading details...</p>}
                                {errorDetails && <div className="alert alert-danger">{errorDetails}</div>}
                                {employeeDetails && !loadingDetails && !errorDetails && (
                                    <>
                                        <p><strong>Full Name:</strong> {employeeDetails.firstName} {employeeDetails.lastName}</p>
                                        <p><strong>Email:</strong> {employeeDetails.email}</p>
                                        <p><strong>Phone:</strong> {employeeDetails.phone || 'N/A'}</p>
                                        <p><strong>Department:</strong> {employeeDetails.department?.name || 'N/A'}</p>
                                        {/* Add more fields as necessary, e.g., Job Title, Hire Date */}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Paystubs Section */}
                    <div className="col-md-6 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="my-0 fw-normal">Recent Paystubs</h4>
                            </div>
                            <div className="card-body">
                                {loadingPaystubs && <p>Loading paystubs...</p>}
                                {errorPaystubs && <div className="alert alert-danger">{errorPaystubs}</div>}
                                {!loadingPaystubs && !errorPaystubs && recentPaystubs.length > 0 && (
                                    <ul className="list-group list-group-flush">
                                        {recentPaystubs.map(paystub => (
                                            <li key={paystub.id || paystub._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>Period:</strong> {paystub.month}/{paystub.year} <br />
                                                    <strong>Net Pay:</strong> {formatCurrency(paystub.netPay)}
                                                </div>
                                                <Link to={`/my-paystubs/${paystub.id || paystub._id}`} className="btn btn-sm btn-outline-primary">View Details</Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!loadingPaystubs && !errorPaystubs && recentPaystubs.length === 0 && (
                                    <p>No recent paystubs found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Payment Dates Section - Placeholder */}
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="my-0 fw-normal">Upcoming Payment Dates</h4>
                            </div>
                            <div className="card-body">
                                {/* Placeholder for loadingPayments and errorPayments if needed in future */}
                                <p>Upcoming payment information will be available here soon.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isAuthenticated && (
                <div className="alert alert-info" role="alert">
                    Please log in or register a company to continue.
                </div>
            )}
        </div>
    );
};
export default HomePage;

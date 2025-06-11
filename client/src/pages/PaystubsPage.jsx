import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { formatCurrency } from '../../utils/formatting';

const PaystubsPage = () => {
    const { payslipId } = useParams();
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    const [paystubs, setPaystubs] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userInfo) {
            // Waiting for userInfo to load, or redirect if it's clear they aren't logged in.
            // ProtectedRoute should ideally handle unauthorized access.
            return;
        }

        if (userInfo.role !== 'employee') {
            setError("Access denied. This page is for employees only.");
            setLoading(false); // Stop loading if role check fails early
            return;
        }

        if (!userInfo.employee?._id) {
            setError("User information is incomplete (employee profile not linked or ID missing).");
            setLoading(false); // Ensure loading is stopped
            return;
        }

        setLoading(true);
        setError(null);

        if (payslipId) {
            // Fetch specific payslip details
            api.get(`/payrolls/${payslipId}`) // Backend route is /api/payrolls/:id
                .then(response => {
                    const payslipData = response.data;
                    const userEmployeeIdString = userInfo.employee?._id?.toString();

                    if (!userEmployeeIdString) { // Should have been caught by earlier check, but as a safeguard
                        setError("User employee ID is missing, cannot verify payslip ownership.");
                        setSelectedPayslip(null);
                        setLoading(false); // Ensure loading stops
                        return;
                    }

                    if (payslipData && payslipData.employeeId && typeof payslipData.employeeId === 'object' && payslipData.employeeId._id) {
                        // This handles the case where employeeId is populated (typical case)
                        if (payslipData.employeeId._id.toString() === userEmployeeIdString) {
                            setSelectedPayslip(payslipData);
                        } else {
                            setError("Payslip not found or access denied. (Owner mismatch)");
                            setSelectedPayslip(null);
                        }
                    } else if (payslipData && payslipData.employeeId && typeof payslipData.employeeId === 'string') {
                        // This handles the case where employeeId might be just an ID string
                        if (payslipData.employeeId.toString() === userEmployeeIdString) {
                            setSelectedPayslip(payslipData);
                        } else {
                            setError("Payslip not found or access denied. (Owner mismatch - string compare)");
                            setSelectedPayslip(null);
                        }
                    } else {
                        // This case means the payslip data or its employeeId field is missing or not in expected format
                        setError("Payslip data is incomplete or invalid (missing or malformed employeeId field).");
                        setSelectedPayslip(null);
                    }
                })
                .catch(err => {
                    console.error("Error fetching payslip details:", err);
                    setError(err.response?.data?.message || "Failed to fetch payslip details.");
                    setSelectedPayslip(null); // Clear on error too
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            // Fetch list of paystubs for the employee
            // Backend route GET /api/payrolls already filters by employeeId if role is 'employee' based on token
            // and user.employeeId is now confirmed to exist
            api.get(`/payrolls?sort=-year,-month`)
                .then(response => {
                    setPaystubs(response.data.payrolls || []);
                    setSelectedPayslip(null);
                })
                .catch(err => {
                    console.error("Error fetching paystubs list:", err);
                    setError(err.response?.data?.message || "Failed to fetch paystubs.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [payslipId, userInfo, navigate]);

    if (loading) {
        return <div className="container mt-5"><p>Loading paystubs...</p></div>;
    }

    if (error) {
        return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
    }

    if (selectedPayslip) {
        // Detailed view for a single payslip
        return (
            <div className="container mt-5">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h4>Payslip Details</h4>
                        <Link to="/my-paystubs" className="btn btn-sm btn-outline-secondary">Back to List</Link>
                    </div>
                    <div className="card-body">
                        <p><strong>Period:</strong> {selectedPayslip.month}/{selectedPayslip.year}</p>
                        <p><strong>Net Pay:</strong> {formatCurrency(selectedPayslip.netPay)}</p>
                        <p><strong>Gross Pay:</strong> {formatCurrency(selectedPayslip.grossPay)}</p>
                        <p><strong>Total Deductions:</strong> {formatCurrency(selectedPayslip.totalDeductions)}</p>
                        <p><strong>Status:</strong> <span className={`badge bg-${selectedPayslip.status === 'PAID' ? 'success' : 'warning'}`}>{selectedPayslip.status}</span></p>

                        <h5>Earnings:</h5>
                        <ul>
                            {selectedPayslip.earnings?.map((item, index) => (
                                <li key={index}>{item.name}: {formatCurrency(item.amount)}</li>
                            ))}
                        </ul>

                        <h5>Deductions:</h5>
                        <ul>
                            {selectedPayslip.deductions?.map((item, index) => (
                                <li key={index}>{item.name}: {formatCurrency(item.amount)}</li>
                            ))}
                        </ul>
                        {/* Add more details as needed */}
                    </div>
                </div>
            </div>
        );
    }

    // List view for paystubs
    return (
        <div className="container mt-5">
            <h2>My Paystubs</h2>
            {paystubs.length === 0 && !loading && (
                <p>No paystubs found.</p>
            )}
            {paystubs.length > 0 && (
                <div className="list-group">
                    {paystubs.map(payslip => (
                        <Link
                            key={payslip._id}
                            to={`/my-paystubs/${payslip._id}`}
                            className="list-group-item list-group-item-action"
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">Pay Period: {payslip.month}/{payslip.year}</h5>
                                <small>Status: <span className={`badge bg-${payslip.status === 'PAID' ? 'success' : 'warning'}`}>{payslip.status}</span></small>
                            </div>
                            <p className="mb-1">Net Pay: {formatCurrency(payslip.netPay)}</p>
                            <small>Click to view details</small>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaystubsPage;

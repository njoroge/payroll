import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';
import { formatCurrency } from '../../utils/formatting';

const PrintablePayslipView = () => {
    const { payslipId } = useParams();
    const { userInfo, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [payslip, setPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // const payslipPrintRef = useRef(); // Removed

    useEffect(() => {
        if (authLoading) { // Wait if auth state is still loading
            setLoading(true); // Keep component in its own loading state or set a specific auth loading message
            return;
        }

        // Existing checks (they will now run only if authLoading is false)
        if (!userInfo || !userInfo.employee?._id) {
            setError('User or employee details not found.');
            setLoading(false);
            return;
        }
        if (!payslipId) {
            setError('Payslip ID not provided.');
            setLoading(false);
            return;
        }

        const fetchPayslip = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get(`/payrolls/${payslipId}`);
                // Verify that the payslip belongs to the logged-in user
                if (data.employeeId?._id !== userInfo.employee._id && data.employeeId !== userInfo.employee._id) {
                     setError('Access Denied: You are not authorized to view this payslip.');
                     setPayslip(null);
                } else {
                    setPayslip(data);
                }
            } catch (err) {
                console.error('Error fetching payslip details:', err);
                let errorMessage = 'Failed to fetch payslip details.';
                if (err.response) {
                    console.error('Error Status:', err.response.status);
                    console.error('Error Data:', err.response.data);
                    errorMessage = `Error ${err.response.status}: ${err.response.data?.message || 'Could not retrieve payslip.'}`;
                } else if (err.request) {
                    console.error('Error Request:', err.request);
                    errorMessage = 'No response from server. Please check your network connection.';
                } else {
                    console.error('Error Message:', err.message);
                    errorMessage = `An unexpected error occurred: ${err.message}`;
                }
                setError(errorMessage);
                setPayslip(null); // Ensure payslip is cleared on error
            } finally {
                setLoading(false);
            }
        };

        fetchPayslip();
    }, [payslipId, userInfo, authLoading]); // Added authLoading

    // Removed handlePrint function

    // Removed handleClose function

    if (loading) return <div className="container mt-3"><p>Loading payslip details...</p></div>; // Updated loading message
    if (error) return <div className="container mt-3"><div className="alert alert-danger">{error}</div> <button onClick={() => navigate('/reports/my-payslips')} className="btn btn-secondary mt-2">Back to Report</button></div>;
    if (!payslip) return <div className="container mt-3"><p>Payslip not found or not accessible.</p> <button onClick={() => navigate('/reports/my-payslips')} className="btn btn-secondary mt-2">Back to Report</button></div>;

    // Destructure for easier access, similar to ViewPayslipPage
    const { employeeId: emp, companyId: comp, incomeGradeSnapshot: igs } = payslip;
    const displayGrossEarnings = (payslip.grossEarnings || 0) + (payslip.reimbursementAdded || 0);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return <span className="badge bg-warning text-dark">Pending Approval</span>;
            case 'APPROVED': return <span className="badge bg-info">Approved</span>;
            case 'PAID': return <span className="badge bg-success">Paid</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <div className="container mt-4 mb-4">
            <div className="d-flex justify-content-end mb-3">
                {/* Removed Print Payslip button */}
                <button onClick={() => navigate('/reports/my-payslips')} className="btn btn-secondary">
                    Back to Report
                </button>
            </div>

            {/* This ref is used for printing - ref removed from div */}
            <div className="payslip-print-content card shadow-sm"> {/* payslipPrintRef removed */}
                <div className="card-header text-center bg-light">
                    <h3>{comp?.name || 'Company Name'}</h3>
                    <p className="mb-0">{comp?.location || 'Company Address'}</p>
                    <p className="mb-0">Tax PIN: {comp?.taxPin || 'N/A'}</p>
                </div>
                <div className="card-body p-4">
                    <h4 className="card-title mb-3 text-center">Payslip for {payslip.month}, {payslip.year}</h4>
                    <div className="row mb-3">
                        <div className="col-6">
                            <p className="mb-1"><strong>Employee Name:</strong> {emp?.firstName} {emp?.lastName}</p>
                            <p className="mb-1"><strong>National ID:</strong> {emp?.nationalId}</p>
                        </div>
                        <div className="col-6">
                            <p className="mb-1"><strong>Department:</strong> {emp?.departmentId?.name || 'N/A'}</p>
                            <p className="mb-1"><strong>Income Grade:</strong> {igs?.gradeName || 'N/A'}</p>
                        </div>
                    </div>
                    <p className="text-muted mb-3">Date Processed: {new Date(payslip.processingDate).toLocaleDateString()}</p>
                    <hr />
                    <h5>Earnings</h5>
                    <table className="table table-sm table-borderless mb-4">
                        <tbody>
                            <tr><td>Basic Salary</td><td className="text-end">{formatCurrency(igs?.basicSalary)}</td></tr>
                            {igs?.houseAllowance > 0 && <tr><td>House Allowance</td><td className="text-end">{formatCurrency(igs?.houseAllowance)}</td></tr>}
                            {/* Add other allowances as in ViewPayslipPage */}
                            {payslip.reimbursementAdded > 0 && <tr><td>Reimbursements</td><td className="text-end">{formatCurrency(payslip.reimbursementAdded)}</td></tr>}
                        </tbody>
                        <tfoot><tr className="border-top"><td><strong>Gross Earnings</strong></td><td className="text-end"><strong>{formatCurrency(displayGrossEarnings)}</strong></td></tr></tfoot>
                    </table>
                    <h5>Deductions</h5>
                    <table className="table table-sm table-borderless mb-4">
                        <tbody>
                            <tr><td>PAYE (Tax)</td><td className="text-end">{formatCurrency(payslip.paye)}</td></tr>
                            <tr><td>NHIF</td><td className="text-end">{formatCurrency(payslip.nhifDeduction)}</td></tr>
                            <tr><td>NSSF</td><td className="text-end">{formatCurrency(payslip.nssfDeduction)}</td></tr>
                            {/* Add other deductions as in ViewPayslipPage */}
                        </tbody>
                        <tfoot><tr className="border-top"><td><strong>Total Deductions</strong></td><td className="text-end"><strong>{formatCurrency(payslip.totalDeductions)}</strong></td></tr></tfoot>
                    </table>
                    <hr />
                    <div className="text-end mb-3">
                        <h4 className="fw-bold">Net Pay: {formatCurrency(payslip.netPay)}</h4>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div><span className="fw-bold me-2">Status:</span>{getStatusBadge(payslip.status)}</div>
                        {payslip.notes && <p className="mb-0"><strong>Notes:</strong> <span className="text-muted">{payslip.notes}</span></p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintablePayslipView;

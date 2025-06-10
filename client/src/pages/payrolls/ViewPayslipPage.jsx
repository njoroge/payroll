import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const ViewPayslipPage = () => {
    const { id: payslipId } = useParams();
    const [payslip, setPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const payslipRef = useRef();

    useEffect(() => {
        const fetchPayslip = async () => {
            try {
                setLoading(true); setError('');
                const { data } = await api.get(`/payrolls/${payslipId}`);
                setPayslip(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch payslip details.');
                console.error(err);
            } finally { setLoading(false); }
        };
        if (payslipId) {
            fetchPayslip();
        }
    }, [payslipId]);

    const handlePrint = () => {
        // This basic print function might not preserve Bootstrap styles perfectly.
        // For better print output, specific print CSS or a library might be needed.
        const printContents = payslipRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        // Temporarily add Bootstrap CDN for printing if not already globally available in a way print recognizes
        const bootstrapLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">';
        document.body.innerHTML = bootstrapLink + printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    if (loading) return <p className="text-center mt-5">Loading payslip...</p>;
    if (error) return <div className="alert alert-danger mt-3 mx-auto" style={{maxWidth: '600px'}}>{error}</div>;
    if (!payslip) return <p className="text-center mt-5">Payslip not found.</p>;

    const { employeeId: emp, companyId: comp, incomeGradeSnapshot: igs } = payslip;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return <span className="badge bg-warning text-dark">Pending Approval</span>;
            case 'APPROVED': return <span className="badge bg-info">Approved</span>;
            case 'PAID': return <span className="badge bg-success">Paid</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    // Calculate Gross Earnings including Reimbursements for display consistency
    const displayGrossEarnings = (payslip.grossEarnings || 0) + (payslip.reimbursementAdded || 0);

    return (
        <div className="container mt-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>
                    Payslip: <span className="fw-normal">{emp?.firstName} {emp?.lastName}</span>
                </h2>
                <button onClick={handlePrint} className="btn btn-primary">
                    <i className="bi bi-printer me-2"></i>Print Payslip {/* Assuming Bootstrap Icons are available */}
                </button>
            </div>

            <div className="card shadow-sm" ref={payslipRef}>
                <div className="card-header text-center bg-light">
                    <h3>{comp?.name || 'Company Name'}</h3>
                    <p className="mb-0">{comp?.location || 'Company Address'}</p>
                    <p className="mb-0">Tax PIN: {comp?.taxPin || 'N/A'}</p>
                </div>
                <div className="card-body p-4">
                    <h4 className="card-title mb-3 text-center">Payslip for {payslip.month}, {payslip.year}</h4>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <p className="mb-1"><span className="fw-bold">Employee Name:</span> {emp?.firstName} {emp?.lastName}</p>
                            <p className="mb-1"><span className="fw-bold">National ID:</span> {emp?.nationalId}</p>
                        </div>
                        <div className="col-md-6">
                            <p className="mb-1"><span className="fw-bold">Department:</span> {emp?.departmentId?.name || 'N/A'}</p>
                            <p className="mb-1"><span className="fw-bold">Income Grade:</span> {igs?.gradeName || 'N/A'}</p>
                        </div>
                    </div>
                    <p className="text-muted mb-3">Date Processed: {new Date(payslip.processingDate).toLocaleDateString()}</p>

                    <hr />

                    <h5>Earnings</h5>
                    <table className="table table-sm table-borderless mb-4">
                        <tbody>
                            <tr><td>Basic Salary</td><td className="text-end">{igs?.basicSalary?.toFixed(2)}</td></tr>
                            {igs?.houseAllowance > 0 && <tr><td>House Allowance</td><td className="text-end">{igs?.houseAllowance?.toFixed(2)}</td></tr>}
                            {igs?.transportAllowance > 0 && <tr><td>Transport Allowance</td><td className="text-end">{igs?.transportAllowance?.toFixed(2)}</td></tr>}
                            {igs?.hardshipAllowance > 0 && <tr><td>Hardship Allowance</td><td className="text-end">{igs?.hardshipAllowance?.toFixed(2)}</td></tr>}
                            {igs?.specialAllowance > 0 && <tr><td>Special Allowance</td><td className="text-end">{igs?.specialAllowance?.toFixed(2)}</td></tr>}
                            {payslip.reimbursementAdded > 0 && <tr><td>Reimbursements</td><td className="text-end">{payslip.reimbursementAdded?.toFixed(2)}</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="border-top"><td className="fw-bold">Gross Earnings</td><td className="text-end fw-bold">{displayGrossEarnings?.toFixed(2)}</td></tr>
                        </tfoot>
                    </table>

                    <h5>Deductions</h5>
                    <table className="table table-sm table-borderless mb-4">
                        <tbody>
                            <tr><td>PAYE (Tax)</td><td className="text-end">{payslip.paye?.toFixed(2)}</td></tr>
                            <tr><td>NHIF</td><td className="text-end">{payslip.nhifDeduction?.toFixed(2)}</td></tr>
                            <tr><td>NSSF</td><td className="text-end">{payslip.nssfDeduction?.toFixed(2)}</td></tr>
                            {payslip.advanceDeducted > 0 && <tr><td>Advance Deduction</td><td className="text-end">{payslip.advanceDeducted?.toFixed(2)}</td></tr>}
                            {payslip.damageDeducted > 0 && <tr><td>Damage Deduction</td><td className="text-end">{payslip.damageDeducted?.toFixed(2)}</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="border-top"><td className="fw-bold">Total Deductions</td><td className="text-end fw-bold">{payslip.totalDeductions?.toFixed(2)}</td></tr>
                        </tfoot>
                    </table>

                    <hr />

                    <div className="text-end mb-3">
                        <h4 className="fw-bold">Net Pay: KES {payslip.netPay?.toFixed(2)}</h4>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <span className="fw-bold me-2">Status:</span>
                            {getStatusBadge(payslip.status)}
                        </div>
                        {payslip.notes && <p className="mb-0"><span className="fw-bold">Notes:</span> <span className="text-muted">{payslip.notes}</span></p>}
                    </div>
                </div>
            </div>

            <div className="text-center mt-4">
                 <Link to="/payrolls" className="btn btn-secondary">
                    <i className="bi bi-arrow-left-circle me-2"></i>Back to Payroll List
                </Link>
            </div>
        </div>
    );
};
export default ViewPayslipPage;

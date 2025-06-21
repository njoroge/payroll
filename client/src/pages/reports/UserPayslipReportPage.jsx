import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';
import { formatCurrency } from '../../utils/formatting'; // Assuming this utility exists

const UserPayslipReportPage = () => {
    const { userInfo } = useAuth();
    const [payslips, setPayslips] = useState([]);
    const [filteredPayslips, setFilteredPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPayslips, setSelectedPayslips] = useState(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [payslipsForCombinedPrint, setPayslipsForCombinedPrint] = useState([]);
    const [showCombinedPrintPreview, setShowCombinedPrintPreview] = useState(false);
    const combinedPrintRef = useRef(null); // For targeting the combined print area

    useEffect(() => {
        if (!userInfo || !userInfo.employee?._id) {
            setError('Employee information not found. Cannot fetch payslips.');
            setLoading(false);
            return;
        }

        const fetchPayslips = async () => {
            setLoading(true);
            setError('');
            try {
                // Endpoint fetches payslips for the logged-in user (backend filters by employeeId based on token)
                const response = await api.get('/payrolls?sort=-year,-month');
                setPayslips(response.data.payrolls || []);
                setFilteredPayslips(response.data.payrolls || []);
            } catch (err) {
                console.error('Error fetching payslips:', err);
                setError(err.response?.data?.message || 'Failed to fetch payslips.');
                setPayslips([]);
                setFilteredPayslips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayslips();
    }, [userInfo]);

    useEffect(() => {
        let currentPayslips = [...payslips];
        if (startDate) {
            currentPayslips = currentPayslips.filter(p => {
                // Assuming p.year and p.month exist and are numbers
                // Create a date string 'YYYY-MM-01' for comparison
                const payslipDate = new Date(p.year, p.month - 1, 1);
                return payslipDate >= new Date(startDate);
            });
        }
        if (endDate) {
            currentPayslips = currentPayslips.filter(p => {
                const payslipDate = new Date(p.year, p.month - 1, 1);
                // For end date, compare with the end of the month or start of next month
                const endFilterDate = new Date(endDate);
                endFilterDate.setDate(endFilterDate.getDate() + 1); // Ensure it includes the selected end date
                return payslipDate < endFilterDate;
            });
        }
        setFilteredPayslips(currentPayslips);
    }, [startDate, endDate, payslips]);

    const handleSelectPayslip = (payslipId) => {
        setSelectedPayslips(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(payslipId)) {
                newSelected.delete(payslipId);
            } else {
                newSelected.add(payslipId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        if (selectedPayslips.size === filteredPayslips.length) {
            setSelectedPayslips(new Set());
        } else {
            setSelectedPayslips(new Set(filteredPayslips.map(p => p._id)));
        }
    };

    // Placeholder for download logic
    const handleDownloadSelected = async () => {
        if (selectedPayslips.size === 0) {
            alert('Please select at least one payslip to download.');
            return;
        }
        setLoading(true); // Show loading indicator
        setError('');
        try {
            const payslipDetailsPromises = Array.from(selectedPayslips).map(id =>
                api.get(`/payrolls/${id}`).then(res => res.data)
            );
            const fetchedPayslips = await Promise.all(payslipDetailsPromises);

            // Filter out any null responses or payslips not belonging to the user (extra safety)
            const validPayslips = fetchedPayslips.filter(p => p && (p.employeeId?._id === userInfo.employee?._id || p.employeeId === userInfo.employee?._id));

            if (validPayslips.length === 0) {
                setError("Could not fetch or verify selected payslips for printing.");
                setPayslipsForCombinedPrint([]);
                setShowCombinedPrintPreview(false);
                return;
            }

            setPayslipsForCombinedPrint(validPayslips.sort((a, b) => new Date(a.year, a.month - 1) - new Date(b.year, b.month - 1))); // Sort by date
            setShowCombinedPrintPreview(true);
        } catch (err) {
            console.error('Error fetching selected payslips for combined print:', err);
            setError(err.response?.data?.message || 'Failed to fetch details for selected payslips.');
            setPayslipsForCombinedPrint([]);
            setShowCombinedPrintPreview(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintCombined = () => {
        if (!combinedPrintRef.current) return;
        const printContents = combinedPrintRef.current.innerHTML;

        const tempFrame = document.createElement('iframe');
        tempFrame.style.position = 'absolute';
        tempFrame.style.width = '0';
        tempFrame.style.height = '0';
        tempFrame.style.border = '0';
        document.body.appendChild(tempFrame);

        const frameDoc = tempFrame.contentWindow || tempFrame.contentDocument;
        if (frameDoc.document) frameDoc = frameDoc.document;

        const bootstrapLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">';
        // Basic print styles for page breaks between payslips
        const printSpecificStyles = `
            <style>
                @media print {
                    .payslip-combined-item {
                        page-break-after: always;
                    }
                    .payslip-combined-item:last-child {
                        page-break-after: auto;
                    }
                    body { margin: 20px; }
                }
            </style>
        `;

        frameDoc.open();
        frameDoc.write(`<html><head><title>Combined Payslip Print</title>${bootstrapLink}${printSpecificStyles}</head><body>${printContents}</body></html>`);
        frameDoc.close();

        tempFrame.contentWindow.focus();
        tempFrame.contentWindow.print();

        setTimeout(() => {
            document.body.removeChild(tempFrame);
        }, 1000);
    };

    if (loading && !showCombinedPrintPreview) return <div className="container mt-3"><p>Loading payslips...</p></div>; // Show main loading only if not in combined preview
    if (error && !showCombinedPrintPreview) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;


    if (showCombinedPrintPreview) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>Combined Payslip Preview ({payslipsForCombinedPrint.length} payslips)</h3>
                    <div>
                        <button onClick={handlePrintCombined} className="btn btn-primary me-2">
                            Print All Selected
                        </button>
                        <button onClick={() => {
                            setShowCombinedPrintPreview(false);
                            setPayslipsForCombinedPrint([]); // Clear data
                        }} className="btn btn-secondary">
                            Back to List
                        </button>
                    </div>
                </div>
                {loading && <p>Loading preview...</p>}
                {error && <div className="alert alert-danger">{error}</div>}
                <div ref={combinedPrintRef} className="combined-payslip-area">
                    {payslipsForCombinedPrint.map(payslip => {
                        // Simplified inline rendering of each payslip.
                        // This should mirror the structure of PrintablePayslipView or ViewPayslipPage's content.
                        // For brevity, a simplified version is shown here.
                        // Ensure formatCurrency and other helpers are available.
                        const { employeeId: emp, companyId: comp, incomeGradeSnapshot: igs } = payslip;
                        const displayGrossEarnings = (payslip.grossEarnings || 0) + (payslip.reimbursementAdded || 0);
                        const getStatusBadge = (status) => { /* same as in PrintablePayslipView */
                            switch (status) {
                                case 'PENDING_APPROVAL': return `<span class="badge bg-warning text-dark">Pending Approval</span>`;
                                case 'APPROVED': return `<span class="badge bg-info">Approved</span>`;
                                case 'PAID': return `<span class="badge bg-success">Paid</span>`;
                                default: return `<span class="badge bg-secondary">${status}</span>`;
                            }
                        };

                        // IMPORTANT: The actual rendering here needs to be robust HTML, not JSX directly in string for innerHTML.
                        // The content for `combinedPrintRef.current.innerHTML` will be generated from this map.
                        // So this map should produce HTML strings or be structured so that its direct innerHTML is printable.
                        // A better approach for direct DOM manipulation would be to create elements,
                        // but for window.print() of innerHTML, we structure the content.
                        // The current implementation of handlePrintCombined uses combinedPrintRef.current.innerHTML,
                        // so this map should render the actual HTML structure for each payslip.

                        return (
                            <div key={payslip._id} className="payslip-combined-item card shadow-sm mb-4">
                                <div className="card-header text-center bg-light">
                                    <h3>{comp?.name || 'Company Name'}</h3>
                                    <p className="mb-0">{comp?.location || 'Company Address'}</p>
                                    <p className="mb-0">Tax PIN: {comp?.taxPin || 'N/A'}</p>
                                </div>
                                <div className="card-body p-4">
                                    <h4 className="card-title mb-3 text-center">Payslip for {payslip.month}, {payslip.year}</h4>
                                    {/* Basic structure - expand with all details from PrintablePayslipView */}
                                    <div className="row mb-3">
                                        <div className="col-6"><p><strong>Employee:</strong> {emp?.firstName} {emp?.lastName}</p></div>
                                        <div className="col-6"><p><strong>Department:</strong> {emp?.departmentId?.name || 'N/A'}</p></div>
                                    </div>
                                    <hr />
                                    {/* Mirroring PrintablePayslipView structure more closely */}
                                    <h5>Earnings</h5>
                                    <table className="table table-sm table-borderless mb-4">
                                        <tbody>
                                            <tr><td>Basic Salary</td><td className="text-end">{formatCurrency(igs?.basicSalary)}</td></tr>
                                            {igs?.houseAllowance > 0 && <tr><td>House Allowance</td><td className="text-end">{formatCurrency(igs?.houseAllowance)}</td></tr>}
                                            {/* Placeholder for other allowances */}
                                            {igs?.transportAllowance > 0 && <tr><td>Transport Allowance</td><td className="text-end">{formatCurrency(igs?.transportAllowance)}</td></tr>}
                                            {igs?.otherAllowances > 0 && <tr><td>Other Allowances</td><td className="text-end">{formatCurrency(igs?.otherAllowances)}</td></tr>}
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
                                            {/* Placeholder for other deductions */}
                                            {payslip.advanceDeducted > 0 && <tr><td>Advance Deduction</td><td className="text-end">{formatCurrency(payslip.advanceDeducted)}</td></tr>}
                                             {payslip.otherDeductions > 0 && <tr><td>Other Deductions</td><td className="text-end">{formatCurrency(payslip.otherDeductions)}</td></tr>}
                                        </tbody>
                                        <tfoot><tr className="border-top"><td><strong>Total Deductions</strong></td><td className="text-end"><strong>{formatCurrency(payslip.totalDeductions)}</strong></td></tr></tfoot>
                                    </table>
                                    <hr />
                                    <div className="text-end mb-3">
                                      <h4 className="fw-bold">Net Pay: {formatCurrency(payslip.netPay)}</h4>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div><strong>Status:</strong> <span dangerouslySetInnerHTML={{ __html: getStatusBadge(payslip.status) }} /></div>
                                      {payslip.notes && <p className="mb-0"><strong>Notes:</strong> <span className="text-muted">{payslip.notes}</span></p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Original return for the list view (ensure it's wrapped in a React.Fragment or div if needed)
    return (
        <div className="container mt-4">
            <h2>My Payslip Report</h2>

            <div className="row mb-3 g-3 align-items-center">
                <div className="col-md-3">
                    <label htmlFor="startDate" className="form-label">From:</label>
                    <input
                        type="date"
                        id="startDate"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="col-md-3">
                    <label htmlFor="endDate" className="form-label">To:</label>
                    <input
                        type="date"
                        id="endDate"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {filteredPayslips.length > 0 && (
                 <button onClick={handleDownloadSelected} className="btn btn-success mb-3" disabled={selectedPayslips.size === 0}>
                    Download Selected as Combined PDF ({selectedPayslips.size})
                </button>
            )}

            {filteredPayslips.length === 0 && !loading && (
                <p>No payslips found for the selected criteria.</p>
            )}

            {filteredPayslips.length > 0 && (
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedPayslips.size === filteredPayslips.length && filteredPayslips.length > 0}
                                    onChange={handleSelectAll}
                                    disabled={filteredPayslips.length === 0}
                                />
                            </th>
                            <th>Period</th>
                            <th>Gross Pay</th>
                            <th>Deductions</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayslips.map(payslip => (
                            <tr key={payslip._id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={selectedPayslips.has(payslip._id)}
                                        onChange={() => handleSelectPayslip(payslip._id)}
                                    />
                                </td>
                                <td>{payslip.month}/{payslip.year}</td>
                                <td>{formatCurrency(payslip.grossPay)}</td>
                                <td>{formatCurrency(payslip.totalDeductions)}</td>
                                <td>{formatCurrency(payslip.netPay)}</td>
                                <td>
                                    <span className={`badge bg-${payslip.status === 'PAID' ? 'success' : 'warning'}`}>
                                        {payslip.status}
                                    </span>
                                </td>
                                <td>
                                    <Link
                                        to={`/reports/my-payslips/print/${payslip._id}`}
                                        className="btn btn-sm btn-outline-primary"
                                        // target="_blank" REMOVED
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserPayslipReportPage;

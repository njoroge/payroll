import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { syncPayrollToQuickbooks } from '../../services/api'; // Import syncPayrollToQuickbooks
import { useAuth } from '../../store/authContext';
import { formatCurrency } from '../../utils/formatting';

const PayrollListPage = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [syncingPayrollId, setSyncingPayrollId] = useState(null); // For loading state on sync button
    const [syncMessages, setSyncMessages] = useState({}); // To show messages per payroll ID
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const fetchPayrolls = async () => {
        try {
            setLoading(true); setError('');
            const params = { month: filterMonth, year: filterYear };
            const { data } = await api.get('/payrolls', { params });
            setPayrolls(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch payroll records.');
            console.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (filterMonth && filterYear) {
            fetchPayrolls();
        }
    }, [filterMonth, filterYear]);

    const handleRunPayroll = () => {
        navigate('/payrolls/run');
    };

    const handleApprove = async (id) => {
        if (window.confirm("Are you sure you want to approve this payslip?")) {
            try {
                await api.put(`/payrolls/${id}/status`, { status: 'APPROVED' });
                fetchPayrolls();
            } catch (err) {
                setError(err.response?.data?.message || "Failed to approve payslip.");
            }
        }
    };

    const handleMarkPaid = async (id) => {
         if (window.confirm("Are you sure you want to mark this payslip as PAID?")) {
            try {
                await api.put(`/payrolls/${id}/status`, { status: 'PAID' });
                fetchPayrolls();
            } catch (err) {
                setError(err.response?.data?.message || "Failed to mark as paid.");
            }
        }
    };

    const handleSyncToQuickbooks = async (payrollId) => {
        setSyncingPayrollId(payrollId);
        setSyncMessages(prev => ({ ...prev, [payrollId]: { text: 'Syncing...', type: 'info' } }));
        try {
            const response = await syncPayrollToQuickbooks(payrollId);
            setSyncMessages(prev => ({ ...prev, [payrollId]: { text: response.message || 'Synced successfully!', type: 'success', qboJournalEntryId: response.journalEntryId } }));
            // Refresh payrolls to get updated sync status
            fetchPayrolls();
        } catch (err) {
            console.error("Error syncing to QuickBooks:", err);
            setSyncMessages(prev => ({ ...prev, [payrollId]: { text: err.message || 'Sync failed.', type: 'error' } }));
        } finally {
            setSyncingPayrollId(null);
        }
    };

    const renderQboSyncStatus = (payroll) => {
        if (syncMessages[payroll._id] && syncMessages[payroll._id].type === 'info') {
            return <small className="text-muted fst-italic">Syncing...</small>;
        }
        if (syncMessages[payroll._id] && syncMessages[payroll._id].type === 'success') {
            let message = `Synced: JE ID ${syncMessages[payroll._id].qboJournalEntryId || 'N/A'}`;
            if (payroll.quickbooksLastSyncAt) {
                 message += ` on ${new Date(payroll.quickbooksLastSyncAt).toLocaleDateString()}`;
            }
            return <small className="text-success fst-italic">{message}</small>;
        }
         if (syncMessages[payroll._id] && syncMessages[payroll._id].type === 'error') {
            return <small className="text-danger fst-italic">Error: {syncMessages[payroll._id].text}</small>;
        }

        switch (payroll.quickbooksSyncStatus) {
            case 'SYNCED':
                let message = `Synced: JE ID ${payroll.quickbooksJournalEntryId || 'N/A'}`;
                if (payroll.quickbooksLastSyncAt) {
                    message += ` on ${new Date(payroll.quickbooksLastSyncAt).toLocaleDateString()}`;
                }
                return <small className="text-success fst-italic">{message}</small>;
            case 'FAILED':
                return <small className="text-danger fst-italic">Sync Failed: {payroll.quickbooksSyncError || 'Unknown error'}</small>;
            case 'PENDING':
                return <small className="text-warning fst-italic">Sync Pending</small>;
            case 'NOT_SYNCED':
            default:
                return <small className="text-muted fst-italic">Not Synced</small>;
        }
    };


    return (
        <div>
            <h2>Payroll Records</h2>
            <div className="mb-3 d-flex align-items-center"> {/* Added d-flex for better alignment */}
                <span className="me-2">Filter by:</span> {/* Added span and margin for label */}
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="form-select form-select-sm me-2" style={{width: 'auto'}}> {/* Added form-select, width auto */}
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="form-select form-select-sm" style={{width: 'auto'}}> {/* Added form-select, width auto */}
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {loading && <p>Loading payrolls...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && payrolls.length === 0 && <p>No payroll records found for {filterMonth}, {filterYear}.</p>}

            {!loading && !error && payrolls.length > 0 && (
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Month/Year</th>
                            <th>Net Pay</th>
                            {/* <th>Gross Earnings</th>
                            <th>Total Deductions</th> */}
                            <th>Status</th>
                            <th>QBO Sync</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.map((p) => (
                            <tr key={p._id}>
                                <td>{p.employeeId?.firstName} {p.employeeId?.lastName}</td>
                                <td>{p.month} {p.year}</td>
                                <td>{formatCurrency(p.netPay)}</td>
                                {/* <td>{formatCurrency(p.grossEarnings)}</td>
                                <td>{formatCurrency(p.totalDeductions)}</td> */}
                                <td>
                                    {p.status === 'PENDING_APPROVAL' && <span className="badge bg-warning text-dark">Pending Approval</span>}
                                    {p.status === 'APPROVED' && <span className="badge bg-info">Approved</span>}
                                    {p.status === 'PAID' && <span className="badge bg-success">Paid</span>}
                                    {!['PENDING_APPROVAL', 'APPROVED', 'PAID'].includes(p.status) && <span className="badge bg-secondary">{p.status}</span>}
                                </td>
                                <td>
                                    {renderQboSyncStatus(p)}
                                    {/* Display specific error/success message for this row if any */}
                                    {syncMessages[p._id] && syncMessages[p._id].type !== 'info' && ( // Don't show 'syncing' here again
                                        <div className={`mt-1 small ${syncMessages[p._id].type === 'success' ? 'text-success' : 'text-danger'}`}>
                                            {syncMessages[p._id].text}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <Link to={`/payrolls/${p._id}`} className="btn btn-sm btn-info me-1">View</Link>
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') &&
                                        p.status === 'PENDING_APPROVAL' && (
                                        <button onClick={() => handleApprove(p._id)} className="btn btn-sm btn-success me-1">Approve</button>
                                    )}
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') &&
                                        p.status === 'APPROVED' && (
                                        <button onClick={() => handleMarkPaid(p._id)} className="btn btn-sm btn-success me-1">Mark Paid</button>
                                    )}
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'SUPERADMIN') &&
                                        (p.status === 'APPROVED' || p.status === 'PAID') &&
                                        (p.quickbooksSyncStatus !== 'SYNCED' || (syncMessages[p._id] && syncMessages[p._id].type === 'error')) && (
                                        <button
                                            onClick={() => handleSyncToQuickbooks(p._id)}
                                            className="btn btn-sm btn-primary"
                                            disabled={syncingPayrollId === p._id}
                                        >
                                            {syncingPayrollId === p._id ? 'Syncing...' : 'Sync to QBO'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
export default PayrollListPage;

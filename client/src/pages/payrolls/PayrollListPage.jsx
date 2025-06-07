import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';

const PayrollListPage = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
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
                await api.put(`/payrolls/\${id}/status`, { status: 'APPROVED' });
                fetchPayrolls();
            } catch (err) {
                setError(err.response?.data?.message || "Failed to approve payslip.");
            }
        }
    };

    const handleMarkPaid = async (id) => {
         if (window.confirm("Are you sure you want to mark this payslip as PAID?")) {
            try {
                await api.put(`/payrolls/\${id}/status`, { status: 'PAID' });
                fetchPayrolls();
            } catch (err) {
                setError(err.response?.data?.message || "Failed to mark as paid.");
            }
        }
    };

    return (
        <div>
            <h2>Payroll Records</h2>
            {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && (
                <button onClick={handleRunPayroll} style={{ marginBottom: '1rem' }}>
                    Run New Payroll
                </button>
            )}
            <div style={{ marginBottom: '1rem' }}>
                Filter by:
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{marginLeft: '5px'}}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} style={{marginLeft: '5px'}}>
                     {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {loading && <p>Loading payrolls...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!loading && !error && payrolls.length === 0 && <p>No payroll records found for {filterMonth}, {filterYear}.</p>}

            {!loading && !error && payrolls.length > 0 && (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Month/Year</th>
                            <th>Net Pay</th>
                            <th>Gross Earnings</th>
                            <th>Total Deductions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.map((p) => (
                            <tr key={p._id}>
                                <td>{p.employeeId?.firstName} {p.employeeId?.lastName}</td>
                                <td>{p.month} {p.year}</td>
                                <td>{p.netPay?.toFixed(2)}</td>
                                <td>{p.grossEarnings?.toFixed(2)}</td>
                                <td>{p.totalDeductions?.toFixed(2)}</td>
                                <td>{p.status}</td>
                                <td>
                                    <Link to={`/payrolls/\${p._id}`}>View Payslip</Link>
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && p.status === 'PENDING_APPROVAL' && (
                                        <button onClick={() => handleApprove(p._id)} style={{marginLeft: '5px'}}>Approve</button>
                                    )}
                                     {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && p.status === 'APPROVED' && (
                                        <button onClick={() => handleMarkPaid(p._id)} style={{marginLeft: '5px'}}>Mark Paid</button>
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

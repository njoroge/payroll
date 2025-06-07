import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';

const MyPayslipsPage = () => {
    const { employeeId } = useParams();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userInfo } = useAuth();

    useEffect(() => {
        if (userInfo && userInfo.employeeId && userInfo.employeeId.toString() !== employeeId) {
            setError("Unauthorized to view these payslips.");
            setLoading(false);
            return;
        }

        const fetchMyPayslips = async () => {
            try {
                setLoading(true); setError('');
                const { data } = await api.get('/payrolls', { params: { employeeId: employeeId } });
                setPayslips(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch your payslips.');
                console.error(err);
            } finally { setLoading(false); }
        };

        if (employeeId && userInfo && userInfo.employeeId) {
             fetchMyPayslips();
        } else if (!userInfo || !userInfo.employeeId) {
            setError("User or employee details not found. Cannot fetch payslips.");
            setLoading(false);
        }
    }, [employeeId, userInfo]);

    if (loading) return <p>Loading your payslips...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>My Payslips</h2>
            {payslips.length === 0 ? (
                <p>You have no payslips available.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Month/Year</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payslips.map((p) => (
                            <tr key={p._id}>
                                <td>{p.month} {p.year}</td>
                                <td>{p.netPay?.toFixed(2)}</td>
                                <td>{p.status}</td>
                                <td>
                                    <Link to={`/payrolls/\${p._id}`}>View Details</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
export default MyPayslipsPage;

import React, { useState, useEffect } from 'react'; // Removed useContext
import { useAuth } from '../../store/authContext'; // Changed to useAuth
import api from '../../services/api';
import { formatDate } from '../../utils/formatting'; // Assuming you have a formatting util

function MyLeaveHistoryPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userInfo: user } = useAuth(); // Changed to useAuth and aliased userInfo

    useEffect(() => {
        const fetchLeaveHistory = async () => {
            // user object from useAuth might be null initially if auth state is loading
            // or if user is not logged in.
            // The token is typically inside the user object, e.g., user.token or user.data.token
            // Let's assume user object itself or user.token will be checked.
            // The original code checked !user || !user.token.
            // If userInfo is null, !user is true. If userInfo exists, then userInfo.token is checked.
            if (!user || !user.token) {
                setError("Authentication required.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');
                const response = await api.get('/leaves/my-requests');
                setLeaves(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch leave history.');
                console.error("Fetch leave history error:", err.response || err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveHistory();
    }, [user]);

    if (loading) return <p>Loading leave history...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    // if (!user || user.role !== 'employee') {
        // This check might be handled by route protection in App.jsx
        // return <p>You do not have permission to view this page.</p>;
    // }

    return (
        <div style={{ margin: '20px', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2>My Leave History</h2>
            {leaves.length === 0 ? (
                <p>You have no leave requests.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={tableHeaderStyle}>Start Date</th>
                            <th style={tableHeaderStyle}>End Date</th>
                            <th style={tableHeaderStyle}>Reason</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Requested On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id}>
                                <td style={tableCellStyle}>{formatDate(leave.startDate)}</td>
                                <td style={tableCellStyle}>{formatDate(leave.endDate)}</td>
                                <td style={tableCellStyle}>{leave.reason}</td>
                                <td style={tableCellStyle}>
                                    <span style={getStatusStyle(leave.status)}>
                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                    </span>
                                </td>
                                <td style={tableCellStyle}>{formatDate(leave.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const tableHeaderStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left'
};

const tableCellStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left'
};

const getStatusStyle = (status) => {
    let style = {
        padding: '5px 10px',
        borderRadius: '15px',
        color: 'white',
        fontWeight: 'bold'
    };
    switch (status) {
        case 'pending':
            style.backgroundColor = '#ffc107'; // Amber
            break;
        case 'approved':
            style.backgroundColor = '#4caf50'; // Green
            break;
        case 'rejected':
            style.backgroundColor = '#f44336'; // Red
            break;
        default:
            style.backgroundColor = '#9e9e9e'; // Grey
    }
    return style;
};

export default MyLeaveHistoryPage;

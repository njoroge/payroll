import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../store/authContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatting';

function ManageLeaveRequestsPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const { user } = useContext(AuthContext);

    const fetchAllLeaveRequests = async () => {
        if (!user || !user.token) {
            setError("Authentication required.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError('');
            setActionMessage('');
            const response = await api.get('/leaves/all-requests');
            setLeaves(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leave requests.');
            console.error("Fetch all leave requests error:", err.response || err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllLeaveRequests();
    }, [user]);

    const handleAction = async (leaveId, action) => {
        setActionMessage('');
        setError('');
        try {
            const response = await api.put(`/leaves/${leaveId}/${action}`);
            setActionMessage(response.data.message || `Leave request ${action}ed successfully.`);
            // Refresh the list
            fetchAllLeaveRequests();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} leave request.`);
            console.error(`Error ${action}ing leave:`, err.response || err);
        }
    };

    if (loading) return <p>Loading leave requests...</p>;

    // Basic role check on client though server side is authoritative
    const allowedRoles = ['hr_manager', 'employee_admin', 'company_admin'];
    if (!user || !allowedRoles.includes(user.role)) {
        return <p>You do not have permission to view this page.</p>;
    }

    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div style={{ margin: '20px', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2>Manage Leave Requests</h2>
            {actionMessage && <p style={{ color: 'green' }}>{actionMessage}</p>}
            {leaves.length === 0 ? (
                <p>No pending leave requests.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={tableHeaderStyle}>Employee</th>
                            <th style={tableHeaderStyle}>Department</th>
                            <th style={tableHeaderStyle}>Start Date</th>
                            <th style={tableHeaderStyle}>End Date</th>
                            <th style={tableHeaderStyle}>Reason</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Requested On</th>
                            <th style={tableHeaderStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id}>
                                <td style={tableCellStyle}>{leave.employeeId?.firstName || 'N/A'} {leave.employeeId?.lastName || ''}</td>
                                <td style={tableCellStyle}>{leave.employeeId?.department?.name || 'N/A'}</td>
                                <td style={tableCellStyle}>{formatDate(leave.startDate)}</td>
                                <td style={tableCellStyle}>{formatDate(leave.endDate)}</td>
                                <td style={tableCellStyle}>{leave.reason}</td>
                                <td style={tableCellStyle}>
                                    <span style={getStatusStyle(leave.status)}>
                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                    </span>
                                </td>
                                <td style={tableCellStyle}>{formatDate(leave.createdAt)}</td>
                                <td style={tableCellStyle}>
                                    {leave.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(leave._id, 'approve')}
                                                style={{ ...buttonStyle, backgroundColor: '#4caf50', marginRight: '5px' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(leave._id, 'reject')}
                                                style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {leave.status !== 'pending' && (
                                        <span>Processed by: {leave.processedBy?.email || 'N/A'} on {formatDate(leave.processedAt)}</span>
                                    )}
                                </td>
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
    textAlign: 'left',
    verticalAlign: 'top'
};

const buttonStyle = {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9em'
};

const getStatusStyle = (status) => {
    let style = {
        padding: '5px 10px',
        borderRadius: '15px',
        color: 'white',
        fontWeight: 'bold',
        display: 'inline-block'
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

export default ManageLeaveRequestsPage;

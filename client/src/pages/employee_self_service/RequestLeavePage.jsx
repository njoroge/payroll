import React, { useState, useContext } from 'react';
import { AuthContext } from '../../store/authContext';
import api from '../../services/api'; // Assuming api.js is configured for JWT
import { useNavigate } from 'react-router-dom';

function RequestLeavePage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!startDate || !endDate || !reason) {
            setError('All fields are required.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date.');
            return;
        }

        try {
            const response = await api.post('/leaves/request', {
                startDate,
                endDate,
                reason
            });
            setMessage(response.data.message || 'Leave request submitted successfully!');
            setStartDate('');
            setEndDate('');
            setReason('');
            // Optionally, navigate to leave history page
            // navigate('/my-leave-history');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit leave request.');
            console.error("Leave request error:", err.response || err);
        }
    };

    if (!user || user.role !== 'employee') {
        // Or redirect to an unauthorized page, or show nothing
        // return <p>You do not have permission to view this page.</p>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2>Request Leave</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="startDate">Start Date:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="endDate">End Date:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="reason">Reason:</label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        rows="4"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {message && <p style={{ color: 'green' }}>{message}</p>}
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Submit Request
                </button>
            </form>
        </div>
    );
}

export default RequestLeavePage;

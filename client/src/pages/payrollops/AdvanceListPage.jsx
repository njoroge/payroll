import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import AdvanceFormModal from './AdvanceFormModal';
import { useAuth } from '../../store/authContext';

const AdvanceListPage = () => {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const { userInfo } = useAuth();

    const fetchItems = async () => {
        try {
            setLoading(true); setError('');
            const { data } = await api.get('/payroll-ops/advances');
            setAdvances(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch advances.');
            console.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
        fetchItems();
    };

    const handleStatusUpdate = async (id, newStatus) => {
<<<<<<< HEAD:client/src/pages/payrollops/AdvanceListPage.js
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        try {
            await api.put(`/payroll-ops/advances/${id}/status`, { status: newStatus });
=======
        if (!window.confirm(`Are you sure you want to change status to \${newStatus}?`)) return;
        try {
            await api.put(`/payroll-ops/advances/\${id}/status`, { status: newStatus });
>>>>>>> origin/master:client/src/pages/payrollops/AdvanceListPage.jsx
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status.');
            console.error(err);
        }
    };

    if (loading) return <p>Loading advances...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Advance Management</h2>
            {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && (
                <button onClick={() => handleOpenModal()} style={{ marginBottom: '1rem' }}>
                    Record New Advance
                </button>
            )}
            {advances.length === 0 ? (
                <p>No advances found.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Date Issued</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {advances.map((item) => (
                            <tr key={item._id}>
                                <td>{item.employeeId?.firstName} {item.employeeId?.lastName} ({item.employeeId?.nationalId})</td>
                                <td>{item.amount}</td>
                                <td>{new Date(item.dateIssued).toLocaleDateString()}</td>
                                <td>{item.reason || 'N/A'}</td>
                                <td>{item.status}</td>
                                <td>
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && item.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(item._id, 'APPROVED')}>Approve</button>
                                            <button onClick={() => handleStatusUpdate(item._id, 'REJECTED')} style={{marginLeft: '5px'}}>Reject</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {isModalOpen && (
                <AdvanceFormModal
                    item={editingItem}
                    onClose={handleCloseModal}
                    operationType="Advance"
                />
            )}
        </div>
    );
};
export default AdvanceListPage;

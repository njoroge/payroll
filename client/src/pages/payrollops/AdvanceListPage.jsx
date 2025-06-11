import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import AdvanceFormModal from './AdvanceFormModal';
import { useAuth } from '../../store/authContext';
import { formatCurrency } from '../../../utils/formatting';

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
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        try {
            await api.put(`/payroll-ops/advances/${id}/status`, { status: newStatus });
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status.');
            console.error(err);
        }
    };

    if (loading) return <p>Loading advances...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;

    return (
        <div>
            <h2>Advance Management</h2>
            {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && (
                <button onClick={() => handleOpenModal()} className="btn btn-success mb-3">
                    Record New Advance
                </button>
            )}
            {advances.length === 0 ? (
                <p>No advances found.</p>
            ) : (
                <table className="table table-striped table-hover">
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
                                <td>{formatCurrency(item.amount)}</td>
                                <td>{new Date(item.dateIssued).toLocaleDateString()}</td>
                                <td>{item.reason || 'N/A'}</td>
                                <td>
                                    {item.status === 'PENDING' && <span className="badge bg-warning">Pending</span>}
                                    {item.status === 'APPROVED' && <span className="badge bg-success">Approved</span>}
                                    {item.status === 'REJECTED' && <span className="badge bg-danger">Rejected</span>}
                                    {item.status === 'PAID' && <span className="badge bg-info">Paid</span>}
                                    {/* Assuming PAID is a possible status, added as an example */}
                                    {!['PENDING', 'APPROVED', 'REJECTED', 'PAID'].includes(item.status) && <span className="badge bg-secondary">{item.status}</span>}
                                </td>
                                <td>
                                    {(userInfo.role === 'company_admin' || userInfo.role === 'hr_manager' || userInfo.role === 'employee_admin') && item.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(item._id, 'APPROVED')} className="btn btn-sm btn-success">Approve</button>
                                            <button onClick={() => handleStatusUpdate(item._id, 'REJECTED')} className="btn btn-sm btn-warning ms-1">Reject</button>
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

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const modalStyle = {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
    backgroundColor: 'white', padding: '20px', borderRadius: '5px',
    minWidth: '400px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
};

const initialFormData = {
    employeeId: '',
    amount: 0,
    dateIssued: new Date().toISOString().split('T')[0],
    reason: '',
};

const AdvanceFormModal = ({ item, onClose, operationType = "Advance" }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditMode = Boolean(item);

    useEffect(() => {
        api.get('/employees?workStatus=ACTIVE')
            .then(res => setEmployees(res.data))
            .catch(err => {
                console.error("Failed to fetch employees", err);
                setError("Failed to load employee list.");
            });

        if (isEditMode && item) {
             setFormData({
                employeeId: item.employeeId?._id || '',
                amount: item.amount || 0,
                dateIssued: item.dateIssued ? new Date(item.dateIssued).toISOString().split('T')[0] : initialFormData.dateIssued,
                reason: item.reason || '',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [item, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let payload = {
            employeeId: formData.employeeId,
            amount: formData.amount,
            dateIssued: formData.dateIssued,
            reason: formData.reason,
        };

        try {
            if (isEditMode && item) {
                 setError("Editing not currently supported via this form for advances.");
                 setLoading(false);
                 return;
            } else {
                await api.post('/payroll-ops/advances', payload);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to record ${operationType.toLowerCase()}.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const title = isEditMode ? `Edit ${operationType}` : `Record New ${operationType}`;

    return (
        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3>{title}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div>
                        <label>Employee:
                            <select name="employeeId" value={formData.employeeId} onChange={handleChange} required disabled={isEditMode}>
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.firstName} {emp.lastName} ({emp.nationalId})
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div><label>Amount: <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" /></label></div>
                    <div><label>Date Issued: <input type="date" name="dateIssued" value={formData.dateIssued} onChange={handleChange} required /></label></div>
                    <div><label>Reason: <textarea name="reason" value={formData.reason} onChange={handleChange} rows="2"></textarea></label></div>
                    <div style={{ marginTop: '15px' }}>
                        <button type="submit" className="btn btn-success" disabled={loading || (isEditMode && !item)}>
                            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : `Record ${operationType}`)}
                        </button>
                        <button type="button" className="btn btn-success" onClick={onClose} style={{ marginLeft: '10px' }} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AdvanceFormModal;

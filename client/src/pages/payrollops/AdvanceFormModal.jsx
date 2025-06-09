import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Removed modalStyle and modalContentStyle

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

    const isEditMode = Boolean(item); // Though editing is disabled in handleSubmit

    useEffect(() => {
        api.get('/employees?workStatus=ACTIVE') // Fetch only active employees
            .then(res => setEmployees(res.data))
            .catch(err => {
                console.error("Failed to fetch employees", err);
                setError("Failed to load employee list for selection.");
            });

        if (isEditMode && item) {
             setFormData({
                employeeId: item.employeeId?._id || '', // Handle potential full object or just ID
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
                 return; // Explicitly stop here for edit mode
            } else {
                await api.post('/payroll-ops/advances', payload);
            }
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.response?.data?.message || `Failed to record ${operationType.toLowerCase()}.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const title = isEditMode ? `Edit ${operationType}` : `Record New ${operationType}`;
    const submitButtonText = isEditMode ? 'Save Changes' : `Record ${operationType}`; // Will be disabled if isEditMode

    // Bootstrap modal structure
    return (

        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={loading}></button>
                        </div>
                        <div className="modal-body">
                            {error && <p className="text-danger">{error}</p>}
                            <div className="mb-3">
                                <label htmlFor="employeeId" className="form-label">Employee:</label>
                                <select name="employeeId" id="employeeId" className="form-select" value={formData.employeeId} onChange={handleChange} required disabled={isEditMode}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.firstName} {emp.lastName} ({emp.nationalId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="amount" className="form-label">Amount:</label>
                                    <input type="number" name="amount" id="amount" className="form-control" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="dateIssued" className="form-label">Date Issued:</label>
                                    <input type="date" name="dateIssued" id="dateIssued" className="form-control" value={formData.dateIssued} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="reason" className="form-label">Reason:</label>
                                <textarea name="reason" id="reason" className="form-control" value={formData.reason} onChange={handleChange} rows="3"></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading || isEditMode}> {/* Disable submit in edit mode as per logic */}
                                {loading ? 'Saving...' : submitButtonText}
                            </button>
                        </div>
                    </form>
                </div>

        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3>{title}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-danger">{error}</p>}
                    <div className="mb-3">
                        <label htmlFor="employeeId" className="form-label">Employee:</label>
                        <select name="employeeId" id="employeeId" className="form-select" value={formData.employeeId} onChange={handleChange} required disabled={isEditMode}>
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.firstName} {emp.lastName} ({emp.nationalId})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3"><label htmlFor="amount" className="form-label">Amount: </label><input type="number" name="amount" id="amount" className="form-control" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" /></div>
                    <div className="mb-3"><label htmlFor="dateIssued" className="form-label">Date Issued: </label><input type="date" name="dateIssued" id="dateIssued" className="form-control" value={formData.dateIssued} onChange={handleChange} required /></div>
                    <div className="mb-3"><label htmlFor="reason" className="form-label">Reason: </label><textarea name="reason" id="reason" className="form-control" value={formData.reason} onChange={handleChange} rows="2"></textarea></div>
                    <div className="mt-3">
                        <button type="submit" className="btn btn-success" disabled={loading || (isEditMode && !item)}>
                            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : `Record ${operationType}`)}
                        </button>
                        <button type="button" className="btn btn-success ms-2" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
export default AdvanceFormModal;

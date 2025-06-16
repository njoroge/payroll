import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Removed modalStyle and modalContentStyle

const DepartmentFormModal = ({ department, onClose }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditMode = Boolean(department);

    useEffect(() => {
        if (isEditMode && department) {
            setName(department.name);
            setStatus(department.status);
        } else {
            setName('');
            setStatus('ACTIVE');
        }
    }, [department, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isEditMode) {
                await api.put(`/departments/${department._id}`, { name, status });
            } else {
                await api.post('/departments', { name, status });
            }
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} department.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Bootstrap modal structure

    return (

        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}> {/* Form wraps modal-content or just modal-body/footer */}
                        <div className="modal-header">
                            <h5 className="modal-title">{isEditMode ? 'Edit Department' : 'Add New Department'}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={loading}></button>
                        </div>
                        <div className="modal-body">
                            {error && <p className="text-danger">{error}</p>}
                            <div className="mb-3">
                                <label htmlFor="deptName" className="form-label">Name:</label>
                                <input type="text" id="deptName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="deptStatus" className="form-label">Status:</label>
                                <select id="deptStatus" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Department')}
                            </button>
                        </div>
                    </form>
                </div> {/* Closing modal-content */}
            </div> {/* Closing modal-dialog */}
        </div> /* Closing modal */
    );
};
export default DepartmentFormModal;

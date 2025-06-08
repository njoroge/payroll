import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const modalStyle = {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center'
};
const modalContentStyle = {
    backgroundColor: 'white', padding: '20px', borderRadius: '5px',
    minWidth: '300px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
};

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
<<<<<<< HEAD:client/src/pages/departments/DepartmentFormModal.js
                await api.put(`/departments/${department._id}`, { name, status });
=======
                await api.put(`/departments/\${department._id}`, { name, status });
>>>>>>> origin/master:client/src/pages/departments/DepartmentFormModal.jsx
            } else {
                await api.post('/departments', { name, status });
            }
            onClose();
        } catch (err) {
<<<<<<< HEAD:client/src/pages/departments/DepartmentFormModal.js
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} department.`);
=======
            setError(err.response?.data?.message || `Failed to \${isEditMode ? 'update' : 'create'} department.`);
>>>>>>> origin/master:client/src/pages/departments/DepartmentFormModal.jsx
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3>{isEditMode ? 'Edit Department' : 'Add New Department'}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div>
                        <label htmlFor="deptName">Name:</label>
                        <input type="text" id="deptName" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="deptStatus">Status:</label>
                        <select id="deptStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                        <button type="submit" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Department')}
                        </button>
                        <button type="button" onClick={onClose} style={{ marginLeft: '10px' }} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default DepartmentFormModal;

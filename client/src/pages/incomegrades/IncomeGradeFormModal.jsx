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
    gradeName: '',
    basicSalary: 0,
    houseAllowance: 0,
    transportAllowance: 0,
    hardshipAllowance: 0,
    specialAllowance: 0,
    isActive: true,
};

const IncomeGradeFormModal = ({ incomeGrade, onClose }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditMode = Boolean(incomeGrade);

    useEffect(() => {
        if (isEditMode && incomeGrade) {
            setFormData({ ...initialFormData, ...incomeGrade });
        } else {
            setFormData(initialFormData);
        }
    }, [incomeGrade, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isEditMode) {
                await api.put(`/income-grades/${incomeGrade._id}`, formData);
            } else {
                await api.post('/income-grades', formData);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} income grade.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3>{isEditMode ? 'Edit Income Grade' : 'Add New Income Grade'}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div><label>Grade Name: <input type="text" name="gradeName" value={formData.gradeName} onChange={handleChange} required /></label></div>
                    <div><label>Basic Salary: <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} required min="0" /></label></div>
                    <div><label>House Allowance: <input type="number" name="houseAllowance" value={formData.houseAllowance} onChange={handleChange} min="0" /></label></div>
                    <div><label>Transport Allowance: <input type="number" name="transportAllowance" value={formData.transportAllowance} onChange={handleChange} min="0" /></label></div>
                    <div><label>Hardship Allowance: <input type="number" name="hardshipAllowance" value={formData.hardshipAllowance} onChange={handleChange} min="0" /></label></div>
                    <div><label>Special Allowance: <input type="number" name="specialAllowance" value={formData.specialAllowance} onChange={handleChange} min="0" /></label></div>
                    <div><label><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Active</label></div>

                    <div style={{ marginTop: '15px' }}>
                        <button type="submit" className="btn btn-success" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Grade')}
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
export default IncomeGradeFormModal;

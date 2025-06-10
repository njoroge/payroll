import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Removed modalStyle and modalContentStyle

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
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} income grade.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Bootstrap modal structure
    return (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document"> {/* Added modal-lg for wider content */}
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{isEditMode ? 'Edit Income Grade' : 'Add New Income Grade'}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={loading}></button>
                        </div>
                        <div className="modal-body">
                            {error && <p className="text-danger">{error}</p>}
                            <div className="mb-3"><label htmlFor="gradeName" className="form-label">Grade Name: </label><input type="text" name="gradeName" id="gradeName" className="form-control" value={formData.gradeName} onChange={handleChange} required /></div>
                            <div className="row"> {/* Using row and col for side-by-side layout for amounts */}
                                <div className="col-md-6 mb-3"><label htmlFor="basicSalary" className="form-label">Basic Salary: </label><input type="number" name="basicSalary" id="basicSalary" className="form-control" value={formData.basicSalary} onChange={handleChange} required min="0" /></div>
                                <div className="col-md-6 mb-3"><label htmlFor="houseAllowance" className="form-label">House Allowance: </label><input type="number" name="houseAllowance" id="houseAllowance" className="form-control" value={formData.houseAllowance} onChange={handleChange} min="0" /></div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3"><label htmlFor="transportAllowance" className="form-label">Transport Allowance: </label><input type="number" name="transportAllowance" id="transportAllowance" className="form-control" value={formData.transportAllowance} onChange={handleChange} min="0" /></div>
                                <div className="col-md-6 mb-3"><label htmlFor="hardshipAllowance" className="form-label">Hardship Allowance: </label><input type="number" name="hardshipAllowance" id="hardshipAllowance" className="form-control" value={formData.hardshipAllowance} onChange={handleChange} min="0" /></div>
                            </div>
                            <div className="mb-3"><label htmlFor="specialAllowance" className="form-label">Special Allowance: </label><input type="number" name="specialAllowance" id="specialAllowance" className="form-control" value={formData.specialAllowance} onChange={handleChange} min="0" /></div>
                            <div className="mb-3 form-check">
                                <input type="checkbox" name="isActive" id="isActive" className="form-check-input" checked={formData.isActive} onChange={handleChange} />
                                <label htmlFor="isActive" className="form-check-label"> Active</label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Grade')}
                            </button>
                        </div>
                    </form>
                </div>


        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3>{isEditMode ? 'Edit Income Grade' : 'Add New Income Grade'}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-danger">{error}</p>}
                    <div className="mb-3"><label htmlFor="gradeName" className="form-label">Grade Name: </label><input type="text" name="gradeName" id="gradeName" className="form-control" value={formData.gradeName} onChange={handleChange} required /></div>
                    <div className="mb-3"><label htmlFor="basicSalary" className="form-label">Basic Salary: </label><input type="number" name="basicSalary" id="basicSalary" className="form-control" value={formData.basicSalary} onChange={handleChange} required min="0" /></div>
                    <div className="mb-3"><label htmlFor="houseAllowance" className="form-label">House Allowance: </label><input type="number" name="houseAllowance" id="houseAllowance" className="form-control" value={formData.houseAllowance} onChange={handleChange} min="0" /></div>
                    <div className="mb-3"><label htmlFor="transportAllowance" className="form-label">Transport Allowance: </label><input type="number" name="transportAllowance" id="transportAllowance" className="form-control" value={formData.transportAllowance} onChange={handleChange} min="0" /></div>
                    <div className="mb-3"><label htmlFor="hardshipAllowance" className="form-label">Hardship Allowance: </label><input type="number" name="hardshipAllowance" id="hardshipAllowance" className="form-control" value={formData.hardshipAllowance} onChange={handleChange} min="0" /></div>
                    <div className="mb-3"><label htmlFor="specialAllowance" className="form-label">Special Allowance: </label><input type="number" name="specialAllowance" id="specialAllowance" className="form-control" value={formData.specialAllowance} onChange={handleChange} min="0" /></div>
                    <div className="mb-3 form-check">
                        <input type="checkbox" name="isActive" id="isActive" className="form-check-input" checked={formData.isActive} onChange={handleChange} />
                        <label htmlFor="isActive" className="form-check-label"> Active</label>
                    </div>

                    <div className="mt-3">
                        <button type="submit" className="btn btn-success" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Grade')}
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
export default IncomeGradeFormModal;

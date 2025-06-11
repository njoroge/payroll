import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import IncomeGradeFormModal from './IncomeGradeFormModal';
import { formatCurrency } from '../../utils/formatting';

const IncomeGradeListPage = () => {
    const [incomeGrades, setIncomeGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncomeGrade, setEditingIncomeGrade] = useState(null);

    const fetchIncomeGrades = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/income-grades');
            setIncomeGrades(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch income grades.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncomeGrades();
    }, []);

    const handleOpenModal = (grade = null) => {
        setEditingIncomeGrade(grade);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingIncomeGrade(null);
        setIsModalOpen(false);
        fetchIncomeGrades();
    };

    if (loading) return <p>Loading income grades...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;

    return (
        <div>
            <h2>Income Grade Management</h2>
            <button onClick={() => handleOpenModal()} className="btn btn-success mb-3">
                Add New Income Grade
            </button>
            {incomeGrades.length === 0 ? (
                <p>No income grades found.</p>
            ) : (
                <table className="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Grade Name</th>
                            <th>Basic Salary</th>
                            <th>House Allow.</th>
                            <th>Transport Allow.</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeGrades.map((grade) => (
                            <tr key={grade._id}>
                                <td>{grade.gradeName}</td>
                                <td>{formatCurrency(grade.basicSalary)}</td>
                                <td>{formatCurrency(grade.houseAllowance)}</td>
                                <td>{formatCurrency(grade.transportAllowance)}</td>
                                <td>{grade.isActive ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <button onClick={() => handleOpenModal(grade)} className="btn btn-sm btn-primary">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {isModalOpen && (
                <IncomeGradeFormModal
                    incomeGrade={editingIncomeGrade}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};
export default IncomeGradeListPage;

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import DepartmentFormModal from './DepartmentFormModal';

const DepartmentListPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/departments');
            setDepartments(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch departments.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpenModal = (department = null) => {
        setEditingDepartment(department);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingDepartment(null);
        setIsModalOpen(false);
        fetchDepartments();
    };

    if (loading) return <p>Loading departments...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;

    return (
        <div>
            <h2>Department Management</h2>
            <button onClick={() => handleOpenModal()} className="btn btn-success mb-3">
                Add New Department
            </button>
            {departments.length === 0 ? (
                <p>No departments found.</p>
            ) : (
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((dept) => (
                            <tr key={dept._id}>
                                <td>{dept.name}</td>
                                <td>{dept.status}</td>
                                <td>
                                    <button onClick={() => handleOpenModal(dept)} className="btn btn-sm btn-primary">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {isModalOpen && (
                <DepartmentFormModal
                    department={editingDepartment}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default DepartmentListPage;

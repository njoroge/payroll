import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const EmployeeListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                setError('');
                const { data } = await api.get('/employees');
                setEmployees(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch employees.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    if (loading) return <p>Loading employees...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;

    return (
        <div>
            <h2>Employee Management</h2>
            <Link to="/employees/new" className="btn btn-success mb-3">
                Add New Employee
            </Link>
            {employees.length === 0 ? (
                <p>No employees found.</p>
            ) : (
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>National ID</th>
                            <th>Department</th>
                            <th>Income Grade</th>
                            <th>Email (Login)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp._id}>
                                <td>{emp.firstName} {emp.lastName}</td>
                                <td>{emp.nationalId}</td>
                                <td>{emp.departmentId?.name || 'N/A'}</td>
                                <td>{emp.incomeGradeId?.gradeName || 'N/A'}</td>
                                <td>{emp.userId?.email || 'No Login'}</td>
                                <td>{emp.workStatus}</td>
                                <td>
                                    <Link to={`/employees/${emp._id}`} className="btn btn-sm btn-info">View</Link> |{' '}
                                    <Link to={`/employees/${emp._id}/edit`} className="btn btn-sm btn-primary">Edit</Link>
                                    {/* Add Deactivate button here later */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default EmployeeListPage;

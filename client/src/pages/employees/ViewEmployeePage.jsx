import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';

const ViewEmployeePage = () => {
    const { id: employeeId } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userInfo } = useAuth(); // To check if viewing self for certain actions

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                setError('');
<<<<<<< HEAD:client/src/pages/employees/ViewEmployeePage.js
                const { data } = await api.get(`/employees/${employeeId}`);
=======
                const { data } = await api.get(`/employees/\${employeeId}`);
>>>>>>> origin/master:client/src/pages/employees/ViewEmployeePage.jsx
                setEmployee(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch employee details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [employeeId]);

    if (loading) return <p>Loading employee details...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!employee) return <p>Employee not found.</p>;

    const canEdit = userInfo?.role === 'company_admin' || userInfo?.role === 'employee_admin' || userInfo?.role === 'hr_manager';
    const isSelf = userInfo?.employeeId === employee._id;


    return (
        <div>
            <h2>Employee Details: {employee.firstName} {employee.lastName}</h2>
            {canEdit && <Link to={`/employees/\${employee._id}/edit`} style={{marginRight: '10px'}}>Edit Employee</Link>}
            {/* Add other actions like Deactivate, View Payslips (if HR/Admin) */}
            {isSelf && <Link to={`/employees/\${employee._id}/payslips`}>View My Payslips</Link>}


            <p><strong>National ID:</strong> {employee.nationalId}</p>
            <p><strong>Full Name:</strong> {employee.firstName} {employee.lastName} {employee.surname || ''}</p>
            <p><strong>Department:</strong> {employee.departmentId?.name || 'N/A'}</p>
            <p><strong>Income Grade:</strong> {employee.incomeGradeId?.gradeName || 'N/A'} (Basic: {employee.incomeGradeId?.basicSalary})</p>
            <p><strong>Work Status:</strong> {employee.workStatus}</p>
            <p><strong>Employment Start Date:</strong> {employee.employmentStartDate ? new Date(employee.employmentStartDate).toLocaleDateString() : 'N/A'}</p>

            <h3>Contact Information</h3>
            <p><strong>Phone:</strong> {employee.phoneNo || 'N/A'}</p>
            <p><strong>Personal Email:</strong> {employee.personalEmail || 'N/A'}</p>

            <h3>Personal Details</h3>
            <p><strong>Date of Birth:</strong> {employee.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {employee.gender || 'N/A'}</p>
            <p><strong>Marital Status:</strong> {employee.maritalStatus || 'N/A'}</p>

            <h3>Statutory & Bank</h3>
            <p><strong>KRA PIN:</strong> {employee.kraPin || 'N/A'}</p>
            <p><strong>NHIF No.:</strong> {employee.nhifNo || 'N/A'}</p>
            <p><strong>NSSF No.:</strong> {employee.nssfNo || 'N/A'}</p>
            <p><strong>Bank Name:</strong> {employee.bankName || 'N/A'}</p>
            <p><strong>Account No.:</strong> {employee.accountNo || 'N/A'}</p>

            {employee.nextOfKin && (
                <>
                    <h3>Next of Kin</h3>
                    <p><strong>Name:</strong> {employee.nextOfKin.firstName} {employee.nextOfKin.lastName}</p>
                    <p><strong>Relation:</strong> {employee.nextOfKin.relation}</p>
                    <p><strong>Phone:</strong> {employee.nextOfKin.phoneNo}</p>
                    <p><strong>Email:</strong> {employee.nextOfKin.email}</p>
                </>
            )}

            {employee.userId && (
                <>
                    <h3>User Account</h3>
                    <p><strong>Login Email:</strong> {employee.userId.email}</p>
                    <p><strong>Role:</strong> {employee.userId.role}</p>
                    <p><strong>Account Active:</strong> {employee.userId.isActive ? 'Yes' : 'No'}</p>
                </>
            )}
            <Link to="/employees" style={{marginTop: '1rem', display: 'block'}}>Back to Employee List</Link>
        </div>
    );
};

export default ViewEmployeePage;
